/**
 * Envio de email pelo CRM, sem dependências: fala com a API HTTPS do Resend
 * ou do Brevo. A configuração (serviço, chave, remetente) vive nas
 * definições; os modelos de texto também, com campos entre chavetas.
 */

import { agora, getDb } from "@/lib/db";
import { euros, data as formatarData } from "@/lib/format";
import { MODELO_DISPONIBILIDADE_BASE, SERVICOS_EMAIL, type ModeloEmail, type ServicoEmail, type CamposModelo } from "@/lib/email-modelo";

export * from "@/lib/email-modelo";

export type ConfiguracaoEmail = {
  servico: ServicoEmail;
  chave: string;
  remetente_nome: string;
  remetente_email: string;
  /** Para onde vão as respostas; vazio = o remetente. */
  responder_para: string;
};

const CHAVE_CONFIG = "email_config";
const CHAVE_MODELO = "email_modelo_disponibilidade";

/* ---------------------------------------------------------------- definições */

function ler(chave: string): { valor: string; atualizado_em: string } | null {
  return (
    (getDb()
      .prepare("SELECT valor, atualizado_em FROM definicoes WHERE chave = ?")
      .get(chave) as { valor: string; atualizado_em: string } | undefined) ?? null
  );
}

function guardar(chave: string, valor: string): void {
  getDb()
    .prepare(
      `INSERT INTO definicoes (chave, valor, atualizado_em) VALUES (?, ?, ?)
       ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor, atualizado_em = excluded.atualizado_em`,
    )
    .run(chave, valor, agora());
}

export function configuracaoEmail(): (ConfiguracaoEmail & { atualizado_em: string }) | null {
  const linha = ler(CHAVE_CONFIG);
  if (!linha) return null;
  try {
    const c = JSON.parse(linha.valor) as Partial<ConfiguracaoEmail>;
    if (!c.servico || !SERVICOS_EMAIL.includes(c.servico) || !c.chave || !c.remetente_email) return null;
    return {
      servico: c.servico,
      chave: c.chave,
      remetente_nome: c.remetente_nome ?? "",
      remetente_email: c.remetente_email,
      responder_para: c.responder_para ?? "",
      atualizado_em: linha.atualizado_em,
    };
  } catch {
    return null;
  }
}

export function guardarConfiguracaoEmail(c: ConfiguracaoEmail): void {
  guardar(CHAVE_CONFIG, JSON.stringify(c));
}

export function removerConfiguracaoEmail(): void {
  getDb().prepare("DELETE FROM definicoes WHERE chave = ?").run(CHAVE_CONFIG);
}

/** Mostra só o fim da chave, para confirmar qual está guardada sem a expor. */
export function chaveMascarada(chave: string): string {
  return chave.length <= 6 ? "••••" : `••••${chave.slice(-4)}`;
}

export const EMAIL_VALIDO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/* ------------------------------------------------------------------ modelos */

export function modeloDisponibilidade(): { modelo: ModeloEmail; personalizado: boolean } {
  const linha = ler(CHAVE_MODELO);
  if (!linha) return { modelo: MODELO_DISPONIBILIDADE_BASE, personalizado: false };
  try {
    const m = JSON.parse(linha.valor) as Partial<ModeloEmail>;
    if (!m.assunto || !m.corpo) return { modelo: MODELO_DISPONIBILIDADE_BASE, personalizado: false };
    return { modelo: { assunto: m.assunto, corpo: m.corpo }, personalizado: true };
  } catch {
    return { modelo: MODELO_DISPONIBILIDADE_BASE, personalizado: false };
  }
}

export function guardarModeloDisponibilidade(m: ModeloEmail): void {
  guardar(CHAVE_MODELO, JSON.stringify(m));
}

export function reporModeloDisponibilidade(): void {
  getDb().prepare("DELETE FROM definicoes WHERE chave = ?").run(CHAVE_MODELO);
}

