"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirAdministrador, exigirSessao } from "@/lib/auth";
import {
  criarCompromisso,
  eliminarCompromisso,
  obterCompromisso,
  type DadosCompromisso,
} from "@/lib/queries/compromissos";
import {
  eventosGoogle,
  guardarLigacaoGoogle,
  limparCache,
  regenerarTokenDoFeed,
  removerLigacaoGoogle,
  validarUrlGoogle,
} from "@/lib/google-calendar";
import { dataValida, horaValida } from "@/lib/tempo";
import { inteiro, texto } from "./util";

export type EstadoFormulario = {
  erro?: string;
  sucesso?: string;
  /** O React 19 limpa o formulário após submeter; repomos o que foi escrito. */
  valores?: Record<string, string>;
};

function revalidar(data?: string) {
  revalidatePath("/calendario");
  revalidatePath("/calendario/google");
  revalidatePath("/");
  if (data) revalidatePath(`/calendario?mes=${data.slice(0, 7)}`);
}

/* ------------------------------------------------------------ compromissos */

function dadosDoFormulario(fd: FormData): { ok: true; dados: DadosCompromisso } | { ok: false; erro: string } {
  const titulo = texto(fd, "titulo");
  const data = texto(fd, "data");
  const horaInicio = texto(fd, "hora_inicio");
  const horaFim = texto(fd, "hora_fim");
  if (!titulo) return { ok: false, erro: "Dê um título ao compromisso." };
  if (!dataValida(data)) return { ok: false, erro: "Indique uma data válida." };
  if (horaInicio && !horaValida(horaInicio)) return { ok: false, erro: "A hora de início não é válida." };
  if (horaFim && !horaValida(horaFim)) return { ok: false, erro: "A hora de fim não é válida." };
  if (horaFim && !horaInicio) return { ok: false, erro: "Indique a hora de início para poder ter hora de fim." };
  if (horaInicio && horaFim && horaFim <= horaInicio) return { ok: false, erro: "A hora de fim tem de ser depois da de início." };
  return {
    ok: true,
    dados: {
      titulo: titulo.slice(0, 200),
      data,
      hora_inicio: horaInicio,
      hora_fim: horaFim,
      local: texto(fd, "local"),
      cliente_id: inteiro(fd, "cliente_id"),
      fornecedor_id: inteiro(fd, "fornecedor_id"),
      notas: texto(fd, "notas"),
    },
  };
}

export async function guardarCompromisso(
  _anterior: EstadoFormulario,
  fd: FormData,
): Promise<EstadoFormulario> {
  await exigirSessao();
  const valores = Object.fromEntries(
    ["titulo", "data", "hora_inicio", "hora_fim", "local", "cliente_id", "fornecedor_id", "notas"].map((c) => [
      c,
      String(fd.get(c) ?? ""),
    ]),
  );
  const r = dadosDoFormulario(fd);
  if (!r.ok) return { erro: r.erro, valores };
  criarCompromisso(r.dados);
  revalidar(r.dados.data);
  const voltar = texto(fd, "voltar_para");
  if (voltar && voltar.startsWith("/")) redirect(voltar);
  redirect(`/calendario?mes=${r.dados.data.slice(0, 7)}`);
}

export async function apagarCompromisso(fd: FormData) {
  await exigirSessao();
  const id = Number(fd.get("id"));
  if (!id) return;
  const c = obterCompromisso(id);
  if (!c) return;
  eliminarCompromisso(id);
  revalidar(c.data);
  if (c.cliente_id) revalidatePath(`/clientes/${c.cliente_id}`);
  const voltar = texto(fd, "voltar_para");
  if (voltar && voltar.startsWith("/")) redirect(voltar);
}

/* ----------------------------------------------------------------- Google */

export async function ligarGoogle(_anterior: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  await exigirAdministrador();
  const bruto = texto(fd, "url") ?? "";
  const r = validarUrlGoogle(bruto);
  if (!r.ok) return { erro: r.erro, valores: { url: bruto } };
  guardarLigacaoGoogle(r.url);
  const { estado } = await eventosGoogle(true);
  revalidar();
  if (estado.erro) {
    return {
      erro: `A ligação ficou guardada, mas não foi possível ler o calendário: ${estado.erro}`,
      valores: { url: r.url },
    };
  }
  return {
    sucesso: `Ligado${estado.nome_calendario ? ` a "${estado.nome_calendario}"` : ""}: ${estado.total_eventos} eventos lidos.`,
  };
}

export async function desligarGoogle() {
  await exigirAdministrador();
  removerLigacaoGoogle();
  revalidar();
}

export async function atualizarGoogle(fd: FormData) {
  await exigirSessao();
  limparCache();
  await eventosGoogle(true);
  revalidar();
  const voltar = texto(fd, "voltar_para");
  if (voltar && voltar.startsWith("/")) redirect(voltar);
}

export async function novaLigacaoDoFeed() {
  await exigirAdministrador();
  regenerarTokenDoFeed();
  revalidar();
}
