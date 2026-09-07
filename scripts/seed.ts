/**
 * Popula a base de dados com dados de demonstração.
 *   npm run seed          → só insere se a base estiver vazia
 *   npm run seed -- --forcar → apaga tudo e volta a inserir
 *
 * Corre em Node diretamente (type stripping), por isso importa `db.ts` por
 * caminho relativo — esse módulo só depende de builtins do Node.
 */
import { openStandaloneDb } from "../src/lib/db.ts";

const db = openStandaloneDb();
const forcar = process.argv.includes("--forcar");

const { total } = db.prepare("SELECT COUNT(*) AS total FROM clientes").get() as {
  total: number;
};

if (total > 0 && !forcar) {
  console.log(
    `A base já tem ${total} clientes — nada a fazer. Use "npm run seed -- --forcar" para recomeçar.`,
  );
  process.exit(0);
}

if (forcar) {
  for (const t of ["pagamentos", "contratacoes", "atividades", "clientes", "fornecedores"]) {
    db.exec(`DELETE FROM ${t}`);
  }
  db.exec("DELETE FROM sqlite_sequence");
}

const agora = new Date().toISOString();
const dia = 86_400_000;
const emDias = (d: number) => new Date(Date.now() + d * dia).toISOString().slice(0, 10);
const eur = (v: number) => Math.round(v * 100);

/* ---------------------------------------------------------------- fornecedores */

const fornecedores: [string, string, string, string, string, string, number, number, number][] = [
  ["Quinta da Bela Vista", "Espaço / Quinta", "Helena Matos", "reservas@belavista.pt", "912 340 001", "Lisboa", 6000, 14000, 10],
  ["Solar dos Arcos", "Espaço / Quinta", "Tiago Nunes", "geral@solardosarcos.pt", "912 340 002", "Porto", 5500, 12000, 8],
  ["Herdade do Sobreiro", "Espaço / Quinta", "Rita Bastos", "eventos@sobreiro.pt", "912 340 003", "Évora", 4500, 11000, 9],
  ["Sabores & Companhia", "Catering", "Miguel Antunes", "info@saborescia.pt", "912 340 010", "Lisboa", 3500, 9000, 12],
  ["Mesa Real Catering", "Catering", "Sofia Cruz", "geral@mesareal.pt", "912 340 011", "Porto", 3000, 8500, 10],
  ["Luz & Instante", "Fotografia", "André Lopes", "ola@luzeinstante.pt", "912 340 020", "Lisboa", 1200, 3200, 15],
  ["Retrato Nosso", "Fotografia", "Carla Pinto", "geral@retratonosso.pt", "912 340 021", "Braga", 900, 2600, 15],
  ["Momento Filmes", "Vídeo", "Nuno Reis", "producao@momentofilmes.pt", "912 340 030", "Lisboa", 1400, 3800, 12],
  ["DJ Ricardo Sousa", "Música & DJ", "Ricardo Sousa", "bookings@djricardo.pt", "912 340 040", "Setúbal", 600, 1600, 20],
  ["Quarteto Aurora", "Música & DJ", "Inês Vaz", "aurora@musica.pt", "912 340 041", "Coimbra", 700, 1800, 18],
  ["Flor de Sal Decoração", "Flores & Decoração", "Marta Silva", "atelier@flordesal.pt", "912 340 050", "Lisboa", 800, 4500, 15],
  ["Verde Casa Flores", "Flores & Decoração", "Joana Rocha", "geral@verdecasa.pt", "912 340 051", "Porto", 700, 3800, 14],
  ["Doce Encanto", "Bolo & Doçaria", "Paula Gomes", "encomendas@doceencanto.pt", "912 340 060", "Leiria", 250, 900, 20],
  ["Papel & Tinta", "Convites & Papelaria", "Bruno Faria", "ola@papeltinta.pt", "912 340 070", "Aveiro", 200, 1200, 20],
  ["Studio Noiva", "Beleza & Estética", "Sara Melo", "marcacoes@studionoiva.pt", "912 340 080", "Lisboa", 300, 1100, 25],
  ["Atelier Branco", "Vestuário", "Luísa Campos", "atelier@branco.pt", "912 340 090", "Porto", 900, 3500, 10],
  ["Ourivesaria Aliança", "Alianças", "Pedro Nogueira", "loja@alianca.pt", "912 340 100", "Braga", 600, 2500, 12],
  ["Clássicos & Estrada", "Transporte", "Hugo Dias", "reservas@classicos.pt", "912 340 110", "Lisboa", 350, 1200, 18],
];

