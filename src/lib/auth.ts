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
  /** 1 = pode gerir contas (página Utilizadores). */
  administrador: number;
};

export type UtilizadorListado = Utilizador & { criado_em: string };

/* ------------------------------------------------------------- utilizadores */

export function contarUtilizadores(): number {
  const { total } = getDb()
    .prepare("SELECT COUNT(*) AS total FROM utilizadores WHERE ativo = 1")
    .get() as unknown as { total: number };
  return total;
}

export function contarAdministradoresAtivos(): number {
  const { total } = getDb()
    .prepare(
      "SELECT COUNT(*) AS total FROM utilizadores WHERE ativo = 1 AND administrador = 1",
    )
    .get() as unknown as { total: number };
  return total;
}

export function listarUtilizadores(): UtilizadorListado[] {
  return getDb()
    .prepare(
      `SELECT id, nome, email, ativo, administrador, criado_em
       FROM utilizadores ORDER BY ativo DESC, nome COLLATE NOCASE`,
    )
    .all() as unknown as UtilizadorListado[];
}

export function obterUtilizador(id: number): Utilizador | null {
  const linha = getDb()
    .prepare("SELECT id, nome, email, ativo, administrador FROM utilizadores WHERE id = ?")
    .get(id) as Utilizador | undefined;
  return linha ?? null;
}

export function emailExiste(email: string): boolean {
  return (
    getDb()
      .prepare("SELECT 1 FROM utilizadores WHERE email = ?")
      .get(email.trim().toLowerCase()) !== undefined
  );
}

export function criarUtilizador(
  nome: string,
  email: string,
  palavraPasse: string,
  administrador = 0,
): number {
  const ts = agora();
  const r = getDb()
    .prepare(
      `INSERT INTO utilizadores
         (nome, email, palavra_passe, administrador, criado_em, atualizado_em)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(nome, email.trim().toLowerCase(), criarHash(palavraPasse), administrador, ts, ts);
  return Number(r.lastInsertRowid);
}

/** Desativar termina as sessões da pessoa; reativar não as recupera. */
export function definirAtivo(id: number, ativo: boolean): void {
  const db = getDb();
  db.prepare("UPDATE utilizadores SET ativo = ?, atualizado_em = ? WHERE id = ?").run(
    ativo ? 1 : 0,
    agora(),
    id,
  );
  if (!ativo) db.prepare("DELETE FROM sessoes WHERE utilizador_id = ?").run(id);
}

export function definirAdministrador(id: number, administrador: boolean): void {
  getDb()
    .prepare("UPDATE utilizadores SET administrador = ?, atualizado_em = ? WHERE id = ?")
    .run(administrador ? 1 : 0, agora(), id);
}

/**
 * Troca a palavra-passe e termina as sessões abertas — todas, ou todas
 * menos `tokenAManter` (quando é a própria pessoa a mudá-la e não faz
 * sentido pô-la fora).
 */
export function redefinirPalavraPasse(
  id: number,
  nova: string,
  tokenAManter?: string,
): void {
  const db = getDb();
  db.prepare(
    "UPDATE utilizadores SET palavra_passe = ?, atualizado_em = ? WHERE id = ?",
  ).run(criarHash(nova), agora(), id);
  if (tokenAManter) {
    db.prepare("DELETE FROM sessoes WHERE utilizador_id = ? AND token <> ?").run(
      id,
      tokenAManter,
    );
  } else {
    db.prepare("DELETE FROM sessoes WHERE utilizador_id = ?").run(id);
  }
}

export function verificarPalavraPasseAtual(id: number, palavraPasse: string): boolean {
  const linha = getDb()
    .prepare("SELECT palavra_passe FROM utilizadores WHERE id = ?")
    .get(id) as { palavra_passe: string } | undefined;
  return !!linha && verificarHash(palavraPasse, linha.palavra_passe);
}

export function autenticar(email: string, palavraPasse: string): Utilizador | null {
  const linha = getDb()
    .prepare(
      `SELECT id, nome, email, ativo, administrador, palavra_passe
       FROM utilizadores WHERE email = ? AND ativo = 1`,
    )
    .get(email.trim().toLowerCase()) as
    | (Utilizador & { palavra_passe: string })
    | undefined;

  // Corre o scrypt mesmo sem utilizador, para que um email inexistente e uma
  // palavra-passe errada demorem o mesmo tempo.
  const hash = linha?.palavra_passe ?? criarHash("__inexistente__");
  const valida = verificarHash(palavraPasse, hash);
  if (!linha || !valida) return null;

  return {
    id: linha.id,
    nome: linha.nome,
    email: linha.email,
    ativo: linha.ativo,
    administrador: linha.administrador,
  };
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
      `SELECT u.id, u.nome, u.email, u.ativo, u.administrador
       FROM sessoes s
       JOIN utilizadores u ON u.id = s.utilizador_id
       WHERE s.token = ? AND s.expira_em > ? AND u.ativo = 1`,
    )
    .get(token, agora()) as Utilizador | undefined;
  return linha ?? null;
}

export async function tokenDaSessao(): Promise<string | null> {
  return (await cookies()).get(COOKIE_SESSAO)?.value ?? null;
}

/** Utilizador da sessão atual, ou `null` se não houver sessão válida. */
export async function obterSessao(): Promise<Utilizador | null> {
  const token = await tokenDaSessao();
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

/** Como `exigirSessao`, mas só deixa passar administradores. */
export async function exigirAdministrador(): Promise<Utilizador> {
  const utilizador = await exigirSessao();
  if (!utilizador.administrador) redirect("/");
  return utilizador;
}

/** Remove sessões expiradas; corre no arranque e depois de cada autenticação. */
export function limparSessoesExpiradas(): void {
  getDb().prepare("DELETE FROM sessoes WHERE expira_em <= ?").run(agora());
}
