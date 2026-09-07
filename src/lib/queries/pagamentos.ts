import { getDb, agora, hoje } from "@/lib/db";
import type { ComissoesDoFornecedor, PagamentoDetalhado } from "@/lib/types";
import type { EstadoPagamento } from "@/lib/constants";

/**
 * Pagamentos do casal ao fornecedor e, sobre cada um, a comissão que o
 * fornecedor fica a dever ao negócio.
 *
 * Duas coisas distintas que é fácil confundir: "pago" diz respeito ao casal
 * (pagou ao fornecedor); a comissão só fica "recebida" quando o fornecedor a
 * paga. Entre uma e outra está o que o negócio tem a receber — e é disso que
 * vive.
 */

const SELECAO = `
  SELECT
    p.*,
    c.cliente_id,
    c.fornecedor_id,
    c.categoria,
    c.comissao_pct,
    cl.nome AS cliente_nome,
    f.nome  AS fornecedor_nome,
    (p.estado = 'pendente' AND p.data_prevista IS NOT NULL AND p.data_prevista < ?)
      AS atrasado,
    (p.estado = 'pago' AND p.comissao_cents > 0 AND p.comissao_recebida_em IS NULL)
      AS comissao_a_receber
  FROM pagamentos p
  JOIN contratacoes c  ON c.id  = p.contratacao_id
  JOIN clientes cl     ON cl.id = c.cliente_id
  JOIN fornecedores f  ON f.id  = c.fornecedor_id
`;

export type FiltrosPagamentos = {
  q?: string;
  /** `pendente` | `pago` | `cancelado` | `atrasado` (derivado) */
  estado?: string;
  cliente_id?: number;
  fornecedor_id?: number;
  contratacao_id?: number;
  desde?: string;
  ate?: string;
};

function linhasParaPagamentos(linhas: unknown[]): PagamentoDetalhado[] {
  // SQLite devolve 0/1 para expressões booleanas.
  return (
    linhas as (PagamentoDetalhado & {
      atrasado: number | boolean;
      comissao_a_receber: number | boolean;
    })[]
  ).map((l) => ({
    ...l,
    atrasado: Boolean(l.atrasado),
    comissao_a_receber: Boolean(l.comissao_a_receber),
  }));
}

export function listarPagamentos(
  f: FiltrosPagamentos = {},
): PagamentoDetalhado[] {
  const where: string[] = [];
  const args: (string | number)[] = [hoje()];

  if (f.q?.trim()) {
    where.push("(cl.nome LIKE ? OR f.nome LIKE ? OR p.descricao LIKE ? OR p.referencia LIKE ?)");
    const termo = `%${f.q.trim()}%`;
    args.push(termo, termo, termo, termo);
  }
  if (f.estado === "atrasado") {
    where.push(
      "p.estado = 'pendente' AND p.data_prevista IS NOT NULL AND p.data_prevista < ?",
    );
    args.push(hoje());
  } else if (f.estado) {
    where.push("p.estado = ?");
    args.push(f.estado);
  }
  if (f.cliente_id) {
    where.push("c.cliente_id = ?");
    args.push(f.cliente_id);
  }
  if (f.fornecedor_id) {
    where.push("c.fornecedor_id = ?");
    args.push(f.fornecedor_id);
  }
  if (f.contratacao_id) {
    where.push("p.contratacao_id = ?");
    args.push(f.contratacao_id);
  }
  if (f.desde) {
    where.push("COALESCE(p.data_pagamento, p.data_prevista) >= ?");
    args.push(f.desde);
  }
  if (f.ate) {
    where.push("COALESCE(p.data_pagamento, p.data_prevista) <= ?");
    args.push(f.ate);
  }

  const sql = `${SELECAO}
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY p.data_prevista IS NULL, p.data_prevista ASC, p.id ASC`;
  return linhasParaPagamentos(getDb().prepare(sql).all(...args));
}

export function obterPagamento(id: number): PagamentoDetalhado | null {
  const linha = getDb().prepare(`${SELECAO} WHERE p.id = ?`).get(hoje(), id);
  return linha ? linhasParaPagamentos([linha])[0] : null;
}

export type DadosPagamento = {
  contratacao_id: number;
  descricao?: string | null;
  valor_cents?: number;
  data_prevista?: string | null;
  data_pagamento?: string | null;
  metodo?: string | null;
  estado?: EstadoPagamento;
  referencia?: string | null;
  notas?: string | null;
};