const inserirFornecedor = db.prepare(
  `INSERT INTO fornecedores
     (nome, categoria, contacto, email, telefone, distrito,
      preco_min_cents, preco_max_cents, comissao_pct, ativo, criado_em, atualizado_em)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
);

const idFornecedor = new Map<string, number>();
for (const [nome, cat, contacto, email, tel, distrito, min, max, com] of fornecedores) {
  const r = inserirFornecedor.run(
    nome, cat, contacto, email, tel, distrito, eur(min), eur(max), com, agora, agora,
  );
  idFornecedor.set(nome, Number(r.lastInsertRowid));
}

/* -------------------------------------------------------------------- clientes */

type SemenoCliente = {
  nome: string;
  parceiro: string;
  email: string;
  telefone: string;
  dias: number | null;
  convidados: number | null;
  orcamento: number | null;
  distrito: string;
  local: string;
  origem: string;
  estado: string;
  responsavel: string;
  notas?: string;
};

const clientes: SemenoCliente[] = [
  { nome: "Ana Ferreira", parceiro: "Rui Ferreira", email: "ana.ferreira@email.pt", telefone: "961 111 001", dias: 95, convidados: 120, orcamento: 28000, distrito: "Lisboa", local: "Quinta da Bela Vista", origem: "Simulador", estado: "ganho", responsavel: "Bernardo", notas: "Cerimónia religiosa às 16h. Querem fogo de artifício no final." },
  { nome: "Beatriz Costa", parceiro: "Tomás Lima", email: "beatriz.costa@email.pt", telefone: "961 111 002", dias: 160, convidados: 90, orcamento: 21000, distrito: "Porto", local: "Solar dos Arcos", origem: "Instagram", estado: "ganho", responsavel: "Bernardo" },
  { nome: "Carolina Mendes", parceiro: "Diogo Ramos", email: "carolina.mendes@email.pt", telefone: "961 111 003", dias: 45, convidados: 150, orcamento: 35000, distrito: "Évora", local: "Herdade do Sobreiro", origem: "Recomendação", estado: "ganho", responsavel: "Marta" },
  { nome: "Daniela Cardoso", parceiro: "Vasco Neves", email: "daniela.cardoso@email.pt", telefone: "961 111 004", dias: 240, convidados: 80, orcamento: 18000, distrito: "Lisboa", local: "", origem: "Website", estado: "proposta", responsavel: "Marta", notas: "Aguardam proposta final do catering." },
  { nome: "Eva Marques", parceiro: "João Pires", email: "eva.marques@email.pt", telefone: "961 111 005", dias: 310, convidados: 200, orcamento: 45000, distrito: "Braga", local: "", origem: "Feira", estado: "qualificado", responsavel: "Bernardo" },
  { nome: "Filipa Moreira", parceiro: "André Santos", email: "filipa.moreira@email.pt", telefone: "961 111 006", dias: 120, convidados: 60, orcamento: 14000, distrito: "Coimbra", local: "", origem: "Simulador", estado: "contactado", responsavel: "Marta" },
  { nome: "Gabriela Sousa", parceiro: "Nelson Braga", email: "gabriela.sousa@email.pt", telefone: "961 111 007", dias: null, convidados: null, orcamento: 12000, distrito: "Setúbal", local: "", origem: "Google", estado: "novo", responsavel: "" },
  { nome: "Helena Barros", parceiro: "Paulo Vieira", email: "helena.barros@email.pt", telefone: "961 111 008", dias: 400, convidados: 110, orcamento: 26000, distrito: "Faro", local: "", origem: "Instagram", estado: "novo", responsavel: "" },
  { nome: "Inês Carvalho", parceiro: "Bruno Melo", email: "ines.carvalho@email.pt", telefone: "961 111 009", dias: -60, convidados: 100, orcamento: 23000, distrito: "Lisboa", local: "Quinta da Bela Vista", origem: "Recomendação", estado: "ganho", responsavel: "Bernardo", notas: "Casamento realizado. Faltava liquidar o vídeo." },
  { nome: "Joana Teixeira", parceiro: "Hugo Fonseca", email: "joana.teixeira@email.pt", telefone: "961 111 010", dias: 200, convidados: 70, orcamento: 16000, distrito: "Aveiro", local: "", origem: "Website", estado: "perdido", responsavel: "Marta", notas: "Escolheram outra wedding planner." },
];

const inserirCliente = db.prepare(
  `INSERT INTO clientes
     (nome, parceiro, email, telefone, data_casamento, num_convidados, orcamento_cents,
      distrito, local_evento, origem, estado, responsavel, notas, criado_em, atualizado_em)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);
