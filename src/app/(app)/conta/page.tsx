import { exigirSessao } from "@/lib/auth";
import { alterarMinhaPalavraPasse } from "@/lib/actions/utilizadores";
import { CabecalhoPagina, Detalhe, Seccao } from "@/components/ui";
import { FormularioMinhaPalavraPasse } from "@/components/formularios-utilizadores";

export const dynamic = "force-dynamic";

export default async function MinhaConta() {
  const eu = await exigirSessao();

  return (
    <>
      <CabecalhoPagina titulo="A minha conta" descricao="Os seus dados de acesso ao CRM." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Seccao titulo="Dados">
          <dl className="grid grid-cols-2 gap-4 p-4">
            <Detalhe rotulo="Nome">{eu.nome}</Detalhe>
            <Detalhe rotulo="Email">{eu.email}</Detalhe>
            <Detalhe rotulo="Perfil">{eu.administrador ? "Administrador" : "Utilizador"}</Detalhe>
          </dl>
        </Seccao>

        <Seccao titulo="Alterar palavra-passe">
          <FormularioMinhaPalavraPasse acao={alterarMinhaPalavraPasse} />
        </Seccao>
      </div>
    </>
  );
}
