/**
 * iCalendar (RFC 5545) na medida do CRM: gera o feed que o Google Calendar
 * subscreve e lê o endereço secreto do Google, incluindo eventos recorrentes
 * (FREQ diário/semanal/mensal/anual com INTERVAL, COUNT, UNTIL, BYDAY,
 * BYMONTHDAY, BYMONTH), exceções (EXDATE) e instâncias alteradas
 * (RECURRENCE-ID). Não há dependências: a biblioteca é pequena de propósito.
 */

import {
  FUSO,
  diaLocal,
  fusoValido,
  instanteDe,
  isoDe,
  partesDeIso,
  partesLocais,
  somarDias,
  somarMeses,
  diaDaSemana,
  type PartesLocais,
} from "@/lib/tempo";

export type DataIcs =
  | { tipo: "dia"; dia: string }
  | { tipo: "instante"; instante: Date };

export type EventoIcs = {
  uid: string;
  titulo: string;
  descricao: string | null;
  local: string | null;
  inicio: DataIcs;
  fim: DataIcs | null;
  /** Fuso em que o evento foi escrito; a recorrência conta-se nele. */
  fuso: string;
  rrule: string | null;
  /** Chaves (ver `chaveDe`) das ocorrências excluídas. */
  exdatas: Set<string>;
  /** Chave da ocorrência que este evento substitui, se for uma instância alterada. */
  recorrenciaDe: string | null;
  cancelado: boolean;
};

/* ------------------------------------------------------------------ escrita */

export type EventoParaIcs = {
  uid: string;
  titulo: string;
  descricao?: string | null;
  local?: string | null;
  inicio: DataIcs;
  fim?: DataIcs | null;
  url?: string | null;
};

const dd = (n: number) => String(n).padStart(2, "0");

function carimbo(d: Date): string {
  return (
    `${d.getUTCFullYear()}${dd(d.getUTCMonth() + 1)}${dd(d.getUTCDate())}` +
    `T${dd(d.getUTCHours())}${dd(d.getUTCMinutes())}${dd(d.getUTCSeconds())}Z`
  );
}

function escaparTexto(t: string): string {
  return t
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Dobra uma linha a 75 octetos sem partir caracteres multibyte. */
function dobrar(linha: string): string {
  const partes: string[] = [];
  let atual = "";
  let bytes = 0;
  for (const ch of linha) {
    const b = Buffer.byteLength(ch, "utf8");
    const limite = partes.length === 0 ? 75 : 74;
    if (bytes + b > limite) {
      partes.push(atual);
      atual = "";
      bytes = 0;
    }
    atual += ch;
    bytes += b;
  }
  partes.push(atual);
  return partes.join("\r\n ");
}

function propriedadeData(nome: string, d: DataIcs): string {
  if (d.tipo === "dia") return `${nome};VALUE=DATE:${d.dia.replace(/-/g, "")}`;
  return `${nome}:${carimbo(d.instante)}`;
}

export function gerarIcs(nome: string, eventos: EventoParaIcs[]): string {
  const agora = carimbo(new Date());
  const linhas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Quanto Custa Casar//CRM//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escaparTexto(nome)}`,
    `X-WR-TIMEZONE:${FUSO}`,
    "X-PUBLISHED-TTL:PT1H",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
  ];
  for (const e of eventos) {
    linhas.push("BEGIN:VEVENT");
    linhas.push(`UID:${e.uid}`);
    linhas.push(`DTSTAMP:${agora}`);
    linhas.push(propriedadeData("DTSTART", e.inicio));
    if (e.fim) linhas.push(propriedadeData("DTEND", e.fim));
    linhas.push(`SUMMARY:${escaparTexto(e.titulo)}`);
    if (e.descricao) linhas.push(`DESCRIPTION:${escaparTexto(e.descricao)}`);
    if (e.local) linhas.push(`LOCATION:${escaparTexto(e.local)}`);
    if (e.url) linhas.push(`URL:${e.url}`);
    linhas.push("END:VEVENT");
  }
  linhas.push("END:VCALENDAR");
  return linhas.map(dobrar).join("\r\n") + "\r\n";
}

/* ------------------------------------------------------------------ leitura */

