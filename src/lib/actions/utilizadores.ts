"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  contarAdministradoresAtivos,
  criarUtilizador,
  definirAdministrador,
  definirAtivo,
  emailExiste,
  exigirAdministrador,
  exigirSessao,
  obterUtilizador,
  redefinirPalavraPasse,
  tokenDaSessao,
  verificarPalavraPasseAtual,
} from "@/lib/auth";
import { PALAVRA_PASSE_MINIMA } from "@/lib/palavra-passe";
import { booleano, texto } from "./util";

export type EstadoFormulario = {
  erro?: string;
  sucesso?: string;
  /** O React 19 limpa o formulário após submeter; repomos o que não é segredo. */
  valores?: { nome?: string; email?: string };
};

const EMAIL_VALIDO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function validarNova(palavraPasse: string | null, confirmacao: string | null): string | null {
  if (!palavraPasse) return "Indique a palavra-passe.";
  if (palavraPasse.length < PALAVRA_PASSE_MINIMA) {
    return `A palavra-passe tem de ter pelo menos ${PALAVRA_PASSE_MINIMA} caracteres.`;
  }
  if (palavraPasse !== confirmacao) return "A confirmação não coincide com a palavra-passe.";
  return null;
}

/* --------------------------------------------------- gestão (administradores) */

export async function criarConta(
  _anterior: EstadoFormulario,
  fd: FormData,
): Promise<EstadoFormulario> {
  await exigirAdministrador();

  const nome = texto(fd, "nome");
  const email = texto(fd, "email");
  const valores = { nome: nome ?? "", email: email ?? "" };

  if (!nome || !email) return { erro: "Indique o nome e o email.", valores };
  if (!EMAIL_VALIDO.test(email)) return { erro: "O email não parece válido.", valores };
  if (emailExiste(email)) return { erro: "Já existe uma conta com esse email.", valores };

  const problema = validarNova(texto(fd, "palavra_passe"), texto(fd, "confirmacao"));
  if (problema) return { erro: problema, valores };

  criarUtilizador(nome, email, texto(fd, "palavra_passe")!, booleano(fd, "administrador"));
  revalidatePath("/utilizadores");
  return { sucesso: `Conta criada para ${email.trim().toLowerCase()}.` };
}

/**
 * Ativa ou desativa uma conta. Recusa desativar a própria conta e recusa
 * desativar o último administrador ativo — de outro modo ninguém poderia
 * voltar a gerir contas.
 */
export async function alternarAtivo(fd: FormData) {
  const eu = await exigirAdministrador();
  const id = Number(fd.get("id"));
  const alvo = id ? obterUtilizador(id) : null;
  if (!alvo) return;

  if (alvo.id === eu.id) redirect("/utilizadores?aviso=propria-conta");
  if (alvo.ativo && alvo.administrador && contarAdministradoresAtivos() <= 1) {
    redirect("/utilizadores?aviso=ultimo-administrador");
  }

  definirAtivo(alvo.id, !alvo.ativo);
  revalidatePath("/utilizadores");
}

/** Dá ou retira o perfil de administrador, nunca ao último que resta. */
export async function alternarAdministrador(fd: FormData) {
  const eu = await exigirAdministrador();
  const id = Number(fd.get("id"));
  const alvo = id ? obterUtilizador(id) : null;
  if (!alvo) return;

  if (alvo.administrador && alvo.ativo && contarAdministradoresAtivos() <= 1) {
    redirect("/utilizadores?aviso=ultimo-administrador");
  }
  // Retirar o perfil a si próprio deixaria a página inacessível de imediato.
  if (alvo.id === eu.id) redirect("/utilizadores?aviso=propria-conta");

  definirAdministrador(alvo.id, !alvo.administrador);
  revalidatePath("/utilizadores");
}

/** Define uma palavra-passe nova a outra pessoa e termina as sessões dela. */
export async function redefinirPalavraPasseDeOutrem(
  _anterior: EstadoFormulario,
  fd: FormData,
): Promise<EstadoFormulario> {
  await exigirAdministrador();
  const id = Number(fd.get("id"));
  const alvo = id ? obterUtilizador(id) : null;
  if (!alvo) return { erro: "Conta não encontrada." };

  const problema = validarNova(texto(fd, "palavra_passe"), texto(fd, "confirmacao"));
  if (problema) return { erro: problema };

  redefinirPalavraPasse(alvo.id, texto(fd, "palavra_passe")!);
  revalidatePath("/utilizadores");
  return { sucesso: `Palavra-passe de ${alvo.email} redefinida. As sessões dessa conta terminaram.` };
}

/* ---------------------------------------------------------- a própria conta */

export async function alterarMinhaPalavraPasse(
  _anterior: EstadoFormulario,
  fd: FormData,
): Promise<EstadoFormulario> {
  const eu = await exigirSessao();

  const atual = texto(fd, "atual");
  if (!atual || !verificarPalavraPasseAtual(eu.id, atual)) {
    return { erro: "A palavra-passe atual não está correta." };
  }
  const problema = validarNova(texto(fd, "palavra_passe"), texto(fd, "confirmacao"));
  if (problema) return { erro: problema };

  // Mantém esta sessão; termina as outras (outro telemóvel, outro computador).
  redefinirPalavraPasse(eu.id, texto(fd, "palavra_passe")!, (await tokenDaSessao()) ?? undefined);
  return { sucesso: "Palavra-passe alterada. As outras sessões desta conta terminaram." };
}
