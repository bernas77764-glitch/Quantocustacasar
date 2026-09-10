/**
 * Um email pronto a rever: o modelo em vigor preenchido com o que as fichas
 * sabem. O que falta fica "a definir", e os campos que só se sabem ao enviar
 * (notas, n.º da fatura…) ficam entre chavetas para o formulário preencher.
 */

import { euros, data as formatarData, percentagem } from "@/lib/format";
import { configuracaoEmail, definicaoModelo, modelo, preencherModelo, type CamposModelo, type DefinicaoModelo } from "@/lib/email";
import { obterCliente } from "@/lib/queries/clientes";
import { listarContratacoes, obterContratacao } from "@/lib/queries/contratacoes";
import { obterFornecedor } from "@/lib/queries/fornecedores";
import { ultimoEnviado } from "@/lib/queries/emails";
import type { ContratacaoDetalhada } from "@/lib/types";
import type { ClienteListado } from "@/lib/queries/clientes";
import type { FornecedorListado } from "@/lib/queries/fornecedores";

export type Ids = { cliente_id?: number | null; fornecedor_id?: number | null; contratacao_id?: number | null };

export type EmailPreparado = {
  definicao: DefinicaoModelo;
  cliente: ClienteListado | null;
  fornecedor: FornecedorListado | null;
  contratacao: ContratacaoDetalhada | null;
  /** Campos já conhecidos; os do momento do envio não estão aqui. */
  campos: CamposModelo;
  para: string;
  assunto: string;
  corpo: string;
};

const A_DEFINIR = "a definir";

function nomeDoCasal(c: { nome: string; parceiro: string | null }): string {
  return c.parceiro ? `${c.nome} & ${c.parceiro}` : c.nome;
}

function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome;
}

function linhasDePropostas(clienteId: number): { propostas: string; total: string } {
  const linhas = listarContratacoes({ cliente_id: clienteId }).filter((c) => c.estado === "proposta" || c.estado === "confirmada");
  if (linhas.length === 0) return { propostas: "(ainda sem propostas registadas)", total: A_DEFINIR };
  const total = linhas.reduce((s, c) => s + c.valor_cents, 0);
  return {
    propostas: linhas
      .map((c) => `- ${c.categoria}: ${c.fornecedor_nome}, ${euros(c.valor_cents)}${c.descricao ? ` (${c.descricao})` : ""}`)
      .join("\n"),
    total: euros(total),
  };
}

/** Carrega as fichas e monta o email. Devolve nulo se faltar a ficha principal. */
export function prepararEmail(chave: string, ids: Ids, remetente: string): EmailPreparado | null {
  const definicao = definicaoModelo(chave);
  if (!definicao) return null;

  const contratacao = ids.contratacao_id ? obterContratacao(ids.contratacao_id) : null;
  const cliente = ids.cliente_id ? obterCliente(ids.cliente_id) : contratacao ? obterCliente(contratacao.cliente_id) : null;
  const fornecedor = ids.fornecedor_id
    ? obterFornecedor(ids.fornecedor_id)
    : contratacao
      ? obterFornecedor(contratacao.fornecedor_id)
      : null;

  for (const p of definicao.precisa) {
    if (p === "cliente" && !cliente) return null;
    if (p === "fornecedor" && !fornecedor) return null;
    if (p === "contratacao" && !contratacao) return null;
  }

  const dataEvento = contratacao?.data_servico ?? cliente?.data_casamento ?? null;
  const comissaoPct = contratacao?.comissao_pct ?? fornecedor?.comissao_pct ?? null;
  const config = configuracaoEmail();

  const campos: CamposModelo = {
    nome: cliente ? primeiroNome(cliente.nome) : A_DEFINIR,
    casal: cliente ? nomeDoCasal(cliente) : A_DEFINIR,
    data: dataEvento ? formatarData(dataEvento) : A_DEFINIR,
    convidados: cliente?.num_convidados ? String(cliente.num_convidados) : A_DEFINIR,
    distrito: cliente?.distrito ?? fornecedor?.distrito ?? A_DEFINIR,
    local: cliente?.local_evento?.trim() || A_DEFINIR,
    orcamento: cliente?.orcamento_cents ? euros(cliente.orcamento_cents) : A_DEFINIR,
    fornecedor: fornecedor?.nome ?? A_DEFINIR,
    contacto: fornecedor?.contacto?.trim() || fornecedor?.nome || A_DEFINIR,
    categoria: contratacao?.categoria ?? fornecedor?.categoria ?? A_DEFINIR,
    comissao: comissaoPct !== null ? percentagem(comissaoPct) : A_DEFINIR,
    valor: contratacao && contratacao.valor_cents > 0 ? euros(contratacao.valor_cents) : A_DEFINIR,
    descricao: contratacao?.descricao ?? "",
    data_envio: contratacao
      ? (() => {
          const u = ultimoEnviado(contratacao.id, "fornecedor_disponibilidade");
          return u ? formatarData(u.criado_em.slice(0, 10)) : A_DEFINIR;
        })()
      : A_DEFINIR,
    iban: config?.iban || A_DEFINIR,
    remetente,
  };
  if (cliente && definicao.chave === "cliente_proposta") Object.assign(campos, linhasDePropostas(cliente.id));

  const { modelo: m } = modelo(chave);
  const para = definicao.destinatario === "cliente" ? (cliente?.email ?? "") : (fornecedor?.email ?? "");
  return {
    definicao,
    cliente,
    fornecedor,
    contratacao,
    campos,
    para,
    assunto: preencherModelo(m.assunto, campos),
    corpo: preencherModelo(m.corpo, campos),
  };
}
