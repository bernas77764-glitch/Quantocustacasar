import Link from "next/link";
import { exigirSessao } from "@/lib/auth";
import { listarCategoriasDespesa } from "@/lib/queries/despesas";
import { listarClientesSimples } from "@/lib/queries/clientes";
import { guardarDespesa } from "@/lib/actions/despesas";
import { hojeLisboa } from "@/lib/tempo";
import { CabecalhoPagina } from "@/components/ui";
import { FormularioDespesa } from "@/components/formularios-despesas";

export const dynamic = "force-dynamic";

type Params = Promise<Record<string, string | string[] | undefined>>;

export default async function NovaDespesa({ searchParams }: { searchParams: Params }) {
  await exigirSessao();
  const sp = await searchParams;
  const voltar = typeof sp.voltar_para === "string" && sp.voltar_para.startsWith("/") ? sp.voltar_para : "/despesas";

  return (
    <>
      <CabecalhoPagina
        titulo="Nova despesa"
        descricao="Escreva o valor como está no recibo e escolha a taxa de IVA: o CRM separa a base do imposto."
        acoes={
          <Link href={voltar} className="btn">
            Cancelar
          </Link>
        }
      />
      <div className="cartao max-w-4xl">
        <FormularioDespesa
          acao={guardarDespesa}
          categorias={listarCategoriasDespesa()}
          clientes={listarClientesSimples()}
          dataInicial={hojeLisboa()}
          voltarPara={voltar}
        />
      </div>
    </>
  );
}
