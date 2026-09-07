import { notFound } from "next/navigation";
import { obterFornecedor } from "@/lib/queries/fornecedores";
import { FormularioFornecedor } from "@/components/formulario-fornecedor";
import { CabecalhoPagina } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function EditarFornecedor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const fornecedor = obterFornecedor(Number(id));
  if (!fornecedor) notFound();

  return (
    <>
      <CabecalhoPagina titulo={`Editar ${fornecedor.nome}`} />
      <FormularioFornecedor fornecedor={fornecedor} />
    </>
  );
}
