import { listarClientesSimples } from "@/lib/queries/clientes";
import { listarFornecedoresSimples } from "@/lib/queries/fornecedores";
import { FormularioContratacao } from "@/components/formulario-contratacao";
import { CabecalhoPagina } from "@/components/ui";

export const dynamic = "force-dynamic";

type Params = Promise<Record<string, string | string[] | undefined>>;

export default async function NovaContratacao({
  searchParams,
}: {
  searchParams: Params;
}) {
  const sp = await searchParams;
  const clienteId = Number(sp.cliente_id) || undefined;
  const fornecedorId = Number(sp.fornecedor_id) || undefined;

  return (
    <>
      <CabecalhoPagina
        titulo="Nova contratação"
        descricao="Ligue um cliente a um fornecedor e defina o valor acordado."
      />
      <FormularioContratacao
        clientes={listarClientesSimples()}
        fornecedores={listarFornecedoresSimples()}
        clienteIdInicial={clienteId}
        fornecedorIdInicial={fornecedorId}
      />
    </>
  );
}
