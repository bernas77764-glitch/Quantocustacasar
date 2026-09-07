import { listarPagamentos } from "@/lib/queries/pagamentos";
import { exigirSessao } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Escapa um campo para CSV com separador `;` (o que o Excel pt-PT espera). */
function celula(valor: unknown): string {
  const texto = valor === null || valor === undefined ? "" : String(valor);
  return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

export async function GET(pedido: Request) {
  // A exportação expõe dados financeiros: exige sessão, como as páginas.
  await exigirSessao();

  const sp = new URL(pedido.url).searchParams;
  const pagamentos = listarPagamentos({
    q: sp.get("q") ?? undefined,
    estado: sp.get("estado") ?? undefined,
    cliente_id: Number(sp.get("cliente_id")) || undefined,
    desde: sp.get("desde") ?? undefined,
    ate: sp.get("ate") ?? undefined,
  });

  const cabecalho = [
    "Cliente",
    "Fornecedor",
    "Categoria",
    "Descrição",
    "Vencimento",
    "Data de pagamento",
    "Método",
    "Estado",
    "Referência",
    "Valor (EUR)",
  ];

  const linhas = pagamentos.map((p) =>
    [
      p.cliente_nome,
      p.fornecedor_nome,
      p.categoria,
      p.descricao,
      p.data_prevista,
      p.data_pagamento,
      p.metodo,
      p.atrasado ? "em atraso" : p.estado,
      p.referencia,
      (p.valor_cents / 100).toFixed(2).replace(".", ","),
    ].map(celula).join(";"),
  );

  // O BOM faz o Excel reconhecer UTF-8 e mostrar os acentos corretamente.
  const csv = `﻿${[cabecalho.join(";"), ...linhas].join("\r\n")}\r\n`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pagamentos-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
