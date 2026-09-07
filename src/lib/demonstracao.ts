import { getDb } from "./db";
import { criarCliente } from "./queries/clientes";
import { eliminarFornecedor } from "./queries/fornecedores";
import { registarPedidoDeParceria } from "./registo-site";
import { MULT_BASE, RUBRICAS_BASE, tabelaAtual, type Dimensao } from "./precos";

/**
 * Dados de demonstração para aprender a trabalhar no CRM: dez casais e dez
 * pedidos de parceria, construídos com o mesmo código e o mesmo formato que
 * o site usa quando envia um pedido real. Reconhecem-se pelo domínio do
 * email, o que permite removê-los todos de uma vez.
 */

export const DOMINIO_DEMO = "demo.quantocustacasar.pt";

type Casal = {
  nome: string;
  email: string;
  telefone: string;
  emDias: number;
  convidados: number;
  distrito: string;
  regiao: string;
  epoca: string;
  estilo: string;
  quem: string;
  ligar?: string[];
  desligar?: string[];
  orcamento?: number;
  partilha: boolean;
  observacoes?: string;
};

const CASAIS: Casal[] = [
  { nome: "Inês Lourenço e Miguel Tavares", email: "ines.miguel", telefone: "912 345 001", emDias: 240, convidados: 120, distrito: "Lisboa", regiao: "lisboa", epoca: "alta", estilo: "classico", quem: "A noiva", partilha: true, observacoes: "Já temos a igreja marcada em Sintra; falta tudo o resto." },
  { nome: "Carolina e Rui", email: "carolina.rui", telefone: "912 345 002", emDias: 320, convidados: 80, distrito: "Porto", regiao: "porto", epoca: "media", estilo: "intimista", quem: "Os dois", desligar: ["dj", "planner"], ligar: ["banda"], partilha: true },
  { nome: "Mariana Fonseca e Tiago Alves", email: "mariana.tiago", telefone: "912 345 003", emDias: 150, convidados: 160, distrito: "Faro", regiao: "algarve", epoca: "alta", estilo: "sofisticado", quem: "A noiva", ligar: ["booth", "lembrancas"], orcamento: 60000, partilha: true, observacoes: "Casamento na praia, com jantar ao pôr do sol. Queremos propostas de quintas com vista mar." },
  { nome: "Sara e Pedro", email: "sara.pedro", telefone: "912 345 004", emDias: 400, convidados: 60, distrito: "Braga", regiao: "norte", epoca: "baixa", estilo: "intimista", quem: "O noivo", desligar: ["video", "somluz"], orcamento: 12000, partilha: false, observacoes: "Orçamento apertado. Só o essencial." },
  { nome: "Beatriz Cardoso e André Melo", email: "beatriz.andre", telefone: "912 345 005", emDias: 200, convidados: 100, distrito: "Coimbra", regiao: "centro", epoca: "alta", estilo: "classico", quem: "—", partilha: true },
  { nome: "Joana e Filipe", email: "joana.filipe", telefone: "912 345 006", emDias: 280, convidados: 140, distrito: "Setúbal", regiao: "lisboa", epoca: "alta", estilo: "classico", quem: "A noiva", ligar: ["criancas", "transporte"], partilha: true, observacoes: "Muitas crianças entre os convidados; precisamos de animação para elas." },
  { nome: "Catarina Pinto e Gonçalo Reis", email: "catarina.goncalo", telefone: "912 345 007", emDias: 500, convidados: 90, distrito: "Évora", regiao: "alentejo", epoca: "media", estilo: "classico", quem: "Os dois", partilha: false },
  { nome: "Leonor e Duarte", email: "leonor.duarte", telefone: "912 345 008", emDias: 180, convidados: 200, distrito: "Aveiro", regiao: "centro", epoca: "alta", estilo: "sofisticado", quem: "A noiva", ligar: ["banda", "booth"], orcamento: 50000, partilha: true },
  { nome: "Rita Gomes e Vasco Nunes", email: "rita.vasco", telefone: "912 345 009", emDias: 360, convidados: 70, distrito: "Madeira", regiao: "madeira", epoca: "baixa", estilo: "intimista", quem: "O noivo", desligar: ["dj"], ligar: ["luamel"], partilha: true, observacoes: "Somos emigrantes; o casamento é na Madeira e a lua de mel a seguir." },
  { nome: "Ana Sofia e Bruno", email: "anasofia.bruno", telefone: "912 345 010", emDias: 120, convidados: 110, distrito: "Leiria", regiao: "centro", epoca: "alta", estilo: "classico", quem: "A noiva", partilha: true, observacoes: "Data já muito próxima — precisamos de respostas rápidas." },
];

