/**
 * Datas e horas em hora de Lisboa, sem dependências. O servidor corre em UTC
 * (Railway), por isso tudo o que é "que dia é" ou "a que horas" passa por aqui.
 */

export const FUSO = "Europe/Lisbon";

export type PartesLocais = { ano: number; mes: number; dia: number; hora: number; minuto: number };

const formatadores = new Map<string, Intl.DateTimeFormat>();

function formatador(fuso: string): Intl.DateTimeFormat {
  let f = formatadores.get(fuso);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: fuso,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    formatadores.set(fuso, f);
  }
  return f;
}

export function fusoValido(fuso: string): boolean {
  try {
    formatador(fuso);
    return true;
  } catch {
    return false;
  }
}

/** Decompõe um instante nas partes de relógio de um fuso. */
export function partesLocais(instante: Date, fuso = FUSO): PartesLocais {
  const partes: Record<string, number> = {};
  for (const p of formatador(fuso).formatToParts(instante)) {
    if (p.type !== "literal") partes[p.type] = Number(p.value);
  }
  return {
    ano: partes.year,
    mes: partes.month,
    dia: partes.day,
    hora: partes.hour === 24 ? 0 : partes.hour,
    minuto: partes.minute,
  };
}

/** O instante que corresponde a uma hora de relógio num fuso. */
export function instanteDe(p: PartesLocais, fuso = FUSO): Date {
  const alvo = Date.UTC(p.ano, p.mes - 1, p.dia, p.hora, p.minuto);
  let palpite = alvo;
  for (let i = 0; i < 2; i++) {
    const l = partesLocais(new Date(palpite), fuso);
    const desvio = Date.UTC(l.ano, l.mes - 1, l.dia, l.hora, l.minuto) - palpite;
    palpite = alvo - desvio;
  }
  return new Date(palpite);
}

const dd = (n: number) => String(n).padStart(2, "0");

export function isoDe(p: { ano: number; mes: number; dia: number }): string {
  return `${p.ano}-${dd(p.mes)}-${dd(p.dia)}`;
}

export function horaDe(p: { hora: number; minuto: number }): string {
  return `${dd(p.hora)}:${dd(p.minuto)}`;
}

export function partesDeIso(iso: string): { ano: number; mes: number; dia: number } {
  const [a, m, d] = iso.split("-").map(Number);
  return { ano: a, mes: m, dia: d };
}

/** Dia local (YYYY-MM-DD) de um instante. */
export function diaLocal(instante: Date, fuso = FUSO): string {
  return isoDe(partesLocais(instante, fuso));
}

export function horaLocal(instante: Date, fuso = FUSO): string {
  return horaDe(partesLocais(instante, fuso));
}

export function hojeLisboa(): string {
  return diaLocal(new Date());
}

/** Soma dias a uma data ISO, em aritmética de calendário (sem fusos). */
export function somarDias(iso: string, dias: number): string {
  const { ano, mes, dia } = partesDeIso(iso);
  const d = new Date(Date.UTC(ano, mes - 1, dia + dias));
  return d.toISOString().slice(0, 10);
}

export function somarMeses(iso: string, meses: number): string {
  const { ano, mes, dia } = partesDeIso(iso);
  const d = new Date(Date.UTC(ano, mes - 1 + meses, 1));
  const ultimo = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(dia, ultimo));
  return d.toISOString().slice(0, 10);
}

/** Dias entre duas datas ISO (b - a). */
export function diferencaDias(a: string, b: string): number {
  const pa = partesDeIso(a);
  const pb = partesDeIso(b);
  return Math.round(
    (Date.UTC(pb.ano, pb.mes - 1, pb.dia) - Date.UTC(pa.ano, pa.mes - 1, pa.dia)) / 86_400_000,
  );
}

/** 0 = segunda … 6 = domingo. */
export function diaDaSemana(iso: string): number {
  const { ano, mes, dia } = partesDeIso(iso);
  return (new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay() + 6) % 7;
}

export function dataValida(iso: string | null | undefined): iso is string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const { ano, mes, dia } = partesDeIso(iso);
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  return d.getUTCFullYear() === ano && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia;
}

export function horaValida(h: string | null | undefined): h is string {
  return !!h && /^([01]\d|2[0-3]):[0-5]\d$/.test(h);
}

export function compararHoras(a: string | null, b: string | null): number {
  return (a ?? "").localeCompare(b ?? "");
}

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];
const DIAS_SEMANA = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];
export const DIAS_SEMANA_CURTOS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

function capitalizar(t: string): string {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** (2026, 9) -> "Setembro de 2026". */
export function nomeDoMes(ano: number, mes: number): string {
  return capitalizar(`${MESES[mes - 1]} de ${ano}`);
}

/** "2026-09-10" -> "Quinta, 10 de setembro". */
export function dataPorExtenso(iso: string): string {
  const { mes, dia } = partesDeIso(iso);
  return capitalizar(`${DIAS_SEMANA[diaDaSemana(iso)]}, ${dia} de ${MESES[mes - 1]}`);
}