const CAMPOS = [
  "contratacao_id",
  "descricao",
  "valor_cents",
  "data_prevista",
  "data_pagamento",
  "metodo",
  "estado",
  "referencia",
  "notas",
] as const;

function valores(dados: DadosPagamento) {
  const estado = dados.estado ?? "pendente";
  return CAMPOS.map((campo) => {
    if (campo === "valor_cents") return dados.valor_cents ?? 0;
    if (campo === "estado") return estado;
    // Um pagamento marcado como pago tem sempre data de pagamento.
    if (campo === "data_pagamento")
      return estado === "pago" ? (dados.data_pagamento ?? hoje()) : null;
    return (dados[campo] ?? null) as string | number | null;
  });
}

/**
 * Mantém a comissão coerente com o estado do pagamento: um pagamento pago
 * fica a dever a comissão à percentagem da contratação (fotografia tirada
 * nesse momento, que não muda se a percentagem for editada depois); um
 * pagamento que deixa de estar pago deixa de dever comissão. Uma comissão
 * já recebida nunca é recalculada.
 */
function sincronizarComissao(id: number): void {
  getDb()
    .prepare(
      `UPDATE pagamentos
       SET comissao_cents = CASE
             WHEN estado <> 'pago' THEN 0
             WHEN comissao_recebida_em IS NOT NULL THEN comissao_cents
             ELSE CAST(ROUND(valor_cents *
                    (SELECT comissao_pct FROM contratacoes c WHERE c.id = pagamentos.contratacao_id) / 100.0)
                  AS INTEGER)
           END,
           comissao_recebida_em = CASE WHEN estado <> 'pago' THEN NULL ELSE comissao_recebida_em END
       WHERE id = ?`,
    )
    .run(id);
}

export function criarPagamento(dados: DadosPagamento): number {
  const ts = agora();
  const r = getDb()
    .prepare(
      `INSERT INTO pagamentos (${CAMPOS.join(", ")}, criado_em, atualizado_em)
       VALUES (${CAMPOS.map(() => "?").join(", ")}, ?, ?)`,
    )
    .run(...valores(dados), ts, ts);
  const id = Number(r.lastInsertRowid);
  sincronizarComissao(id);
  return id;
}

export function atualizarPagamento(id: number, dados: DadosPagamento): void {
  getDb()
    .prepare(
      `UPDATE pagamentos SET ${CAMPOS.map((c) => `${c} = ?`).join(", ")},
       atualizado_em = ? WHERE id = ?`,
    )
    .run(...valores(dados), agora(), id);
  sincronizarComissao(id);
}

export function marcarPago(id: number, dataPagamento?: string, metodo?: string): void {
  getDb()
    .prepare(
      `UPDATE pagamentos
       SET estado = 'pago',
           data_pagamento = ?,
           metodo = COALESCE(?, metodo),
           atualizado_em = ?
       WHERE id = ?`,
    )
    .run(dataPagamento || hoje(), metodo || null, agora(), id);
  sincronizarComissao(id);
}

export function marcarPendente(id: number): void {
  getDb()
    .prepare(
      `UPDATE pagamentos SET estado = 'pendente', data_pagamento = NULL,
       atualizado_em = ? WHERE id = ?`,
    )
    .run(agora(), id);
  sincronizarComissao(id);
}

export function eliminarPagamento(id: number): void {
  getDb().prepare("DELETE FROM pagamentos WHERE id = ?").run(id);
}

/* --------------------------------------------------------------- comissões */

export function marcarComissaoRecebida(id: number, data?: string): void {
  getDb()
    .prepare(
      `UPDATE pagamentos SET comissao_recebida_em = ?, atualizado_em = ?
       WHERE id = ? AND estado = 'pago' AND comissao_cents > 0`,
    )
    .run(data || hoje(), agora(), id);
}

export function marcarComissaoPorReceber(id: number): void {
  getDb()
    .prepare("UPDATE pagamentos SET comissao_recebida_em = NULL, atualizado_em = ? WHERE id = ?")
    .run(agora(), id);
}

