"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirAdministrador } from "@/lib/auth";
import { inserirDemonstracao, removerDemonstracao } from "@/lib/demonstracao";

function revalidar() {
  for (const caminho of ["/", "/clientes", "/fornecedores", "/contratacoes", "/pagamentos", "/demonstracao"]) {
    revalidatePath(caminho);
  }
}

export async function inserirDadosDeDemonstracao() {
  await exigirAdministrador();
  const criados = inserirDemonstracao();
  revalidar();
  redirect(`/demonstracao?inseridos=${criados.clientes}-${criados.fornecedores}`);
}

export async function removerDadosDeDemonstracao() {
  await exigirAdministrador();
  const r = removerDemonstracao();
  revalidar();
  redirect(`/demonstracao?removidos=${r.clientes}-${r.fornecedores}-${r.desativados}`);
}