type Propriedade = { nome: string; params: Record<string, string>; valor: string };

function analisarLinha(linha: string): Propriedade | null {
  let i = 0;
  let nome = "";
  while (i < linha.length && linha[i] !== ";" && linha[i] !== ":") nome += linha[i++];
  if (!nome) return null;
  const params: Record<string, string> = {};
  while (i < linha.length && linha[i] === ";") {
    i++;
    let chave = "";
    while (i < linha.length && linha[i] !== "=") chave += linha[i++];
    i++; // "="
    let valor = "";
    if (linha[i] === '"') {
      i++;
      while (i < linha.length && linha[i] !== '"') valor += linha[i++];
      i++;
    } else {
      while (i < linha.length && linha[i] !== ";" && linha[i] !== ":") valor += linha[i++];
    }
    params[chave.toUpperCase()] = valor;
  }
  if (linha[i] !== ":") return null;
  return { nome: nome.toUpperCase(), params, valor: linha.slice(i + 1) };
}

function desescapar(t: string): string {
  return t
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function fusoDe(params: Record<string, string>): string {
  const tz = params.TZID;
  return tz && fusoValido(tz) ? tz : FUSO;
}

/** Lê um valor DATE ou DATE-TIME; devolve também o fuso em que estava escrito. */
function analisarData(p: Propriedade): { data: DataIcs; fuso: string } | null {
  const v = p.valor.trim();
  const m = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);
  if (!m) return null;
  const [, a, me, d, h, mi, , z] = m;
  if (p.params.VALUE === "DATE" || h === undefined) {
    return { data: { tipo: "dia", dia: `${a}-${me}-${d}` }, fuso: fusoDe(p.params) };
  }
  if (z) {
    return {
      data: { tipo: "instante", instante: new Date(Date.UTC(+a, +me - 1, +d, +h, +mi)) },
      fuso: "UTC",
    };
  }
  const fuso = fusoDe(p.params);
  const partes = { ano: +a, mes: +me, dia: +d, hora: +h, minuto: +mi };
  return { data: { tipo: "instante", instante: instanteDe(partes, fuso) }, fuso };
}

/** Chave que identifica uma ocorrência, para EXDATE e RECURRENCE-ID. */
export function chaveDe(d: DataIcs): string {
  return d.tipo === "dia" ? d.dia : String(d.instante.getTime());
}

/** Extrai os VEVENT de um ficheiro iCalendar. Linhas que não entende são ignoradas. */
export function analisarIcs(texto: string): EventoIcs[] {
  const linhas = texto.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
  const eventos: EventoIcs[] = [];
  let atual: (Partial<EventoIcs> & { exdatas: Set<string>; duracao?: string }) | null = null;

  for (const bruta of linhas) {
    const p = analisarLinha(bruta);
    if (!p) continue;
    if (p.nome === "BEGIN" && p.valor.toUpperCase() === "VEVENT") {
      atual = { exdatas: new Set(), fuso: FUSO, cancelado: false };
      continue;
    }
    if (p.nome === "END" && p.valor.toUpperCase() === "VEVENT") {
      if (atual && atual.inicio && atual.uid) {
        eventos.push({
          uid: atual.uid,
          titulo: atual.titulo ?? "(sem título)",
          descricao: atual.descricao ?? null,
          local: atual.local ?? null,
          inicio: atual.inicio,
          fim: atual.fim ?? fimPorDuracao({ inicio: atual.inicio, duracao: atual.duracao }),
          fuso: atual.fuso ?? FUSO,
          rrule: atual.rrule ?? null,
          exdatas: atual.exdatas,
          recorrenciaDe: atual.recorrenciaDe ?? null,
          cancelado: atual.cancelado ?? false,
        });
      }
      atual = null;
      continue;
    }
    if (!atual) continue;
    switch (p.nome) {
      case "UID":
        atual.uid = p.valor.trim();
        break;
      case "SUMMARY":
        atual.titulo = desescapar(p.valor).trim();
        break;
      case "DESCRIPTION":
        atual.descricao = desescapar(p.valor).trim() || null;
        break;
      case "LOCATION":
        atual.local = desescapar(p.valor).trim() || null;
        break;
      case "DTSTART": {
        const r = analisarData(p);
        if (r) {
          atual.inicio = r.data;
          atual.fuso = r.fuso;
        }
        break;
      }
      case "DTEND": {
        const r = analisarData(p);
        if (r) atual.fim = r.data;
        break;
      }
      case "DURATION": {
        atual.duracao = p.valor.trim();
        break;
      }
      case "RRULE":
        atual.rrule = p.valor.trim();
        break;
      case "EXDATE":
        for (const v of p.valor.split(",")) {
          const r = analisarData({ ...p, valor: v });
          if (r) atual.exdatas.add(chaveDe(r.data));
        }
        break;
      case "RECURRENCE-ID": {
        const r = analisarData(p);
        if (r) atual.recorrenciaDe = chaveDe(r.data);
        break;
      }
      case "STATUS":
        atual.cancelado = p.valor.trim().toUpperCase() === "CANCELLED";
        break;
    }
  }
  return eventos;
}

