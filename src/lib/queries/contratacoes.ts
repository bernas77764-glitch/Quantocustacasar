import { getDb, agora, hoje } from "@/lib/db";
import type { ContratacaoDetalhada } from "@/lib/types";
import type { EstadoContratacao } from "@/lib/constants";
import { registarAtividade } from "./clientes";

const SELECAO = `
  SELECT
    c.*,
    cl.nome AS cliente_nome,
    f.nome  AS fornecedor_nome,
    f.categoria AS fornecedor_categoria,
    c.valor_cents AS contratado_cents,
    COALESCE(pg.pago, 0)     AS pago_cents,
    COALESCE(pg.pendente, 0) AS pendente_cents,
    COALESCE(pg.atrasado, 0) AS atrasado_cents,
    MAX(c.valor_cents - COALESCE(pg.pago, 0) - COALESCE(pg.pendente, 0), 0)
                             AS por_agendar_cents
  FROM contratacoes c
  JOIN clientes cl     ON cl.id = c.cliente_id
  JOIN fornecedores f  ON f.id  = c.fornecedor_id
  LEFT JOIN (
    SELECT
      contratacao_id,
      SUM(CASE WHEN estado = 'pago' THEN valor_cents ELSE 0 END)     AS pago,
      SUM(CASE WHEN estado = 'pendente' THEN valor_cents ELSE 0 END) AS pendente,
      SUM(CASE WHEN estado = 'pendente' AND data_prevista IS NOT NULL
                    AND data_prevista < ? THEN valor_cents ELSE 0 END) AS atrasado
    FROM pagamentos
    GROUP BY contratacao_id
  ) pg ON pg.contratacao_id = c.id
`;

export type FiltrosContratacoes = {
  q?: string;
  estado?: string;
  categoria?: string;
  cliente_id?: number;
  fornecedor_id?: number;
};

export function listarContratacoes(
  f: FiltrosContratacoes = {},
): ContratacaoDetalhada[] {
  const where: string[] = [];
  const args: (string | number)[] = [hoje()];

  if (f.q?.trim()) {
    where.push("(cl.nome LIKE ? OR f.nome LIKE ? OR c.descricao LIKE ?)");
    const termo = `%${f.q.trim()}%`;
    args.push(termo, termo, termo);
  }
  if (f.estado) {
    where.push("c.estado = ?");
    args.push(f.estado);
  }
  if (f.categoria) {
    where.push("c.categoria = ?");
    args.push(f.categoria);
  }
  if (f.cliente_id) {
    where.push("c.cliente_id = ?");
    args.push(f.cliente_id);
  }
  if (f.fornecedor_id) {
    where.push("c.fornecedor_id = ?");
    args.push(f.fornecedor_id);
  }

  const sql = `${SELECAO}
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY c.data_servico IS NULL, c.data_servico ASC, c.id DESC`;
  return getDb().prepare(sql).all(...args) as unknown as ContratacaoDetalhada[];
}

export function obterContratacao(id: number): ContratacaoDetalhada | null {
  const linha = getDb().prepare(`${SELECAO} WHERE c.id = ?`).get(hoje(), id);
  return (linha as unknown as ContratacaoDetalhada) ?? null;
}

export type DadosContratacao = {
  cliente_id: number;
  fornecedor_id: number;
  categoria: string;
  descricao?: string | null;
  valor_cents?: number;
  comissao_pct?: number;
  estado?: EstadoContratacao;
  data_servico?: string | null;
  notas?: string | null;
};

const CAMPOS = [
  "cliente_id",
  "fornecedor_id",
  "categoria",
  "descricao",
  "valor_cents",
  "comissao_pct",
  "estado",
  "data_servico",
  "notas",
] as const;

function valores(dados: DadosContratacao) {
  return CAMPOS.map((campo) => {
    if (campo === "valor_cents") return dados.valor_cents ?? 0;
    if (campo === "comissao_pct") return dados.comissao_pct ?? 0;
    if (campo === "estado") return dados.estado ?? "proposta";
    return (dados[campo] ?? null) as string | number | null;
  });
}

export function criarContratacao(dados: DadosContratacao): number {
  const ts = agora();
  const r = getDb()
    .prepare(
      `INSERT INTO contratacoes (${CAMPOS.join(", ")}, criado_em, atualizado_em)
       VALUES (${CAMPOS.map(() => "?").join(", ")}, ?, ?)`,
    )
    .run(...valores(dados), ts, ts);
  const id = Number(r.lastInsertRowid);
  const fornecedor = getDb()
    .prepare("SELECT nome FROM fornecedores WHERE id = ?")
    .get(dados.fornecedor_id) as { nome: string } | undefined;
  registarAtividade(
    dados.cliente_id,
    "sistema",
    `Fornecedor associado: ${fornecedor?.nome ?? "?"} (${dados.categoria}).`,
  );
  return id;
}

export function atualizarContratacao(id: number, dados: DadosContratacao): void {
  getDb()
    .prepare(
      `UPDATE contratacoes SET ${CAMPOS.map((c) => `${c} = ?`).join(", ")},
       atualizado_em = ? WHERE id = ?`,
    )
    .run(...valores(dados), agora(), id);
}

export function atualizarEstadoContratacao(
  id: number,
  estado: EstadoContratacao,
): void {
  getDb()
    .prepare("UPDATE contratacoes SET estado = ?, atualizado_em = ? WHERE id = ?")
    .run(estado, agora(), id);
}

export function eliminarContratacao(id: number): void {
  getDb().prepare("DELETE FROM contratacoes WHERE id = ?").run(id);
}

/**
 * Cria um plano de pagamentos simples para uma contratação sem pagamentos:
 * sinal a 30 dias e liquidação na data do serviço (ou a 30 dias, se não houver).
 */
export function gerarPlanoPagamentos(
  contratacaoId: number,
  percentagemSinal = 30,
): number {
  const db = getDb();
  const c = db
    .prepare("SELECT valor_cents, data_servico FROM contratacoes WHERE id = ?")
    .get(contratacaoId) as
    | { valor_cents: number; data_servico: string | null }
    | undefined;
  if (!c || c.valor_cents <= 0) return 0;

  const { total } = db
    .prepare("SELECT COUNT(*) AS total FROM pagamentos WHERE contratacao_id = ?")
    .get(contratacaoId) as unknown as { total: number };
  if (total > 0) return 0;

  const sinal = Math.round((c.valor_cents * percentagemSinal) / 100);
  const restante = c.valor_cents - sinal;
  const daquiA = (dias: number) =>
    new Date(Date.now() + dias * 86_400_000).toISOString().slice(0, 10);

  const ts = agora();
  const inserir = db.prepare(
    `INSERT INTO pagamentos
       (contratacao_id, descricao, valor_cents, data_prevista, estado, criado_em, atualizado_em)
     VALUES (?, ?, ?, ?, 'pendente', ?, ?)`,
  );
  inserir.run(contratacaoId, "Sinal", sinal, daquiA(30), ts, ts);
  inserir.run(
    contratacaoId,
    "Liquidação",
    restante,
    c.data_servico ?? daquiA(60),
    ts,
    ts,
  );
  return 2;
}
