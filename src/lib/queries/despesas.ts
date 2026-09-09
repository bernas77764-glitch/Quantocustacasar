import { agora, getDb } from "@/lib/db";
export { calcularIva } from "@/lib/iva";
import type {
  CategoriaDespesa,
  CategoriaDespesaComTotal,
  Despesa,
  DespesaDetalhada,
} from "@/lib/types";

/* ---------------------------------------------------------------- categorias */

export function listarCategoriasDespesa(): CategoriaDespesaComTotal[] {
  return getDb()
    .prepare(
      `SELECT c.*, COUNT(d.id) AS num_despesas, COALESCE(SUM(d.total_cents), 0) AS total_cents
       FROM categorias_despesa c
       LEFT JOIN despesas d ON d.categoria_id = c.id
       GROUP BY c.id
       ORDER BY c.nome COLLATE NOCASE`,
    )
    .all() as unknown as CategoriaDespesaComTotal[];
}

export function obterCategoriaDespesa(id: number): CategoriaDespesa | null {
  return (getDb().prepare("SELECT * FROM categorias_despesa WHERE id = ?").get(id) as
    | CategoriaDespesa
    | undefined) ?? null;
}

export function categoriaDespesaExiste(nome: string, excetoId?: number): boolean {
  const linha = getDb()
    .prepare("SELECT id FROM categorias_despesa WHERE nome = ? COLLATE NOCASE AND id <> ?")
    .get(nome.trim(), excetoId ?? 0);
  return linha !== undefined;
}

export function criarCategoriaDespesa(nome: string): number {
  const r = getDb()
    .prepare("INSERT INTO categorias_despesa (nome, criado_em) VALUES (?, ?)")
    .run(nome.trim(), agora());
  return Number(r.lastInsertRowid);
}

export function renomearCategoriaDespesa(id: number, nome: string): void {
  getDb().prepare("UPDATE categorias_despesa SET nome = ? WHERE id = ?").run(nome.trim(), id);
}

/** Só se não tiver despesas: as despesas não podem ficar sem categoria por engano. */
export function eliminarCategoriaDespesa(id: number): boolean {
  const usada = getDb().prepare("SELECT 1 FROM despesas WHERE categoria_id = ? LIMIT 1").get(id);
  if (usada) return false;
  getDb().prepare("DELETE FROM categorias_despesa WHERE id = ?").run(id);
  return true;
}

/* ------------------------------------------------------------------ despesas */

export type DadosDespesa = Omit<Despesa, "id" | "criado_em" | "atualizado_em">;

export type FiltrosDespesas = {
  de?: string;
  ate?: string;
  categoria_id?: number;
  q?: string;
};

const SELECAO = `
  SELECT d.*, c.nome AS categoria_nome, cl.nome AS cliente_nome
  FROM despesas d
  LEFT JOIN categorias_despesa c ON c.id = d.categoria_id
  LEFT JOIN clientes cl ON cl.id = d.cliente_id
`;

function condicoes(f: FiltrosDespesas, prefixo = "d"): { where: string; args: (string | number)[] } {
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (f.de) {
    where.push(`${prefixo}.data >= ?`);
    args.push(f.de);
  }
  if (f.ate) {
    where.push(`${prefixo}.data <= ?`);
    args.push(f.ate);
  }
  if (f.categoria_id) {
    where.push(`${prefixo}.categoria_id = ?`);
    args.push(f.categoria_id);
  }
  if (f.q?.trim()) {
    where.push(`(${prefixo}.descricao LIKE ? OR ${prefixo}.fornecedor LIKE ? OR ${prefixo}.notas LIKE ?)`);
    const termo = `%${f.q.trim()}%`;
    args.push(termo, termo, termo);
  }
  return { where: where.length ? `WHERE ${where.join(" AND ")}` : "", args };
}

export function listarDespesas(f: FiltrosDespesas = {}): DespesaDetalhada[] {
  const { where, args } = condicoes(f);
  return getDb()
    .prepare(`${SELECAO} ${where} ORDER BY d.data DESC, d.id DESC`)
    .all(...args) as unknown as DespesaDetalhada[];
}

export function obterDespesa(id: number): DespesaDetalhada | null {
  return (getDb().prepare(`${SELECAO} WHERE d.id = ?`).get(id) as DespesaDetalhada | undefined) ?? null;
}

const CAMPOS = [
  "data", "descricao", "categoria_id", "fornecedor", "valor_cents",
  "iva_pct", "iva_cents", "total_cents", "metodo", "cliente_id", "notas",
] as const;

function valores(d: DadosDespesa): (string | number | null)[] {
  return CAMPOS.map((c) => d[c] ?? null);
}

export function criarDespesa(d: DadosDespesa): number {
  const ts = agora();
  const r = getDb()
    .prepare(
      `INSERT INTO despesas (${CAMPOS.join(", ")}, criado_em, atualizado_em)
       VALUES (${CAMPOS.map(() => "?").join(", ")}, ?, ?)`,
    )
    .run(...valores(d), ts, ts);
  return Number(r.lastInsertRowid);
}

export function atualizarDespesa(id: number, d: DadosDespesa): void {
  getDb()
    .prepare(
      `UPDATE despesas SET ${CAMPOS.map((c) => `${c} = ?`).join(", ")}, atualizado_em = ? WHERE id = ?`,
    )
    .run(...valores(d), agora(), id);
}

export function eliminarDespesa(id: number): void {
  getDb().prepare("DELETE FROM despesas WHERE id = ?").run(id);
}

