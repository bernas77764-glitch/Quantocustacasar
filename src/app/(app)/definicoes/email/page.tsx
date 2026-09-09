import Link from "next/link";
import { exigirAdministrador } from "@/lib/auth";
import { chaveMascarada, configuracaoEmail, modeloDisponibilidade, ROTULO_SERVICO } from "@/lib/email";
import { ultimosEmails } from "@/lib/queries/emails";
import { enviarTeste, guardarConfiguracao, guardarModelo, removerConfiguracao, reporModelo } from "@/lib/actions/email";
import { dataHora } from "@/lib/format";
import { CabecalhoPagina, Etiqueta, Seccao } from "@/components/ui";
import { BotaoConfirmar } from "@/components/formulario-auto";
import { FormularioConfiguracaoEmail, FormularioModelo, FormularioTeste } from "@/components/formularios-email";

export const dynamic = "force-dynamic";

export default async function DefinicoesEmail() {
  const utilizador = await exigirAdministrador();
  const config = configuracaoEmail();
  const { modelo, personalizado } = modeloDisponibilidade();
  const historico = ultimosEmails(15);

  return (
    <>
      <CabecalhoPagina
        titulo="Email"
        descricao="Como o CRM envia emails aos fornecedores: o serviço de envio, o remetente e o modelo do pedido de disponibilidade."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Seccao
            titulo="Serviço de envio"
            acoes={
              config ? (
                <Etiqueta tom="verde">
                  {ROTULO_SERVICO[config.servico]} · {config.remetente_email}
                </Etiqueta>
              ) : (
                <Etiqueta tom="ambar">Por configurar</Etiqueta>
              )
            }
          >
            <div className="space-y-3 p-4 pb-0 text-sm text-muted">
              <p>
                O CRM envia através de um serviço de email com plano gratuito: <span className="font-medium text-ink">Resend</span> ou{" "}
                <span className="font-medium text-ink">Brevo</span>. Em qualquer deles: criar conta, adicionar o domínio
                quantocustacasar.pt e criar os registos DNS que o serviço indicar, esperar pela verificação, e criar uma chave da API
                para colar aqui.
              </p>
            </div>
            <FormularioConfiguracaoEmail
              acao={guardarConfiguracao}
              atual={
                config
                  ? {
                      servico: config.servico,
                      chave_mascarada: chaveMascarada(config.chave),
                      remetente_nome: config.remetente_nome,
                      remetente_email: config.remetente_email,
                      responder_para: config.responder_para,
                    }
                  : null
              }
            />
            {config && (
              <>
                <div className="border-t border-line">
                  <FormularioTeste acao={enviarTeste} emailPorOmissao={utilizador.email} />
                </div>
                <form action={removerConfiguracao} className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 text-xs text-muted">
                  <span>Guardada em {dataHora(config.atualizado_em)}.</span>
                  <BotaoConfirmar mensagem="Remover a configuração de email? O CRM deixa de conseguir enviar emails." className="btn-perigo rounded-lg px-2 py-1 text-xs">
                    Remover
                  </BotaoConfirmar>
                </form>
              </>
            )}
          </Seccao>

          <Seccao titulo="Últimos envios" vazio={historico.length === 0}>
            {historico.length === 0 ? (
              "Ainda não foi enviado nenhum email."
            ) : (
              <ul className="divide-y divide-line text-sm">
                {historico.map((e) => (
                  <li key={e.id} className="flex items-start gap-3 px-4 py-2.5">
                    <span className="w-28 shrink-0 text-xs text-muted">{dataHora(e.criado_em)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate">
                        {e.contratacao_id ? (
                          <Link href={`/contratacoes/${e.contratacao_id}`} className="hover:text-brand">
                            {e.assunto}
                          </Link>
                        ) : (
                          e.assunto
                        )}
                      </p>
                      <p className="truncate text-xs text-muted">
                        para {e.para}
                        {e.erro ? ` · ${e.erro}` : ""}
                      </p>
                    </div>
                    <Etiqueta tom={e.estado === "enviado" ? "verde" : "vermelho"}>{e.estado === "enviado" ? "Enviado" : "Erro"}</Etiqueta>
                  </li>
                ))}
              </ul>
            )}
          </Seccao>
        </div>

        <Seccao
          titulo="Modelo do pedido de disponibilidade"
          acoes={
            personalizado ? (
              <form action={reporModelo}>
                <BotaoConfirmar mensagem="Voltar ao modelo original? O texto que guardou perde-se." className="btn px-2 py-1 text-xs">
                  Repor original
                </BotaoConfirmar>
              </form>
            ) : (
              <span className="text-xs text-muted">Modelo original</span>
            )
          }
        >
          <FormularioModelo acao={guardarModelo} modelo={modelo} />
        </Seccao>
      </div>
    </>
  );
}
