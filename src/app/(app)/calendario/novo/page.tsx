import Link from "next/link";
import { exigirSessao } from "@/lib/auth";
import { listarClientesSimples } from "@/lib/queries/clientes";
import { listarFornecedoresSimples } from "@/lib/queries/fornecedores";
import { guardarCompromisso } from "@/lib/actions/calendario";
import { dataValida, hojeLisboa } from "@/lib/tempo";
import { CabecalhoPagina } from "@/components/ui";
import { FormularioCompromisso } from "@/components/formularios-calendario";

export const dynamic = "force-dynamic";

type Params = Promise<Record<string, string | string[] | undefined>>;

function primeiro(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" ? v : undefined;
}

export default async function NovoCompromisso({ searchParams }: { searchParams: Params }) {
  await exigirSessao();
  const sp = await searchParams;
  const data = primeiro(sp.data);
  const voltar = primeiro(sp.voltar_para);
  const clienteId = Number(primeiro(sp.cliente_id)) || undefined;
  const fornecedorId = Number(primeiro(sp.fornecedor_id)) || undefined;
  const dataInicial = dataValida(data) ? data : hojeLisboa();

  return (
    <>
      <CabecalhoPagina
        titulo="Novo compromisso"
        descricao="Reuniões, visitas, chamadas: fica no calendário do CRM e, se o Google Calendar estiver ligado, no seu telemóvel."
        acoes={
          <Link href={voltar && voltar.startsWith("/") ? voltar : `/calendario?mes=${dataInicial.slice(0, 7)}`} className="btn">
            Cancelar
          </Link>
        }
      />
      <div className="cartao max-w-4xl">
        <FormularioCompromisso
          acao={guardarCompromisso}
          clientes={listarClientesSimples()}
          fornecedores={listarFornecedoresSimples()}
          dataInicial={dataInicial}
          clienteId={clienteId}
          fornecedorId={fornecedorId}
          voltarPara={voltar && voltar.startsWith("/") ? voltar : undefined}
        />
      </div>
    </>
  );
}
