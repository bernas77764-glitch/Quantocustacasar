import { redirect } from "next/navigation";
import { contarUtilizadores, obterSessao } from "@/lib/auth";
import { criarPrimeiraConta, entrar } from "@/lib/actions/auth";
import { FormularioLogin } from "@/components/formulario-login";

export const dynamic = "force-dynamic";

export const metadata = { title: "Entrar · CRM Quanto Custa Casar" };

export default async function Login() {
  if (await obterSessao()) redirect("/");

  const primeiraConta = contarUtilizadores() === 0;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-lg font-semibold tracking-tight">Quanto Custa Casar</h1>
          <p className="text-sm text-muted">CRM de casamentos</p>
        </div>

        <div className="cartao p-6">
          {primeiraConta && (
            <div className="mb-5">
              <h2 className="text-sm font-semibold">Primeira utilização</h2>
              <p className="mt-1 text-sm text-muted">
                Ainda não existe nenhuma conta. Crie a conta de administração
                para começar a usar o CRM.
              </p>
            </div>
          )}

          <FormularioLogin
            acao={primeiraConta ? criarPrimeiraConta : entrar}
            primeiraConta={primeiraConta}
          />
        </div>

        {!primeiraConta && (
          <p className="mt-4 text-center text-xs text-muted">
            Novas contas criam-se no servidor com{" "}
            <code className="rounded bg-surface-2 px-1 py-0.5">
              npm run criar-utilizador
            </code>
            .
          </p>
        )}
      </div>
    </main>
  );
}
