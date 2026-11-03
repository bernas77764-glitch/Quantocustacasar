import { exigirAdministrador } from "@/lib/auth";
import { copiaBaseDados, nomeCopia } from "@/lib/copia";

export const dynamic = "force-dynamic";

/**
 * Descarrega a base de dados inteira (clientes, pagamentos, contas, emails…).
 * Só administradores: o ficheiro inclui os hashes das palavras-passe e os
 * segredos guardados nas definições.
 */
export async function GET() {
  await exigirAdministrador();
  const copia = copiaBaseDados();
  return new Response(new Uint8Array(copia), {
    headers: {
      "Content-Type": "application/vnd.sqlite3",
      "Content-Disposition": `attachment; filename="${nomeCopia()}"`,
      "Content-Length": String(copia.length),
      "Cache-Control": "no-store",
    },
  });
}
