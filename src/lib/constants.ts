/** Vocabulário de domínio do CRM (pt-PT). */

export const ESTADOS_CLIENTE = [
  "novo",
  "contactado",
  "qualificado",
  "proposta",
  "ganho",
  "perdido",
] as const;
export type EstadoCliente = (typeof ESTADOS_CLIENTE)[number];

export const ROTULO_ESTADO_CLIENTE: Record<EstadoCliente, string> = {
  novo: "Novo",
  contactado: "Contactado",
  qualificado: "Qualificado",
  proposta: "Proposta enviada",
  ganho: "Ganho",
  perdido: "Perdido",
};

/** Estados que representam um negócio ainda em aberto. */
export const ESTADOS_CLIENTE_ATIVOS: EstadoCliente[] = [
  "novo",
  "contactado",
  "qualificado",
  "proposta",
];

export const CATEGORIAS = [
  "Espaço / Quinta",
  "Catering",
  "Fotografia",
  "Vídeo",
  "Música & DJ",
  "Flores & Decoração",
  "Bolo & Doçaria",
  "Convites & Papelaria",
  "Beleza & Estética",
  "Vestuário",
  "Alianças",
  "Transporte",
  "Animação",
  "Wedding Planner",
  "Outro",
] as const;
export type Categoria = (typeof CATEGORIAS)[number];

/** Categorias que quase todos os casamentos precisam de fechar. */
export const CATEGORIAS_ESSENCIAIS: Categoria[] = [
  "Espaço / Quinta",
  "Catering",
  "Fotografia",
  "Música & DJ",
  "Flores & Decoração",
  "Bolo & Doçaria",
];

export const ORIGENS = [
  "Simulador",
  "Website",
  "Instagram",
  "Facebook",
  "Google",
  "Recomendação",
  "Feira",
  "Outro",
] as const;

export const ESTADOS_CONTRATACAO = [
  "proposta",
  "confirmada",
  "concluida",
  "cancelada",
] as const;
export type EstadoContratacao = (typeof ESTADOS_CONTRATACAO)[number];

export const ROTULO_ESTADO_CONTRATACAO: Record<EstadoContratacao, string> = {
  proposta: "Proposta",
  confirmada: "Confirmada",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

/** Contratações que contam para os totais financeiros. */
export const ESTADOS_CONTRATACAO_ATIVOS: EstadoContratacao[] = [
  "confirmada",
  "concluida",
];

export const ESTADOS_PAGAMENTO = ["pendente", "pago", "cancelado"] as const;
export type EstadoPagamento = (typeof ESTADOS_PAGAMENTO)[number];

export const ROTULO_ESTADO_PAGAMENTO: Record<EstadoPagamento, string> = {
  pendente: "Pendente",
  pago: "Pago",
  cancelado: "Cancelado",
};

export const METODOS_PAGAMENTO = [
  "Transferência",
  "MB Way",
  "Multibanco",
  "Numerário",
  "Cartão",
  "Cheque",
] as const;

export const DISTRITOS = [
  "Aveiro",
  "Beja",
  "Braga",
  "Bragança",
  "Castelo Branco",
  "Coimbra",
  "Évora",
  "Faro",
  "Guarda",
  "Leiria",
  "Lisboa",
  "Portalegre",
  "Porto",
  "Santarém",
  "Setúbal",
  "Viana do Castelo",
  "Vila Real",
  "Viseu",
  "Açores",
  "Madeira",
] as const;
