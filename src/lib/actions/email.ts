"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirAdministrador, exigirSessao } from "@/lib/auth";
import {
  EMAIL_VALIDO,
  SERVICOS_EMAIL,
  configuracaoEmail,
  definicaoModelo,
  definirAutomatico,
  enviarEmail,
  guardarConfiguracaoEmail,
  guardarModelo as guardarModeloEmail,
  preencherModelo,
  removerConfiguracaoEmail,
  reporModelo as reporModeloEmail,
  type Anexo,
  type ServicoEmail,
} from "@/lib/email";
import { prepararEmail } from "@/lib/email-preparar";
import { registarEmail } from "@/lib/queries/emails";
import { atualizarEmailDoCliente, registarAtividade } from "@/lib/queries/clientes";
import { atualizarEmailDoFornecedor } from "@/lib/queries/fornecedores";
import { euros, paraCents, data as formatarData } from "@/lib/format";
import { texto } from "./util";

export type EstadoFormulario = {
  erro?: string;
  sucesso?: string;
  valores?: Record<string, string>;
};

const ANEXO_MAXIMO = 8 * 1024 * 1024;
const TIPOS_ANEXO = ["application/pdf", "image/jpeg", "image/png"];

function revalidar() {
  revalidatePath("/definicoes/email");
  revalidatePath("/contratacoes");
  revalidatePath("/clientes");
  revalidatePath("/fornecedores");
}

/* ------------------------------------------------------------ configuração */

export async function guardarConfiguracao(_anterior: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  await exigirAdministrador();
  const servico = texto(fd, "servico") as ServicoEmail | null;
  const chaveNova = texto(fd, "chave");
  const smtpServidor = (texto(fd, "smtp_servidor") ?? "").toLowerCase();
  const smtpPorta = Number(texto(fd, "smtp_porta")) || 465;
  const smtpUtilizador = texto(fd, "smtp_utilizador") ?? "";
  const remetenteNome = texto(fd, "remetente_nome") ?? "";
  const remetenteEmail = (texto(fd, "remetente_email") ?? "").toLowerCase();
  const responderPara = (texto(fd, "responder_para") ?? "").toLowerCase();
  const iban = (texto(fd, "iban") ?? "").toUpperCase().replace(/\s+/g, " ");
  const valores = {
    servico: servico ?? "",
    smtp_servidor: smtpServidor,
    smtp_porta: String(smtpPorta),
    smtp_utilizador: smtpUtilizador,
    remetente_nome: remetenteNome,
    remetente_email: remetenteEmail,
    responder_para: responderPara,
    iban,
  };

  if (!servico || !SERVICOS_EMAIL.includes(servico)) return { erro: "Escolha a forma de envio.", valores };
  const atual = configuracaoEmail();
  // O segredo nunca volta ao formulário; se vier vazio, fica o que já está guardado.
  const chave = chaveNova ?? (atual && atual.servico === servico ? atual.chave : null);
  if (!chave) {
    return { erro: servico === "smtp" ? "Escreva a palavra-passe da caixa de correio." : "Cole a chave da API do serviço.", valores };
  }
  if (servico === "smtp") {
    if (!smtpServidor) return { erro: "Indique o servidor de saída (SMTP).", valores };
    if (smtpPorta < 1 || smtpPorta > 65535) return { erro: "A porta não é válida.", valores };
    if (!smtpUtilizador) return { erro: "Indique o utilizador da caixa de correio (normalmente o próprio email).", valores };
  }
  if (!EMAIL_VALIDO.test(remetenteEmail)) return { erro: "O email do remetente não parece válido.", valores };
  if (responderPara && !EMAIL_VALIDO.test(responderPara)) return { erro: "O email de resposta não parece válido.", valores };

  guardarConfiguracaoEmail({
    servico,
    chave,
    smtp_servidor: smtpServidor,
    smtp_porta: smtpPorta,
    smtp_utilizador: smtpUtilizador,
    remetente_nome: remetenteNome,
    remetente_email: remetenteEmail,
    responder_para: responderPara,
    iban,
  });
  revalidar();
  return { sucesso: "Configuração guardada. Envie um email de teste para confirmar." };
}

export async function removerConfiguracao() {
  await exigirAdministrador();
  removerConfiguracaoEmail();
  revalidar();
}

