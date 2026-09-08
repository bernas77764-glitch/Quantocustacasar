/**
 * Ligação ao Google Calendar sem OAuth nem projeto na Google Cloud:
 *
 *  - Saída: o CRM publica um feed iCalendar protegido por um token secreto;
 *    o Google subscreve-o ("Outros calendários → Do URL") e mostra os eventos
 *    do CRM no computador e no telemóvel.
 *  - Entrada: quem administra cola o "endereço secreto em formato iCal" do
 *    seu calendário Google; o CRM lê-o (com cache) e mostra esses eventos
 *    no calendário, ao lado dos do negócio.
 */

import { randomBytes, timingSafeEqual } from "node:crypto";
import { agora, getDb } from "@/lib/db";
import { analisarIcs, ocorrencias, type EventoIcs } from "@/lib/ics";
import { diaLocal, horaLocal, partesLocais, somarDias } from "@/lib/tempo";
import type { EventoCalendario } from "@/lib/types";

const CHAVE_TOKEN = "calendario_feed_token";
const CHAVE_GOOGLE = "google_calendar_ics_url";
const VALIDADE_CACHE_MS = 10 * 60 * 1000;
const TAMANHO_MAXIMO = 5 * 1024 * 1024;

/* ------------------------------------------------------------ definições */

function lerDefinicao(chave: string): { valor: string; atualizado_em: string } | null {
  return (
    (getDb()
      .prepare("SELECT valor, atualizado_em FROM definicoes WHERE chave = ?")
      .get(chave) as { valor: string; atualizado_em: string } | undefined) ?? null
  );
}

function guardarDefinicao(chave: string, valor: string): void {
  getDb()
    .prepare(
      `INSERT INTO definicoes (chave, valor, atualizado_em) VALUES (?, ?, ?)
       ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor, atualizado_em = excluded.atualizado_em`,
    )
    .run(chave, valor, agora());
}

function apagarDefinicao(chave: string): void {
  getDb().prepare("DELETE FROM definicoes WHERE chave = ?").run(chave);
}

/* ------------------------------------------------------------ feed (saída) */

/** O token do feed; cria-o na primeira vez que é pedido. */
export function tokenDoFeed(): string {
  const existente = lerDefinicao(CHAVE_TOKEN);
  if (existente) return existente.valor;
  return regenerarTokenDoFeed();
}

/** Novo token: a ligação antiga deixa de funcionar de imediato. */
export function regenerarTokenDoFeed(): string {
  const token = randomBytes(24).toString("hex");
  guardarDefinicao(CHAVE_TOKEN, token);
  return token;
}

export function tokenValido(candidato: string): boolean {
  const atual = lerDefinicao(CHAVE_TOKEN)?.valor;
  if (!atual || candidato.length !== atual.length) return false;
  return timingSafeEqual(Buffer.from(candidato), Buffer.from(atual));
}

export function caminhoDoFeed(token: string): string {
  return `/api/calendario/${token}/quantocustacasar.ics`;
}

/* -------------------------------------------------------- Google (entrada) */

export type LigacaoGoogle = {
  url: string;
  ligado_em: string;
};

export function ligacaoGoogle(): LigacaoGoogle | null {
  const l = lerDefinicao(CHAVE_GOOGLE);
  return l ? { url: l.valor, ligado_em: l.atualizado_em } : null;
}

/**
 * Aceita o endereço secreto do Google (e, por simpatia, qualquer feed iCal
 * público em https). Recusa esquemas e anfitriões que não fazem sentido
 * vindos de um browser — o servidor é que vai buscar o ficheiro.
 */
export function validarUrlGoogle(texto: string): { ok: true; url: string } | { ok: false; erro: string } {
  let bruto = texto.trim();
  if (bruto.startsWith("webcal://")) bruto = `https://${bruto.slice("webcal://".length)}`;
  if (bruto.length > 2000) return { ok: false, erro: "A ligação é demasiado comprida." };
  let url: URL;
  try {
    url = new URL(bruto);
  } catch {
    return { ok: false, erro: "Isto não parece uma ligação. Cole o endereço completo, a começar por https://." };
  }
  const host = url.hostname.toLowerCase();
  // Só para testes automáticos: aceitar um servidor iCal local em http.
  const permitirLocal = process.env.CRM_PERMITIR_ICS_LOCAL === "1";
  if (permitirLocal && (host === "localhost" || host === "127.0.0.1")) return { ok: true, url: url.toString() };
  if (url.protocol !== "https:") return { ok: false, erro: "A ligação tem de começar por https://." };
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^(\d+\.){3}\d+$/.test(host) ||
    host.includes(":")
  ) {
    return { ok: false, erro: "A ligação tem de apontar para um endereço público." };
  }
  if (host === "calendar.google.com" && !/\/calendar\/ical\/.+\/(private-[a-z0-9]+|public)\/.+\.ics$/i.test(url.pathname)) {
    return {
      ok: false,
      erro: 'Esta não é a ligação certa. Em calendar.google.com, procure "Endereço secreto em formato iCal" nas definições do calendário.',
    };
  }
  return { ok: true, url: url.toString() };
}

export function guardarLigacaoGoogle(url: string): void {
  guardarDefinicao(CHAVE_GOOGLE, url);
  limparCache();
}

export function removerLigacaoGoogle(): void {
  apagarDefinicao(CHAVE_GOOGLE);
  limparCache();
}

/* ----------------------------------------------------------------- cache */

