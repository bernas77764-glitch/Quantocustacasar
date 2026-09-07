import Link from "next/link";
import { Navegacao } from "@/components/nav";
import { exigirSessao } from "@/lib/auth";
import { sair } from "@/lib/actions/auth";

/**
 * Guarda de autenticação de todas as páginas do CRM. As Server Actions e as
 * rotas de API verificam a sessão por si próprias — este layout não as cobre.
 */
export default async function LayoutAplicacao({
  children,
}: {
  children: React.ReactNode;
}) {
  const utilizador = await exigirSessao();

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col md:flex-row">
      <aside className="flex flex-col border-b border-line bg-surface px-4 py-4 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-r md:border-b-0 md:py-6">
        <Link href="/" className="mb-5 block px-3">
          <span className="block text-sm font-semibold tracking-tight">
            Quanto Custa Casar
          </span>
          <span className="block text-xs text-muted">CRM de casamentos</span>
        </Link>

        <Navegacao administrador={utilizador.administrador === 1} />

        <div className="mt-4 border-t border-line pt-3 md:mt-auto md:border-t md:pt-4">
          <p className="px-3 text-sm font-medium">{utilizador.nome}</p>
          <p className="px-3 text-xs break-words text-muted">{utilizador.email}</p>
          <div className="mt-2 flex items-center gap-3 px-3">
            <Link href="/conta" className="text-xs text-muted hover:text-brand">
              A minha conta
            </Link>
            <form action={sair}>
              <button type="submit" className="text-xs text-muted hover:text-brand">
                Terminar sessão
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
