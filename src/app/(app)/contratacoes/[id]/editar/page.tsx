import { notFound } from "next/navigation";
import { obterContratacao } from "@/lib/queries/contratacoes";
import { listarClientesSimples } from "@/lib/queries/clientes";
import { listarFornecedoresSimples } from "@/lib/queries/fornecedores";
import { FormularioContratacao } from "@/components/formulario-contratacao";
import { CabecalhoPagina } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function EditarContratacao({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contratacao = obterContratacao(Number(id));
  if (!contratacao) notFound();

  return (
    <>
      <CabecalhoPagina
        titulo="Editar contratação"
        descricao={`${contratacao.cliente_nome} · ${contratacao.fornecedor_nome}`}
      />
      <FormularioContratacao
        clientes={listarClientesSimples()}
        fornecedores={listarFornecedoresSimples()}
        contratacao={contratacao}
      />
    </>
  );
}
