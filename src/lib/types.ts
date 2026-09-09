import type {
  EstadoCliente,
  EstadoContratacao,
  EstadoPagamento,
} from "./constants";

export type Cliente = {
  id: number;
  nome: string;
  parceiro: string | null;
  email: string | null;
  telefone: string | null;
  data_casamento: string | null;
  num_convidados: number | null;
  orcamento_cents: number | null;
  distrito: string | null;
  local_evento: string | null;
  origem: string | null;
  estado: EstadoCliente;
  responsavel: string | null;
  notas: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type Fornecedor = {
  id: number;
  nome: string;
  categoria: string;
  contacto: string | null;
  email: string | null;
  telefone: string | null;
  website: string | null;
  distrito: string | null;
  preco_min_cents: number | null;
  preco_max_cents: number | null;
  comissao_pct: number;
  ativo: number;
  notas: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type Contratacao = {
  id: number;
  cliente_id: number;
  fornecedor_id: number;
  categoria: string;
  descricao: string | null;
  valor_cents: number;
  comissao_pct: number;
  estado: EstadoContratacao;
  data_servico: string | null;
  notas: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type Pagamento = {
  id: number;
  contratacao_id: number;
  descricao: string | null;
  valor_cents: number;
  data_prevista: string | null;
  data_pagamento: string | null;
  metodo: string | null;
  estado: EstadoPagamento;
  referencia: string | null;
  notas: string | null;
  /** Comissão que o fornecedor fica a dever quando este pagamento é pago. */
  comissao_cents: number;
  /** Data em que o fornecedor pagou a comissão; `null` = a receber. */
  comissao_recebida_em: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type Atividade = {
  id: number;
  cliente_id: number;
  tipo: string;
  descricao: string;
  criado_em: string;
};

/** Totais financeiros derivados dos pagamentos de uma contratação. */
export type Saldo = {
  contratado_cents: number;
  pago_cents: number;
  pendente_cents: number;
  atrasado_cents: number;
  /** Parte do valor contratado ainda sem pagamento agendado. */
  por_agendar_cents: number;
};

export type ContratacaoDetalhada = Contratacao &
  Saldo & {
    cliente_nome: string;
    fornecedor_nome: string;
    fornecedor_categoria: string;
  };

export type PagamentoDetalhado = Pagamento & {
  cliente_id: number;
  cliente_nome: string;
  fornecedor_id: number;
  fornecedor_nome: string;
  categoria: string;
  /** Percentagem de comissão da contratação, para referência. */
  comissao_pct: number;
  /** `pendente` cuja data prevista já passou. */
  atrasado: boolean;
  /** O casal já pagou, o fornecedor ainda não pagou a comissão. */
  comissao_a_receber: boolean;
};

/** Comissões agregadas por fornecedor. */
export type ComissoesDoFornecedor = {
  fornecedor_id: number;
  fornecedor_nome: string;
  a_receber_cents: number;
  recebida_cents: number;
  num_a_receber: number;
};

/** Reunião, visita ou outro compromisso marcado à mão no calendário. */
export type Compromisso = {
  id: number;
  titulo: string;
  /** YYYY-MM-DD, em hora de Lisboa. */
  data: string;
  /** HH:MM; nulo para compromissos de dia inteiro. */
  hora_inicio: string | null;
  hora_fim: string | null;
  local: string | null;
  cliente_id: number | null;
  fornecedor_id: number | null;
  notas: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type CompromissoDetalhado = Compromisso & {
  cliente_nome: string | null;
  fornecedor_nome: string | null;
};

export type TipoEvento = "casamento" | "servico" | "vencimento" | "compromisso" | "google";

/** Uma entrada do calendário, seja qual for a origem. */
export type EventoCalendario = {
  chave: string;
  tipo: TipoEvento;
  titulo: string;
  /** Dia em que aparece (YYYY-MM-DD, hora de Lisboa). */
  data: string;
  /** Último dia, inclusive, para eventos de vários dias. */
  data_fim: string | null;
  hora: string | null;
  hora_fim: string | null;
  detalhe: string | null;
  local: string | null;
  /** Ligação dentro do CRM. */
  href: string | null;
  /** Ligação "adicionar ao Google Calendar" (só para eventos do CRM). */
  google_url: string | null;
  atrasado: boolean;
  compromisso_id: number | null;
};

export type CategoriaDespesa = {
  id: number;
  nome: string;
  criado_em: string;
};

export type CategoriaDespesaComTotal = CategoriaDespesa & {
  num_despesas: number;
  total_cents: number;
};

/** Uma despesa do negócio. `valor_cents` é a base sem IVA; `total_cents` inclui-o. */
export type Despesa = {
  id: number;
  data: string;
  descricao: string;
  categoria_id: number | null;
  /** A quem se pagou (loja, serviço, pessoa). */
  fornecedor: string | null;
  valor_cents: number;
  /** Taxa de IVA aplicada; nulo quando não se aplica. */
  iva_pct: number | null;
  iva_cents: number;
  total_cents: number;
  metodo: string | null;
  cliente_id: number | null;
  notas: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type DespesaDetalhada = Despesa & {
  categoria_nome: string | null;
  cliente_nome: string | null;
};

/** Um email enviado (ou tentado) pelo CRM. */
export type EmailEnviado = {
  id: number;
  tipo: string;
  contratacao_id: number | null;
  cliente_id: number | null;
  para: string;
  assunto: string;
  corpo: string;
  estado: "enviado" | "erro";
  erro: string | null;
  id_externo: string | null;
  utilizador_id: number | null;
  criado_em: string;
};
