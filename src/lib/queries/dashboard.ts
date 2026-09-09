import { getDb, hoje } from "@/lib/db";
import { ESTADOS_CLIENTE_ATIVOS } from "@/lib/constants";
import { listarPagamentos } from "./pagamentos";
import type { PagamentoDetalhado } from "@/lib/types";

export type Resumo = {
  clientes_total: number;
  clientes_ativos: number;
  clientes_ganhos: number;
  fornecedores_ativos: number;
  contratacoes_ativas: number;
  contratado_cents: number;
  pago_cents: number;
  pendente_cents: number;
  atrasado_cents: number;
  a_vencer_30d_cents: number;
  /** Comissão prevista nas contratações confirmadas e concluídas. */
  comissao_cents: number;
  /** O casal já pagou; o fornecedor ainda não pagou a comissão. */
  comissao_a_receber_cents: number;
  comissao_recebida_cents: number;
  comissao_recebida_mes_cents: number;
  /** Despesas registadas este mês, com IVA. */
  despesas_mes_cents: number;
  taxa_conversao: number;
  casamentos_90d: number;
};

export function resumo(): Resumo {
  const db = getDb();
  const marcadores = ESTADOS_CLIENTE_ATIVOS.map(() => "?").join(", ");
  const daqui30 = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
  const daqui90 = new Date(Date.now() + 90 * 86_400_000).toISOString().slice(0, 10);

  const clientes = db
    .prepare(
      `SELECT
         COUNT(*) AS total,
         COALESCE(SUM(CASE WHEN estado IN (${marcadores}) THEN 1 END), 0) AS ativos,
         COALESCE(SUM(CASE WHEN estado = 'ganho' THEN 1 END), 0) AS ganhos,
         COALESCE(SUM(CASE WHEN estado = 'perdido' THEN 1 END), 0) AS perdidos,
         COALESCE(SUM(CASE WHEN data_casamento IS NOT NULL
                            AND data_casamento BETWEEN ? AND ? THEN 1 END), 0) AS casamentos_90d
       FROM clientes`,
    )
    .get(...ESTADOS_CLIENTE_ATIVOS, hoje(), daqui90) as unknown as {
    total: number;
    ativos: number;
    ganhos: number;
    perdidos: number;
    casamentos_90d: number;
  };

  const fornecedores = db
    .prepare("SELECT COUNT(*) AS ativos FROM fornecedores WHERE ativo = 1")
    .get() as unknown as { ativos: number };

  const financeiro = db
    .prepare(
      `SELECT
         COUNT(*) AS contratacoes,
         COALESCE(SUM(valor_cents), 0) AS contratado_cents,
         COALESCE(SUM(CAST(ROUND(valor_cents * comissao_pct / 100.0) AS INTEGER)), 0) AS comissao_cents
       FROM contratacoes WHERE estado IN ('confirmada', 'concluida')`,
    )
    .get() as unknown as {
    contratacoes: number;
    contratado_cents: number;
    comissao_cents: number;
  };

  const pagamentos = db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN p.estado = 'pago' THEN p.valor_cents END), 0) AS pago_cents,
         COALESCE(SUM(CASE WHEN p.estado = 'pendente' THEN p.valor_cents END), 0) AS pendente_cents,
         COALESCE(SUM(CASE WHEN p.estado = 'pendente' AND p.data_prevista < ?
                           THEN p.valor_cents END), 0) AS atrasado_cents,
         COALESCE(SUM(CASE WHEN p.estado = 'pendente'
                            AND p.data_prevista BETWEEN ? AND ?
                           THEN p.valor_cents END), 0) AS a_vencer_30d_cents,
         COALESCE(SUM(CASE WHEN p.estado = 'pago' AND p.comissao_recebida_em IS NULL
                           THEN p.comissao_cents END), 0) AS comissao_a_receber_cents,
         COALESCE(SUM(CASE WHEN p.estado = 'pago' AND p.comissao_recebida_em IS NOT NULL
                           THEN p.comissao_cents END), 0) AS comissao_recebida_cents,
         COALESCE(SUM(CASE WHEN p.estado = 'pago' AND p.comissao_recebida_em >= ?
                           THEN p.comissao_cents END), 0) AS comissao_recebida_mes_cents
       FROM pagamentos p
       JOIN contratacoes c ON c.id = p.contratacao_id
       WHERE c.estado IN ('confirmada', 'concluida')`,
    )
    .get(hoje(), hoje(), daqui30, `${hoje().slice(0, 7)}-01`) as unknown as {
    pago_cents: number;
    pendente_cents: number;
    atrasado_cents: number;
    a_vencer_30d_cents: number;
    comissao_a_receber_cents: number;
    comissao_recebida_cents: number;
    comissao_recebida_mes_cents: number;
  };

  const fechados = clientes.ganhos + clientes.perdidos;

  return {
    clientes_total: clientes.total,
    clientes_ativos: clientes.ativos,
    clientes_ganhos: clientes.ganhos,
    fornecedores_ativos: fornecedores.ativos,
    contratacoes_ativas: financeiro.contratacoes,
    contratado_cents: financeiro.contratado_cents,
    comissao_cents: financeiro.comissao_cents,
    pago_cents: pagamentos.pago_cents,
    pendente_cents: pagamentos.pendente_cents,
    atrasado_cents: pagamentos.atrasado_cents,
    a_vencer_30d_cents: pagamentos.a_vencer_30d_cents,
    comissao_a_receber_cents: pagamentos.comissao_a_receber_cents,
    comissao_recebida_cents: pagamentos.comissao_recebida_cents,
    comissao_recebida_mes_cents: pagamentos.comissao_recebida_mes_cents,
    despesas_mes_cents: (
      getDb()
        .prepare("SELECT COALESCE(SUM(total_cents), 0) AS total FROM despesas WHERE data >= ?")
        .get(`${hoje().slice(0, 7)}-01`) as unknown as { total: number }
    ).total,
    taxa_conversao: fechados > 0 ? (clientes.ganhos / fechados) * 100 : 0,
    casamentos_90d: clientes.casamentos_90d,
  };
}

export function pipeline(): { estado: string; total: number; valor_cents: number }[] {
  return getDb()
    .prepare(
      `SELECT estado, COUNT(*) AS total, COALESCE(SUM(orcamento_cents), 0) AS valor_cents
       FROM clientes GROUP BY estado`,
    )
    .all() as unknown as { estado: string; total: number; valor_cents: number }[];
}

export function valorPorCategoria(): { categoria: string; total: number; valor_cents: number }[] {
  return getDb()
    .prepare(
      `SELECT categoria, COUNT(*) AS total, COALESCE(SUM(valor_cents), 0) AS valor_cents
       FROM contratacoes
       WHERE estado IN ('confirmada', 'concluida')
       GROUP BY categoria
       ORDER BY valor_cents DESC`,
    )
    .all() as unknown as { categoria: string; total: number; valor_cents: number }[];
}

/** Recebimentos por mês (YYYY-MM), dos últimos `meses` meses. */
export function recebimentosPorMes(meses = 6): { mes: string; valor_cents: number }[] {
  const inicio = new Date();
  inicio.setDate(1);
  inicio.setMonth(inicio.getMonth() - (meses - 1));
  const desde = inicio.toISOString().slice(0, 10);

  const linhas = getDb()
    .prepare(
      `SELECT substr(data_pagamento, 1, 7) AS mes, COALESCE(SUM(valor_cents), 0) AS valor_cents
       FROM pagamentos
       WHERE estado = 'pago' AND data_pagamento IS NOT NULL AND data_pagamento >= ?
       GROUP BY mes ORDER BY mes`,
    )
    .all(desde) as unknown as { mes: string; valor_cents: number }[];

  const porMes = new Map(linhas.map((l) => [l.mes, l.valor_cents]));
  const resultado: { mes: string; valor_cents: number }[] = [];
  for (let i = 0; i < meses; i++) {
    const d = new Date(inicio);
    d.setMonth(inicio.getMonth() + i);
    const chave = d.toISOString().slice(0, 7);
    resultado.push({ mes: chave, valor_cents: porMes.get(chave) ?? 0 });
  }
  return resultado;
}

export function pagamentosEmAtraso(limite = 8): PagamentoDetalhado[] {
  return listarPagamentos({ estado: "atrasado" }).slice(0, limite);
}

export function proximosPagamentos(limite = 8): PagamentoDetalhado[] {
  const daqui60 = new Date(Date.now() + 60 * 86_400_000).toISOString().slice(0, 10);
  return listarPagamentos({ estado: "pendente", desde: hoje(), ate: daqui60 }).slice(
    0,
    limite,
  );
}

export function proximosCasamentos(limite = 6) {
  return getDb()
    .prepare(
      `SELECT id, nome, data_casamento, local_evento, distrito, estado
       FROM clientes
       WHERE data_casamento IS NOT NULL AND data_casamento >= ?
       ORDER BY data_casamento ASC LIMIT ?`,
    )
    .all(hoje(), limite) as unknown as {
    id: number;
    nome: string;
    data_casamento: string;
    local_evento: string | null;
    distrito: string | null;
    estado: string;
  }[];
}
