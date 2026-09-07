const moeda = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
});

const moedaCompacta = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

/** Formata cêntimos como euros: 125050 -> "1250,50 €". */
export function euros(cents: number | null | undefined): string {
  return moeda.format((cents ?? 0) / 100);
}

/** Formata cêntimos sem casas decimais, para cartões de indicadores. */
export function eurosCompacto(cents: number | null | undefined): string {
  return moedaCompacta.format((cents ?? 0) / 100);
}

/**
 * Converte texto introduzido pelo utilizador em cêntimos.
 * Aceita "1250", "1250,50", "1.250,50" e "1250.50".
 */
export function paraCents(valor: unknown): number | null {
  if (valor === null || valor === undefined) return null;
  const bruto = String(valor).trim();
  if (bruto === "") return null;

  let limpo = bruto.replace(/[^\d.,-]/g, "");
  const ultimaVirgula = limpo.lastIndexOf(",");
  const ultimoPonto = limpo.lastIndexOf(".");

  if (ultimaVirgula !== -1 && ultimoPonto !== -1) {
    // O separador que aparece mais à direita é o decimal.
    const decimal = ultimaVirgula > ultimoPonto ? "," : ".";
    const milhares = decimal === "," ? "." : ",";
    limpo = limpo.split(milhares).join("").replace(decimal, ".");
  } else if (ultimaVirgula !== -1) {
    // "1,50" é decimal; "1,500" (3 dígitos) é separador de milhares.
    const casas = limpo.length - ultimaVirgula - 1;
    limpo = casas > 0 && casas <= 2
      ? limpo.replace(",", ".")
      : limpo.split(",").join("");
  } else if (ultimoPonto !== -1) {
    const casas = limpo.length - ultimoPonto - 1;
    if (casas === 3 && limpo.split(".").length === 2 && !limpo.startsWith("0."))
      limpo = limpo.split(".").join("");
  }

  const numero = Number(limpo);
  if (!Number.isFinite(numero)) return null;
  return Math.round(numero * 100);
}

/** Valor em cêntimos para o `value` de um <input type="number">. */
export function centsParaInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(2);
}

/** "2026-06-13" -> "13/06/2026". */
export function data(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function dataHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Dias até uma data ISO; negativo se já passou. */
export function diasAte(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const alvo = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(alvo.getTime())) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.round((alvo.getTime() - hoje.getTime()) / 86_400_000);
}

export function percentagem(valor: number): string {
  return `${new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 1 }).format(valor)}%`;
}
