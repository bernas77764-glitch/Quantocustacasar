import { RUBRICAS_BASE, tabelaAtual } from "@/lib/precos";

export const dynamic = "force-dynamic";

/**
 * A tabela de preços do simulador, no formato exato do botão «Copiar tabela
 * (JSON)» do site. É informação pública (está no código-fonte do site), por
 * isso o CORS é aberto; o site pede-a com `cache: "no-store"` e nós
 * respondemos o mesmo, para uma alteração no CRM se ver no próximo
 * carregamento da página.
 */

const CABECALHOS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Accept",
  "Cache-Control": "no-store",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CABECALHOS });
}

export async function GET() {
  const { tabela } = tabelaAtual();
  const nomes = new Map(RUBRICAS_BASE.map((r) => [r.id, { nome: r.nome, un: r.un }]));

  return Response.json(
    {
      // Sem valores guardados no CRM, a data é a de hoje: é a tabela com que o
      // site nasceu, servida tal e qual.
      atualizado: tabela.atualizado || new Date().toISOString().slice(0, 10),
      rubricas: tabela.rubricas.map((r) => ({ id: r.id, ...nomes.get(r.id), min: r.min, base: r.base, max: r.max })),
      mult: tabela.mult,
    },
    { headers: CABECALHOS },
  );
}
