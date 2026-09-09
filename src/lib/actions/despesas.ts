"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirSessao } from "@/lib/auth";
import {
  atualizarDespesa,
  calcularIva,
  categoriaDespesaExiste,
  criarCategoriaDespesa,
  criarDespesa,
  eliminarCategoriaDespesa,
  eliminarDespesa,
  obterCategoriaDespesa,
  obterDespesa,
  renomearCategoriaDespesa,
  type DadosDespesa,
} from "@/lib/queries/despesas";
import { dataValida } from "@/lib/tempo";
import { cents, inteiro, texto } from "./util";

export type EstadoFormulario = {
  erro?: string;
  sucesso?: string;
  /** O React 19 limpa o formulário após submeter; repomos o que foi escrito. */
  valores?: Record<string, string>;
};

function revalidar() {
  revalidatePath("/despesas");
  revalidatePath("/");
}

/* ------------------------------------------------------------------ despesas */

const CAMPOS_ECO = ["data", "descricao", "categoria_id", "fornecedor", "valor", "iva_pct", "iva_outra", "valor_com_iva", "metodo", "cliente_id", "notas"];

/** A taxa escolhida no seletor, ou a escrita à mão em "Outra". */
function taxaDoFormulario(fd: FormData): { ok: true; taxa: number | null } | { ok: false; erro: string } {
  const escolha = texto(fd, "iva_pct");
  if (!escolha || escolha === "nao") return { ok: true, taxa: null };
  const bruto = escolha === "outra" ? texto(fd, "iva_outra") : escolha;
  if (!bruto) return { ok: false, erro: "Indique a taxa de IVA." };
  const taxa = Number(bruto.replace(",", "."));
  if (!Number.isFinite(taxa) || taxa < 0 || taxa > 100) return { ok: false, erro: "A taxa de IVA tem de estar entre 0 e 100." };
  return { ok: true, taxa };
}

function dadosDoFormulario(fd: FormData): { ok: true; dados: DadosDespesa } | { ok: false; erro: string } {
  const descricao = texto(fd, "descricao");
  const data = texto(fd, "data");
  const valor = cents(fd, "valor");
  if (!descricao) return { ok: false, erro: "Descreva a despesa." };
  if (!dataValida(data)) return { ok: false, erro: "Indique uma data válida." };
  if (valor === null || valor <= 0) return { ok: false, erro: "Indique o valor da despesa." };
  const taxa = taxaDoFormulario(fd);
  if (!taxa.ok) return taxa;
  const categoriaId = inteiro(fd, "categoria_id");
  if (categoriaId && !obterCategoriaDespesa(categoriaId)) return { ok: false, erro: "Escolha uma categoria válida." };
  const calculo = calcularIva(valor, taxa.taxa, fd.get("valor_com_iva") === "sim");
  return {
    ok: true,
    dados: {
      data,
      descricao: descricao.slice(0, 200),
      categoria_id: categoriaId,
      fornecedor: texto(fd, "fornecedor"),
      ...calculo,
      iva_pct: taxa.taxa,
      metodo: texto(fd, "metodo"),
      cliente_id: inteiro(fd, "cliente_id"),
      notas: texto(fd, "notas"),
    },
  };
}

export async function guardarDespesa(_anterior: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  await exigirSessao();
  const valores = Object.fromEntries(CAMPOS_ECO.map((c) => [c, String(fd.get(c) ?? "")]));
  const r = dadosDoFormulario(fd);
  if (!r.ok) return { erro: r.erro, valores };
  const id = Number(fd.get("id")) || 0;
  if (id > 0) {
    if (!obterDespesa(id)) return { erro: "Esta despesa já não existe.", valores };
    atualizarDespesa(id, r.dados);
  } else {
    criarDespesa(r.dados);
  }
  revalidar();
  const voltar = texto(fd, "voltar_para");
  redirect(voltar && voltar.startsWith("/") ? voltar : `/despesas?de=${r.dados.data.slice(0, 7)}-01&ate=${r.dados.data.slice(0, 7)}-31`);
}

export async function apagarDespesa(fd: FormData) {
  await exigirSessao();
  const id = Number(fd.get("id"));
  if (!id) return;
  eliminarDespesa(id);
  revalidar();
  const voltar = texto(fd, "voltar_para");
  if (voltar && voltar.startsWith("/")) redirect(voltar);
}

/* ---------------------------------------------------------------- categorias */

export async function criarCategoria(_anterior: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  await exigirSessao();
  const nome = texto(fd, "nome");
  if (!nome) return { erro: "Dê um nome à categoria." };
  if (nome.length > 60) return { erro: "O nome é demasiado comprido (máximo 60 caracteres).", valores: { nome } };
  if (categoriaDespesaExiste(nome)) return { erro: `Já existe a categoria "${nome}".`, valores: { nome } };
  criarCategoriaDespesa(nome);
  revalidar();
  return { sucesso: `Categoria "${nome}" criada.` };
}

export async function renomearCategoria(fd: FormData) {
  await exigirSessao();
  const id = Number(fd.get("id"));
  const nome = texto(fd, "nome");
  if (!id || !nome || nome.length > 60 || categoriaDespesaExiste(nome, id)) return;
  renomearCategoriaDespesa(id, nome);
  revalidar();
}

export async function apagarCategoria(fd: FormData) {
  await exigirSessao();
  const id = Number(fd.get("id"));
  if (!id) return;
  eliminarCategoriaDespesa(id);
  revalidar();
}
