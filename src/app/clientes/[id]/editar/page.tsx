import { notFound } from "next/navigation";
import { obterCliente } from "@/lib/queries/clientes";
import { FormularioCliente } from "@/components/formulario-cliente";
import { CabecalhoPagina } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function EditarCliente({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cliente = obterCliente(Number(id));
  if (!cliente) notFound();

  return (
    <>
      <CabecalhoPagina titulo={`Editar ${cliente.nome}`} />
      <FormularioCliente cliente={cliente} />
    </>
  );
}
