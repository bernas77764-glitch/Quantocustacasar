/**
 * Emails que o site dispara sem intervenção: o agradecimento ao casal que
 * simulou e ao fornecedor que se candidatou. Só saem se o envio estiver
 * configurado e o automático ligado; um erro fica registado, nunca chega ao
 * site.
 */

import { automaticoLigado, configuracaoEmail, enviarEmail, preencherModelo } from "@/lib/email";
import { prepararEmail, type Ids } from "@/lib/email-preparar";
import { registarAtividade } from "@/lib/queries/clientes";
import { registarEmail } from "@/lib/queries/emails";

export async function enviarAutomatico(chave: "cliente_simulacao" | "fornecedor_candidatura", ids: Ids): Promise<void> {
  try {
    const config = configuracaoEmail();
    if (!config || !automaticoLigado(chave)) return;
    const preparado = prepararEmail(chave, ids, config.remetente_nome || "Quanto Custa Casar");
    if (!preparado || !preparado.para) return;
    // Sem campos do momento do envio: o que restar entre chavetas sai em branco.
    const corpo = preencherModelo(preparado.corpo, { notas: "", servicos: "", validade: "" }).replace(/\{[a-z_]+\}/g, "");
    const r = await enviarEmail(config, { para: preparado.para, assunto: preparado.assunto, texto: corpo });
    registarEmail({
      tipo: chave,
      contratacao_id: null,
      cliente_id: preparado.cliente?.id ?? null,
      fornecedor_id: preparado.fornecedor?.id ?? null,
      para: preparado.para,
      assunto: preparado.assunto,
      corpo,
      estado: r.ok ? "enviado" : "erro",
      erro: r.ok ? null : r.erro,
      id_externo: r.ok ? r.id_externo : null,
      utilizador_id: null,
      anexo_nome: null,
    });
    if (r.ok && preparado.cliente) {
      registarAtividade(preparado.cliente.id, "email", `Email automático enviado: ${preparado.assunto}.`);
    }
  } catch (e) {
    console.error("Email automático falhou:", e);
  }
}
