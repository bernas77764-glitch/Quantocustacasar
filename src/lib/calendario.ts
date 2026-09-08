import { getDb } from "@/lib/db";
import { euros } from "@/lib/format";
import { listarCompromissos, listarTodosCompromissos } from "@/lib/queries/compromissos";
import type { CompromissoDetalhado, EventoCalendario, TipoEvento } from "@/lib/types";
import { instanteDe, partesDeIso, somarDias, diaDaSemana, hojeLisboa } from "@/lib/tempo";
import type { EventoParaIcs } from "@/lib/ics";

export const ROTULO_TIPO: Record<TipoEvento, string> = {
  casamento: "Casamento",
  servico: "Serviço",
  vencimento: "Vencimento",
  compromisso: "Compromisso",
  google: "Google Calendar",
};

/* ------------------------------------------------------------- grelha */

/** Semanas (segunda a domingo) que cobrem o mês; dias fora do mês incluídos. */
export function gradeDoMes(ano: number, mes: number): string[][] {
  const primeiro = `${ano}-${String(mes).padStart(2, "0")}-01`;
  const inicio = somarDias(primeiro, -diaDaSemana(primeiro));
  const ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  const ultimo = `${ano}-${String(mes).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`;
  const fim = somarDias(ultimo, 6 - diaDaSemana(ultimo));
  const semanas: string[][] = [];
  let dia = inicio;
  while (dia <= fim) {
    const semana: string[] = [];
    for (let i = 0; i < 7; i++) {
      semana.push(dia);
      dia = somarDias(dia, 1);
    }
    semanas.push(semana);
  }
  return semanas;
}

/** "2026-09" válido → {ano, mes}; senão o mês atual em Lisboa. */
export function mesDe(texto: string | undefined): { ano: number; mes: number } {
  const m = texto?.match(/^(\d{4})-(\d{2})$/);
  if (m) {
    const ano = Number(m[1]);
    const mes = Number(m[2]);
    if (ano >= 2000 && ano <= 2100 && mes >= 1 && mes <= 12) return { ano, mes };
  }
  const { ano, mes } = partesDeIso(hojeLisboa());
  return { ano, mes };
}

