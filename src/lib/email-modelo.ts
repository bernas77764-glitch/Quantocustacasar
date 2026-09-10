/**
 * A parte do email que não toca na base de dados: serviços de envio, os
 * modelos com que o CRM nasce e o preenchimento dos campos entre chavetas.
 * Corre também no browser, para a pré-visualização nas definições.
 */

export const SERVICOS_EMAIL = ["smtp", "resend", "brevo"] as const;
export type ServicoEmail = (typeof SERVICOS_EMAIL)[number];

export const ROTULO_SERVICO: Record<ServicoEmail, string> = {
  smtp: "A minha caixa de correio (SMTP)",
  resend: "Resend",
  brevo: "Brevo",
};

export type ModeloEmail = { assunto: string; corpo: string };

/** Campo pedido no momento do envio (não vem das fichas). */
export type CampoAoEnviar = {
  campo: string;
  rotulo: string;
  tipo: "texto" | "textarea" | "data" | "valor";
  dica?: string;
};

export type DefinicaoModelo = {
  chave: string;
  grupo: "cliente" | "fornecedor";
  rotulo: string;
  descricao: string;
  /** Disparado pelo site, sem intervenção. */
  automatico: boolean;
  /** Quem recebe: o casal ou o fornecedor. */
  destinatario: "cliente" | "fornecedor";
  /** O que a ficha precisa de ter para preencher o email. */
  precisa: ("cliente" | "fornecedor" | "contratacao")[];
  campos_ao_enviar: CampoAoEnviar[];
  /** Permite juntar um ficheiro (PDF, imagem) ao enviar. */
  anexo: boolean;
  modelo: ModeloEmail;
};

const ASSINATURA = `Cumprimentos,
{remetente}
Quanto Custa Casar`;

