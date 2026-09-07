import { criarCliente } from "@/lib/queries/clientes";
import { paraCents } from "@/lib/format";
import { aceitarPedido, responder, responderPreflight } from "@/lib/api-publica";

export const dynamic = "force-dynamic";

/**
 * Entrada de leads (casais) vinda do site público — o simulador "Quanto
 * Custa Casar". As verificações comuns às rotas públicas (origem, token,
 * limite de pedidos) estão em `@/lib/api-publica`.
 */

export async function OPTIONS(pedido: Request) {
  return responderPreflight(pedido);
}

export async function POST(pedido: Request) {
  const aceite = await aceitarPedido(pedido);
  if (aceite instanceof Response) return aceite;
  const { cors, corpo, texto } = aceite;

  const nome = texto("nome");
  if (!nome) {
    return responder({ erro: 'O campo "nome" é obrigatório.' }, 400, cors);
  }

  const convidados = Number(corpo.num_convidados);

  const id = criarCliente({
    nome,
    parceiro: texto("parceiro"),
    email: texto("email"),
    telefone: texto("telefone"),
    data_casamento: texto("data_casamento"),
    num_convidados:
      Number.isFinite(convidados) && convidados > 0 ? convidados : null,
    orcamento_cents: paraCents(corpo.orcamento),
    distrito: texto("distrito"),
    local_evento: texto("local_evento"),
    origem: texto("origem") ?? "Website",
    estado: "novo",
    notas: texto("notas"),
  });

  return responder({ id, estado: "novo" }, 201, cors);
}