export function chaveMes(ano: number, mes: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}`;
}

export function mesSeguinte(ano: number, mes: number, passo: number): { ano: number; mes: number } {
  const d = new Date(Date.UTC(ano, mes - 1 + passo, 1));
  return { ano: d.getUTCFullYear(), mes: d.getUTCMonth() + 1 };
}

/* ------------------------------------------------------ eventos do CRM */

type LinhaCasamento = {
  id: number;
  nome: string;
  parceiro: string | null;
  data_casamento: string;
  local_evento: string | null;
};

type LinhaServico = {
  id: number;
  data_servico: string;
  categoria: string;
  descricao: string | null;
  cliente_nome: string;
  fornecedor_nome: string;
};

type LinhaVencimento = {
  id: number;
  contratacao_id: number;
  data_prevista: string;
  descricao: string | null;
  valor_cents: number;
  cliente_nome: string;
  fornecedor_nome: string;
};

function nomeDoCasal(c: { nome: string; parceiro: string | null }): string {
  return c.parceiro ? `${c.nome} & ${c.parceiro}` : c.nome;
}

function casamentos(inicio?: string, fim?: string): LinhaCasamento[] {
  const filtro = inicio ? "AND data_casamento BETWEEN ? AND ?" : "";
  return getDb()
    .prepare(
      `SELECT id, nome, parceiro, data_casamento, local_evento FROM clientes
       WHERE data_casamento IS NOT NULL AND estado <> 'perdido' ${filtro}
       ORDER BY data_casamento`,
    )
    .all(...(inicio ? [inicio, fim!] : [])) as unknown as LinhaCasamento[];
}

function servicos(inicio?: string, fim?: string): LinhaServico[] {
  const filtro = inicio ? "AND c.data_servico BETWEEN ? AND ?" : "";
  return getDb()
    .prepare(
      `SELECT c.id, c.data_servico, c.categoria, c.descricao,
              cl.nome AS cliente_nome, f.nome AS fornecedor_nome
       FROM contratacoes c
       JOIN clientes cl ON cl.id = c.cliente_id
       JOIN fornecedores f ON f.id = c.fornecedor_id
       WHERE c.data_servico IS NOT NULL AND c.estado <> 'cancelada' ${filtro}
       ORDER BY c.data_servico`,
    )
    .all(...(inicio ? [inicio, fim!] : [])) as unknown as LinhaServico[];
}

function vencimentos(inicio?: string, fim?: string): LinhaVencimento[] {
  const filtro = inicio ? "AND p.data_prevista BETWEEN ? AND ?" : "";
  return getDb()
    .prepare(
      `SELECT p.id, p.contratacao_id, p.data_prevista, p.descricao, p.valor_cents,
              cl.nome AS cliente_nome, f.nome AS fornecedor_nome
       FROM pagamentos p
       JOIN contratacoes c ON c.id = p.contratacao_id
       JOIN clientes cl ON cl.id = c.cliente_id
       JOIN fornecedores f ON f.id = c.fornecedor_id
       WHERE p.estado = 'pendente' AND p.data_prevista IS NOT NULL ${filtro}
       ORDER BY p.data_prevista`,
    )
    .all(...(inicio ? [inicio, fim!] : [])) as unknown as LinhaVencimento[];
}

function base(
  tipo: TipoEvento,
  chave: string,
  titulo: string,
  data: string,
): EventoCalendario {
  return {
    chave,
    tipo,
    titulo,
    data,
    data_fim: null,
    hora: null,
    hora_fim: null,
    detalhe: null,
    local: null,
    href: null,
    google_url: null,
    atrasado: false,
    compromisso_id: null,
  };
}

function eventoCompromisso(c: CompromissoDetalhado): EventoCalendario {
  const ligado = [c.cliente_nome, c.fornecedor_nome].filter(Boolean).join(" · ");
  return {
    ...base("compromisso", `compromisso-${c.id}`, c.titulo, c.data),
    hora: c.hora_inicio,
    hora_fim: c.hora_fim,
    detalhe: [ligado, c.notas].filter(Boolean).join(" — ") || null,
    local: c.local,
    href: c.cliente_id ? `/clientes/${c.cliente_id}` : c.fornecedor_id ? `/fornecedores/${c.fornecedor_id}` : null,
    compromisso_id: c.id,
  };
}

/** Tudo o que o CRM sabe que acontece entre dois dias (inclusive). */
export function eventosDoCrm(inicio: string, fim: string): EventoCalendario[] {
  const hoje = hojeLisboa();
  const eventos: EventoCalendario[] = [];

  for (const c of casamentos(inicio, fim)) {
    eventos.push({
      ...base("casamento", `casamento-${c.id}`, `Casamento · ${nomeDoCasal(c)}`, c.data_casamento),
      local: c.local_evento,
      href: `/clientes/${c.id}`,
    });
  }
  for (const s of servicos(inicio, fim)) {
    eventos.push({
      ...base("servico", `servico-${s.id}`, `${s.fornecedor_nome} · ${s.cliente_nome}`, s.data_servico),
      detalhe: [s.categoria, s.descricao].filter(Boolean).join(" — "),
      href: `/contratacoes/${s.id}`,
    });
  }
  for (const v of vencimentos(inicio, fim)) {
    eventos.push({
      ...base("vencimento", `vencimento-${v.id}`, `${euros(v.valor_cents)} · ${v.cliente_nome}`, v.data_prevista),
      detalhe: [v.descricao, v.fornecedor_nome].filter(Boolean).join(" — "),
      href: `/contratacoes/${v.contratacao_id}`,
      atrasado: v.data_prevista < hoje,
    });
  }
  for (const c of listarCompromissos(inicio, fim)) eventos.push(eventoCompromisso(c));

  for (const e of eventos) e.google_url = urlGoogle(e);
  return eventos;
}

/** Ordena por dia, depois dia inteiro primeiro, depois hora. */
export function ordenarEventos(eventos: EventoCalendario[]): EventoCalendario[] {
  const peso: Record<TipoEvento, number> = { casamento: 0, servico: 1, compromisso: 2, vencimento: 3, google: 4 };
  return [...eventos].sort(
    (a, b) =>
      a.data.localeCompare(b.data) ||
      (a.hora ?? "").localeCompare(b.hora ?? "") ||
      peso[a.tipo] - peso[b.tipo] ||
      a.titulo.localeCompare(b.titulo),
  );
}

/** Agrupa por dia; eventos de vários dias aparecem em cada dia que tocam. */
export function porDia(eventos: EventoCalendario[], primeiro: string, ultimo: string): Map<string, EventoCalendario[]> {
  const mapa = new Map<string, EventoCalendario[]>();
  for (const e of ordenarEventos(eventos)) {
    const fim = e.data_fim && e.data_fim > e.data ? e.data_fim : e.data;
    let dia = e.data < primeiro ? primeiro : e.data;
    let n = 0;
    while (dia <= fim && dia <= ultimo && n++ < 62) {
      if (!mapa.has(dia)) mapa.set(dia, []);
      mapa.get(dia)!.push(e);
      dia = somarDias(dia, 1);
    }
  }
  return mapa;
}

/* ------------------------------------------------ Google: "adicionar" */

function compacto(iso: string): string {
  return iso.replace(/-/g, "");
}

function carimboUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/** Ligação "adicionar ao Google Calendar" para um evento do CRM. */
export function urlGoogle(e: EventoCalendario): string | null {
  if (e.tipo === "google") return null;
  const params = new URLSearchParams({ action: "TEMPLATE", text: e.titulo });
  if (e.hora) {
    const inicio = instanteDe({ ...partesDeIso(e.data), ...horaMinuto(e.hora) });
    const fim = e.hora_fim
      ? instanteDe({ ...partesDeIso(e.data), ...horaMinuto(e.hora_fim) })
      : new Date(inicio.getTime() + 3_600_000);
    params.set("dates", `${carimboUtc(inicio)}/${carimboUtc(fim)}`);
    params.set("ctz", "Europe/Lisbon");
  } else {
    const fim = somarDias(e.data_fim ?? e.data, 1);
    params.set("dates", `${compacto(e.data)}/${compacto(fim)}`);
  }
  if (e.detalhe) params.set("details", e.detalhe);
  if (e.local) params.set("location", e.local);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function horaMinuto(h: string): { hora: number; minuto: number } {
  const [hora, minuto] = h.split(":").map(Number);
  return { hora, minuto };
}

/* --------------------------------------------------------- feed ICS */

const DOMINIO_UID = "crm.quantocustacasar.pt";

/** Todos os eventos do CRM, para o calendário que o Google subscreve. */
export function eventosParaFeed(): EventoParaIcs[] {
  const saida: EventoParaIcs[] = [];
  const diaInteiro = (dia: string) => ({
    inicio: { tipo: "dia" as const, dia },
    fim: { tipo: "dia" as const, dia: somarDias(dia, 1) },
  });

  for (const c of casamentos()) {
    saida.push({
      uid: `casamento-${c.id}@${DOMINIO_UID}`,
      titulo: `Casamento · ${nomeDoCasal(c)}`,
      local: c.local_evento,
      descricao: "Data do casamento registada no CRM.",
      ...diaInteiro(c.data_casamento),
    });
  }
  for (const s of servicos()) {
    saida.push({
      uid: `servico-${s.id}@${DOMINIO_UID}`,
      titulo: `${s.fornecedor_nome} · ${s.cliente_nome}`,
      descricao: [s.categoria, s.descricao].filter(Boolean).join(" — "),
      ...diaInteiro(s.data_servico),
    });
  }
  for (const v of vencimentos()) {
    saida.push({
      uid: `vencimento-${v.id}@${DOMINIO_UID}`,
      titulo: `Vencimento ${euros(v.valor_cents)} · ${v.cliente_nome}`,
      descricao: [v.descricao, `Fornecedor: ${v.fornecedor_nome}`].filter(Boolean).join("\n"),
      ...diaInteiro(v.data_prevista),
    });
  }
  for (const c of listarTodosCompromissos()) {
    const ligado = [c.cliente_nome, c.fornecedor_nome].filter(Boolean).join(" · ");
    const descricao = [ligado, c.notas].filter(Boolean).join("\n") || null;
    if (c.hora_inicio) {
      const inicio = instanteDe({ ...partesDeIso(c.data), ...horaMinuto(c.hora_inicio) });
      const fim = c.hora_fim
        ? instanteDe({ ...partesDeIso(c.data), ...horaMinuto(c.hora_fim) })
        : new Date(inicio.getTime() + 3_600_000);
      saida.push({
        uid: `compromisso-${c.id}@${DOMINIO_UID}`,
        titulo: c.titulo,
        descricao,
        local: c.local,
        inicio: { tipo: "instante", instante: inicio },
        fim: { tipo: "instante", instante: fim },
      });
    } else {
      saida.push({
        uid: `compromisso-${c.id}@${DOMINIO_UID}`,
        titulo: c.titulo,
        descricao,
        local: c.local,
        ...diaInteiro(c.data),
      });
    }
  }
  return saida;
}