/** DTEND a partir de DURATION, quando o evento só traz a duração. */
function fimPorDuracao(e: { inicio: DataIcs; duracao?: string }): DataIcs | null {
  const dur = e.duracao;
  if (!dur) return null;
  const m = dur.match(/^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
  if (!m) return null;
  const sinal = m[1] === "-" ? -1 : 1;
  const ms =
    sinal *
    ((+(m[2] ?? 0) * 7 + +(m[3] ?? 0)) * 86_400_000 +
      +(m[4] ?? 0) * 3_600_000 +
      +(m[5] ?? 0) * 60_000 +
      +(m[6] ?? 0) * 1000);
  if (e.inicio.tipo === "dia") return { tipo: "dia", dia: somarDias(e.inicio.dia, Math.round(ms / 86_400_000)) };
  return { tipo: "instante", instante: new Date(e.inicio.instante.getTime() + ms) };
}

/* ------------------------------------------------------------ recorrência */

const DIAS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

type Regra = {
  freq: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  intervalo: number;
  count: number | null;
  until: DataIcs | null;
  byday: { ordinal: number | null; dia: number }[];
  bymonthday: number[];
  bymonth: number[];
};

function analisarRegra(texto: string, fuso: string): Regra | null {
  const partes: Record<string, string> = {};
  for (const par of texto.split(";")) {
    const [k, v] = par.split("=");
    if (k && v !== undefined) partes[k.toUpperCase()] = v;
  }
  const freq = partes.FREQ?.toUpperCase();
  if (freq !== "DAILY" && freq !== "WEEKLY" && freq !== "MONTHLY" && freq !== "YEARLY") return null;
  let until: DataIcs | null = null;
  if (partes.UNTIL) {
    const r = analisarData({ nome: "UNTIL", params: { TZID: fuso }, valor: partes.UNTIL });
    until = r?.data ?? null;
  }
  return {
    freq,
    intervalo: Math.max(1, Number(partes.INTERVAL) || 1),
    count: partes.COUNT ? Math.max(0, Number(partes.COUNT) || 0) : null,
    until,
    byday: (partes.BYDAY ?? "")
      .split(",")
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean)
      .map((t) => {
        const m = t.match(/^([+-]?\d+)?([A-Z]{2})$/);
        if (!m) return null;
        const dia = DIAS.indexOf(m[2]);
        return dia === -1 ? null : { ordinal: m[1] ? Number(m[1]) : null, dia };
      })
      .filter((x): x is { ordinal: number | null; dia: number } => x !== null),
    bymonthday: (partes.BYMONTHDAY ?? "").split(",").map(Number).filter((n) => n >= 1 && n <= 31),
    bymonth: (partes.BYMONTH ?? "").split(",").map(Number).filter((n) => n >= 1 && n <= 12),
  };
}

function diasDoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

