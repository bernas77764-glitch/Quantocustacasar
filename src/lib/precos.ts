import { agora, getDb } from "./db";

/**
 * Tabela de preços do simulador, gerida no CRM e servida ao site em
 * `GET /api/public/precos`.
 *
 * O catálogo base (rubricas, grupos, unidade de cobrança e multiplicadores)
 * é o do `index.html` do site: os `id` e as chaves têm de coincidir, porque
 * o site só aplica o que reconhece. Os valores aqui são os indicativos com
 * que o site nasceu; o que a equipa guardar no CRM sobrepõe-se a eles.
 *
 * Ao contrário do resto do CRM, os valores são em euros (números simples),
 * porque é esse o formato do site — não em cêntimos.
 */

export type Unidade = "fixo" | "convidado";

export type RubricaBase = {
  id: string;
  grupo: string;
  nome: string;
  un: Unidade;
  min: number;
  base: number;
  max: number;
  /** Sensível ao mercado: os multiplicadores de região, época e estilo aplicam-se. */
  mercado: boolean;
  /** Ligada por omissão no simulador. */
  on: boolean;
};

export const RUBRICAS_BASE: RubricaBase[] = [
  { id: "espaco",     grupo: "O dia",         nome: "Espaço / quinta",                un: "fixo",      min: 1500, base: 3000, max: 6000, mercado: true,  on: true },
  { id: "catering",   grupo: "O dia",         nome: "Catering e bebidas",             un: "convidado", min: 55,   base: 80,   max: 130,  mercado: true,  on: true },
  { id: "openbar",    grupo: "O dia",         nome: "Open bar / bar de noite",        un: "convidado", min: 10,   base: 18,   max: 32,   mercado: true,  on: true },
  { id: "bolo",       grupo: "O dia",         nome: "Bolo de noiva",                  un: "fixo",      min: 250,  base: 450,  max: 900,  mercado: true,  on: true },
  { id: "cerimonia",  grupo: "O dia",         nome: "Cerimónia (taxas e celebrante)", un: "fixo",      min: 150,  base: 300,  max: 700,  mercado: true,  on: true },
  { id: "somluz",     grupo: "O dia",         nome: "Som, luz e estruturas",          un: "fixo",      min: 400,  base: 900,  max: 1800, mercado: true,  on: true },
  { id: "foto",       grupo: "Imagem",        nome: "Fotografia",                     un: "fixo",      min: 900,  base: 1600, max: 3000, mercado: true,  on: true },
  { id: "video",      grupo: "Imagem",        nome: "Vídeo",                          un: "fixo",      min: 800,  base: 1500, max: 2800, mercado: true,  on: true },
  { id: "booth",      grupo: "Imagem",        nome: "Fotobooth / animação extra",     un: "fixo",      min: 300,  base: 600,  max: 1200, mercado: true,  on: false },
  { id: "dj",         grupo: "Música",        nome: "DJ",                             un: "fixo",      min: 600,  base: 950,  max: 1600, mercado: true,  on: true },
  { id: "banda",      grupo: "Música",        nome: "Banda ao vivo",                  un: "fixo",      min: 1200, base: 2200, max: 4000, mercado: true,  on: false },
  { id: "musicacer",  grupo: "Música",        nome: "Música da cerimónia",            un: "fixo",      min: 250,  base: 400,  max: 800,  mercado: true,  on: true },
  { id: "flores",     grupo: "Decoração",     nome: "Decoração e flores",             un: "fixo",      min: 800,  base: 1800, max: 4000, mercado: true,  on: true },
  { id: "mesas",      grupo: "Decoração",     nome: "Centros de mesa e mise en place", un: "convidado", min: 4,   base: 8,    max: 15,   mercado: true,  on: true },
  { id: "papelaria",  grupo: "Decoração",     nome: "Convites e papelaria",           un: "convidado", min: 3,    base: 6,    max: 12,   mercado: true,  on: true },
  { id: "lembrancas", grupo: "Decoração",     nome: "Lembranças para os convidados",  un: "convidado", min: 2,    base: 5,    max: 10,   mercado: true,  on: false },
  { id: "vestido",    grupo: "Os noivos",     nome: "Vestido de noiva e acessórios",  un: "fixo",      min: 900,  base: 1800, max: 3500, mercado: false, on: true },
  { id: "fato",       grupo: "Os noivos",     nome: "Fato do noivo",                  un: "fixo",      min: 350,  base: 700,  max: 1400, mercado: false, on: true },
  { id: "aliancas",   grupo: "Os noivos",     nome: "Alianças",                       un: "fixo",      min: 500,  base: 1100, max: 2500, mercado: false, on: true },
  { id: "beleza",     grupo: "Os noivos",     nome: "Cabelo e maquilhagem",           un: "fixo",      min: 250,  base: 450,  max: 900,  mercado: true,  on: true },
  { id: "transporte", grupo: "Os noivos",     nome: "Transporte dos noivos",          un: "fixo",      min: 250,  base: 450,  max: 900,  mercado: true,  on: false },
  { id: "planner",    grupo: "Apoio",         nome: "Wedding planner e coordenação",  un: "fixo",      min: 1200, base: 2500, max: 5000, mercado: true,  on: true },
  { id: "criancas",   grupo: "Apoio",         nome: "Espaço e apoio para crianças",   un: "fixo",      min: 200,  base: 400,  max: 700,  mercado: true,  on: false },
  { id: "luamel",     grupo: "Depois do dia", nome: "Lua de mel",                     un: "fixo",      min: 2000, base: 4000, max: 9000, mercado: false, on: false },
];

