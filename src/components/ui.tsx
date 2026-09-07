import Link from "next/link";
import type { ReactNode } from "react";
import {
  ROTULO_ESTADO_CLIENTE,
  ROTULO_ESTADO_CONTRATACAO,
  type EstadoCliente,
  type EstadoContratacao,
} from "@/lib/constants";

/* As classes têm de aparecer literais no código para o Tailwind as gerar. */
const TOM = {
  cinza: "bg-zinc-500/12 text-zinc-600 dark:text-zinc-300 ring-zinc-500/25",
  azul: "bg-sky-500/12 text-sky-700 dark:text-sky-300 ring-sky-500/25",
  indigo: "bg-indigo-500/12 text-indigo-700 dark:text-indigo-300 ring-indigo-500/25",
  violeta: "bg-violet-500/12 text-violet-700 dark:text-violet-300 ring-violet-500/25",
  ambar: "bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/30",
  verde: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 ring-emerald-500/25",
  vermelho: "bg-red-500/12 text-red-700 dark:text-red-300 ring-red-500/25",
} as const;

export type Tom = keyof typeof TOM;

export function Etiqueta({
  children,
  tom = "cinza",
}: {
  children: ReactNode;
  tom?: Tom;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap ${TOM[tom]}`}
    >
      {children}
    </span>
  );
}

const TOM_CLIENTE: Record<EstadoCliente, Tom> = {
  novo: "azul",
  contactado: "indigo",
  qualificado: "violeta",
  proposta: "ambar",
  ganho: "verde",
  perdido: "vermelho",
};

export function EstadoClienteBadge({ estado }: { estado: EstadoCliente }) {
  return (
    <Etiqueta tom={TOM_CLIENTE[estado] ?? "cinza"}>
      {ROTULO_ESTADO_CLIENTE[estado] ?? estado}
    </Etiqueta>
  );
}

const TOM_CONTRATACAO: Record<EstadoContratacao, Tom> = {
  proposta: "ambar",
  confirmada: "azul",
  concluida: "verde",
  cancelada: "cinza",
};

export function EstadoContratacaoBadge({ estado }: { estado: EstadoContratacao }) {
  return (
    <Etiqueta tom={TOM_CONTRATACAO[estado] ?? "cinza"}>
      {ROTULO_ESTADO_CONTRATACAO[estado] ?? estado}
    </Etiqueta>
  );
}

export function EstadoPagamentoBadge({
  estado,
  atrasado,
}: {
  estado: string;
  atrasado?: boolean;
}) {
  if (estado === "pago") return <Etiqueta tom="verde">Pago</Etiqueta>;
  if (estado === "cancelado") return <Etiqueta tom="cinza">Cancelado</Etiqueta>;
  if (atrasado) return <Etiqueta tom="vermelho">Em atraso</Etiqueta>;
  return <Etiqueta tom="ambar">Pendente</Etiqueta>;
}

export function CabecalhoPagina({
  titulo,
  descricao,
  acoes,
}: {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
        {descricao && <p className="mt-1 text-sm text-muted">{descricao}</p>}
      </div>
      {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
    </div>
  );
}

export function Indicador({
  rotulo,
  valor,
  detalhe,
  tom,
  href,
}: {
  rotulo: string;
  valor: string;
  detalhe?: string;
  tom?: "ok" | "warn" | "bad";
  href?: string;
}) {
  const cor =
    tom === "ok"
      ? "text-[color:var(--ok)]"
      : tom === "warn"
        ? "text-[color:var(--warn)]"
        : tom === "bad"
          ? "text-[color:var(--bad)]"
          : "text-ink";

  const conteudo = (
    <>
      <p className="text-xs font-medium tracking-wide text-muted uppercase">
        {rotulo}
      </p>
      <p className={`mt-2 text-2xl font-semibold tracking-tight ${cor}`}>{valor}</p>
      {detalhe && <p className="mt-1 text-xs text-muted">{detalhe}</p>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="cartao block p-4 transition hover:border-brand/50">
        {conteudo}
      </Link>
    );
  }
  return <div className="cartao p-4">{conteudo}</div>;
}

export function Seccao({
  titulo,
  acoes,
  children,
  vazio,
}: {
  titulo: string;
  acoes?: ReactNode;
  children: ReactNode;
  vazio?: boolean;
}) {
  return (
    <section className="cartao overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold">{titulo}</h2>
        {acoes}
      </header>
      {vazio ? <div className="px-4 py-8 text-center text-sm text-muted">{children}</div> : children}
    </section>
  );
}

export function SemResultados({ children }: { children: ReactNode }) {
  return (
    <div className="px-4 py-12 text-center text-sm text-muted">{children}</div>
  );
}

export function Campo({
  rotulo,
  children,
  className = "",
}: {
  rotulo: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="rotulo">{rotulo}</span>
      {children}
    </label>
  );
}

export function Detalhe({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">
        {rotulo}
      </dt>
      <dd className="mt-1 text-sm break-words">{children}</dd>
    </div>
  );
}

/** Barra de progresso de recebimento (pago vs. contratado). */
export function BarraProgresso({ pago, total }: { pago: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((pago / total) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-[color:var(--ok)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-9 shrink-0 text-right text-xs text-muted tabular-nums">
        {pct}%
      </span>
    </div>
  );
}