type Parceiro = {
  empresa: string;
  categoria: string;
  distrito: string;
  responsavel: string;
  email: string;
  telefone?: string;
};

const PARCEIROS: Parceiro[] = [
  { empresa: "Quinta do Ribeiro Claro", categoria: "Espaço / quinta", distrito: "braga", responsavel: "Helena Matos", email: "quinta.ribeiro", telefone: "253 100 001" },
  { empresa: "Sabor & Companhia Catering", categoria: "Catering e bebidas", distrito: "LISBOA", responsavel: "Miguel Antunes", email: "sabor.companhia", telefone: "21 100 0002" },
  { empresa: "Luz de Setembro Fotografia", categoria: "Fotografia", distrito: "Porto", responsavel: "Carla Pinto", email: "luz.setembro", telefone: "912 100 003" },
  { empresa: "Momento Filmes", categoria: "Vídeo", distrito: "Coimbra", responsavel: "Nuno Reis", email: "momento.filmes" },
  { empresa: "DJ Marco Silva", categoria: "Música / DJ / banda", distrito: "Setúbal", responsavel: "Marco Silva", email: "dj.marco", telefone: "913 100 005" },
  { empresa: "Flor de Sal Atelier", categoria: "Decoração e flores", distrito: "Margem Sul", responsavel: "Marta Silva", email: "flor.sal", telefone: "914 100 006" },
  { empresa: "Doce Encanto", categoria: "Bolos e doçaria", distrito: "Leiria", responsavel: "Paula Gomes", email: "doce.encanto" },
  { empresa: "Studio Noiva", categoria: "Beleza e cabelo", distrito: "Vila Nova de Gaia", responsavel: "Sara Melo", email: "studio.noiva", telefone: "915 100 008" },
  { empresa: "Clássicos & Estrada", categoria: "Transporte", distrito: "Évora", responsavel: "Hugo Dias", email: "classicos.estrada" },
  { empresa: "Casa das Alianças", categoria: "Outra", distrito: "Faro", responsavel: "Pedro Nogueira", email: "casa.aliancas", telefone: "289 100 010" },
];

/* ------------------------------------------------------------- estimativa */

const moeda = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const eur = (n: number) => moeda.format(Math.round(n));
const arred = (n: number, passo = 50) => Math.round(n / passo) * passo;

/**
 * A mesma conta que o simulador faz: rubricas ligadas, cobradas por valor
 * fixo ou por convidado, e os multiplicadores de mercado sobre as rubricas
 * que lhes são sensíveis. Usa a tabela em vigor no CRM, como o site.
 */
function estimar(c: Casal) {
  const { tabela } = tabelaAtual();
  const m =
    tabela.mult.regiao[c.regiao] * tabela.mult.epoca[c.epoca] * tabela.mult.estilo[c.estilo];

  const ligadas = new Set(RUBRICAS_BASE.filter((r) => r.on).map((r) => r.id));
  for (const id of c.ligar ?? []) ligadas.add(id);
  for (const id of c.desligar ?? []) ligadas.delete(id);

  let base = 0, min = 0, max = 0;
  const incluidas: string[] = [];
  const excluidas: string[] = [];
  for (const r of RUBRICAS_BASE) {
    const precos = tabela.rubricas.find((x) => x.id === r.id)!;
    const fator = (r.un === "convidado" ? c.convidados : 1) * (r.mercado ? m : 1);
    if (!ligadas.has(r.id)) {
      excluidas.push(r.nome);
      continue;
    }
    const valor = precos.base * fator;
    base += valor;
    min += precos.min * fator;
    max += precos.max * fator;
    incluidas.push(`${r.nome} (${eur(arred(valor, 10))})`);
  }

  const nomeDe = (dim: Dimensao, chave: string) =>
    MULT_BASE[dim].find((x) => x.chave === chave)?.nome ?? chave;

  return {
    estimativa: arred(base),
    intervalo: `${eur(arred(min))} a ${eur(arred(max))}`,
    regiao: nomeDe("regiao", c.regiao),
    epoca: nomeDe("epoca", c.epoca),
    estilo: nomeDe("estilo", c.estilo),
    incluidas,
    excluidas,
  };
}

