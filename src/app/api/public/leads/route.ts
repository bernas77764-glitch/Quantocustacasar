import { criarCliente } from "@/lib/queries/clientes";
import { paraCents } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * Entrada de leads vinda do site público (simulador "Quanto Custa Casar").
 *
 * Se `CRM_API_TOKEN` estiver definido, o pedido tem de trazer o mesmo valor
 * no cabeçalho `Authorization: Bearer …`.
 */
export async function POST(pedido: Request) {
  const token = process.env.CRM_API_TOKEN;
  if (token) {
    const enviado = pedido.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (enviado !== token) {
      return Response.json({ erro: "Não autorizado." }, { status: 401 });
    }
  }

  let corpo: Record<string, unknown>;
  try {
    corpo = (await pedido.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ erro: "JSON inválido." }, { status: 400 });
  }

  const texto = (campo: string): string | null => {
    const v = corpo[campo];
    if (typeof v !== "string") return null;
    const t = v.trim();
    return t === "" ? null : t;
  };

  const nome = texto("nome");
  if (!nome) {
    return Response.json({ erro: 'O campo "nome" é obrigatório.' }, { status: 400 });
  }

  const convidados = Number(corpo.num_convidados);

  const id = criarCliente({
    nome,
    parceiro: texto("parceiro"),
    email: texto("email"),
    telefone: texto("telefone"),
    data_casamento: texto("data_casamento"),
    num_convidados: Number.isFinite(convidados) && convidados > 0 ? convidados : null,
    orcamento_cents: paraCents(corpo.orcamento),
    distrito: texto("distrito"),
    local_evento: texto("local_evento"),
    origem: texto("origem") ?? "Website",
    estado: "novo",
    notas: texto("notas"),
  });

  return Response.json({ id, estado: "novo" }, { status: 201 });
}
