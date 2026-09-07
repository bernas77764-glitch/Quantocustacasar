/**
 * Cria (ou atualiza) uma conta de acesso ao CRM.
 *
 *   npm run criar-utilizador -- "Bernardo Soares" bernardo@exemplo.pt
 *
 * Se o email já existir, a palavra-passe é substituída e as sessões abertas
 * terminam. A palavra-passe nunca vem nos argumentos, para não ficar no
 * histórico da shell nem na lista de processos.
 *
 * Corre em Node diretamente (type stripping), por isso importa por caminho
 * relativo os módulos que não dependem do Next.
 */
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { openStandaloneDb } from "../src/lib/db.ts";
import { PALAVRA_PASSE_MINIMA, criarHash } from "../src/lib/palavra-passe.ts";

const [nome, email] = process.argv.slice(2);

if (!nome || !email) {
  console.error(
    'Uso: npm run criar-utilizador -- "Nome Completo" email@exemplo.pt',
  );
  process.exit(1);
}

if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error(`"${email}" não parece um email válido.`);
  process.exit(1);
}

/**
 * A palavra-passe pode vir de três sítios, por ordem de precedência:
 *   1. `CRM_PALAVRA_PASSE` — o modo prático dentro de um contentor;
 *   2. entrada canalizada (`echo … | npm run criar-utilizador …`);
 *   3. o terminal, pedida duas vezes e sem eco.
 */
async function obterPalavraPasse(): Promise<string> {
  const doAmbiente = process.env.CRM_PALAVRA_PASSE;
  if (doAmbiente) return doAmbiente;

  if (!stdin.isTTY) {
    const linhas: string[] = [];
    for await (const linha of createInterface({ input: stdin })) {
      linhas.push(linha);
    }
    const primeira = linhas[0];
    if (!primeira) {
      console.error(
        "Sem palavra-passe na entrada. Defina CRM_PALAVRA_PASSE ou canalize-a por stdin.",
      );
      process.exit(1);
    }
    return primeira;
  }

  // O que sobra de um bloco depois do Enter pertence à leitura seguinte —
  // colar as duas linhas de uma vez entrega-as num único bloco.
  let excedente = "";

  const pedir = (pedido: string) =>
    new Promise<string>((resolve) => {
      // Lemos tecla a tecla em modo raw para nada aparecer no ecrã. O readline
      // não oferece leitura sem eco, e a API privada que o permitia mudou.
      stdout.write(pedido);
      let valor = "";

      /** Devolve `true` quando encontrou o fim da linha. */
      const consumir = (bloco: string): boolean => {
        for (let i = 0; i < bloco.length; i++) {
          const tecla = bloco[i];
          if (tecla === "\r" || tecla === "\n" || tecla === "\u0004") {
            excedente = bloco.slice(i + 1);
            return true;
          }
          if (tecla === "\u0003") {
            if (stdin.isTTY) stdin.setRawMode(false);
            stdout.write("\n");
            process.exit(130);
          }
          if (tecla === "\u007f" || tecla === "\b") valor = valor.slice(0, -1);
          else valor += tecla;
        }
        excedente = "";
        return false;
      };

      const pendente = excedente;
      excedente = "";
      if (pendente && consumir(pendente)) {
        stdout.write("\n");
        resolve(valor);
        return;
      }

      stdin.setRawMode(true);
      stdin.resume();
      stdin.setEncoding("utf8");

      const aoReceber = (bloco: string) => {
        if (!consumir(bloco)) return;
        stdin.off("data", aoReceber);
        stdin.setRawMode(false);
        stdin.pause();
        stdout.write("\n");
        resolve(valor);
      };
      stdin.on("data", aoReceber);
    });

  const primeira = await pedir("Palavra-passe: ");
  const confirmacao = await pedir("Confirmar palavra-passe: ");

  if (primeira !== confirmacao) {
    console.error("A confirmação não coincide com a palavra-passe.");
    process.exit(1);
  }
  return primeira;
}

const palavraPasse = await obterPalavraPasse();

if (palavraPasse.length < PALAVRA_PASSE_MINIMA) {
  console.error(
    `A palavra-passe tem de ter pelo menos ${PALAVRA_PASSE_MINIMA} caracteres.`,
  );
  process.exit(1);
}

const db = openStandaloneDb();
const ts = new Date().toISOString();
const normalizado = email.trim().toLowerCase();

const existente = db
  .prepare("SELECT id FROM utilizadores WHERE email = ?")
  .get(normalizado) as { id: number } | undefined;

// Quem corre este script tem acesso ao servidor, logo a conta fica administradora.
if (existente) {
  db.prepare(
    `UPDATE utilizadores
     SET nome = ?, palavra_passe = ?, ativo = 1, administrador = 1, atualizado_em = ?
     WHERE id = ?`,
  ).run(nome, criarHash(palavraPasse), ts, existente.id);
  // As sessões abertas deixam de servir depois de trocar a palavra-passe.
  db.prepare("DELETE FROM sessoes WHERE utilizador_id = ?").run(existente.id);
  console.log(`Palavra-passe de ${normalizado} atualizada. Sessões terminadas.`);
} else {
  db.prepare(
    `INSERT INTO utilizadores
       (nome, email, palavra_passe, administrador, criado_em, atualizado_em)
     VALUES (?, ?, ?, 1, ?, ?)`,
  ).run(nome, normalizado, criarHash(palavraPasse), ts, ts);
  console.log(`Conta de administrador criada para ${normalizado}.`);
}
