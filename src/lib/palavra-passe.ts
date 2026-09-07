import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Hashing de palavras-passe com scrypt. Módulo deliberadamente sem
 * dependências do Next, para que os scripts de linha de comandos o possam
 * importar diretamente.
 */

const CUSTO = { N: 16384, r: 8, p: 1 };
const TAMANHO_CHAVE = 64;

export const PALAVRA_PASSE_MINIMA = 10;

/** Guarda a palavra-passe como `scrypt$N$r$p$salt$chave`, tudo em hexadecimal. */
export function criarHash(palavraPasse: string): string {
  const salt = randomBytes(16);
  const chave = scryptSync(palavraPasse, salt, TAMANHO_CHAVE, CUSTO);
  return [
    "scrypt",
    CUSTO.N,
    CUSTO.r,
    CUSTO.p,
    salt.toString("hex"),
    chave.toString("hex"),
  ].join("$");
}

export function verificarHash(palavraPasse: string, guardado: string): boolean {
  const partes = guardado.split("$");
  if (partes.length !== 6 || partes[0] !== "scrypt") return false;
  const [, n, r, p, saltHex, chaveHex] = partes;

  let esperada: Buffer;
  let calculada: Buffer;
  try {
    esperada = Buffer.from(chaveHex, "hex");
    calculada = scryptSync(palavraPasse, Buffer.from(saltHex, "hex"), esperada.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    });
  } catch {
    return false;
  }
  // Comparação em tempo constante, para não revelar o hash por temporização.
  return esperada.length === calculada.length && timingSafeEqual(esperada, calculada);
}
