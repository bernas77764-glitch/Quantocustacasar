/**
 * A parte do email que não toca na base de dados: serviços, modelos e o
 * preenchimento dos campos entre chavetas. Corre também no browser, para a
 * pré-visualização nas definições.
 */

export const SERVICOS_EMAIL = ["resend", "brevo"] as const;
export type ServicoEmail = (typeof SERVICOS_EMAIL)[number];

export const ROTULO_SERVICO: Record<ServicoEmail, string> = {
  resend: "Resend",
  brevo: "Brevo",
};

export type ModeloEmail = { assunto: string; corpo: string };

export const MODELO_DISPONIBILIDADE_BASE: ModeloEmail = {
  assunto: "Pedido de disponibilidade · {data} · {casal}",
  corpo: `Olá {contacto},

Segue um pedido de disponibilidade para um casamento.

Casal: {casal}
Data: {data}
Convidados: {convidados}
Local: {local}
Valor previsto: {valor}

Conseguem confirmar a disponibilidade para esta data?

Aguardo confirmação.

Cumprimentos,
{remetente}
Quanto Custa Casar`,
};

/** Campos que se podem usar nos modelos, com a explicação para a página de definições. */
export const CAMPOS_MODELO: { campo: string; descricao: string }[] = [
  { campo: "{contacto}", descricao: "Nome da pessoa de contacto do fornecedor (ou o nome do fornecedor)" },
  { campo: "{fornecedor}", descricao: "Nome do fornecedor" },
  { campo: "{casal}", descricao: "Nomes do casal" },
  { campo: "{data}", descricao: "Data do casamento" },
  { campo: "{convidados}", descricao: "Número de convidados" },
  { campo: "{local}", descricao: "Local do evento" },
  { campo: "{distrito}", descricao: "Distrito" },
  { campo: "{valor}", descricao: "Valor da contratação" },
  { campo: "{categoria}", descricao: "Categoria do serviço" },
  { campo: "{descricao}", descricao: "Descrição da contratação" },
  { campo: "{remetente}", descricao: "O seu nome" },
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
  contacto: "Maria",
  fornecedor: "Quinta da Bela Vista",
  casal: "Ana Ferreira & Rui Ferreira",
  data: "12/06/2027",
  convidados: "120",
  local: "Sintra",
  distrito: "Lisboa",
  valor: "9 500,00 €",
  categoria: "Espaço / Quinta",
  descricao: "Espaço e jantar",
  remetente: "Bernardo",
};

