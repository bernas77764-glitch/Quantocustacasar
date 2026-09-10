/**
 * Envio de email pelo CRM: pela caixa de correio do negócio (SMTP), ou pela
 * API do Resend ou do Brevo. A configuração, os modelos e o IBAN vivem nas
 * definições; os modelos podem ser alterados por administradores.
 */

import nodemailer from "nodemailer";
import { agora, getDb } from "@/lib/db";
import {
  MODELOS,
  SERVICOS_EMAIL,
  definicaoModelo,
  type ModeloEmail,
  type ServicoEmail,
} from "@/lib/email-modelo";
import { ASSINATURA_BASE, assinaturaTexto, corpoHtml, type Assinatura } from "@/lib/email-assinatura";

export * from "@/lib/email-modelo";
export * from "@/lib/email-assinatura";

export type ConfiguracaoEmail = {
  servico: ServicoEmail;
  /** Chave da API (Resend/Brevo) ou palavra-passe da caixa (SMTP). */
  chave: string;
  smtp_servidor: string;
  smtp_porta: number;
  smtp_utilizador: string;
  remetente_nome: string;
  remetente_email: string;
  /** Para onde vão as respostas; vazio = o remetente. */
  responder_para: string;
  /** Para o campo {iban} das faturas. */
  iban: string;
  assinatura: Assinatura;
};

const CHAVE_CONFIG = "email_config";
const PREFIXO_MODELO = "email_modelo_";
const PREFIXO_AUTOMATICO = "email_automatico_";

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

function apagar(chave: string): void {
  getDb().prepare("DELETE FROM definicoes WHERE chave = ?").run(chave);
}

