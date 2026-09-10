import { redirect } from "next/navigation";

/** Endereço antigo do pedido de disponibilidade; passou para a página genérica de emails. */
export default async function PedidoAntigo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/emails/novo?modelo=fornecedor_disponibilidade&contratacao_id=${Number(id) || 0}`);
}
