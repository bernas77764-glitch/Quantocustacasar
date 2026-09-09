import { exigirSessao } from "@/lib/auth";
import { listarDespesas } from "@/lib/queries/despesas";

export const dynamic = "force-dynamic";

/** Escapa um campo para CSV com separador `;` (o que o Excel pt-PT espera). */
function celula(valor: unknown): string {
  const texto = valor === null || valor === undefined ? "" : String(valor);
  return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

const eur = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

export async function GET(pedido: Request) {
  await exigirSessao();
  const sp = new URL(pedido.url).searchParams;
  const despesas = listarDespesas({
    de: sp.get("de") ?? undefined,
    ate: sp.get("ate") ?? undefined,
    categoria_id: Number(sp.get("categoria_id")) || undefined,
    q: sp.get("q") ?? undefined,
  });

  const cabecalho = ["Data", "Descrição", "Categoria", "Pago a", "Método", "Cliente", "Base (EUR)", "Taxa IVA (%)", "IVA (EUR)", "Total (EUR)", "Notas"];
  const linhas = despesas.map((d) =>
    [
      d.data,
      d.descricao,
      d.categoria_nome,
      d.fornecedor,
      d.metodo,
      d.cliente_nome,
      eur(d.valor_cents),
      d.iva_pct === null ? "" : String(d.iva_pct).replace(".", ","),
      eur(d.iva_cents),
      eur(d.total_cents),
      d.notas,
    ].map(celula).join(";"),
  );

  // O BOM faz o Excel reconhecer UTF-8 e mostrar os acentos corretamente.
  const csv = `﻿${[cabecalho.join(";"), ...linhas].join("\r\n")}\r\n`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="despesas-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
