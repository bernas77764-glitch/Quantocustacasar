import Link from "next/link";
import { exigirAdministrador } from "@/lib/auth";
import { ASSINATURA_BASE, ROTULO_SERVICO, chaveMascarada, configuracaoEmail, todosOsModelos } from "@/lib/email";
import { ultimosEmails } from "@/lib/queries/emails";
import {
  alternarAutomatico,
  enviarTeste,
  guardarConfiguracao,
  guardarModelo,
  removerConfiguracao,
  reporModelo,
} from "@/lib/actions/email";
import { dataHora } from "@/lib/format";
import { CabecalhoPagina, Etiqueta, Seccao } from "@/components/ui";
import { BotaoConfirmar } from "@/components/formulario-auto";
import { FormularioConfiguracaoEmail, FormularioModelo, FormularioTeste } from "@/components/formularios-email";

export const dynamic = "force-dynamic";

export default async function DefinicoesEmail() {
  const utilizador = await exigirAdministrador();
  const config = configuracaoEmail();
  const modelos = todosOsModelos();
  const historico = ultimosEmails(15);

  return (
    <>
      <CabecalhoPagina
        titulo="Email"
        descricao="Como o CRM envia emails, e os modelos que usa com casais e fornecedores."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Seccao
          titulo="Envio"
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
              O mais simples é enviar pela caixa de correio do negócio, com a palavra-passe dela. Em alternativa, um serviço
              de envio (Resend ou Brevo) com o domínio verificado. As respostas chegam sempre à sua caixa.
            </p>
          </div>
          <FormularioConfiguracaoEmail
            acao={guardarConfiguracao}
            atual={
              config
                ? {
                    servico: config.servico,
                    chave_mascarada: chaveMascarada(config.chave),
                    smtp_servidor: config.smtp_servidor,
                    smtp_porta: config.smtp_porta,
                    smtp_utilizador: config.smtp_utilizador,
                    remetente_nome: config.remetente_nome,
                    remetente_email: config.remetente_email,
                    responder_para: config.responder_para,
                    iban: config.iban,
                    assinatura: config.assinatura,
                  }
                : null
            }
            assinaturaBase={ASSINATURA_BASE}
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
                      ) : e.cliente_id ? (
                        <Link href={`/clientes/${e.cliente_id}`} className="hover:text-brand">
                          {e.assunto}
                        </Link>
                      ) : e.fornecedor_id ? (
                        <Link href={`/fornecedores/${e.fornecedor_id}`} className="hover:text-brand">
                          {e.assunto}
                        </Link>
                      ) : (
                        e.assunto
                      )}
                    </p>
                    <p className="truncate text-xs text-muted">
                      para {e.para}
                      {e.utilizador_id === null && e.tipo !== "teste" ? " · automático" : ""}
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

      <h2 className="mt-8 mb-3 text-lg font-semibold">Modelos</h2>
      <p className="mb-4 text-sm text-muted">
        Cada modelo abre preenchido com os dados da ficha; pode alterá-lo aqui, para todos os envios seguintes, ou no
        momento do envio, só para aquele email. Os dois automáticos saem sem intervenção quando o site envia um pedido.
      </p>
      <div className="space-y-3">
        {(["cliente", "fornecedor"] as const).map((grupo) => (
          <div key={grupo} className="space-y-3">
            <h3 className="text-xs font-medium tracking-wide text-muted uppercase">
              {grupo === "cliente" ? "Para os casais" : "Para os fornecedores"}
            </h3>
            {modelos
              .filter((m) => m.definicao.grupo === grupo)
              .map(({ definicao, modelo, personalizado, automatico_ligado }) => (
                <details key={definicao.chave} className="cartao group" id={`modelo-${definicao.chave}`}>
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <span>
                      <span className="text-sm font-semibold">{definicao.rotulo}</span>
                      <span className="block text-xs text-muted">{definicao.descricao}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      {definicao.automatico && (
                        <Etiqueta tom={automatico_ligado ? "verde" : "cinza"}>
                          {automatico_ligado ? "Automático ligado" : "Automático desligado"}
                        </Etiqueta>
                      )}
                      {personalizado ? <Etiqueta tom="azul">Alterado</Etiqueta> : <Etiqueta tom="cinza">Original</Etiqueta>}
                      <span aria-hidden className="text-muted transition group-open:rotate-90">
                        ›
                      </span>
                    </span>
                  </summary>
                  <div className="border-t border-line">
                    {(definicao.automatico || personalizado) && (
                      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2 text-xs">
                        {definicao.automatico && (
                          <form action={alternarAutomatico}>
                            <input type="hidden" name="chave" value={definicao.chave} />
                            <input type="hidden" name="ligado" value={automatico_ligado ? "0" : "1"} />
                            <button type="submit" className="btn px-2 py-1 text-xs">
                              {automatico_ligado ? "Desligar envio automático" : "Ligar envio automático"}
                            </button>
                          </form>
                        )}
                        {personalizado && (
                          <form action={reporModelo}>
                            <input type="hidden" name="chave" value={definicao.chave} />
                            <BotaoConfirmar mensagem="Voltar ao modelo original? O texto que guardou perde-se." className="btn px-2 py-1 text-xs">
                              Repor original
                            </BotaoConfirmar>
                          </form>
                        )}
                      </div>
                    )}
                    <FormularioModelo acao={guardarModelo} chave={definicao.chave} modelo={modelo} />
                  </div>
                </details>
              ))}
          </div>
        ))}
      </div>
    </>
  );
}
