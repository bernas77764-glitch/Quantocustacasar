"use server";

import { exigirSessao } from "@/lib/auth";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  atualizarContratacao,
  atualizarEstadoContratacao,
  criarContratacao,
  eliminarContratacao,
  gerarPlanoPagamentos,
  obterContratacao,
  type DadosContratacao,
} from "@/lib/queries/contratacoes";
import {
  ESTADOS_CONTRATACAO,
  type EstadoContratacao,
} from "@/lib/constants";
import {
  cents,
  decimal,
  inteiroObrigatorio,
  texto,
  textoObrigatorio,
} from "./util";

function dadosDoFormulario(fd: FormData): DadosContratacao {
  const estado = texto(fd, "estado");
  return {
    cliente_id: inteiroObrigatorio(fd, "cliente_id"),
    fornecedor_id: inteiroObrigatorio(fd, "fornecedor_id"),
    categoria: textoObrigatorio(fd, "categoria"),
    descricao: texto(fd, "descricao"),
    valor_cents: cents(fd, "valor") ?? 0,
    comissao_pct: decimal(fd, "comissao_pct"),
    estado: ESTADOS_CONTRATACAO.includes(estado as EstadoContratacao)
      ? (estado as EstadoContratacao)
      : "proposta",
    data_servico: texto(fd, "data_servico"),
    notas: texto(fd, "notas"),
  };
}

function revalidar(id: number, clienteId?: number, fornecedorId?: number) {
  revalidatePath("/contratacoes");
  revalidatePath(`/contratacoes/${id}`);
  revalidatePath("/pagamentos");
  revalidatePath("/");
  if (clienteId) revalidatePath(`/clientes/${clienteId}`);
  if (fornecedorId) revalidatePath(`/fornecedores/${fornecedorId}`);
}

export async function guardarContratacao(fd: FormData) {
  await exigirSessao();
  const id = Number(fd.get("id")) || 0;
  const dados = dadosDoFormulario(fd);

  if (id > 0) {
    atualizarContratacao(id, dados);
    revalidar(id, dados.cliente_id, dados.fornecedor_id);
    redirect(`/contratacoes/${id}`);
  }

  const novoId = criarContratacao(dados);
  if (fd.get("gerar_plano") === "on") gerarPlanoPagamentos(novoId);
  revalidar(novoId, dados.cliente_id, dados.fornecedor_id);
  if (fd.get("pedir_disponibilidade") === "on") redirect(`/contratacoes/${novoId}/pedido`);
  redirect(`/contratacoes/${novoId}`);
}

export async function alterarEstadoContratacao(fd: FormData) {
  await exigirSessao();
  const id = Number(fd.get("id"));
  const estado = String(fd.get("estado")) as EstadoContratacao;
  if (!id || !ESTADOS_CONTRATACAO.includes(estado)) return;
  const antes = obterContratacao(id);
  atualizarEstadoContratacao(id, estado);
  revalidar(id, antes?.cliente_id, antes?.fornecedor_id);
}

export async function criarPlanoPagamentos(fd: FormData) {
  await exigirSessao();
  const id = Number(fd.get("id"));
  const percentagem = Number(fd.get("sinal_pct")) || 30;
  if (!id) return;
  gerarPlanoPagamentos(id, percentagem);
  const c = obterContratacao(id);
  revalidar(id, c?.cliente_id, c?.fornecedor_id);
}

export async function apagarContratacao(fd: FormData) {
  await exigirSessao();
  const id = Number(fd.get("id"));
  if (!id) return;
  const c = obterContratacao(id);
  eliminarContratacao(id);
  revalidar(id, c?.cliente_id, c?.fornecedor_id);
  redirect(c ? `/clientes/${c.cliente_id}` : "/contratacoes");
}
