import { Etiqueta } from "@/components/ui";
import { data, euros } from "@/lib/format";
import type { PagamentoDetalhado } from "@/lib/types";

/**
 * Estado da comissão de um pagamento, para as tabelas: só existe comissão
 * depois de o casal pagar; a partir daí está a receber do fornecedor ou já
 * foi recebida.
 */
export function ComissaoBadge({ p }: { p: PagamentoDetalhado }) {
  if (p.estado !== "pago" || p.comissao_cents === 0) {
    return <span className="text-xs text-muted">—</span>;
  }
  if (p.comissao_a_receber) {
    return (
      <span className="inline-flex flex-col items-start gap-0.5">
        <Etiqueta tom="ambar">A receber do fornecedor</Etiqueta>
        <span className="text-sm font-semibold text-[color:var(--warn)] tabular-nums">
          {euros(p.comissao_cents)}
        </span>
      </span>
    );
  }
  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <Etiqueta tom="verde">Recebida {data(p.comissao_recebida_em)}</Etiqueta>
      <span className="text-sm tabular-nums text-muted">{euros(p.comissao_cents)}</span>
    </span>
  );
}
