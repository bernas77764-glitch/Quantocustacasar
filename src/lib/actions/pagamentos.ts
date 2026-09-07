"use server";

import { exigirSessao } from "@/lib/auth";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  atualizarPagamento,
  criarPagamento,
  eliminarPagamento,
  marcarComissaoPorReceber,
  marcarComissaoRecebida,
  marcarPago,
  marcarPendente,
  obterPagamento,
  receberComissoesDoFornecedor as receberTodasDoFornecedor,
  type DadosPagamento,
} from "@/lib/queries/pagamentos";
import { ESTADOS_PAGAMENTO, type EstadoPagamento } from "@/lib/constants";
import { cents, inteiroObrigatorio, texto } from "./util";

function revalidar(pagamentoId?: number) {
  revalidatePath("/pagamentos");
  revalidatePath("/comissoes");
  revalidatePath("/");
  if (!pagamentoId) return;
  const p = obterPagamento(pagamentoId);
  if (!p) return;
  revalidatePath(`/contratacoes/${p.contratacao_id}`);
  revalidatePath(`/clientes/${p.cliente_id}`);
  revalidatePath(`/fornecedores/${p.fornecedor_id}`);
}

/* --------------------------------------------------------------- comissões */

/** Alterna a comissão de um pagamento pago entre "a receber" e "recebida". */
export async function alternarComissao(fd: FormData) {
  await exigirSessao();
  const id = Number(fd.get("id"));
  if (!id) return;
  const p = obterPagamento(id);
  if (!p || p.estado !== "pago" || p.comissao_cents === 0) return;
  if (p.comissao_recebida_em) marcarComissaoPorReceber(id);
  else marcarComissaoRecebida(id, texto(fd, "data") ?? undefined);
  revalidar(id);
  const voltarPara = texto(fd, "voltar_para");
  if (voltarPara) redirect(voltarPara);
}

/** Dá todas as comissões a receber de um fornecedor como recebidas hoje. */
export async function receberComissoesDoFornecedor(fd: FormData) {
  await exigirSessao();
  const fornecedorId = Number(fd.get("fornecedor_id"));
  if (!fornecedorId) return;
  receberTodasDoFornecedor(fornecedorId, texto(fd, "data") ?? undefined);
  revalidatePath("/comissoes");
  revalidatePath("/pagamentos");
  revalidatePath("/");
  revalidatePath(`/fornecedores/${fornecedorId}`);
  const voltarPara = texto(fd, "voltar_para");
  if (voltarPara) redirect(voltarPara);
}

function dadosDoFormulario(fd: FormData): DadosPagamento {
  const estado = texto(fd, "estado");
  return {
    contratacao_id: inteiroObrigatorio(fd, "contratacao_id"),
    descricao: texto(fd, "descricao"),
    valor_cents: cents(fd, "valor") ?? 0,
    data_prevista: texto(fd, "data_prevista"),
    data_pagamento: texto(fd, "data_pagamento"),
    metodo: texto(fd, "metodo"),
    estado: ESTADOS_PAGAMENTO.includes(estado as EstadoPagamento)
      ? (estado as EstadoPagamento)
      : "pendente",
    referencia: texto(fd, "referencia"),
    notas: texto(fd, "notas"),
  };
}

export async function guardarPagamento(fd: FormData) {
  await exigirSessao();
  const id = Number(fd.get("id")) || 0;
  const dados = dadosDoFormulario(fd);

  if (id > 0) {
    atualizarPagamento(id, dados);
    revalidar(id);
  } else {
    const novoId = criarPagamento(dados);
    revalidar(novoId);
  }

  const voltarPara = texto(fd, "voltar_para");
  if (voltarPara) redirect(voltarPara);
}

export async function alternarPagamento(fd: FormData) {
  await exigirSessao();
  const id = Number(fd.get("id"));
  if (!id) return;
  const atual = obterPagamento(id);
  if (!atual) return;
  if (atual.estado === "pago") marcarPendente(id);
  else marcarPago(id, texto(fd, "data_pagamento") ?? undefined, texto(fd, "metodo") ?? undefined);
  revalidar(id);
}

export async function apagarPagamento(fd: FormData) {
  await exigirSessao();
  const id = Number(fd.get("id"));
  if (!id) return;
  const p = obterPagamento(id);
  eliminarPagamento(id);
  revalidatePath("/pagamentos");
  revalidatePath("/");
  if (p) {
    revalidatePath(`/contratacoes/${p.contratacao_id}`);
    revalidatePath(`/clientes/${p.cliente_id}`);
  }
}