/** Dá todas as comissões a receber de um fornecedor como recebidas. Devolve quantas. */
export function receberComissoesDoFornecedor(fornecedorId: number, data?: string): number {
  const r = getDb()
    .prepare(
      `UPDATE pagamentos SET comissao_recebida_em = ?, atualizado_em = ?
       WHERE estado = 'pago' AND comissao_cents > 0 AND comissao_recebida_em IS NULL
         AND contratacao_id IN (SELECT id FROM contratacoes WHERE fornecedor_id = ?)`,
    )
    .run(data || hoje(), agora(), fornecedorId);
  return Number(r.changes);
}

export type FiltrosComissoes = {
  /** `a_receber` | `recebida` | vazio para ambas */
  estado?: string;
  fornecedor_id?: number;
};

/** Pagamentos pagos pelo casal que geram comissão, mais recentes primeiro. */
export function listarComissoes(f: FiltrosComissoes = {}): PagamentoDetalhado[] {
  const where = ["p.estado = 'pago'", "p.comissao_cents > 0"];
  const args: (string | number)[] = [hoje()];
  if (f.estado === "a_receber") where.push("p.comissao_recebida_em IS NULL");
  if (f.estado === "recebida") where.push("p.comissao_recebida_em IS NOT NULL");
  if (f.fornecedor_id) {
    where.push("c.fornecedor_id = ?");
    args.push(f.fornecedor_id);
  }
  const sql = `${SELECAO} WHERE ${where.join(" AND ")}
    ORDER BY p.comissao_recebida_em IS NOT NULL, p.data_pagamento DESC, p.id DESC`;
  return linhasParaPagamentos(getDb().prepare(sql).all(...args));
}

export function comissoesPorFornecedor(): ComissoesDoFornecedor[] {
  return getDb()
    .prepare(
      `SELECT
         f.id   AS fornecedor_id,
         f.nome AS fornecedor_nome,
         COALESCE(SUM(CASE WHEN p.comissao_recebida_em IS NULL THEN p.comissao_cents END), 0) AS a_receber_cents,
         COALESCE(SUM(CASE WHEN p.comissao_recebida_em IS NOT NULL THEN p.comissao_cents END), 0) AS recebida_cents,
         COALESCE(SUM(CASE WHEN p.comissao_recebida_em IS NULL THEN 1 END), 0) AS num_a_receber
       FROM pagamentos p
       JOIN contratacoes c ON c.id = p.contratacao_id
       JOIN fornecedores f ON f.id = c.fornecedor_id
       WHERE p.estado = 'pago' AND p.comissao_cents > 0
       GROUP BY f.id
       ORDER BY a_receber_cents DESC, f.nome COLLATE NOCASE`,
    )
    .all() as unknown as ComissoesDoFornecedor[];
}

export type TotaisComissoes = {
  /** O que os fornecedores devem agora: o casal pagou, o fornecedor ainda não. */
  a_receber_cents: number;
  recebida_cents: number;
  recebida_mes_cents: number;
  /** Comissão sobre o que o casal ainda não pagou — ainda não é devida. */
  ainda_nao_devida_cents: number;
  /** Comissão total prevista nas contratações confirmadas e concluídas. */
  prevista_cents: number;
};

export function totaisComissoes(): TotaisComissoes {
  const db = getDb();
  const inicioMes = `${hoje().slice(0, 7)}-01`;
  const pagos = db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN comissao_recebida_em IS NULL THEN comissao_cents END), 0) AS a_receber_cents,
         COALESCE(SUM(CASE WHEN comissao_recebida_em IS NOT NULL THEN comissao_cents END), 0) AS recebida_cents,
         COALESCE(SUM(CASE WHEN comissao_recebida_em >= ? THEN comissao_cents END), 0) AS recebida_mes_cents
       FROM pagamentos WHERE estado = 'pago'`,
    )
    .get(inicioMes) as unknown as {
    a_receber_cents: number;
    recebida_cents: number;
    recebida_mes_cents: number;
  };
  const { prevista_cents } = db
    .prepare(
      `SELECT COALESCE(SUM(CAST(ROUND(valor_cents * comissao_pct / 100.0) AS INTEGER)), 0) AS prevista_cents
       FROM contratacoes WHERE estado IN ('confirmada', 'concluida')`,
    )
    .get() as unknown as { prevista_cents: number };

  return {
    ...pagos,
    prevista_cents,
    ainda_nao_devida_cents: Math.max(0, prevista_cents - pagos.a_receber_cents - pagos.recebida_cents),
  };
}