export const MODELOS: DefinicaoModelo[] = [
  {
    chave: "cliente_simulacao",
    grupo: "cliente",
    rotulo: "Agradecimento pela simulação",
    descricao: "Enviado automaticamente ao casal quando submete a simulação no site.",
    automatico: true,
    destinatario: "cliente",
    precisa: ["cliente"],
    campos_ao_enviar: [],
    anexo: false,
    modelo: {
      assunto: "A vossa simulação no Quanto Custa Casar",
      corpo: `Olá {nome},

Obrigado por simularem o vosso casamento no Quanto Custa Casar.

Segue o que nos deixaram: casamento a {data}, {convidados} convidados, {distrito}, orçamento à volta de {orcamento}.

Nos próximos dias entro em contacto para perceber o que já têm tratado e o que falta.

Se preferirem, respondam a este email com o melhor dia e hora para falarmos.

${ASSINATURA}`,
    },
  },
  {
    chave: "cliente_contacto",
    grupo: "cliente",
    rotulo: "Depois do primeiro telefonema",
    descricao: "Agradece o voto de confiança e, se já houver, adianta serviços a propor.",
    automatico: false,
    destinatario: "cliente",
    precisa: ["cliente"],
    campos_ao_enviar: [
      { campo: "servicos", rotulo: "Serviços a propor (opcional)", tipo: "textarea", dica: "Uma linha por serviço. Deixe vazio para não incluir." },
    ],
    anexo: false,
    modelo: {
      assunto: "Obrigado pela conversa",
      corpo: `Olá {nome},

Obrigado pela conversa de hoje e pelo voto de confiança.

Conforme combinado, vou falar com os fornecedores da vossa zona para a data de {data}.

{servicos}

Assim que tiver as respostas, faço um ponto de situação convosco.

Qualquer dúvida entretanto, é só responder a este email ou ligar.

Abraço,
{remetente}
Quanto Custa Casar`,
    },
  },
  {
    chave: "cliente_proposta",
    grupo: "cliente",
    rotulo: "Proposta de orçamentos",
    descricao: "Lista as contratações em proposta ou confirmadas do casal, com valores e total.",
    automatico: false,
    destinatario: "cliente",
    precisa: ["cliente"],
    campos_ao_enviar: [{ campo: "validade", rotulo: "Validade dos valores (dias)", tipo: "texto", dica: "Ex.: 15" }],
    anexo: true,
    modelo: {
      assunto: "Propostas para o vosso casamento a {data}",
      corpo: `Olá {nome},

Segue a proposta para o vosso casamento a {data}, com {convidados} convidados.

{propostas}

Total estimado: {total}

Os valores foram confirmados com cada fornecedor para a vossa data e mantêm-se durante {validade} dias.

Para avançar, digam-me quais querem fechar. Eu trato das visitas e da marcação dos sinais com cada um.

Para vocês não há custo. O nosso serviço é pago pelos fornecedores.

Aguardo notícias.

${ASSINATURA}`,
    },
  },
  {
    chave: "fornecedor_candidatura",
    grupo: "fornecedor",
    rotulo: "Agradecimento pela candidatura",
    descricao: "Enviado automaticamente ao fornecedor quando submete a candidatura no site.",
    automatico: true,
    destinatario: "fornecedor",
    precisa: ["fornecedor"],
    campos_ao_enviar: [],
    anexo: false,
    modelo: {
      assunto: "Recebemos a vossa candidatura",
      corpo: `Olá {contacto},

Obrigado pelo interesse em trabalhar com o Quanto Custa Casar.

Recebemos a candidatura de {fornecedor} ({categoria}, {distrito}).

Nos próximos dias a nossa equipa entra em contacto para conhecer o vosso trabalho e explicar as condições de parceria.

Se quiserem adiantar, respondam a este email com o site ou o Instagram e a faixa de preços que praticam.

Cumprimentos,
Equipa Quanto Custa Casar`,
    },
  },
  {
    chave: "fornecedor_parceria",
    grupo: "fornecedor",
    rotulo: "Apresentação e condições de parceria",
    descricao: "Primeiro contacto com um fornecedor, com o modelo de comissão.",
    automatico: false,
    destinatario: "fornecedor",
    precisa: ["fornecedor"],
    campos_ao_enviar: [],
    anexo: true,
    modelo: {
      assunto: "Parceria Quanto Custa Casar",
      corpo: `Bom dia {contacto},

Sou o {remetente}, do Quanto Custa Casar.

Temos um simulador online onde os casais calculam o custo do casamento e nos deixam a data, o número de convidados, o distrito e o orçamento.

Venho por este meio propor uma parceria com a {fornecedor}.

Funciona assim:

1. Enviamos-lhe os casais que procuram {categoria} na vossa zona, já com data, convidados e orçamento.
2. Confirmam a disponibilidade e tratam da visita e da proposta diretamente com o casal.
3. Quando o casal paga o sinal, faturamos {comissao} do valor do contrato. Sem sinal, não há custo.

Não há mensalidade nem exclusividade.

Posso ligar-lhe esta semana para explicar em detalhe?

Aguardo confirmação.

${ASSINATURA}`,
    },
  },
  {
    chave: "fornecedor_disponibilidade",
    grupo: "fornecedor",
    rotulo: "Pedido de disponibilidade e cotação",
    descricao: "Data, convidados, distrito e local do casamento, com notas específicas.",
    automatico: false,
    destinatario: "fornecedor",
    precisa: ["contratacao"],
    campos_ao_enviar: [{ campo: "notas", rotulo: "Notas específicas para este pedido", tipo: "textarea", dica: "Horário, número de pessoas ao jantar, pedidos especiais…" }],
    anexo: false,
    modelo: {
      assunto: "Pedido de disponibilidade · {data} · {casal}",
      corpo: `Olá {contacto},

Segue um pedido de disponibilidade e cotação para um casamento.

Casal: {casal}
Data: {data}
Convidados: {convidados}
Distrito: {distrito}
Local: {local}
Notas: {notas}

Conseguem confirmar a disponibilidade para esta data e enviar-me a vossa proposta de valores?

Aguardo confirmação.

${ASSINATURA}`,
    },
  },
  {
    chave: "fornecedor_ponto_situacao",
    grupo: "fornecedor",
    rotulo: "Ponto de situação",
    descricao: "Pergunta ao fornecedor se já falou com o casal, para acompanhar a comissão.",
    automatico: false,
    destinatario: "fornecedor",
    precisa: ["contratacao"],
    campos_ao_enviar: [],
    anexo: false,
    modelo: {
      assunto: "Ponto de situação · {casal}",
      corpo: `Olá {contacto},

Faço um ponto de situação sobre o casal {casal}, casamento a {data}, que vos enviámos a {data_envio}.

Já falaram com eles? Houve visita ou proposta?

Se já fecharam, digam-me o valor e a data do sinal, para atualizarmos o processo do nosso lado.

Se não avançou, também interessa saber, para não vos ocupar com mais contactos deste casal.

Aguardo notícias.

${ASSINATURA}`,
    },
  },
  {
    chave: "fornecedor_fatura",
    grupo: "fornecedor",
    rotulo: "Envio da fatura",
    descricao: "Fatura da comissão sobre o contrato com o casal, com o PDF em anexo.",
    automatico: false,
    destinatario: "fornecedor",
    precisa: ["contratacao"],
    campos_ao_enviar: [
      { campo: "numero_fatura", rotulo: "N.º da fatura", tipo: "texto" },
      { campo: "valor_fatura", rotulo: "Valor da fatura", tipo: "valor" },
      { campo: "vencimento", rotulo: "Vencimento", tipo: "data" },
    ],
    anexo: true,
    modelo: {
      assunto: "Fatura {numero_fatura} · {casal}",
      corpo: `Olá {contacto},

Segue em anexo a fatura {numero_fatura}, referente à comissão de {comissao} sobre o contrato com o casal {casal}, casamento a {data}.

Valor: {valor_fatura}
Vencimento: {vencimento}
IBAN: {iban}

Conforme combinado, a comissão é devida com o sinal pago pelo casal.

Obrigado pela parceria.

${ASSINATURA}`,
    },
  },
];

