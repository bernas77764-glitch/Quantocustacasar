import { exigirSessao } from "@/lib/auth";
import { MULT_BASE, RUBRICAS_BASE, tabelaAtual } from "@/lib/precos";
import { guardarPrecos, importarPrecos, reporPrecos } from "@/lib/actions/precos";
import { data } from "@/lib/format";
import { CabecalhoPagina, Seccao } from "@/components/ui";
import { FormularioImportar, FormularioPrecos } from "@/components/formulario-precos";
import { BotaoConfirmar } from "@/components/formulario-auto";

export const dynamic = "force-dynamic";

export default async function Precos() {
  await exigirSessao();
  const { tabela, guardada } = tabelaAtual();

  return (
    <>
      <CabecalhoPagina
        titulo="Tabela de preços"
        descricao={
          guardada
            ? `Valores do CRM, guardados em ${data(tabela.atualizado)}. O site vai buscá-los ao abrir.`
            : "Ainda são os valores com que o site nasceu. O que guardar aqui passa a valer para toda a gente."
        }
        acoes={
          guardada ? (
            <form action={reporPrecos}>
              <BotaoConfirmar mensagem="Voltar aos valores originais do site? Os valores guardados no CRM perdem-se.">
                Repor valores do site
              </BotaoConfirmar>
            </form>
          ) : undefined
        }
      />

      <FormularioPrecos
        acao={guardarPrecos}
        rubricas={RUBRICAS_BASE}
        multiplicadores={MULT_BASE}
        tabela={tabela}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Seccao titulo="Importar do site">
          <FormularioImportar acao={importarPrecos} />
        </Seccao>
        <Seccao titulo="Como chega ao site">
          <div className="space-y-2 p-4 text-sm text-muted">
            <p>
              O site pede esta tabela em <code className="rounded bg-surface-2 px-1">/api/public/precos</code>{" "}
              sempre que alguém o abre, e substitui os valores do ficheiro pelos daqui. Se o CRM
              não responder, fica com os do ficheiro — nunca fica sem preços.
            </p>
            <p>
              Uma alteração guardada aqui vê-se no site no carregamento seguinte da página, sem
              nova publicação.
            </p>
          </div>
        </Seccao>
      </div>
    </>
  );
}