/** Datas (ISO) candidatas de um período (dia, semana, mês ou ano) a partir do seu início. */
function candidatosDoPeriodo(regra: Regra, inicioPeriodo: string, inicioEvento: string): string[] {
  const p = partesDeIso(inicioPeriodo);
  const pi = partesDeIso(inicioEvento);
  switch (regra.freq) {
    case "DAILY":
      return [inicioPeriodo];
    case "WEEKLY": {
      const dias = regra.byday.length ? regra.byday.map((b) => b.dia) : [diaDaSemana(inicioEvento)];
      return [...new Set(dias)].sort().map((d) => somarDias(inicioPeriodo, d));
    }
    case "MONTHLY": {
      const total = diasDoMes(p.ano, p.mes);
      if (regra.byday.length) {
        const out: string[] = [];
        for (const b of regra.byday) {
          const dias: string[] = [];
          for (let d = 1; d <= total; d++) {
            const iso = isoDe({ ano: p.ano, mes: p.mes, dia: d });
            if (diaDaSemana(iso) === b.dia) dias.push(iso);
          }
          if (b.ordinal === null) out.push(...dias);
          else {
            const escolhido = b.ordinal > 0 ? dias[b.ordinal - 1] : dias[dias.length + b.ordinal];
            if (escolhido) out.push(escolhido);
          }
        }
        return out.sort();
      }
      const diasMes = regra.bymonthday.length ? regra.bymonthday : [pi.dia];
      return diasMes.filter((d) => d <= total).map((d) => isoDe({ ano: p.ano, mes: p.mes, dia: d }));
    }
    case "YEARLY": {
      const meses = regra.bymonth.length ? regra.bymonth : [pi.mes];
      const diasMes = regra.bymonthday.length ? regra.bymonthday : [pi.dia];
      const out: string[] = [];
      for (const m of meses) {
        const total = diasDoMes(p.ano, m);
        for (const d of diasMes) if (d <= total) out.push(isoDe({ ano: p.ano, mes: m, dia: d }));
      }
      return out.sort();
    }
  }
}

function avancarPeriodo(regra: Regra, inicioPeriodo: string): string {
  switch (regra.freq) {
    case "DAILY":
      return somarDias(inicioPeriodo, regra.intervalo);
    case "WEEKLY":
      return somarDias(inicioPeriodo, 7 * regra.intervalo);
    case "MONTHLY":
      return somarMeses(inicioPeriodo, regra.intervalo);
    case "YEARLY":
      return somarMeses(inicioPeriodo, 12 * regra.intervalo);
  }
}

function inicioDoPeriodo(regra: Regra, dia: string): string {
  const p = partesDeIso(dia);
  switch (regra.freq) {
    case "DAILY":
      return dia;
    case "WEEKLY":
      return somarDias(dia, -diaDaSemana(dia));
    case "MONTHLY":
      return isoDe({ ano: p.ano, mes: p.mes, dia: 1 });
    case "YEARLY":
      return isoDe({ ano: p.ano, mes: 1, dia: 1 });
  }
}

export type Ocorrencia = { inicio: DataIcs; fim: DataIcs | null; evento: EventoIcs };

/**
 * Ocorrências de um conjunto de eventos que tocam a janela [inicio, fim]
 * (dias ISO, inclusive, em hora de Lisboa). Instâncias alteradas de um evento
 * recorrente substituem a ocorrência original.
 */
export function ocorrencias(eventos: EventoIcs[], inicio: string, fim: string): Ocorrencia[] {
  const substituidas = new Map<string, Set<string>>();
  for (const e of eventos) {
    if (e.recorrenciaDe) {
      if (!substituidas.has(e.uid)) substituidas.set(e.uid, new Set());
      substituidas.get(e.uid)!.add(e.recorrenciaDe);
    }
  }

  const saida: Ocorrencia[] = [];
  for (const e of eventos) {
    if (e.cancelado) continue;
    if (!e.rrule) {
      if (tocaJanela(e.inicio, e.fim, inicio, fim)) saida.push({ inicio: e.inicio, fim: e.fim, evento: e });
      continue;
    }
    const regra = analisarRegra(e.rrule, e.fuso);
    if (!regra) {
      if (tocaJanela(e.inicio, e.fim, inicio, fim)) saida.push({ inicio: e.inicio, fim: e.fim, evento: e });
      continue;
    }
    const excluir = new Set([...e.exdatas, ...(substituidas.get(e.uid) ?? [])]);
    for (const o of expandir(e, regra, inicio, fim)) {
      if (excluir.has(chaveDe(o.inicio))) continue;
      if (tocaJanela(o.inicio, o.fim, inicio, fim)) saida.push({ ...o, evento: e });
    }
  }
  return saida;
}

