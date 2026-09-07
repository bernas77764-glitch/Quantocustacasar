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
  fornecedor_nome: string;
  categoria: string;
  /** `pendente` cuja data prevista já passou. */
  atrasado: boolean;
};
