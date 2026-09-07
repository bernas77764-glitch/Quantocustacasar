import { FormularioCliente } from "@/components/formulario-cliente";
import { CabecalhoPagina } from "@/components/ui";

export default function NovoCliente() {
  return (
    <>
      <CabecalhoPagina
        titulo="Novo cliente"
        descricao="Registe um casal e comece a associar fornecedores."
      />
      <FormularioCliente />
    </>
  );
}
