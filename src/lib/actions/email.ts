"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirAdministrador, exigirSessao } from "@/lib/auth";
import {
  EMAIL_VALIDO,
  SERVICOS_EMAIL,
  configuracaoEmail,
  enviarEmail,
  guardarConfiguracaoEmail,
  guardarModeloDisponibilidade,
  removerConfiguracaoEmail,
  reporModeloDisponibilidade,
  type ServicoEmail,
} from "@/lib/email";
import { registarEmail } from "@/lib/queries/emails";
import { obterContratacao } from "@/lib/queries/contratacoes";
import { registarAtividade } from "@/lib/queries/clientes";
import { atualizarEmailDoFornecedor } from "@/lib/queries/fornecedores";
import { texto } from "./util";

export type EstadoFormulario = {
  erro?: string;
  sucesso?: string;
  valores?: Record<string, string>;
};

function revalidar() {
  revalidatePath("/definicoes/email");
  revalidatePath("/contratacoes");
}

/* ------------------------------------------------------------ configuração */

export async function guardarConfiguracao(_anterior: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  await exigirAdministrador();
  const servico = texto(fd, "servico") as ServicoEmail | null;
  const chaveNova = texto(fd, "chave");
  const remetenteNome = texto(fd, "remetente_nome") ?? "";
  const remetenteEmail = (texto(fd, "remetente_email") ?? "").toLowerCase();
  const responderPara = (texto(fd, "responder_para") ?? "").toLowerCase();
  const valores = { servico: servico ?? "", remetente_nome: remetenteNome, remetente_email: remetenteEmail, responder_para: responderPara };

  if (!servico || !SERVICOS_EMAIL.includes(servico)) return { erro: "Escolha o serviço de envio.", valores };
  const atual = configuracaoEmail();
  // A chave nunca volta ao formulário; se vier vazia, fica a que já está guardada.
  const chave = chaveNova ?? (atual && atual.servico === servico ? atual.chave : null);
  if (!chave) return { erro: "Cole a chave da API do serviço.", valores };
  if (!EMAIL_VALIDO.test(remetenteEmail)) return { erro: "O email do remetente não parece válido.", valores };
  if (responderPara && !EMAIL_VALIDO.test(responderPara)) return { erro: "O email de resposta não parece válido.", valores };

  guardarConfiguracaoEmail({ servico, chave, remetente_nome: remetenteNome, remetente_email: remetenteEmail, responder_para: responderPara });
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
  const r = await enviarEmail(config, {
    para,
    assunto: "Teste do CRM Quanto Custa Casar",
    texto: `Olá ${utilizador.nome},\n\nSe está a ler isto, o envio de email do CRM está a funcionar.\n\nCumprimentos,\nCRM Quanto Custa Casar`,
  });
  registarEmail({
    tipo: "teste",
    contratacao_id: null,
    cliente_id: null,
    para,
    assunto: "Teste do CRM Quanto Custa Casar",
    corpo: "(email de teste)",
    estado: r.ok ? "enviado" : "erro",
    erro: r.ok ? null : r.erro,
    id_externo: r.ok ? r.id_externo : null,
    utilizador_id: utilizador.id,
  });
  revalidar();
  if (!r.ok) return { erro: `Não foi possível enviar: ${r.erro}`, valores: { para } };
  return { sucesso: `Email de teste enviado para ${para}. Veja a caixa de entrada (e o spam, na primeira vez).` };
}

/* ------------------------------------------------------------------ modelo */

export async function guardarModelo(_anterior: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  await exigirAdministrador();
  const assunto = texto(fd, "assunto");
  const corpo = texto(fd, "corpo");
  const valores = { assunto: assunto ?? "", corpo: corpo ?? "" };
  if (!assunto || !corpo) return { erro: "O modelo precisa de assunto e de texto.", valores };
  if (assunto.length > 200) return { erro: "O assunto é demasiado comprido (máximo 200 caracteres).", valores };
  guardarModeloDisponibilidade({ assunto, corpo });
  revalidar();
  return { sucesso: "Modelo guardado.", valores };
}

export async function reporModelo() {
  await exigirAdministrador();
  reporModeloDisponibilidade();
  revalidar();
}

/* ------------------------------------------------- pedido de disponibilidade */

export async function enviarPedidoDisponibilidade(_anterior: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  const utilizador = await exigirSessao();
  const contratacaoId = Number(fd.get("contratacao_id"));
  const para = (texto(fd, "para") ?? "").toLowerCase();
  const assunto = texto(fd, "assunto") ?? "";
  const corpo = texto(fd, "corpo") ?? "";
  const valores = { para, assunto, corpo };
  const c = obterContratacao(contratacaoId);
  if (!c) return { erro: "Esta contratação já não existe." };
  if (!EMAIL_VALIDO.test(para)) return { erro: "Indique o email do fornecedor.", valores };
  if (!assunto || !corpo) return { erro: "O email precisa de assunto e de texto.", valores };
  const config = configuracaoEmail();
  if (!config) return { erro: "O envio de email ainda não está configurado. Peça a um administrador para o fazer em Definições › Email.", valores };

  const r = await enviarEmail(config, { para, assunto, texto: corpo });
  registarEmail({
    tipo: "pedido_disponibilidade",
    contratacao_id: c.id,
    cliente_id: c.cliente_id,
    para,
    assunto,
    corpo,
    estado: r.ok ? "enviado" : "erro",
    erro: r.ok ? null : r.erro,
    id_externo: r.ok ? r.id_externo : null,
    utilizador_id: utilizador.id,
  });
  if (!r.ok) return { erro: `Não foi possível enviar: ${r.erro}`, valores };
  registarAtividade(c.cliente_id, "email", `Pedido de disponibilidade enviado a ${c.fornecedor_nome} (${para}).`);
  revalidatePath(`/contratacoes/${c.id}`);
  revalidatePath(`/clientes/${c.cliente_id}`);
  redirect(`/contratacoes/${c.id}?email=enviado`);
}

/** Guarda o email do fornecedor a partir da página do pedido, quando faltava. */
export async function guardarEmailDoFornecedor(fd: FormData) {
  await exigirSessao();
  const id = Number(fd.get("fornecedor_id"));
  const email = (texto(fd, "email") ?? "").toLowerCase();
  const voltar = texto(fd, "voltar_para");
  if (id && EMAIL_VALIDO.test(email)) {
    atualizarEmailDoFornecedor(id, email);
    revalidatePath(`/fornecedores/${id}`);
  }
  if (voltar && voltar.startsWith("/")) redirect(voltar);
}