export type Dimensao = "regiao" | "epoca" | "estilo";
export const DIMENSOES: Dimensao[] = ["regiao", "epoca", "estilo"];
export const ROTULO_DIMENSAO: Record<Dimensao, string> = {
  regiao: "Região",
  epoca: "Época",
  estilo: "Estilo",
};

export const MULT_BASE: Record<Dimensao, { chave: string; nome: string; m: number }[]> = {
  regiao: [
    { chave: "lisboa",   nome: "Lisboa e arredores", m: 1.15 },
    { chave: "porto",    nome: "Porto e arredores",  m: 1.08 },
    { chave: "algarve",  nome: "Algarve",            m: 1.2 },
    { chave: "norte",    nome: "Norte (restante)",   m: 0.95 },
    { chave: "centro",   nome: "Centro",             m: 0.92 },
    { chave: "alentejo", nome: "Alentejo",           m: 0.95 },
    { chave: "madeira",  nome: "Madeira",            m: 1.12 },
    { chave: "acores",   nome: "Açores",             m: 1.1 },
  ],
  epoca: [
    { chave: "alta",  nome: "Época alta (maio a setembro)", m: 1.1 },
    { chave: "media", nome: "Abril ou outubro",             m: 1 },
    { chave: "baixa", nome: "Novembro a março",             m: 0.88 },
  ],
  estilo: [
    { chave: "intimista",   nome: "Intimista",   m: 0.82 },
    { chave: "classico",    nome: "Clássico",    m: 1 },
    { chave: "sofisticado", nome: "Sofisticado", m: 1.35 },
  ],
};

/** O formato que o site consome — o mesmo do botão «Copiar tabela (JSON)». */
export type TabelaPrecos = {
  atualizado: string;
  rubricas: { id: string; min: number; base: number; max: number }[];
  mult: Record<Dimensao, Record<string, number>>;
};

const CHAVE = "precos";

function tabelaBase(): TabelaPrecos {
  return {
    atualizado: "",
    rubricas: RUBRICAS_BASE.map(({ id, min, base, max }) => ({ id, min, base, max })),
    mult: {
      regiao: Object.fromEntries(MULT_BASE.regiao.map((m) => [m.chave, m.m])),
      epoca: Object.fromEntries(MULT_BASE.epoca.map((m) => [m.chave, m.m])),
      estilo: Object.fromEntries(MULT_BASE.estilo.map((m) => [m.chave, m.m])),
    },
  };
}

/**
 * A tabela em vigor: o catálogo base com o que a equipa guardou por cima.
 * `guardada` diz se há valores do CRM ou se são ainda os do site.
 */
