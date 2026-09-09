/**
 * Base, IVA e total a partir do que a pessoa escreveu: o valor de um recibo
 * costuma já ter IVA; o de um orçamento, não. Sem taxa, não há IVA.
 * Sem dependências, para correr também no browser (pré-visualização).
 */
export function calcularIva(
  valorCents: number,
  ivaPct: number | null,
  valorComIva: boolean,
): { valor_cents: number; iva_cents: number; total_cents: number } {
  if (ivaPct === null || !(ivaPct > 0)) return { valor_cents: valorCents, iva_cents: 0, total_cents: valorCents };
  if (valorComIva) {
    const base = Math.round(valorCents / (1 + ivaPct / 100));
    return { valor_cents: base, iva_cents: valorCents - base, total_cents: valorCents };
  }
  const iva = Math.round((valorCents * ivaPct) / 100);
  return { valor_cents: valorCents, iva_cents: iva, total_cents: valorCents + iva };
}