export function configuracaoEmail(): (ConfiguracaoEmail & { atualizado_em: string }) | null {
  const linha = ler(CHAVE_CONFIG);
  if (!linha) return null;
  try {
    const c = JSON.parse(linha.valor) as Partial<ConfiguracaoEmail>;
    if (!c.servico || !SERVICOS_EMAIL.includes(c.servico) || !c.chave || !c.remetente_email) return null;
    if (c.servico === "smtp" && (!c.smtp_servidor || !c.smtp_utilizador)) return null;
    return {
      servico: c.servico,
      chave: c.chave,
      smtp_servidor: c.smtp_servidor ?? "",
      smtp_porta: Number(c.smtp_porta) || 465,
      smtp_utilizador: c.smtp_utilizador ?? "",
      remetente_nome: c.remetente_nome ?? "",
      remetente_email: c.remetente_email,
      responder_para: c.responder_para ?? "",
      iban: c.iban ?? "",
      assinatura: { ...ASSINATURA_BASE, ...(c.assinatura ?? {}) },
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
  apagar(CHAVE_CONFIG);
}

/** Mostra só o fim do segredo, para confirmar qual está guardado sem o expor. */
export function chaveMascarada(chave: string): string {
  return chave.length <= 6 ? "••••" : `••••${chave.slice(-4)}`;
}

export const EMAIL_VALIDO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/* ------------------------------------------------------------------ modelos */

/** O modelo em vigor: o guardado pela equipa ou o original. */
export function modelo(chave: string): { modelo: ModeloEmail; personalizado: boolean } {
  const definicao = definicaoModelo(chave);
  if (!definicao) throw new Error(`Modelo de email desconhecido: ${chave}`);
  const linha = ler(PREFIXO_MODELO + chave);
  if (!linha) return { modelo: definicao.modelo, personalizado: false };
  try {
    const m = JSON.parse(linha.valor) as Partial<ModeloEmail>;
    if (!m.assunto || !m.corpo) return { modelo: definicao.modelo, personalizado: false };
    return { modelo: { assunto: m.assunto, corpo: m.corpo }, personalizado: true };
  } catch {
    return { modelo: definicao.modelo, personalizado: false };
  }
}

export function guardarModelo(chave: string, m: ModeloEmail): void {
  if (!definicaoModelo(chave)) throw new Error(`Modelo de email desconhecido: ${chave}`);
  guardar(PREFIXO_MODELO + chave, JSON.stringify(m));
}

export function reporModelo(chave: string): void {
  apagar(PREFIXO_MODELO + chave);
}

/** Os envios automáticos vêm ligados; um administrador pode desligá-los. */
export function automaticoLigado(chave: string): boolean {
  const linha = ler(PREFIXO_AUTOMATICO + chave);
  return linha ? linha.valor === "1" : true;
}

export function definirAutomatico(chave: string, ligado: boolean): void {
  guardar(PREFIXO_AUTOMATICO + chave, ligado ? "1" : "0");
}

export function todosOsModelos() {
  return MODELOS.map((d) => ({
    definicao: d,
    ...modelo(d.chave),
    automatico_ligado: d.automatico ? automaticoLigado(d.chave) : false,
  }));
}

/* -------------------------------------------------------------------- envio */

export type Anexo = { nome: string; tipo: string; conteudo: Buffer };

export type PedidoEnvio = {
  para: string;
  assunto: string;
  texto: string;
  anexo?: Anexo | null;
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

/** As duas versões do corpo: texto simples com a assinatura em texto, e HTML com a assinatura completa. */
function corpos(c: ConfiguracaoEmail, texto: string): { texto: string; html: string } {
  const a = c.assinatura;
  return {
    texto: a.ativa ? `${texto.replace(/\s+$/, "")}\n\n${assinaturaTexto(a)}` : texto,
    html: corpoHtml(texto, a),
  };
}

function mensagemDeErro(status: number, corpo: string): string {
  let detalhe = "";
  try {
    const j = JSON.parse(corpo) as { message?: string; error?: string };
    detalhe = j.message ?? j.error ?? "";
  } catch {
    detalhe = corpo.slice(0, 200);
  }
  if (status === 401 || status === 403) return `O serviço recusou a chave (${status}). ${detalhe}`.trim();
  if (status === 422 || status === 400) return `O serviço recusou o email (${status}). ${detalhe}`.trim();
  return `O serviço respondeu ${status}. ${detalhe}`.trim();
}

async function enviarPorApi(c: ConfiguracaoEmail, pedido: PedidoEnvio): Promise<ResultadoEnvio> {
  const responder = c.responder_para || c.remetente_email;
  const { texto: textoFinal, html } = corpos(c, pedido.texto);
  let url: string;
  let cabecalhos: Record<string, string>;
  let corpo: Record<string, unknown>;
  if (c.servico === "resend") {
    url = `${baseDaApi("resend")}/emails`;
    cabecalhos = { Authorization: `Bearer ${c.chave}` };
    corpo = { from: remetente(c), to: [pedido.para], subject: pedido.assunto, text: textoFinal, html, reply_to: responder };
    if (pedido.anexo) corpo.attachments = [{ filename: pedido.anexo.nome, content: pedido.anexo.conteudo.toString("base64") }];
  } else {
    url = `${baseDaApi("brevo")}/v3/smtp/email`;
    cabecalhos = { "api-key": c.chave };
    corpo = {
      sender: { name: c.remetente_nome || undefined, email: c.remetente_email },
      to: [{ email: pedido.para }],
      replyTo: { email: responder },
      subject: pedido.assunto,
      textContent: textoFinal,
      htmlContent: html,
    };
    if (pedido.anexo) corpo.attachment = [{ name: pedido.anexo.nome, content: pedido.anexo.conteudo.toString("base64") }];
  }
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
}

async function enviarPorSmtp(c: ConfiguracaoEmail, pedido: PedidoEnvio): Promise<ResultadoEnvio> {
  const porta = c.smtp_porta || 465;
  const transporte = nodemailer.createTransport({
    host: c.smtp_servidor,
    port: porta,
    secure: porta === 465,
    auth: { user: c.smtp_utilizador, pass: c.chave },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
    // Só nos testes, contra um servidor SMTP local sem certificado.
    tls: process.env.CRM_SMTP_INSEGURO === "1" ? { rejectUnauthorized: false } : undefined,
  });
  const { texto: textoFinal, html } = corpos(c, pedido.texto);
  const info = await transporte.sendMail({
    from: remetente(c),
    to: pedido.para,
    replyTo: c.responder_para || c.remetente_email,
    subject: pedido.assunto,
    text: textoFinal,
    html,
    attachments: pedido.anexo
      ? [{ filename: pedido.anexo.nome, content: pedido.anexo.conteudo, contentType: pedido.anexo.tipo }]
      : undefined,
  });
  return { ok: true, id_externo: info.messageId ?? null };
}

function descreverErro(e: unknown): string {
  if (!(e instanceof Error)) return String(e);
  const codigo = (e as { code?: string; responseCode?: number }).code;
  const resposta = (e as { responseCode?: number }).responseCode;
  if (e.name === "TimeoutError" || codigo === "ETIMEDOUT") return "O servidor de email demorou demasiado a responder.";
  if (codigo === "EAUTH" || resposta === 535) return "O servidor recusou o utilizador ou a palavra-passe da caixa de correio.";
  if (codigo === "ENOTFOUND" || codigo === "ECONNREFUSED" || codigo === "ESOCKET") {
    return `Não foi possível ligar ao servidor de email (${codigo}). Confirme o servidor e a porta.`;
  }
  return e.message;
}

/**
 * Envia um email de texto simples pelo serviço configurado. Nunca lança:
 * devolve o erro para a interface o mostrar e o registo o guardar.
 */
export async function enviarEmail(c: ConfiguracaoEmail, pedido: PedidoEnvio): Promise<ResultadoEnvio> {
  try {
    return c.servico === "smtp" ? await enviarPorSmtp(c, pedido) : await enviarPorApi(c, pedido);
  } catch (e) {
    return { ok: false, erro: descreverErro(e) };
  }
}
