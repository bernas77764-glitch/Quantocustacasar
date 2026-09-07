"use server";

import { exigirSessao } from "@/lib/auth";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  atualizarCliente,
  atualizarEstadoCliente,
  criarCliente,
  eliminarCliente,
  registarAtividade,
  type DadosCliente,
} from "@/lib/queries/clientes";
import { ESTADOS_CLIENTE, type EstadoCliente } from "@/lib/constants";
import { cents, inteiro, texto, textoObrigatorio } from "./util";

function dadosDoFormulario(fd: FormData): DadosCliente {
  const estado = texto(fd, "estado");
  return {
    nome: textoObrigatorio(fd, "nome"),
    parceiro: texto(fd, "parceiro"),
    email: texto(fd, "email"),
    telefone: texto(fd, "telefone"),
    data_casamento: texto(fd, "data_casamento"),
    num_convidados: inteiro(fd, "num_convidados"),
    orcamento_cents: cents(fd, "orcamento"),
    distrito: texto(fd, "distrito"),
    local_evento: texto(fd, "local_evento"),
    origem: texto(fd, "origem"),
    estado: ESTADOS_CLIENTE.includes(estado as EstadoCliente)
      ? (estado as EstadoCliente)
      : "novo",
    responsavel: texto(fd, "responsavel"),
    notas: texto(fd, "notas"),
  };
}

export async function guardarCliente(fd: FormData) {
  await exigirSessao();
  const id = Number(fd.get("id")) || 0;
  const dados = dadosDoFormulario(fd);

  if (id > 0) {
    atualizarCliente(id, dados);
    revalidatePath("/clientes");
    revalidatePath(`/clientes/${id}`);
    redirect(`/clientes/${id}`);
  }

  const novoId = criarCliente(dados);
  revalidatePath("/clientes");
  redirect(`/clientes/${novoId}`);
}

export async function alterarEstadoCliente(fd: FormData) {
  await exigirSessao();
  const id = Number(fd.get("id"));
  const estado = String(fd.get("estado")) as EstadoCliente;
  if (!id || !ESTADOS_CLIENTE.includes(estado)) return;
  atualizarEstadoCliente(id, estado);
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  revalidatePath("/");
}

export async function adicionarNota(fd: FormData) {
  await exigirSessao();
  const id = Number(fd.get("id"));
  const descricao = texto(fd, "descricao");
  const tipo = texto(fd, "tipo") ?? "nota";
  if (!id || !descricao) return;
  registarAtividade(id, tipo, descricao);
  revalidatePath(`/clientes/${id}`);
}

export async function apagarCliente(fd: FormData) {
  await exigirSessao();
  const id = Number(fd.get("id"));
  if (!id) return;
  eliminarCliente(id);
  revalidatePath("/clientes");
  redirect("/clientes");
}
