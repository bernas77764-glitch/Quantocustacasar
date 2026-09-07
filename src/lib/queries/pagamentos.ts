import { getDb, agora, hoje } from "@/lib/db";
import type { PagamentoDetalhado } from "@/lib/types";
import type { EstadoPagamento } from "@/lib/constants";

const SELECAO = `
  SELECT
    p.*,
    c.cliente_id,
    c.categoria,
    cl.nome AS cliente_nome,
    f.nome  AS fornecedor_nome,
    (p.estado = 'pendente' AND p.data_prevista IS NOT NULL AND p.data_prevista < ?)
      AS atrasado
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
  return (linhas as (PagamentoDetalhado & { atrasado: number | boolean })[]).map(
    (l) => ({ ...l, atrasado: Boolean(l.atrasado) }),
  );
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

export function criarPagamento(dados: DadosPagamento): number {
  const ts = agora();
  const r = getDb()
    .prepare(
      `INSERT INTO pagamentos (${CAMPOS.join(", ")}, criado_em, atualizado_em)
       VALUES (${CAMPOS.map(() => "?").join(", ")}, ?, ?)`,
    )
    .run(...valores(dados), ts, ts);
  return Number(r.lastInsertRowid);
}

export function atualizarPagamento(id: number, dados: DadosPagamento): void {
  getDb()
    .prepare(
      `UPDATE pagamentos SET ${CAMPOS.map((c) => `${c} = ?`).join(", ")},
       atualizado_em = ? WHERE id = ?`,
    )
    .run(...valores(dados), agora(), id);
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
}

export function marcarPendente(id: number): void {
  getDb()
    .prepare(
      `UPDATE pagamentos SET estado = 'pendente', data_pagamento = NULL,
       atualizado_em = ? WHERE id = ?`,
    )
    .run(agora(), id);
}

export function eliminarPagamento(id: number): void {
  getDb().prepare("DELETE FROM pagamentos WHERE id = ?").run(id);
}
