import { eventosParaFeed } from "@/lib/calendario";
import { tokenValido } from "@/lib/google-calendar";
import { gerarIcs } from "@/lib/ics";

export const dynamic = "force-dynamic";

/**
 * Feed iCalendar com tudo o que o CRM sabe que acontece: casamentos, datas de
 * serviço, vencimentos por pagar e compromissos. O Google Calendar (e o
 * Apple Calendar, Outlook…) subscreve esta ligação; o token no caminho é o
 * único segredo, por isso não há sessão nem CORS.
 */
export async function GET(_pedido: Request, contexto: { params: Promise<{ token: string }> }) {
  const { token } = await contexto.params;
  if (!/^[a-f0-9]{16,128}$/.test(token) || !tokenValido(token)) {
    return new Response("Ligação inválida.", { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  const corpo = gerarIcs("Quanto Custa Casar · CRM", eventosParaFeed());
  return new Response(corpo, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="quantocustacasar.ics"',
      "Cache-Control": "private, max-age=300",
    },
  });
}
