"use server";

import { exigirSessao } from "@/lib/auth";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  atualizarFornecedor,
  criarFornecedor,
  eliminarFornecedor,
  type DadosFornecedor,
} from "@/lib/queries/fornecedores";
import { booleano, cents, decimal, texto, textoObrigatorio } from "./util";

function dadosDoFormulario(fd: FormData): DadosFornecedor {
  return {
    nome: textoObrigatorio(fd, "nome"),
    categoria: textoObrigatorio(fd, "categoria"),
    contacto: texto(fd, "contacto"),
    email: texto(fd, "email"),
    telefone: texto(fd, "telefone"),
    website: texto(fd, "website"),
    distrito: texto(fd, "distrito"),
    preco_min_cents: cents(fd, "preco_min"),
    preco_max_cents: cents(fd, "preco_max"),
    comissao_pct: decimal(fd, "comissao_pct"),
    ativo: booleano(fd, "ativo"),
    notas: texto(fd, "notas"),
  };
}

export async function guardarFornecedor(fd: FormData) {
  await exigirSessao();
  const id = Number(fd.get("id")) || 0;
  const dados = dadosDoFormulario(fd);

  if (id > 0) {
    atualizarFornecedor(id, dados);
    revalidatePath("/fornecedores");
    revalidatePath(`/fornecedores/${id}`);
    redirect(`/fornecedores/${id}`);
  }

  const novoId = criarFornecedor(dados);
  revalidatePath("/fornecedores");
  redirect(`/fornecedores/${novoId}`);
}

export async function apagarFornecedor(fd: FormData) {
  await exigirSessao();
  const id = Number(fd.get("id"));
  if (!id) return;
  const removido = eliminarFornecedor(id);
  revalidatePath("/fornecedores");
  if (removido) redirect("/fornecedores");
  revalidatePath(`/fornecedores/${id}`);
}
