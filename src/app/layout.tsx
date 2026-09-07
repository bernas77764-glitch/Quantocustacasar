import type { Metadata } from "next";
import Link from "next/link";
import { Navegacao } from "@/components/nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM · Quanto Custa Casar",
  description:
    "Gestão de clientes, fornecedores, contratações e pagamentos de casamentos.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-PT" className="h-full">
      <body className="min-h-full">
        <div className="mx-auto flex max-w-[1400px] flex-col md:flex-row">
          <aside className="border-b border-line bg-surface px-4 py-4 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-r md:border-b-0 md:py-6">
            <Link href="/" className="mb-5 block px-3">
              <span className="block text-sm font-semibold tracking-tight">
                Quanto Custa Casar
              </span>
              <span className="block text-xs text-muted">CRM de casamentos</span>
            </Link>
            <Navegacao />
          </aside>
          <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
