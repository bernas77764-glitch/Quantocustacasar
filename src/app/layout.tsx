import type { Metadata } from "next";
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
      <body className="min-h-full">{children}</body>
    </html>
  );
}
