import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";

/**
 * Cópia completa e consistente da base de dados, pronta a descarregar.
 *
 * Copiar o `crm.db` à mão não chega: com o modo WAL, as alterações recentes
 * vivem no `crm.db-wal` até ao próximo checkpoint. O `VACUUM INTO` escreve um
 * ficheiro novo com tudo (incluindo o WAL), num instante coerente, sem parar o
 * servidor. O ficheiro temporário é apagado logo a seguir à leitura.
 */
export function copiaBaseDados(): Buffer {
  const destino = path.join(os.tmpdir(), `crm-copia-${randomUUID()}.db`);
  try {
    getDb().exec(`VACUUM INTO '${destino.replace(/'/g, "''")}'`);
    return fs.readFileSync(destino);
  } finally {
    fs.rmSync(destino, { force: true });
  }
}

/** Nome do ficheiro descarregado, com data e hora de Lisboa: crm-2026-11-03-1509.db */
export function nomeCopia(agora = new Date()): string {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("pt-PT", {
      timeZone: "Europe/Lisbon",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(agora)
      .map((p) => [p.type, p.value]),
  );
  return `crm-${partes.year}-${partes.month}-${partes.day}-${partes.hour}${partes.minute}.db`;
}
