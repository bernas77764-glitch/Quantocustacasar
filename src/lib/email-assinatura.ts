/**
 * A assinatura que vai no fim de cada email do CRM: a mesma do Outlook, com
 * logótipo, nome, cargo, contactos e botões. Sem dependências, para a
 * pré-visualização correr também no browser.
 */

export type Assinatura = {
  ativa: boolean;
  nome: string;
  cargo: string;
  telefone: string;
  email: string;
  site: string;
  instagram: string;
  facebook: string;
  whatsapp: string;
  /** Frase pequena por baixo, opcional. */
  lema: string;
};

export const ASSINATURA_BASE: Assinatura = {
  ativa: true,
  nome: "Bernardo Soares",
  cargo: "Sócio Gerente · Quanto Custa Casar",
  telefone: "912 263 717",
  email: "geral@quantocustacasar.pt",
  site: "https://quantocustacasar.pt",
  instagram: "https://www.instagram.com/quantocustacasar",
  facebook: "https://www.facebook.com/profile.php?id=61594176211185",
  whatsapp: "https://wa.me/351912263717",
  lema: "Simulador gratuito do custo de um casamento em Portugal. Cinco perguntas, sem registo.",
};

const LOGOTIPO = "https://quantocustacasar.pt/marca/logotipo-1600.png";

export function escaparHtml(t: string): string {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function botao(texto: string, url: string, cor: string): string {
  return `<td style="padding:0 6px 0 0;"><a href="${escaparHtml(url)}" target="_blank" style="display:inline-block;background:${cor};color:#ffffff;font-size:12px;line-height:12px;font-weight:bold;text-decoration:none;padding:8px 12px;border-radius:6px;">${texto}</a></td>`;
}

/** A assinatura em HTML, para o fim do email. */
export function assinaturaHtml(a: Assinatura): string {
  const telefoneLimpo = a.telefone.replace(/\s+/g, "");
  const siteCurto = a.site.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const botoes = [
    a.instagram ? botao("Instagram", a.instagram, "#E1306C") : "",
    a.facebook ? botao("Facebook", a.facebook, "#1877F2") : "",
    a.whatsapp ? botao("WhatsApp", a.whatsapp, "#25D366") : "",
  ].join("");
  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;color:#1A1613;max-width:560px;margin-top:24px;">
  <tr>
    <td style="padding:0 20px 0 0;vertical-align:middle;border-right:2px solid #EADFD2;">
      <a href="${escaparHtml(a.site)}" target="_blank" style="text-decoration:none;"><img src="${LOGOTIPO}" width="150" alt="Quanto Custa Casar" style="display:block;width:150px;height:auto;border:0;"></a>
    </td>
    <td style="padding:0 0 0 20px;vertical-align:middle;">
      <p style="margin:0 0 2px 0;font-size:16px;line-height:20px;font-weight:bold;">${escaparHtml(a.nome)}</p>
      <p style="margin:0 0 8px 0;font-size:13px;line-height:18px;color:#A8552B;">${escaparHtml(a.cargo)}</p>
      ${a.telefone ? `<p style="margin:0 0 2px 0;font-size:13px;line-height:18px;"><a href="tel:+351${escaparHtml(telefoneLimpo)}" style="color:#1A1613;text-decoration:none;">${escaparHtml(a.telefone)}</a></p>` : ""}
      ${a.email ? `<p style="margin:0 0 2px 0;font-size:13px;line-height:18px;"><a href="mailto:${escaparHtml(a.email)}" style="color:#1A1613;text-decoration:none;">${escaparHtml(a.email)}</a></p>` : ""}
      <p style="margin:0 0 10px 0;font-size:13px;line-height:18px;"><a href="${escaparHtml(a.site)}" target="_blank" style="color:#A8552B;text-decoration:none;font-weight:bold;">${escaparHtml(siteCurto)}</a></p>
      ${botoes ? `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:separate;"><tr>${botoes}</tr></table>` : ""}
    </td>
  </tr>
  ${a.lema ? `<tr><td colspan="2" style="padding:12px 0 0 0;font-size:11px;line-height:15px;color:#8A7F74;">${escaparHtml(a.lema)}</td></tr>` : ""}
</table>`;
}

/** A mesma assinatura em texto simples, para a versão sem HTML. */
export function assinaturaTexto(a: Assinatura): string {
  const siteCurto = a.site.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return [a.nome, a.cargo, [a.telefone, a.email, siteCurto].filter(Boolean).join(" · ")].filter(Boolean).join("\n");
}

/** O email completo em HTML: o texto escrito, com quebras de linha, e a assinatura. */
export function corpoHtml(texto: string, assinatura: Assinatura | null): string {
  const paragrafos = texto
    .split(/\r?\n\r?\n/)
    .map((p) => `<p style="margin:0 0 14px 0;">${escaparHtml(p).replace(/\r?\n/g, "<br>")}</p>`)
    .join("");
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:21px;color:#1A1613;">${paragrafos}${assinatura?.ativa ? assinaturaHtml(assinatura) : ""}</div>`;
}
