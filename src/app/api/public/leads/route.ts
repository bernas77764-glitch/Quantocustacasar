import { criarCliente } from "@/lib/queries/clientes";
import { paraCents } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * Entrada de leads vinda do site público (simulador "Quanto Custa Casar").
 *
 * O site é uma página estática servida noutro domínio, por isso o browser
 * faz um pedido cross-origin: respondemos ao preflight (OPTIONS) e só
 * aceitamos as origens de `CRM_ORIGENS_PERMITIDAS` (separadas por vírgulas).
 * Sem essa variável, valem as origens do próprio site.
 *
 * Como o código do site é público, um token embebido nele não seria segredo.
 * A proteção para pedidos do browser é, por isso, a lista de origens, o
 * campo-isco do formulário e um limite de pedidos por endereço.
 * `CRM_API_TOKEN` continua a servir para integrações servidor-a-servidor:
 * se estiver definido, os pedidos sem `Origin` têm de trazer
 * `Authorization: Bearer …`.
 */

const ORIGENS_POR_OMISSAO = [
  "https://bernas77764-glitch.github.io",
  "https://quantocustacasar.pt",
  "https://www.quantocustacasar.pt",
];

/** Pedidos por endereço IP dentro da janela, antes de responder 429. */
const LIMITE_PEDIDOS = 10;
const JANELA_MS = 10 * 60 * 1000;

function origensPermitidas(): string[] {
  const env = process.env.CRM_ORIGENS_PERMITIDAS;
  if (!env) return ORIGENS_POR_OMISSAO;
  return env
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

function cabecalhosCors(origem: string | null): Record<string, string> {
  if (!origem || !origensPermitidas().includes(origem)) return {};
  return {
    "Access-Control-Allow-Origin": origem,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function responder(
  corpo: Record<string, unknown>,
  status: number,
  cors: Record<string, string>,
): Response {
  return Response.json(corpo, { status, headers: cors });
}

/* ---------------------------------------------------------- limite de pedidos */

// Um único processo no servidor, logo um Map em memória chega. Reinicia com
// o processo, o que para este fim é aceitável.
const pedidosPorIp = new Map<string, { contagem: number; inicio: number }>();

function excedeuLimite(ip: string): boolean {
  const agora = Date.now();
  const registo = pedidosPorIp.get(ip);
  if (!registo || agora - registo.inicio > JANELA_MS) {
    pedidosPorIp.set(ip, { contagem: 1, inicio: agora });
    // Limpeza oportunista para o Map não crescer sem limite.
    if (pedidosPorIp.size > 1000) {
      for (const [chave, r] of pedidosPorIp) {
        if (agora - r.inicio > JANELA_MS) pedidosPorIp.delete(chave);
      }
    }
    return false;
  }
  registo.contagem += 1;
  return registo.contagem > LIMITE_PEDIDOS;
}

function enderecoDe(pedido: Request): string {
  // Atrás do proxy do serviço de alojamento, o IP real vem neste cabeçalho.
  const encaminhado = pedido.headers.get("x-forwarded-for");
  return encaminhado?.split(",")[0].trim() || "desconhecido";
}

/* --------------------------------------------------------------- handlers */

export async function OPTIONS(pedido: Request) {
  const cors = cabecalhosCors(pedido.headers.get("origin"));
  // Sem cabeçalhos CORS, o browser recusa o pedido seguinte — é o que se quer
  // para origens desconhecidas.
  return new Response(null, { status: 204, headers: cors });
}

export async function POST(pedido: Request) {
  const origem = pedido.headers.get("origin");
  const cors = cabecalhosCors(origem);

  // Um browser a partir de uma origem que não é o site: recusa explícita.
  if (origem && Object.keys(cors).length === 0) {
    return responder({ erro: "Origem não autorizada." }, 403, {});
  }

  // Integrações servidor-a-servidor (sem Origin) podem exigir token.
  const token = process.env.CRM_API_TOKEN;
  if (token && !origem) {
    const enviado = pedido.headers
      .get("authorization")
      ?.replace(/^Bearer\s+/i, "");
    if (enviado !== token) {
      return responder({ erro: "Não autorizado." }, 401, cors);
    }
  }

  if (excedeuLimite(enderecoDe(pedido))) {
    return responder(
      { erro: "Demasiados pedidos. Tente de novo dentro de alguns minutos." },
      429,
      cors,
    );
  }

  let corpo: Record<string, unknown>;
  try {
    corpo = (await pedido.json()) as Record<string, unknown>;
  } catch {
    return responder({ erro: "JSON inválido." }, 400, cors);
  }

  const texto = (campo: string): string | null => {
    const v = corpo[campo];
    if (typeof v !== "string") return null;
    const t = v.trim();
    return t === "" ? null : t;
  };

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