export async function enviarTeste(_anterior: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  const utilizador = await exigirAdministrador();
  const config = configuracaoEmail();
  if (!config) return { erro: "Guarde primeiro a configuração." };
  const para = (texto(fd, "para") ?? utilizador.email).toLowerCase();
  if (!EMAIL_VALIDO.test(para)) return { erro: "O destinatário não parece válido.", valores: { para } };
  const assunto = "Teste do CRM Quanto Custa Casar";
  const r = await enviarEmail(config, {
    para,
    assunto,
    texto: `Olá ${utilizador.nome},\n\nSe está a ler isto, o envio de email do CRM está a funcionar.\n\nCumprimentos,\nCRM Quanto Custa Casar`,
  });
  registarEmail({
    tipo: "teste",
    contratacao_id: null,
    cliente_id: null,
    fornecedor_id: null,
    para,
    assunto,
    corpo: "(email de teste)",
    estado: r.ok ? "enviado" : "erro",
    erro: r.ok ? null : r.erro,
    id_externo: r.ok ? r.id_externo : null,
    utilizador_id: utilizador.id,
    anexo_nome: null,
  });
  revalidar();
  if (!r.ok) return { erro: `Não foi possível enviar: ${r.erro}`, valores: { para } };
  return { sucesso: `Email de teste enviado para ${para}. Veja a caixa de entrada (e o spam, na primeira vez).` };
}

/* ------------------------------------------------------------------ modelos */

export async function guardarModelo(_anterior: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  await exigirAdministrador();
  const chave = texto(fd, "chave") ?? "";
  const assunto = texto(fd, "assunto");
  const corpo = texto(fd, "corpo");
  const valores = { assunto: assunto ?? "", corpo: corpo ?? "" };
  if (!definicaoModelo(chave)) return { erro: "Modelo desconhecido." };
  if (!assunto || !corpo) return { erro: "O modelo precisa de assunto e de texto.", valores };
  if (assunto.length > 200) return { erro: "O assunto é demasiado comprido (máximo 200 caracteres).", valores };
  guardarModeloEmail(chave, { assunto, corpo });
  revalidar();
  return { sucesso: "Modelo guardado.", valores };
}

export async function reporModelo(fd: FormData) {
  await exigirAdministrador();
  const chave = texto(fd, "chave") ?? "";
  if (!definicaoModelo(chave)) return;
  reporModeloEmail(chave);
  revalidar();
}

export async function alternarAutomatico(fd: FormData) {
  await exigirAdministrador();
  const chave = texto(fd, "chave") ?? "";
  const definicao = definicaoModelo(chave);
  if (!definicao || !definicao.automatico) return;
  definirAutomatico(chave, fd.get("ligado") === "1");
  revalidar();
}

/* -------------------------------------------------------------------- envio */

/** Os campos do momento do envio, formatados como o modelo espera. */
function camposAoEnviar(chave: string, fd: FormData): Record<string, string> {
  const definicao = definicaoModelo(chave);
  const campos: Record<string, string> = {};
  for (const c of definicao?.campos_ao_enviar ?? []) {
    const bruto = texto(fd, `campo_${c.campo}`) ?? "";
    if (c.tipo === "valor") {
      const cents = paraCents(bruto);
      campos[c.campo] = cents === null ? bruto : euros(cents);
    } else if (c.tipo === "data") {
      campos[c.campo] = bruto ? formatarData(bruto) : "";
    } else if (c.campo === "servicos" && bruto) {
      campos[c.campo] = `Segue desde já o que tenho para vos propor:\n${bruto
        .split(/\r?\n/)
        .filter((l) => l.trim())
        .map((l) => (l.trim().startsWith("-") ? l.trim() : `- ${l.trim()}`))
        .join("\n")}`;
    } else {
      campos[c.campo] = bruto;
    }
  }
  return campos;
}

async function lerAnexo(fd: FormData): Promise<{ ok: true; anexo: Anexo | null } | { ok: false; erro: string }> {
  const ficheiro = fd.get("anexo");
  if (!(ficheiro instanceof File) || ficheiro.size === 0) return { ok: true, anexo: null };
  if (ficheiro.size > ANEXO_MAXIMO) return { ok: false, erro: "O anexo é demasiado grande (máximo 8 MB)." };
  if (!TIPOS_ANEXO.includes(ficheiro.type)) return { ok: false, erro: "O anexo tem de ser um PDF ou uma imagem (JPG/PNG)." };
  return { ok: true, anexo: { nome: ficheiro.name, tipo: ficheiro.type, conteudo: Buffer.from(await ficheiro.arrayBuffer()) } };
}