type Cache = {
  url: string;
  eventos: EventoIcs[];
  obtidoEm: number;
  erro: string | null;
  nome: string | null;
};

const global = globalThis as unknown as { __crmGoogleCache?: Cache | null };

export function limparCache(): void {
  global.__crmGoogleCache = null;
}

export type EstadoGoogle = {
  ligado: boolean;
  url: string | null;
  ligado_em: string | null;
  /** Instante da última leitura bem-sucedida (ISO) ou nulo. */
  atualizado_em: string | null;
  erro: string | null;
  nome_calendario: string | null;
  total_eventos: number;
};

function nomeDoCalendario(texto: string): string | null {
  const m = texto.match(/^X-WR-CALNAME:(.+)$/m);
  return m ? m[1].trim().replace(/\\,/g, ",") : null;
}

async function descarregar(url: string): Promise<{ eventos: EventoIcs[]; nome: string | null }> {
  const resposta = await fetch(url, {
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
    redirect: "follow",
    headers: { "user-agent": "QuantoCustaCasar-CRM/1.0 (+https://quantocustacasar.pt)", accept: "text/calendar, */*" },
  });
  if (!resposta.ok) {
    throw new Error(
      resposta.status === 404
        ? "O Google respondeu 404: a ligação já não é válida (foi reposta nas definições do calendário?)."
        : `O servidor respondeu ${resposta.status}.`,
    );
  }
  const tamanho = Number(resposta.headers.get("content-length") ?? 0);
  if (tamanho > TAMANHO_MAXIMO) throw new Error("O calendário é demasiado grande para ser lido.");
  const texto = await resposta.text();
  if (texto.length > TAMANHO_MAXIMO) throw new Error("O calendário é demasiado grande para ser lido.");
  if (!/BEGIN:VCALENDAR/i.test(texto)) throw new Error("A ligação não devolveu um calendário (ficheiro iCal).");
  return { eventos: analisarIcs(texto), nome: nomeDoCalendario(texto) };
}

/**
 * Eventos do Google, da cache se tiver menos de 10 minutos. Um erro de rede
 * não deita abaixo a página: fica registado e mostram-se os últimos eventos
 * lidos com sucesso, se os houver.
 */
export async function eventosGoogle(forcar = false): Promise<{ eventos: EventoIcs[]; estado: EstadoGoogle }> {
  const ligacao = ligacaoGoogle();
  if (!ligacao) {
    return {
      eventos: [],
      estado: { ligado: false, url: null, ligado_em: null, atualizado_em: null, erro: null, nome_calendario: null, total_eventos: 0 },
    };
  }
  let cache = global.__crmGoogleCache ?? null;
  const fresca = cache && cache.url === ligacao.url && Date.now() - cache.obtidoEm < VALIDADE_CACHE_MS;
  if (forcar || !fresca) {
    try {
      const { eventos, nome } = await descarregar(ligacao.url);
      cache = { url: ligacao.url, eventos, obtidoEm: Date.now(), erro: null, nome };
    } catch (e) {
      const mensagem = e instanceof Error ? (e.name === "TimeoutError" ? "O Google demorou demasiado a responder." : e.message) : String(e);
      cache = {
        url: ligacao.url,
        eventos: cache?.url === ligacao.url ? cache.eventos : [],
        obtidoEm: cache?.url === ligacao.url ? cache.obtidoEm : 0,
        erro: mensagem,
        nome: cache?.url === ligacao.url ? cache.nome : null,
      };
    }
    global.__crmGoogleCache = cache;
  }
  return {
    eventos: cache!.eventos,
    estado: {
      ligado: true,
      url: ligacao.url,
      ligado_em: ligacao.ligado_em,
      atualizado_em: cache!.obtidoEm ? new Date(cache!.obtidoEm).toISOString() : null,
      erro: cache!.erro,
      nome_calendario: cache!.nome,
      total_eventos: cache!.eventos.length,
    },
  };
}

/** Ocorrências do Google numa janela de dias, já como eventos do calendário. */
export function eventosGoogleNaJanela(eventos: EventoIcs[], inicio: string, fim: string): EventoCalendario[] {
  const saida: EventoCalendario[] = [];
  for (const o of ocorrencias(eventos, inicio, fim)) {
    const e = o.evento;
    let data: string;
    let data_fim: string | null = null;
    let hora: string | null = null;
    let hora_fim: string | null = null;
    if (o.inicio.tipo === "dia") {
      data = o.inicio.dia;
      if (o.fim?.tipo === "dia") {
        const ultimo = somarDias(o.fim.dia, -1);
        if (ultimo > data) data_fim = ultimo;
      }
    } else {
      data = diaLocal(o.inicio.instante);
      hora = horaLocal(o.inicio.instante);
      if (o.fim?.tipo === "instante") {
        const diaFim = diaLocal(o.fim.instante);
        const p = partesLocais(o.fim.instante);
        if (diaFim === data) hora_fim = horaLocal(o.fim.instante);
        else if (!(p.hora === 0 && p.minuto === 0 && somarDias(data, 1) === diaFim)) data_fim = diaFim;
      }
    }
    saida.push({
      chave: `google-${e.uid}-${data}-${hora ?? "dia"}`,
      tipo: "google",
      titulo: e.titulo,
      data,
      data_fim,
      hora,
      hora_fim,
      detalhe: e.descricao ? e.descricao.slice(0, 300) : null,
      local: e.local,
      href: null,
      google_url: null,
      atrasado: false,
      compromisso_id: null,
    });
  }
  return saida;
}
