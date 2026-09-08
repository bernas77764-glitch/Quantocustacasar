import Link from "next/link";
import { exigirSessao } from "@/lib/auth";
import {
  chaveMes,
  eventosDoCrm,
  gradeDoMes,
  mesDe,
  mesSeguinte,
  porDia,
} from "@/lib/calendario";
import { eventosGoogle, eventosGoogleNaJanela } from "@/lib/google-calendar";
import { atualizarGoogle } from "@/lib/actions/calendario";
import { DIAS_SEMANA_CURTOS, dataPorExtenso, hojeLisboa, nomeDoMes } from "@/lib/tempo";
import { dataHora } from "@/lib/format";
import { CabecalhoPagina, Seccao } from "@/components/ui";
import { Chip, LegendaCalendario, LinhaAgenda, Ponto } from "@/components/calendario";

export const dynamic = "force-dynamic";

type Params = Promise<Record<string, string | string[] | undefined>>;

function primeiro(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" ? v : undefined;
}

export default async function Calendario({ searchParams }: { searchParams: Params }) {
  const utilizador = await exigirSessao();
  const sp = await searchParams;
  const { ano, mes } = mesDe(primeiro(sp.mes));
  const grade = gradeDoMes(ano, mes);
  const primeiroDia = grade[0][0];
  const ultimoDia = grade[grade.length - 1][6];
  const chave = chaveMes(ano, mes);
  const hoje = hojeLisboa();
  const anterior = mesSeguinte(ano, mes, -1);
  const seguinte = mesSeguinte(ano, mes, 1);
  const voltarPara = `/calendario?mes=${chave}`;

  const doCrm = eventosDoCrm(primeiroDia, ultimoDia);
  const { eventos: icsGoogle, estado: google } = await eventosGoogle();
  const doGoogle = eventosGoogleNaJanela(icsGoogle, primeiroDia, ultimoDia);
  const mapa = porDia([...doCrm, ...doGoogle], primeiroDia, ultimoDia);

  const diasDoMes = grade.flat().filter((d) => d.startsWith(chave));
  const totalNoMes = diasDoMes.reduce((s, d) => s + (mapa.get(d)?.length ?? 0), 0);
  const administrador = utilizador.administrador === 1;

  return (
    <>
      <CabecalhoPagina
        titulo="Calendário"
        descricao="Casamentos, datas de serviço, vencimentos e compromissos — e o seu Google Calendar, quando ligado."
        acoes={
          <>
            <Link href={`/calendario/novo?data=${chave.startsWith(hoje.slice(0, 7)) ? hoje : `${chave}-01`}`} className="btn btn-principal">
              Novo compromisso
            </Link>
            <Link href="/calendario/google" className="btn">
              <span
                aria-hidden
                className={`mr-2 inline-block h-2 w-2 rounded-full ${google.ligado ? (google.erro ? "bg-amber-500" : "bg-emerald-500") : "bg-zinc-400"}`}
              />
              Google Calendar
            </Link>
          </>
        }
      />

      <div className="cartao flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <Link href={`/calendario?mes=${chaveMes(anterior.ano, anterior.mes)}`} className="btn px-2.5" aria-label="Mês anterior">
            ‹
          </Link>
          <h2 className="min-w-44 text-center text-base font-semibold">{nomeDoMes(ano, mes)}</h2>
          <Link href={`/calendario?mes=${chaveMes(seguinte.ano, seguinte.mes)}`} className="btn px-2.5" aria-label="Mês seguinte">
            ›
          </Link>
          <Link href="/calendario" className="btn px-2.5 text-xs">
            Hoje
          </Link>
        </div>
        <LegendaCalendario />
      </div>

      <div className="cartao mt-4 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-line bg-surface-2 text-center text-[11px] font-medium tracking-wide text-muted uppercase">
          {DIAS_SEMANA_CURTOS.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        {grade.map((semana, i) => (
          <div key={i} className="grid grid-cols-7 border-b border-line last:border-b-0">
            {semana.map((dia) => {
              const eventos = mapa.get(dia) ?? [];
              const doMes = dia.startsWith(chave);
              const ehHoje = dia === hoje;
              const numero = Number(dia.slice(8, 10));
              return (
                <div
                  key={dia}
                  className={`group relative min-h-14 border-r border-line p-1 last:border-r-0 sm:min-h-24 sm:p-1.5 ${
                    doMes ? "" : "bg-surface-2/60 text-muted"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Link
                      href={`#d-${dia}`}
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                        ehHoje ? "bg-brand text-brand-ink" : "hover:bg-surface-2"
                      }`}
                    >
                      {numero}
                    </Link>
                    {doMes && (
                      <Link
                        href={`/calendario/novo?data=${dia}`}
                        aria-label={`Novo compromisso a ${numero}`}
                        className="hidden h-5 w-5 items-center justify-center rounded text-xs text-muted opacity-0 transition group-hover:opacity-100 hover:bg-surface-2 sm:inline-flex"
                      >
                        +
                      </Link>
                    )}
                  </div>
                  {eventos.length > 0 && (
                    <>
                      <ul className="mt-1 hidden space-y-0.5 sm:block">
                        {eventos.slice(0, 3).map((e) => (
                          <li key={e.chave}>
                            <Chip evento={e} dia={dia} />
                          </li>
                        ))}
                        {eventos.length > 3 && (
                          <li>
                            <Link href={`#d-${dia}`} className="block px-1.5 text-[11px] text-muted hover:text-brand">
                              +{eventos.length - 3} mais
                            </Link>
                          </li>
                        )}
                      </ul>
                      <Link href={`#d-${dia}`} className="mt-1 flex flex-wrap gap-0.5 px-1 sm:hidden" aria-label={`${eventos.length} eventos`}>
                        {eventos.slice(0, 6).map((e) => (
                          <Ponto key={e.chave} evento={e} />
                        ))}
                      </Link>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {google.ligado && google.erro && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-[color:var(--warn)]/10 px-4 py-3 text-sm">
          <span className="flex-1">
            Não foi possível ler o Google Calendar: {google.erro}
            {google.atualizado_em ? ` A mostrar a última leitura, de ${dataHora(google.atualizado_em)}.` : ""}
          </span>
          <form action={atualizarGoogle}>
            <input type="hidden" name="voltar_para" value={voltarPara} />
            <button type="submit" className="btn px-2 py-1 text-xs">
              Tentar de novo
            </button>
          </form>
        </div>
      )}

      <div className="mt-6">
        <Seccao
          titulo={`Agenda de ${nomeDoMes(ano, mes)}`}
          vazio={totalNoMes === 0}
          acoes={
            google.ligado && !google.erro ? (
              <form action={atualizarGoogle} className="flex items-center gap-2 text-xs text-muted">
                <input type="hidden" name="voltar_para" value={voltarPara} />
                <span>
                  Google{google.nome_calendario ? ` · ${google.nome_calendario}` : ""}
                  {google.atualizado_em ? ` · lido às ${dataHora(google.atualizado_em).slice(-5)}` : ""}
                </span>
                <button type="submit" className="btn px-2 py-1 text-xs">
                  Atualizar
                </button>
              </form>
            ) : !google.ligado ? (
              <Link href="/calendario/google" className="text-xs text-muted hover:text-brand">
                {administrador ? "Ligar ao Google Calendar →" : "Google Calendar não ligado"}
              </Link>
            ) : null
          }
        >
          {totalNoMes === 0 ? (
            "Nada marcado neste mês. Use “Novo compromisso” ou toque no + de um dia."
          ) : (
            <div className="divide-y divide-line">
              {diasDoMes
                .filter((d) => (mapa.get(d)?.length ?? 0) > 0)
                .map((dia) => (
                  <section key={dia} id={`d-${dia}`} className="scroll-mt-4">
                    <h3
                      className={`flex items-center justify-between px-4 pt-3 pb-1 text-sm font-semibold ${
                        dia === hoje ? "text-brand" : ""
                      }`}
                    >
                      <span>
                        {dataPorExtenso(dia)}
                        {dia === hoje && <span className="ml-2 text-xs font-normal text-muted">hoje</span>}
                      </span>
                      <Link href={`/calendario/novo?data=${dia}`} className="text-xs font-normal text-muted hover:text-brand">
                        + compromisso
                      </Link>
                    </h3>
                    <ul className="divide-y divide-line/60">
                      {mapa.get(dia)!.map((e) => (
                        <LinhaAgenda key={e.chave} evento={e} voltarPara={`${voltarPara}#d-${dia}`} />
                      ))}
                    </ul>
                  </section>
                ))}
            </div>
          )}
        </Seccao>
      </div>
    </>
  );
}