export function tabelaAtual(): { tabela: TabelaPrecos; guardada: boolean } {
  const linha = getDb()
    .prepare("SELECT valor, atualizado_em FROM definicoes WHERE chave = ?")
    .get(CHAVE) as { valor: string; atualizado_em: string } | undefined;

  const tabela = tabelaBase();
  if (!linha) return { tabela, guardada: false };

  let guardado: Partial<TabelaPrecos>;
  try {
    guardado = JSON.parse(linha.valor) as Partial<TabelaPrecos>;
  } catch {
    return { tabela, guardada: false };
  }

  for (const r of guardado.rubricas ?? []) {
    const alvo = tabela.rubricas.find((x) => x.id === r.id);
    if (alvo) Object.assign(alvo, { min: r.min, base: r.base, max: r.max });
  }
  for (const dim of DIMENSOES) {
    for (const [chave, m] of Object.entries(guardado.mult?.[dim] ?? {})) {
      if (chave in tabela.mult[dim]) tabela.mult[dim][chave] = m;
    }
  }
  tabela.atualizado = linha.atualizado_em.slice(0, 10);
  return { tabela, guardada: true };
}

/* ---------------------------------------------------------------- validação */

export type ResultadoValidacao =
  | { ok: true; tabela: TabelaPrecos }
  | { ok: false; erros: string[] };

function numero(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Aceita um objeto no formato do site (por exemplo, o JSON colado do botão
 * «Copiar tabela») e devolve uma tabela completa e coerente, ou a lista do
 * que está mal. Rubricas e chaves desconhecidas são ignoradas com aviso —
 * o site também as ignoraria.
 */
export function validarTabela(entrada: unknown): ResultadoValidacao {
  if (!entrada || typeof entrada !== "object" || Array.isArray(entrada)) {
    return { ok: false, erros: ["O conteúdo não é um objeto JSON."] };
  }
  const obj = entrada as Record<string, unknown>;
  const erros: string[] = [];
  const tabela = tabelaBase();

  if (obj.rubricas !== undefined) {
    if (!Array.isArray(obj.rubricas)) {
      erros.push('"rubricas" tem de ser uma lista.');
    } else {
      for (const item of obj.rubricas as unknown[]) {
        const r = (item ?? {}) as Record<string, unknown>;
        const alvo = tabela.rubricas.find((x) => x.id === r.id);
        const nome = RUBRICAS_BASE.find((x) => x.id === r.id)?.nome ?? String(r.id);
        if (!alvo) {
          erros.push(`Rubrica desconhecida: "${String(r.id)}".`);
          continue;
        }
        const min = numero(r.min);
        const base = numero(r.base);
        const max = numero(r.max);
        if (min === null || base === null || max === null) {
          erros.push(`${nome}: mínimo, estimativa e máximo têm de ser números.`);
          continue;
        }
        if (min < 0) erros.push(`${nome}: o mínimo não pode ser negativo.`);
        if (!(min <= base && base <= max)) {
          erros.push(`${nome}: tem de ser mínimo ≤ estimativa ≤ máximo (${min} / ${base} / ${max}).`);
        }
        Object.assign(alvo, { min, base, max });
      }
    }
  }

  if (obj.mult !== undefined) {
    const mult = obj.mult as Record<string, unknown>;
    if (!mult || typeof mult !== "object") {
      erros.push('"mult" tem de ser um objeto.');
    } else {
      for (const dim of DIMENSOES) {
        const grupo = mult[dim];
        if (grupo === undefined) continue;
        if (!grupo || typeof grupo !== "object") {
          erros.push(`"mult.${dim}" tem de ser um objeto.`);
          continue;
        }
        for (const [chave, valor] of Object.entries(grupo as Record<string, unknown>)) {
          if (!(chave in tabela.mult[dim])) {
            erros.push(`Multiplicador desconhecido: "${dim}.${chave}".`);
            continue;
          }
          const m = numero(valor);
          if (m === null || m <= 0) {
            erros.push(`${ROTULO_DIMENSAO[dim]} · ${chave}: o multiplicador tem de ser um número positivo.`);
            continue;
          }
          tabela.mult[dim][chave] = m;
        }
      }
    }
  }

  return erros.length ? { ok: false, erros } : { ok: true, tabela };
}

/* ------------------------------------------------------------------- escrita */

export function guardarTabela(tabela: TabelaPrecos): void {
  const valor = JSON.stringify({ rubricas: tabela.rubricas, mult: tabela.mult });
  getDb()
    .prepare(
      `INSERT INTO definicoes (chave, valor, atualizado_em) VALUES (?, ?, ?)
       ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor, atualizado_em = excluded.atualizado_em`,
    )
    .run(CHAVE, valor, agora());
}

/** Volta aos valores com que o site nasceu. */
export function reporTabela(): void {
  getDb().prepare("DELETE FROM definicoes WHERE chave = ?").run(CHAVE);
}
