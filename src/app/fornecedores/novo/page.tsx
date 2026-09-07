import { FormularioFornecedor } from "@/components/formulario-fornecedor";
import { CabecalhoPagina } from "@/components/ui";

export default function NovoFornecedor() {
  return (
    <>
      <CabecalhoPagina
        titulo="Novo fornecedor"
        descricao="Adicione um parceiro ao catálogo para o poder associar a clientes."
      />
      <FormularioFornecedor />
    </>
  );
}