export type ChaveModelo = (typeof MODELOS)[number]["chave"];

export function definicaoModelo(chave: string): DefinicaoModelo | null {
  return MODELOS.find((m) => m.chave === chave) ?? null;
}

/** Todos os campos que se podem usar nos modelos, com a explicação para as definições. */
export const CAMPOS_MODELO: { campo: string; descricao: string }[] = [
  { campo: "{nome}", descricao: "Nome de quem preencheu a simulação" },
  { campo: "{casal}", descricao: "Os dois nomes do casal" },
  { campo: "{data}", descricao: "Data do casamento (ou do serviço, numa contratação)" },
  { campo: "{convidados}", descricao: "Número de convidados" },
  { campo: "{distrito}", descricao: "Distrito" },
  { campo: "{local}", descricao: "Local do evento" },
  { campo: "{orcamento}", descricao: "Orçamento indicado na simulação" },
  { campo: "{fornecedor}", descricao: "Nome do fornecedor" },
  { campo: "{contacto}", descricao: "Pessoa de contacto no fornecedor (ou o nome do fornecedor)" },
  { campo: "{categoria}", descricao: "Categoria do serviço" },
  { campo: "{comissao}", descricao: "Percentagem de comissão (da contratação ou do fornecedor)" },
  { campo: "{valor}", descricao: "Valor da contratação" },
  { campo: "{descricao}", descricao: "Descrição da contratação" },
  { campo: "{propostas}", descricao: "Lista das contratações do casal em proposta/confirmadas, uma por linha" },
  { campo: "{total}", descricao: "Soma dos valores das propostas" },
  { campo: "{data_envio}", descricao: "Data em que o pedido de disponibilidade foi enviado" },
  { campo: "{iban}", descricao: "IBAN definido nas definições de email" },
  { campo: "{remetente}", descricao: "O seu nome" },
  { campo: "{notas}", descricao: "Notas escritas ao enviar" },
  { campo: "{servicos}", descricao: "Serviços a propor, escritos ao enviar" },
  { campo: "{validade}", descricao: "Validade dos valores, escrita ao enviar" },
  { campo: "{numero_fatura}", descricao: "N.º da fatura, escrito ao enviar" },
  { campo: "{valor_fatura}", descricao: "Valor da fatura, escrito ao enviar" },
  { campo: "{vencimento}", descricao: "Vencimento da fatura, escrito ao enviar" },
];

export type CamposModelo = Record<string, string>;

/** Substitui os campos entre chavetas; os desconhecidos ficam como estão. */
export function preencherModelo(texto: string, campos: CamposModelo): string {
  return texto.replace(/\{([a-z_]+)\}/g, (original, nome: string) =>
    Object.prototype.hasOwnProperty.call(campos, nome) ? campos[nome] : original,
  );
}

/** Campos de exemplo para a pré-visualização nas definições. */
export const CAMPOS_EXEMPLO: CamposModelo = {
  nome: "Ana",
  casal: "Ana Ferreira & Rui Ferreira",
  data: "12/06/2027",
  convidados: "120",
  distrito: "Lisboa",
  local: "Sintra",
  orcamento: "25 000 €",
  fornecedor: "Quinta da Bela Vista",
  contacto: "Maria",
  categoria: "Espaço / Quinta",
  comissao: "5%",
  valor: "9 500,00 €",
  descricao: "Espaço e jantar",
  propostas: "- Espaço / Quinta: Quinta da Bela Vista, 9 500,00 €\n- Fotografia: Luz & Sombra, 1 800,00 €",
  total: "11 300,00 €",
  data_envio: "02/09/2026",
  iban: "PT50 0000 0000 0000 0000 0000 0",
  remetente: "Bernardo Soares",
  notas: "Jantar para 110 pessoas, cerimónia civil no local.",
  servicos: "Segue desde já o que tenho para vos propor:\n- Quinta da Bela Vista (Espaço / Quinta): disponível, 9 500 €",
  validade: "15",
  numero_fatura: "FT 2026/12",
  valor_fatura: "475,00 €",
  vencimento: "30/09/2026",
};