function diaDe(d: DataIcs, fuso: string): string {
  return d.tipo === "dia" ? d.dia : diaLocal(d.instante, fuso);
}

function tocaJanela(inicio: DataIcs, fim: DataIcs | null, de: string, ate: string): boolean {
  const primeiro = diaDe(inicio, FUSO);
  let ultimo = fim ? diaDe(fim, FUSO) : primeiro;
  // DTEND é exclusivo: um evento de dia inteiro até 2026-09-12 acaba a 11.
  if (fim && fim.tipo === "dia" && ultimo > primeiro) ultimo = somarDias(ultimo, -1);
  if (fim && fim.tipo === "instante" && ultimo > primeiro) {
    const h = partesLocais(fim.instante, FUSO);
    if (h.hora === 0 && h.minuto === 0) ultimo = somarDias(ultimo, -1);
  }
  if (ultimo < primeiro) ultimo = primeiro;
  return ultimo >= de && primeiro <= ate;
}

const LIMITE_PERIODOS = 1200;
const LIMITE_OCORRENCIAS = 2000;

function expandir(e: EventoIcs, regra: Regra, de: string, ate: string): { inicio: DataIcs; fim: DataIcs | null }[] {
  const fuso = e.fuso;
  const inicioLocal: PartesLocais =
    e.inicio.tipo === "dia"
      ? { ...partesDeIso(e.inicio.dia), hora: 0, minuto: 0 }
      : partesLocais(e.inicio.instante, fuso);
  const primeiroDia = isoDe(inicioLocal);
  const duracaoMs =
    e.fim && e.fim.tipo === "instante" && e.inicio.tipo === "instante"
      ? e.fim.instante.getTime() - e.inicio.instante.getTime()
      : null;
  const duracaoDias =
    e.fim && e.fim.tipo === "dia" && e.inicio.tipo === "dia"
      ? Math.max(1, Math.round((Date.parse(e.fim.dia) - Date.parse(e.inicio.dia)) / 86_400_000))
      : null;
  const limiteUntil = regra.until ? diaDe(regra.until, fuso) : null;
  const untilMs = regra.until?.tipo === "instante" ? regra.until.instante.getTime() : null;

  const saida: { inicio: DataIcs; fim: DataIcs | null }[] = [];
  let periodo = inicioDoPeriodo(regra, primeiroDia);
  let contagem = 0;
  for (let n = 0; n < LIMITE_PERIODOS && saida.length < LIMITE_OCORRENCIAS; n++) {
    if (periodo > ate) break;
    if (limiteUntil && periodo > limiteUntil) break;
    for (const dia of candidatosDoPeriodo(regra, periodo, primeiroDia)) {
      if (dia < primeiroDia) continue;
      if (limiteUntil && dia > limiteUntil) break;
      if (regra.count !== null && contagem >= regra.count) break;
      contagem++;
      let inicio: DataIcs;
      let fim: DataIcs | null = null;
      if (e.inicio.tipo === "dia") {
        inicio = { tipo: "dia", dia };
        if (duracaoDias !== null) fim = { tipo: "dia", dia: somarDias(dia, duracaoDias) };
      } else {
        const instante = instanteDe({ ...partesDeIso(dia), hora: inicioLocal.hora, minuto: inicioLocal.minuto }, fuso);
        if (untilMs !== null && instante.getTime() > untilMs) continue;
        inicio = { tipo: "instante", instante };
        if (duracaoMs !== null) fim = { tipo: "instante", instante: new Date(instante.getTime() + duracaoMs) };
      }
      if (dia > ate) break;
      // Só interessam as que ainda podem tocar a janela; as anteriores contam para o COUNT.
      if (dia >= somarDias(de, -(duracaoDias ?? 1) - 1)) saida.push({ inicio, fim });
    }
    if (regra.count !== null && contagem >= regra.count) break;
    periodo = avancarPeriodo(regra, periodo);
  }
  return saida;
}