/* ------------------------------------------------------------ lucro do período */

export type ResumoPeriodo = {
  /** Comissões marcadas como recebidas no período (data de receção). */
  comissoes_recebidas_cents: number;
  /** Comissões geradas por pagamentos dos casais no período (ainda que por receber). */
  comissoes_geradas_cents: number;
  /** Das geradas no período, as que ainda estão por receber. */
  comissoes_por_receber_cents: number;
  despesas_total_cents: number;
  despesas_base_cents: number;
  despesas_iva_cents: number;
  num_despesas: number;
  /** Comissões recebidas menos despesas (com IVA). */
  lucro_cents: number;
};

function entre(coluna: string, de?: string, ate?: string): { sql: string; args: string[] } {
  const partes: string[] = [];
  const args: string[] = [];
  if (de) {
    partes.push(`${coluna} >= ?`);
    args.push(de);
  }
  if (ate) {
    partes.push(`${coluna} <= ?`);
    args.push(ate);
  }
  return { sql: partes.length ? partes.join(" AND ") : "1 = 1", args };
}

export function resumoDoPeriodo(f: FiltrosDespesas): ResumoPeriodo {
  const db = getDb();
  const recebidas = entre("p.comissao_recebida_em", f.de, f.ate);
  const geradas = entre("p.data_pagamento", f.de, f.ate);
  const comissoes = db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN p.estado = 'pago' AND p.comissao_recebida_em IS NOT NULL AND ${recebidas.sql}
                           THEN p.comissao_cents END), 0) AS recebidas,
         COALESCE(SUM(CASE WHEN p.estado = 'pago' AND ${geradas.sql}
                           THEN p.comissao_cents END), 0) AS geradas,
         COALESCE(SUM(CASE WHEN p.estado = 'pago' AND p.comissao_recebida_em IS NULL AND ${geradas.sql}
                           THEN p.comissao_cents END), 0) AS por_receber
       FROM pagamentos p`,
    )
    .get(...recebidas.args, ...geradas.args, ...geradas.args) as unknown as {
    recebidas: number;
    geradas: number;
    por_receber: number;
  };

  const { where, args } = condicoes(f);
  const despesas = db
    .prepare(
      `SELECT COALESCE(SUM(total_cents), 0) AS total, COALESCE(SUM(valor_cents), 0) AS base,
              COALESCE(SUM(iva_cents), 0) AS iva, COUNT(*) AS n
       FROM despesas d ${where}`,
    )
    .get(...args) as unknown as { total: number; base: number; iva: number; n: number };

  return {
    comissoes_recebidas_cents: comissoes.recebidas,
    comissoes_geradas_cents: comissoes.geradas,
    comissoes_por_receber_cents: comissoes.por_receber,
    despesas_total_cents: despesas.total,
    despesas_base_cents: despesas.base,
    despesas_iva_cents: despesas.iva,
    num_despesas: despesas.n,
    lucro_cents: comissoes.recebidas - despesas.total,
  };
}

export type LinhaMes = {
  mes: string;
  comissoes_cents: number;
  despesas_cents: number;
  lucro_cents: number;
};

/** Comissões recebidas e despesas por mês, dentro do período (ou tudo). */
export function lucroPorMes(f: FiltrosDespesas): LinhaMes[] {
  const db = getDb();
  const recebidas = entre("comissao_recebida_em", f.de, f.ate);
  const comissoes = db
    .prepare(
      `SELECT substr(comissao_recebida_em, 1, 7) AS mes, SUM(comissao_cents) AS total
       FROM pagamentos
       WHERE estado = 'pago' AND comissao_recebida_em IS NOT NULL AND ${recebidas.sql}
       GROUP BY mes`,
    )
    .all(...recebidas.args) as unknown as { mes: string; total: number }[];
  const { where, args } = condicoes(f);
  const despesas = db
    .prepare(`SELECT substr(d.data, 1, 7) AS mes, SUM(d.total_cents) AS total FROM despesas d ${where} GROUP BY mes`)
    .all(...args) as unknown as { mes: string; total: number }[];

  const mapa = new Map<string, LinhaMes>();
  const linha = (mes: string) => {
    if (!mapa.has(mes)) mapa.set(mes, { mes, comissoes_cents: 0, despesas_cents: 0, lucro_cents: 0 });
    return mapa.get(mes)!;
  };
  for (const c of comissoes) linha(c.mes).comissoes_cents = c.total;
  for (const d of despesas) linha(d.mes).despesas_cents = d.total;
  for (const l of mapa.values()) l.lucro_cents = l.comissoes_cents - l.despesas_cents;
  return [...mapa.values()].sort((a, b) => b.mes.localeCompare(a.mes));
}

export type LinhaCategoria = {
  categoria_id: number | null;
  categoria_nome: string;
  num_despesas: number;
  total_cents: number;
};

export function despesasPorCategoria(f: FiltrosDespesas): LinhaCategoria[] {
  const { where, args } = condicoes({ ...f, categoria_id: undefined });
  return getDb()
    .prepare(
      `SELECT d.categoria_id, COALESCE(c.nome, 'Sem categoria') AS categoria_nome,
              COUNT(*) AS num_despesas, SUM(d.total_cents) AS total_cents
       FROM despesas d
       LEFT JOIN categorias_despesa c ON c.id = d.categoria_id
       ${where}
       GROUP BY d.categoria_id
       ORDER BY total_cents DESC`,
    )
    .all(...args) as unknown as LinhaCategoria[];
}