const inserirAtividade = db.prepare(
  "INSERT INTO atividades (cliente_id, tipo, descricao, criado_em) VALUES (?, ?, ?, ?)",
);

const idCliente = new Map<string, number>();
for (const c of clientes) {
  const r = inserirCliente.run(
    c.nome, c.parceiro, c.email, c.telefone,
    c.dias === null ? null : emDias(c.dias),
    c.convidados, c.orcamento === null ? null : eur(c.orcamento),
    c.distrito, c.local || null, c.origem, c.estado, c.responsavel || null,
    c.notas ?? null, agora, agora,
  );
  const id = Number(r.lastInsertRowid);
  idCliente.set(c.nome, id);
  inserirAtividade.run(id, "sistema", `Lead recebido via ${c.origem}.`, agora);
  if (c.estado !== "novo") {
    inserirAtividade.run(id, "chamada", "Primeiro contacto telefónico. Recolhidos requisitos.", agora);
  }
}

/* ---------------------------------------------------------------- contratações */

type SemenoContratacao = {
  cliente: string;
  fornecedor: string;
  descricao: string;
  valor: number;
  estado: string;
  servicoDias: number | null;
  /** Percentagens já pagas; o resto fica pendente. */
  pagos: number[];
  /** Percentagens pendentes e há quantos dias vencem (negativo = atrasado). */
  pendentes: [number, number][];
};

const contratacoes: SemenoContratacao[] = [
  { cliente: "Ana Ferreira", fornecedor: "Quinta da Bela Vista", descricao: "Espaço + jantar 120 pax", valor: 12500, estado: "confirmada", servicoDias: 95, pagos: [30], pendentes: [[40, 20], [30, 90]] },
  { cliente: "Ana Ferreira", fornecedor: "Luz & Instante", descricao: "Reportagem completa", valor: 2400, estado: "confirmada", servicoDias: 95, pagos: [50], pendentes: [[50, 95]] },
  { cliente: "Ana Ferreira", fornecedor: "Flor de Sal Decoração", descricao: "Decoração floral", valor: 3100, estado: "confirmada", servicoDias: 95, pagos: [], pendentes: [[30, -8], [70, 90]] },
  { cliente: "Ana Ferreira", fornecedor: "DJ Ricardo Sousa", descricao: "Som e animação", valor: 1200, estado: "proposta", servicoDias: 95, pagos: [], pendentes: [] },

  { cliente: "Beatriz Costa", fornecedor: "Solar dos Arcos", descricao: "Espaço + jantar 90 pax", valor: 9800, estado: "confirmada", servicoDias: 160, pagos: [25], pendentes: [[35, 45], [40, 155]] },
  { cliente: "Beatriz Costa", fornecedor: "Retrato Nosso", descricao: "Fotografia + álbum", valor: 1900, estado: "confirmada", servicoDias: 160, pagos: [40], pendentes: [[60, 155]] },
  { cliente: "Beatriz Costa", fornecedor: "Doce Encanto", descricao: "Bolo de 3 andares", valor: 620, estado: "confirmada", servicoDias: 160, pagos: [], pendentes: [[100, 150]] },

  { cliente: "Carolina Mendes", fornecedor: "Herdade do Sobreiro", descricao: "Espaço + catering 150 pax", valor: 16800, estado: "confirmada", servicoDias: 45, pagos: [30, 40], pendentes: [[30, 40]] },
  { cliente: "Carolina Mendes", fornecedor: "Momento Filmes", descricao: "Vídeo cinematográfico", valor: 2800, estado: "confirmada", servicoDias: 45, pagos: [50], pendentes: [[50, -3]] },
  { cliente: "Carolina Mendes", fornecedor: "Quarteto Aurora", descricao: "Cerimónia + cocktail", valor: 1450, estado: "confirmada", servicoDias: 45, pagos: [100], pendentes: [] },
  { cliente: "Carolina Mendes", fornecedor: "Clássicos & Estrada", descricao: "Carro clássico", valor: 780, estado: "confirmada", servicoDias: 45, pagos: [], pendentes: [[100, 40]] },

  { cliente: "Daniela Cardoso", fornecedor: "Sabores & Companhia", descricao: "Proposta menu 80 pax", valor: 6400, estado: "proposta", servicoDias: 240, pagos: [], pendentes: [] },
  { cliente: "Daniela Cardoso", fornecedor: "Studio Noiva", descricao: "Maquilhagem e cabelo", valor: 520, estado: "proposta", servicoDias: 240, pagos: [], pendentes: [] },

  { cliente: "Eva Marques", fornecedor: "Verde Casa Flores", descricao: "Orçamento decoração", valor: 3900, estado: "proposta", servicoDias: 310, pagos: [], pendentes: [] },

  { cliente: "Inês Carvalho", fornecedor: "Quinta da Bela Vista", descricao: "Espaço + jantar 100 pax", valor: 10400, estado: "concluida", servicoDias: -60, pagos: [100], pendentes: [] },
  { cliente: "Inês Carvalho", fornecedor: "Momento Filmes", descricao: "Vídeo completo", valor: 2600, estado: "concluida", servicoDias: -60, pagos: [60], pendentes: [[40, -25]] },
  { cliente: "Inês Carvalho", fornecedor: "Papel & Tinta", descricao: "Convites e menus", valor: 640, estado: "concluida", servicoDias: -90, pagos: [100], pendentes: [] },
];