export async function enviarEmailPreparado(_anterior: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  const utilizador = await exigirSessao();
  const chave = texto(fd, "chave") ?? "";
  const definicao = definicaoModelo(chave);
  const ids = {
    cliente_id: Number(fd.get("cliente_id")) || null,
    fornecedor_id: Number(fd.get("fornecedor_id")) || null,
    contratacao_id: Number(fd.get("contratacao_id")) || null,
  };
  const para = (texto(fd, "para") ?? "").toLowerCase();
  const assunto = texto(fd, "assunto") ?? "";
  const corpoEscrito = texto(fd, "corpo") ?? "";
  const valores: Record<string, string> = { para, assunto, corpo: corpoEscrito };
  for (const [k, v] of fd.entries()) if (k.startsWith("campo_") && typeof v === "string") valores[k] = v;

  if (!definicao) return { erro: "Modelo desconhecido." };
  const preparado = prepararEmail(chave, ids, utilizador.nome);
  if (!preparado) return { erro: "Não encontrei a ficha a que este email diz respeito." };
  if (!EMAIL_VALIDO.test(para)) return { erro: `Indique o email ${definicao.destinatario === "cliente" ? "do casal" : "do fornecedor"}.`, valores };
  if (!assunto || !corpoEscrito) return { erro: "O email precisa de assunto e de texto.", valores };
  const config = configuracaoEmail();
  if (!config) return { erro: "O envio de email ainda não está configurado. Peça a um administrador para o fazer em Definições › Email.", valores };

  // O que ainda estiver entre chavetas é preenchido com os campos do envio; o resto sai em branco.
  const doEnvio = camposAoEnviar(chave, fd);
  const corpo = preencherModelo(corpoEscrito, doEnvio).replace(/\{[a-z_]+\}/g, "");
  const assuntoFinal = preencherModelo(assunto, doEnvio).replace(/\{[a-z_]+\}/g, "").trim();
  const anexo = await lerAnexo(fd);
  if (!anexo.ok) return { erro: anexo.erro, valores };

  const r = await enviarEmail(config, { para, assunto: assuntoFinal, texto: corpo, anexo: anexo.anexo });
  registarEmail({
    tipo: chave,
    contratacao_id: preparado.contratacao?.id ?? null,
    cliente_id: preparado.cliente?.id ?? null,
    fornecedor_id: preparado.fornecedor?.id ?? null,
    para,
    assunto: assuntoFinal,
    corpo,
    estado: r.ok ? "enviado" : "erro",
    erro: r.ok ? null : r.erro,
    id_externo: r.ok ? r.id_externo : null,
    utilizador_id: utilizador.id,
    anexo_nome: anexo.anexo?.nome ?? null,
  });
  if (!r.ok) return { erro: `Não foi possível enviar: ${r.erro}`, valores };

  if (preparado.cliente) {
    const quem = definicao.destinatario === "cliente" ? "ao casal" : `a ${preparado.fornecedor?.nome ?? "fornecedor"}`;
    registarAtividade(preparado.cliente.id, "email", `Email enviado ${quem}: ${assuntoFinal} (${para}).`);
  }
  revalidar();
  const voltar = texto(fd, "voltar_para");
  const destino =
    voltar && voltar.startsWith("/")
      ? voltar
      : preparado.contratacao
        ? `/contratacoes/${preparado.contratacao.id}`
        : preparado.cliente && definicao.destinatario === "cliente"
          ? `/clientes/${preparado.cliente.id}`
          : preparado.fornecedor
            ? `/fornecedores/${preparado.fornecedor.id}`
            : "/";
  redirect(`${destino}${destino.includes("?") ? "&" : "?"}email=enviado`);
}

/** Guarda o email de quem vai receber, quando faltava na ficha. */
export async function guardarEmailDoDestinatario(fd: FormData) {
  await exigirSessao();
  const email = (texto(fd, "email") ?? "").toLowerCase();
  const clienteId = Number(fd.get("cliente_id")) || 0;
  const fornecedorId = Number(fd.get("fornecedor_id")) || 0;
  const voltar = texto(fd, "voltar_para");
  if (EMAIL_VALIDO.test(email)) {
    if (clienteId) {
      atualizarEmailDoCliente(clienteId, email);
      revalidatePath(`/clientes/${clienteId}`);
    } else if (fornecedorId) {
      atualizarEmailDoFornecedor(fornecedorId, email);
      revalidatePath(`/fornecedores/${fornecedorId}`);
    }
  }
  if (voltar && voltar.startsWith("/")) redirect(voltar);
}
