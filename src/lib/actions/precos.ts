"use server";

import { revalidatePath } from "next/cache";
import { exigirSessao } from "@/lib/auth";
import {
  DIMENSOES,
  MULT_BASE,
  RUBRICAS_BASE,
  guardarTabela,
  reporTabela,
  validarTabela,
} from "@/lib/precos";
import { texto } from "./util";

export type EstadoPrecos = { erros?: string[]; sucesso?: string };

function revalidar() {
  revalidatePath("/precos");
  revalidatePath("/api/public/precos");
}

/** Lê o editor (um campo por valor) e guarda a tabela completa. */
export async function guardarPrecos(
  _anterior: EstadoPrecos,
  fd: FormData,
): Promise<EstadoPrecos> {
  await exigirSessao();

  const entrada = {
    rubricas: RUBRICAS_BASE.map((r) => ({
      id: r.id,
      min: texto(fd, `r.${r.id}.min`),
      base: texto(fd, `r.${r.id}.base`),
      max: texto(fd, `r.${r.id}.max`),
    })),
    mult: Object.fromEntries(
      DIMENSOES.map((dim) => [
        dim,
        Object.fromEntries(MULT_BASE[dim].map((m) => [m.chave, texto(fd, `m.${dim}.${m.chave}`)])),
      ]),
    ),
  };

  const resultado = validarTabela(entrada);
  if (!resultado.ok) return { erros: resultado.erros };

  guardarTabela(resultado.tabela);
  revalidar();
  return { sucesso: "Tabela guardada. O site passa a usá-la no próximo carregamento." };
}

/** Cola do botão «Copiar tabela (JSON)» do site. */
export async function importarPrecos(
  _anterior: EstadoPrecos,
  fd: FormData,
): Promise<EstadoPrecos> {
  await exigirSessao();

  const bruto = texto(fd, "json");
  if (!bruto) return { erros: ["Cole o JSON copiado do site."] };

  let objeto: unknown;
  try {
    objeto = JSON.parse(bruto);
  } catch {
    return { erros: ["O texto colado não é JSON válido."] };
  }

  const resultado = validarTabela(objeto);
  if (!resultado.ok) return { erros: resultado.erros };

  guardarTabela(resultado.tabela);
  revalidar();
  return { sucesso: "Tabela importada e guardada." };
}

export async function reporPrecos() {
  await exigirSessao();
  reporTabela();
  revalidar();
}
