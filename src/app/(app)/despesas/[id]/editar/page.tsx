import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirSessao } from "@/lib/auth";
import { listarCategoriasDespesa, obterDespesa } from "@/lib/queries/despesas";
import { listarClientesSimples } from "@/lib/queries/clientes";
import { apagarDespesa, guardarDespesa } from "@/lib/actions/despesas";
import { CabecalhoPagina } from "@/components/ui";
import { BotaoConfirmar } from "@/components/formulario-auto";
import { FormularioDespesa } from "@/components/formularios-despesas";

export const dynamic = "force-dynamic";

type Params = Promise<Record<string, string | string[] | undefined>>;

export default async function EditarDespesa({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Params;
}) {
  await exigirSessao();
  const { id: idTexto } = await params;
  const sp = await searchParams;
  const despesa = obterDespesa(Number(idTexto));
  if (!despesa) notFound();
  const voltar = typeof sp.voltar_para === "string" && sp.voltar_para.startsWith("/") ? sp.voltar_para : "/despesas";

  return (
    <>
      <CabecalhoPagina
        titulo="Editar despesa"
        descricao={despesa.descricao}
        acoes={
          <>
            <Link href={voltar} className="btn">
              Cancelar
            </Link>
            <form action={apagarDespesa}>
              <input type="hidden" name="id" value={despesa.id} />
              <input type="hidden" name="voltar_para" value={voltar} />
              <BotaoConfirmar mensagem={`Eliminar a despesa "${despesa.descricao}"?`}>Eliminar</BotaoConfirmar>
            </form>
          </>
        }
      />
      <div className="cartao max-w-4xl">
        <FormularioDespesa
          acao={guardarDespesa}
          categorias={listarCategoriasDespesa()}
          clientes={listarClientesSimples()}
          despesa={despesa}
          dataInicial={despesa.data}
          voltarPara={voltar}
        />
      </div>
    </>
  );
}
