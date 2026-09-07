"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LIGACOES = [
  { href: "/", rotulo: "Painel", icone: "◧" },
  { href: "/clientes", rotulo: "Clientes", icone: "◍" },
  { href: "/fornecedores", rotulo: "Fornecedores", icone: "◈" },
  { href: "/contratacoes", rotulo: "Contratações", icone: "◇" },
  { href: "/pagamentos", rotulo: "Pagamentos", icone: "€" },
];

function ativo(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Navegacao() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      {LIGACOES.map((l) => {
        const selecionado = ativo(pathname, l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={selecionado ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition ${
              selecionado
                ? "bg-brand-soft text-brand"
                : "text-muted hover:bg-surface-2 hover:text-ink"
            }`}
          >
            <span aria-hidden className="w-4 text-center opacity-70">
              {l.icone}
            </span>
            {l.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
