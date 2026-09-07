import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { agora, getDb } from "./db";
import { criarHash, verificarHash } from "./palavra-passe";

export const COOKIE_SESSAO = "crm_sessao";
const DIAS_DE_SESSAO = 30;

export type Utilizador = {
  id: number;
  nome: string;
  email: string;
  ativo: number;
};

/* ------------------------------------------------------------- utilizadores */

export function contarUtilizadores(): number {
  const { total } = getDb()
    .prepare("SELECT COUNT(*) AS total FROM utilizadores WHERE ativo = 1")
    .get() as unknown as { total: number };
  return total;
}

export function criarUtilizador(
  nome: string,
  email: string,
  palavraPasse: string,
): number {
  const ts = agora();
  const r = getDb()
    .prepare(
      `INSERT INTO utilizadores (nome, email, palavra_passe, criado_em, atualizado_em)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(nome, email.trim().toLowerCase(), criarHash(palavraPasse), ts, ts);
  return Number(r.lastInsertRowid);
}

export function autenticar(email: string, palavraPasse: string): Utilizador | null {
  const linha = getDb()
    .prepare(
      "SELECT id, nome, email, ativo, palavra_passe FROM utilizadores WHERE email = ? AND ativo = 1",
    )
    .get(email.trim().toLowerCase()) as
    | (Utilizador & { palavra_passe: string })
    | undefined;

  // Corre o scrypt mesmo sem utilizador, para que um email inexistente e uma
  // palavra-passe errada demorem o mesmo tempo.
  const hash = linha?.palavra_passe ?? criarHash("__inexistente__");
  const valida = verificarHash(palavraPasse, hash);
  if (!linha || !valida) return null;

  return { id: linha.id, nome: linha.nome, email: linha.email, ativo: linha.ativo };
}

/* ----------------------------------------------------------------- sessões */

export function criarSessao(utilizadorId: number): { token: string; expiraEm: Date } {
  const token = randomBytes(32).toString("hex");
  const expiraEm = new Date(Date.now() + DIAS_DE_SESSAO * 86_400_000);
  getDb()
    .prepare(
      "INSERT INTO sessoes (token, utilizador_id, expira_em, criado_em) VALUES (?, ?, ?, ?)",
    )
    .run(token, utilizadorId, expiraEm.toISOString(), agora());
  return { token, expiraEm };
}

export function eliminarSessao(token: string): void {
  getDb().prepare("DELETE FROM sessoes WHERE token = ?").run(token);
}

function utilizadorDoToken(token: string): Utilizador | null {
  const linha = getDb()
    .prepare(
      `SELECT u.id, u.nome, u.email, u.ativo
       FROM sessoes s
       JOIN utilizadores u ON u.id = s.utilizador_id
       WHERE s.token = ? AND s.expira_em > ? AND u.ativo = 1`,
    )
    .get(token, agora()) as Utilizador | undefined;
  return linha ?? null;
}

/** Utilizador da sessão atual, ou `null` se não houver sessão válida. */
export async function obterSessao(): Promise<Utilizador | null> {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  if (!token) return null;
  return utilizadorDoToken(token);
}

/**
 * Exige uma sessão válida. Usar no topo de cada página protegida, de cada
 * Server Action e de cada rota de API privada — o guarda do layout não protege
 * uma Server Action invocada diretamente.
 */
export async function exigirSessao(): Promise<Utilizador> {
  const utilizador = await obterSessao();
  if (!utilizador) redirect("/login");
  return utilizador;
}

/** Remove sessões expiradas; corre no arranque e depois de cada autenticação. */
export function limparSessoesExpiradas(): void {
  getDb().prepare("DELETE FROM sessoes WHERE expira_em <= ?").run(agora());
}
