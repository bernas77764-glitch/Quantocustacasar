"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  COOKIE_SESSAO,
  autenticar,
  contarUtilizadores,
  criarSessao,
  criarUtilizador,
  eliminarSessao,
  limparSessoesExpiradas,
  obterSessao,
} from "@/lib/auth";
import { PALAVRA_PASSE_MINIMA } from "@/lib/palavra-passe";
import { texto } from "./util";

export type EstadoAutenticacao = {
  erro?: string;
  /**
   * O React 19 limpa o formulário depois de cada submissão. Devolvemos o que
   * foi escrito (nunca a palavra-passe) para o utilizador não ter de repetir
   * tudo a cada erro de validação.
   */
  valores?: { nome?: string; email?: string };
};

async function iniciarSessao(utilizadorId: number) {
  const { token, expiraEm } = criarSessao(utilizadorId);
  (await cookies()).set(COOKIE_SESSAO, token, {
    httpOnly: true,
    sameSite: "lax",
    // Em produção o CRM serve por HTTPS; em desenvolvimento (http://localhost)
    // um cookie `secure` nunca seria enviado.
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiraEm,
  });
  limparSessoesExpiradas();
}

export async function entrar(
  _anterior: EstadoAutenticacao,
  fd: FormData,
): Promise<EstadoAutenticacao> {
  const email = texto(fd, "email");
  const palavraPasse = texto(fd, "palavra_passe");
  const valores = { email: email ?? "" };

  if (!email || !palavraPasse) {
    return { erro: "Indique o email e a palavra-passe.", valores };
  }

  const utilizador = autenticar(email, palavraPasse);
  if (!utilizador) {
    // Mensagem única, para não revelar se o email existe.
    return { erro: "Email ou palavra-passe incorretos.", valores };
  }

  await iniciarSessao(utilizador.id);
  redirect("/");
}

/**
 * Criação da conta inicial, que fica administradora. Só funciona enquanto não
 * existir nenhum utilizador ativo — depois disso, as contas criam-se na
 * página Utilizadores (ou com `npm run criar-utilizador`).
 */
export async function criarPrimeiraConta(
  _anterior: EstadoAutenticacao,
  fd: FormData,
): Promise<EstadoAutenticacao> {
  if (contarUtilizadores() > 0) {
    return { erro: "Já existe uma conta. Peça acesso a quem administra o CRM." };
  }


  const nome = texto(fd, "nome");
  const email = texto(fd, "email");
  const palavraPasse = texto(fd, "palavra_passe");
  const confirmacao = texto(fd, "confirmacao");
  const valores = { nome: nome ?? "", email: email ?? "" };

  if (!nome || !email || !palavraPasse) {
    return { erro: "Preencha todos os campos.", valores };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { erro: "O email não parece válido.", valores };
  }
  if (palavraPasse.length < PALAVRA_PASSE_MINIMA) {
    return {
      erro: `A palavra-passe tem de ter pelo menos ${PALAVRA_PASSE_MINIMA} caracteres.`,
      valores,
    };
  }
  if (palavraPasse !== confirmacao) {
    return { erro: "A confirmação não coincide com a palavra-passe.", valores };
  }

  const id = criarUtilizador(nome, email, palavraPasse, 1);
  await iniciarSessao(id);
  redirect("/");
}

export async function sair() {
  const armazem = await cookies();
  const token = armazem.get(COOKIE_SESSAO)?.value;
  if (token) eliminarSessao(token);
  armazem.delete(COOKIE_SESSAO);
  redirect("/login");
}

/** Usado pela página de login para não mostrar o formulário a quem já entrou. */
export async function sessaoAtiva(): Promise<boolean> {
  return (await obterSessao()) !== null;
}