/** As notas tal como o `paraCrm()` do site as escreve. */
function notasDe(c: Casal) {
  const e = estimar(c);
  return {
    estimativa: e.estimativa,
    notas: [
      c.quem !== "—" ? `Responde: ${c.quem}` : null,
      `Estimativa do simulador: ${eur(e.estimativa)} (${e.intervalo})`,
      `Região ${e.regiao} · época ${e.epoca} · estilo ${e.estilo}`,
      `Inclui (${e.incluidas.length} de ${RUBRICAS_BASE.length}): ${e.incluidas.join(" · ")}`,
      `Exclui: ${e.excluidas.join(" · ") || "nenhuma"}`,
      c.partilha
        ? "Autoriza partilha do pedido com fornecedores parceiros."
        : "NÃO autoriza partilha com fornecedores.",
      c.observacoes ? `Observações: ${c.observacoes}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

/* ------------------------------------------------------------- operações */

export function contarDemonstracao(): { clientes: number; fornecedores: number } {
  const db = getDb();
  const padrao = `%@${DOMINIO_DEMO}`;
  const c = db.prepare("SELECT COUNT(*) AS n FROM clientes WHERE email LIKE ?").get(padrao) as unknown as { n: number };
  const f = db.prepare("SELECT COUNT(*) AS n FROM fornecedores WHERE email LIKE ?").get(padrao) as unknown as { n: number };
  return { clientes: c.n, fornecedores: f.n };
}

/** Insere os dados; se já existirem, não duplica. Devolve quantos criou. */
export function inserirDemonstracao(): { clientes: number; fornecedores: number } {
  const existentes = contarDemonstracao();
  const criados = { clientes: 0, fornecedores: 0 };

  if (existentes.clientes === 0) {
    for (const c of CASAIS) {
      const { estimativa, notas } = notasDe(c);
      criarCliente({
        nome: c.nome,
        email: `${c.email}@${DOMINIO_DEMO}`,
        telefone: c.telefone,
        data_casamento: new Date(Date.now() + c.emDias * 86_400_000).toISOString().slice(0, 10),
        num_convidados: c.convidados,
        // O orçamento-alvo do casal, se o definiu; senão a estimativa — como no site.
        orcamento_cents: Math.round((c.orcamento ?? estimativa) * 100),
        distrito: c.distrito,
        origem: "Simulador",
        estado: "novo",
        notas,
      });
      criados.clientes += 1;
    }
  }

  if (existentes.fornecedores === 0) {
    for (const p of PARCEIROS) {
      registarPedidoDeParceria({
        empresa: p.empresa,
        categoria: p.categoria,
        distrito: p.distrito,
        responsavel: p.responsavel,
        email: `${p.email}@${DOMINIO_DEMO}`,
        telefone: p.telefone,
      });
      criados.fornecedores += 1;
    }
  }

  return criados;
}

/**
 * Remove os dados de demonstração. Os clientes levam consigo as
 * contratações e pagamentos que se tenham criado a praticar; um fornecedor
 * que entretanto tenha sido ligado a um cliente real fica desativado em vez
 * de apagado, para não perder esse histórico.
 */
export function removerDemonstracao(): { clientes: number; fornecedores: number; desativados: number } {
  const db = getDb();
  const padrao = `%@${DOMINIO_DEMO}`;

  const clientes = db.prepare("DELETE FROM clientes WHERE email LIKE ?").run(padrao);

  const fornecedores = db
    .prepare("SELECT id FROM fornecedores WHERE email LIKE ?")
    .all(padrao) as unknown as { id: number }[];
  let apagados = 0, desativados = 0;
  for (const f of fornecedores) {
    if (eliminarFornecedor(f.id)) apagados += 1;
    else desativados += 1;
  }

  return { clientes: Number(clientes.changes), fornecedores: apagados, desativados };
}
