import Link from "next/link";
import type { EventoCalendario, TipoEvento } from "@/lib/types";
import { ROTULO_TIPO } from "@/lib/calendario";
import { apagarCompromisso } from "@/lib/actions/calendario";
import { BotaoConfirmar } from "@/components/formulario-auto";

/* As classes têm de aparecer literais para o Tailwind as gerar. */
const ESTILO: Record<TipoEvento | "atrasado", { ponto: string; chip: string; texto: string }> = {
  casamento: { ponto: "bg-brand", chip: "bg-brand text-brand-ink", texto: "text-brand" },
  servico: { ponto: "bg-sky-500", chip: "bg-sky-500/15 text-sky-800 dark:text-sky-200", texto: "text-sky-700 dark:text-sky-300" },
  vencimento: { ponto: "bg-amber-500", chip: "bg-amber-500/15 text-amber-800 dark:text-amber-200", texto: "text-amber-700 dark:text-amber-300" },
  atrasado: { ponto: "bg-red-500", chip: "bg-red-500/15 text-red-800 dark:text-red-200", texto: "text-red-700 dark:text-red-300" },
  compromisso: { ponto: "bg-emerald-500", chip: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200", texto: "text-emerald-700 dark:text-emerald-300" },
  google: { ponto: "bg-violet-500", chip: "bg-violet-500/15 text-violet-800 dark:text-violet-200", texto: "text-violet-700 dark:text-violet-300" },
};

function estiloDe(e: EventoCalendario) {
  return ESTILO[e.tipo === "vencimento" && e.atrasado ? "atrasado" : e.tipo];
}

export function LegendaCalendario() {
  const itens: [TipoEvento | "atrasado", string][] = [
    ["casamento", "Casamento"],
    ["servico", "Data de serviço"],
    ["vencimento", "Vencimento"],
    ["atrasado", "Em atraso"],
    ["compromisso", "Compromisso"],
    ["google", "Google Calendar"],
  ];
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      {itens.map(([tipo, rotulo]) => (
        <li key={tipo} className="flex items-center gap-1.5">
          <span aria-hidden className={`inline-block h-2 w-2 rounded-full ${ESTILO[tipo].ponto}`} />
          {rotulo}
        </li>
      ))}
    </ul>
  );
}

export function Ponto({ evento }: { evento: EventoCalendario }) {
  return <span aria-hidden className={`inline-block h-1.5 w-1.5 rounded-full ${estiloDe(evento).ponto}`} />;
}

/** Entrada compacta numa célula do mês. */
export function Chip({ evento, dia }: { evento: EventoCalendario; dia: string }) {
  const s = estiloDe(evento);
  const conteudo = (
    <>
      {evento.hora && <span className="mr-1 tabular-nums opacity-80">{evento.hora}</span>}
      {evento.titulo}
    </>
  );
  const classe = `block truncate rounded px-1.5 py-0.5 text-[11px] leading-4 font-medium ${s.chip}`;
  return (
    <Link href={`#d-${dia}`} className={classe} title={`${ROTULO_TIPO[evento.tipo]} · ${evento.titulo}`}>
      {conteudo}
    </Link>
  );
}

/** Entrada completa na agenda do mês. */
export function LinhaAgenda({ evento, voltarPara }: { evento: EventoCalendario; voltarPara: string }) {
  const s = estiloDe(evento);
  const horario = evento.hora ? `${evento.hora}${evento.hora_fim ? `–${evento.hora_fim}` : ""}` : "Dia inteiro";
  const rotulo = evento.tipo === "vencimento" && evento.atrasado ? "Vencimento em atraso" : ROTULO_TIPO[evento.tipo];
  return (
    <li className="flex gap-3 px-4 py-3">
      <div className="w-20 shrink-0 pt-0.5 text-xs tabular-nums text-muted">{horario}</div>
      <div className="min-w-0 flex-1">
        <p className={`text-[11px] font-medium tracking-wide uppercase ${s.texto}`}>{rotulo}</p>
        <p className="text-sm font-medium">
          {evento.href ? (
            <Link href={evento.href} className="hover:text-brand">
              {evento.titulo}
            </Link>
          ) : (
            evento.titulo
          )}
          {evento.data_fim && (
            <span className="ml-1 text-xs font-normal text-muted">
              até {evento.data_fim.split("-").reverse().join("/")}
            </span>
          )}
        </p>
        {(evento.detalhe || evento.local) && (
          <p className="text-xs whitespace-pre-line text-muted">
            {[evento.local, evento.detalhe].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-start gap-1">
        {evento.google_url && (
          <a
            href={evento.google_url}
            target="_blank"
            rel="noreferrer"
            className="btn px-2 py-1 text-xs whitespace-nowrap"
            title="Adicionar este evento ao seu Google Calendar"
          >
            + Google
          </a>
        )}
        {evento.compromisso_id && (
          <form action={apagarCompromisso}>
            <input type="hidden" name="id" value={evento.compromisso_id} />
            <input type="hidden" name="voltar_para" value={voltarPara} />
            <BotaoConfirmar mensagem={`Eliminar o compromisso "${evento.titulo}"?`} className="btn-perigo rounded-lg px-2 py-1 text-xs">
              ✕
            </BotaoConfirmar>
          </form>
        )}
      </div>
    </li>
  );
}