const inserirContratacao = db.prepare(
  `INSERT INTO contratacoes
     (cliente_id, fornecedor_id, categoria, descricao, valor_cents, comissao_pct,
      estado, data_servico, criado_em, atualizado_em)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);
// Um pagamento já pago fica a dever a comissão à percentagem da contratação
// (é o que o CRM faz ao marcar como pago); os pendentes não devem nada.
const inserirPagamento = db.prepare(
  `INSERT INTO pagamentos
     (contratacao_id, descricao, valor_cents, data_prevista, data_pagamento,
      metodo, estado, comissao_cents, criado_em, atualizado_em)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);
const comissaoDe = new Map(
  fornecedores.map(([nome, , , , , , , , com]) => [nome, com]),
);
const categoriaDe = new Map(fornecedores.map(([nome, cat]) => [nome, cat]));

let numPagamentos = 0;
for (const c of contratacoes) {
  const clienteId = idCliente.get(c.cliente)!;
  const fornecedorId = idFornecedor.get(c.fornecedor)!;
  const valorCents = eur(c.valor);

  const r = inserirContratacao.run(
    clienteId,
    fornecedorId,
    categoriaDe.get(c.fornecedor)!,
    c.descricao,
    valorCents,
    comissaoDe.get(c.fornecedor)!,
    c.estado,
    c.servicoDias === null ? null : emDias(c.servicoDias),
    agora,
    agora,
  );
  const contratacaoId = Number(r.lastInsertRowid);

  const parcelas = c.pagos.length + c.pendentes.length;
  let indice = 0;
  const nome = () => {
    indice += 1;
    if (parcelas === 1) return "Pagamento único";
    if (indice === 1) return "Sinal";
    return indice === parcelas ? "Liquidação" : `${indice}.ª prestação`;
  };

  const comissaoPct = comissaoDe.get(c.fornecedor)!;
  for (const pct of c.pagos) {
    const valor = Math.round((valorCents * pct) / 100);
    inserirPagamento.run(
      contratacaoId, nome(), valor,
      emDias(-45), emDias(-44), "Transferência", "pago",
      Math.round((valor * comissaoPct) / 100), agora, agora,
    );
    numPagamentos += 1;
  }
  for (const [pct, dias] of c.pendentes) {
    inserirPagamento.run(
      contratacaoId, nome(), Math.round((valorCents * pct) / 100),
      emDias(dias), null, null, "pendente", 0, agora, agora,
    );
    numPagamentos += 1;
  }
}

console.log(
  `Dados de demonstração criados: ${clientes.length} clientes, ${fornecedores.length} fornecedores, ${contratacoes.length} contratações, ${numPagamentos} pagamentos.`,
);