/** Os campos de um pedido de disponibilidade, a partir das fichas. */
export function camposDoPedido(dados: {
  fornecedor: { nome: string; contacto: string | null; categoria: string };
  cliente: {
    nome: string;
    parceiro: string | null;
    data_casamento: string | null;
    num_convidados: number | null;
    local_evento: string | null;
    distrito: string | null;
  };
  contratacao: { valor_cents: number; categoria: string; descricao: string | null; data_servico: string | null };
  remetente: string;
}): CamposModelo {
  const { fornecedor, cliente, contratacao } = dados;
  const dataEvento = contratacao.data_servico ?? cliente.data_casamento;
  return {
    contacto: fornecedor.contacto?.trim() || fornecedor.nome,
    fornecedor: fornecedor.nome,
    casal: cliente.parceiro ? `${cliente.nome} & ${cliente.parceiro}` : cliente.nome,
    data: dataEvento ? formatarData(dataEvento) : "a definir",
    convidados: cliente.num_convidados ? String(cliente.num_convidados) : "a definir",
    local: cliente.local_evento?.trim() || "a definir",
    distrito: cliente.distrito ?? "a definir",
    valor: contratacao.valor_cents > 0 ? euros(contratacao.valor_cents) : "a definir",
    categoria: contratacao.categoria || fornecedor.categoria,
    descricao: contratacao.descricao ?? "",
    remetente: dados.remetente,
  };
}

/* -------------------------------------------------------------------- envio */

export type PedidoEnvio = {
  para: string;
  assunto: string;
  texto: string;
};

export type ResultadoEnvio = { ok: true; id_externo: string | null } | { ok: false; erro: string };

/** Base da API; `CRM_EMAIL_API_BASE` aponta para um servidor falso nos testes. */
function baseDaApi(servico: ServicoEmail): string {
  const forcada = process.env.CRM_EMAIL_API_BASE;
  if (forcada) return forcada.replace(/\/$/, "");
  return servico === "resend" ? "https://api.resend.com" : "https://api.brevo.com";
}

function remetente(c: ConfiguracaoEmail): string {
  return c.remetente_nome ? `${c.remetente_nome} <${c.remetente_email}>` : c.remetente_email;
}

function mensagemDeErro(status: number, corpo: string): string {
  let detalhe = "";
  try {
    const j = JSON.parse(corpo) as { message?: string; error?: string; code?: string };
    detalhe = j.message ?? j.error ?? "";
  } catch {
    detalhe = corpo.slice(0, 200);
  }
  if (status === 401 || status === 403) return `O serviço recusou a chave (${status}). ${detalhe}`.trim();
  if (status === 422 || status === 400) return `O serviço recusou o email (${status}). ${detalhe}`.trim();
  return `O serviço respondeu ${status}. ${detalhe}`.trim();
}

/**
 * Envia um email de texto simples pelo serviço configurado. Nunca lança:
 * devolve o erro para a interface o mostrar.
 */
export async function enviarEmail(c: ConfiguracaoEmail, pedido: PedidoEnvio): Promise<ResultadoEnvio> {
  const responder = c.responder_para || c.remetente_email;
  let url: string;
  let cabecalhos: Record<string, string>;
  let corpo: unknown;
  if (c.servico === "resend") {
    url = `${baseDaApi("resend")}/emails`;
    cabecalhos = { Authorization: `Bearer ${c.chave}` };
    corpo = { from: remetente(c), to: [pedido.para], subject: pedido.assunto, text: pedido.texto, reply_to: responder };
  } else {
    url = `${baseDaApi("brevo")}/v3/smtp/email`;
    cabecalhos = { "api-key": c.chave };
    corpo = {
      sender: { name: c.remetente_nome || undefined, email: c.remetente_email },
      to: [{ email: pedido.para }],
      replyTo: { email: responder },
      subject: pedido.assunto,
      textContent: pedido.texto,
    };
  }
  try {
    const resposta = await fetch(url, {
      method: "POST",
      headers: { ...cabecalhos, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(corpo),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    const texto = await resposta.text();
    if (!resposta.ok) return { ok: false, erro: mensagemDeErro(resposta.status, texto) };
    let id: string | null = null;
    try {
      const j = JSON.parse(texto) as { id?: string; messageId?: string };
      id = j.id ?? j.messageId ?? null;
    } catch {
      id = null;
    }
    return { ok: true, id_externo: id };
  } catch (e) {
    const nome = e instanceof Error ? e.name : "";
    if (nome === "TimeoutError") return { ok: false, erro: "O serviço de email demorou demasiado a responder." };
    return { ok: false, erro: `Não foi possível contactar o serviço de email: ${e instanceof Error ? e.message : String(e)}` };
  }
}
