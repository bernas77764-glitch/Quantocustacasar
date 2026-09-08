import Link from "next/link";
import { headers } from "next/headers";
import { exigirSessao } from "@/lib/auth";
import { caminhoDoFeed, eventosGoogle, tokenDoFeed } from "@/lib/google-calendar";
import {
  atualizarGoogle,
  desligarGoogle,
  ligarGoogle,
  novaLigacaoDoFeed,
} from "@/lib/actions/calendario";
import { dataHora } from "@/lib/format";
import { CabecalhoPagina, Seccao } from "@/components/ui";
import { BotaoConfirmar } from "@/components/formulario-auto";
import { FormularioLigarGoogle, LigacaoParaCopiar } from "@/components/formularios-calendario";

export const dynamic = "force-dynamic";

async function urlPublica(caminho: string): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}${caminho}`;
}

export default async function GoogleCalendar() {
  const utilizador = await exigirSessao();
  const administrador = utilizador.administrador === 1;
  const feed = await urlPublica(caminhoDoFeed(tokenDoFeed()));
  const { estado } = await eventosGoogle();

  return (
    <>
      <CabecalhoPagina
        titulo="Google Calendar"
        descricao="Duas ligações independentes: o CRM aparece no seu Google Calendar, e o seu Google Calendar aparece no CRM. Nenhuma precisa de conta de programador."
        acoes={
          <Link href="/calendario" className="btn">
            ← Calendário
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Seccao titulo="1 · O CRM no seu Google Calendar (e no telemóvel)">
          <div className="space-y-4 p-4 text-sm">
            <p className="text-muted">
              Esta ligação é um calendário que o Google subscreve. Traz casamentos, datas de serviço,
              vencimentos por pagar e compromissos, e atualiza-se sozinha quando muda algo no CRM.
            </p>
            <LigacaoParaCopiar valor={feed} rotulo="Ligação do calendário do CRM" />
            <ol className="list-decimal space-y-1.5 pl-5">
              <li>
                Num computador, abra <span className="font-medium">calendar.google.com</span> (o passo seguinte não existe na
                aplicação do telemóvel).
              </li>
              <li>
                À esquerda, ao lado de <span className="font-medium">Outros calendários</span>, carregue em{" "}
                <span className="font-medium">+</span> e escolha <span className="font-medium">A partir de URL</span>.
              </li>
              <li>Cole a ligação acima e carregue em <span className="font-medium">Adicionar calendário</span>.</li>
              <li>
                No telemóvel, abra a aplicação Google Calendar, entre nas definições e certifique-se de que o novo calendário
                está visível e sincronizado.
              </li>
            </ol>
            <p className="rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted">
              O Google volta a ler calendários subscritos de poucas em poucas horas (por vezes até 24 h). Para um evento
              entrar no Google de imediato, use o botão “+ Google” na agenda do CRM.
            </p>
            {administrador && (
              <form action={novaLigacaoDoFeed} className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
                <span className="flex-1 text-xs text-muted">
                  Quem tiver esta ligação vê os eventos do CRM. Se a partilhou por engano, gere uma nova: a antiga deixa de
                  funcionar e terá de subscrever outra vez no Google.
                </span>
                <BotaoConfirmar
                  mensagem="Gerar uma nova ligação? A atual deixa de funcionar e o calendário subscrito no Google fica vazio até voltar a subscrever."
                  className="btn"
                >
                  Gerar nova ligação
                </BotaoConfirmar>
              </form>
            )}
          </div>
        </Seccao>

        <Seccao titulo="2 · O seu Google Calendar no CRM">
          <div className="space-y-4 text-sm">
            <div className="space-y-3 p-4 pb-0">
              <p className="text-muted">
                Cole aqui o endereço secreto do seu calendário Google. O CRM lê-o de 10 em 10 minutos e mostra esses
                eventos no calendário, ao lado dos do negócio. Não escreve nada no Google.
              </p>
              {estado.ligado ? (
                <div
                  className={`rounded-lg px-3 py-2 text-xs ${
                    estado.erro ? "bg-[color:var(--warn)]/10" : "bg-[color:var(--ok)]/10"
                  }`}
                >
                  <p className="font-medium">
                    {estado.erro ? "Ligado, mas com problemas" : "Ligado"}
                    {estado.nome_calendario ? ` · ${estado.nome_calendario}` : ""}
                  </p>
                  <p className="text-muted">
                    {estado.erro
                      ? estado.erro
                      : `${estado.total_eventos} eventos lidos${estado.atualizado_em ? ` às ${dataHora(estado.atualizado_em)}` : ""}.`}
                    {estado.ligado_em ? ` Ligado desde ${dataHora(estado.ligado_em)}.` : ""}
                  </p>
                </div>
              ) : (
                <p className="rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted">Ainda não está ligado.</p>
              )}
            </div>

            {administrador ? (
              <FormularioLigarGoogle acao={ligarGoogle} urlAtual={estado.url} />
            ) : (
              <p className="px-4 text-xs text-muted">Só um administrador pode ligar ou desligar o Google Calendar.</p>
            )}

            {estado.ligado && (
              <div className="flex flex-wrap items-center gap-2 px-4">
                <form action={atualizarGoogle}>
                  <input type="hidden" name="voltar_para" value="/calendario/google" />
                  <button type="submit" className="btn px-2 py-1 text-xs">
                    Atualizar agora
                  </button>
                </form>
                {administrador && (
                  <form action={desligarGoogle}>
                    <BotaoConfirmar mensagem="Desligar o Google Calendar? Os eventos do Google deixam de aparecer no CRM." className="btn-perigo rounded-lg px-2 py-1 text-xs">
                      Desligar
                    </BotaoConfirmar>
                  </form>
                )}
              </div>
            )}

            <div className="space-y-3 border-t border-line p-4">
              <p className="font-medium">Onde encontrar o endereço secreto</p>
              <ol className="list-decimal space-y-1.5 pl-5">
                <li>
                  Num computador, abra <span className="font-medium">calendar.google.com</span> e entre em{" "}
                  <span className="font-medium">Definições</span> (a roda dentada).
                </li>
                <li>
                  À esquerda, em <span className="font-medium">Definições dos meus calendários</span>, escolha o calendário
                  que quer ver no CRM.
                </li>
                <li>
                  Desça até <span className="font-medium">Integrar calendário</span> e copie o{" "}
                  <span className="font-medium">Endereço secreto em formato iCal</span>.
                </li>
                <li>Cole-o acima e carregue em Ligar.</li>
              </ol>
              <p className="rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted">
                O endereço secreto dá acesso de leitura ao calendário a quem o tiver. Fica guardado no CRM e só os
                administradores o veem. Se um dia quiser cortar o acesso, use “Repor” ao lado do endereço nas definições
                do Google e volte a ligar aqui.
              </p>
            </div>
          </div>
        </Seccao>
      </div>
    </>
  );
}
