import Link from "next/link";
import { exigirSessao } from "@/lib/auth";
import {
  despesasPorCategoria,
  listarCategoriasDespesa,
  listarDespesas,
  lucroPorMes,
  resumoDoPeriodo,
  type FiltrosDespesas,
} from "@/lib/queries/despesas";
import {
  apagarCategoria,
  apagarDespesa,
  criarCategoria,
  renomearCategoria,
} from "@/lib/actions/despesas";
import { euros, eurosCompacto, data, percentagem } from "@/lib/format";
import {
  hojeLisboa,
  nomeDoMes,
  partesDeIso,
  somarDias,
  somarMeses,
} from "@/lib/tempo";
import {
  CabecalhoPagina,
  Indicador,
  Seccao,
  SemResultados,
} from "@/components/ui";
import { BotaoConfirmar } from "@/components/formulario-auto";
import { FormularioCategoria } from "@/components/formularios-despesas";

export const dynamic = "force-dynamic";

type Params = Promise<Record<string, string | string[] | undefined>>;

function primeiro(v: string | string[] | undefined): string {
  return typeof v === "string" ? v : "";
}

const DATA = /^\d{4}-\d{2}-\d{2}$/;

/** O período pedido; sem nada, o mês atual. `periodo=tudo` tira as datas. */
function periodoDe(sp: Record<string, string | string[] | undefined>): {
  de?: string;
  ate?: string;
  rotulo: string;
} {
  const de = primeiro(sp.de);
  const ate = primeiro(sp.ate);
  if (primeiro(sp.periodo) === "tudo") return { rotulo: "desde sempre" };
  if (DATA.test(de) || DATA.test(ate)) {
    return {
      de: DATA.test(de) ? de : undefined,
      ate: DATA.test(ate) ? ate : undefined,
      rotulo:
        `${DATA.test(de) ? `de ${data(de)}` : ""} ${DATA.test(ate) ? `até ${data(ate)}` : ""}`.trim(),
    };
  }
  const hoje = hojeLisboa();
  const inicio = `${hoje.slice(0, 7)}-01`;
  const { ano, mes } = partesDeIso(hoje);
  return {
    de: inicio,
    ate: somarDias(somarMeses(inicio, 1), -1),
    rotulo: `em ${nomeDoMes(ano, mes).toLowerCase()}`,
  };
}

const MESES_CURTOS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

/** "2026-09" -> "set 2026", para caber na tabela lateral. */
function mesRotulo(chave: string): string {
  const [ano, mes] = chave.split("-").map(Number);
  return `${MESES_CURTOS[mes - 1]} ${ano}`;
}

export default async function Despesas({
  searchParams,
}: {
  searchParams: Params;
}) {
  await exigirSessao();
  const sp = await searchParams;
  const periodo = periodoDe(sp);
  const filtros: FiltrosDespesas = {
    de: periodo.de,
    ate: periodo.ate,
    categoria_id: Number(primeiro(sp.categoria_id)) || undefined,
    q: primeiro(sp.q) || undefined,
  };
  const resumo = resumoDoPeriodo(filtros);
  const despesas = listarDespesas(filtros);
  const porMes = lucroPorMes({ de: filtros.de, ate: filtros.ate });
  const porCategoria = despesasPorCategoria(filtros);
  const categorias = listarCategoriasDespesa();

  const hoje = hojeLisboa();
  const inicioMes = `${hoje.slice(0, 7)}-01`;
  const inicioMesPassado = somarMeses(inicioMes, -1);
  const presets = [
    { rotulo: "Este mês", href: "/despesas" },
    {
      rotulo: "Mês passado",
      href: `/despesas?de=${inicioMesPassado}&ate=${somarDias(inicioMes, -1)}`,
    },
    {
      rotulo: "Este ano",
      href: `/despesas?de=${hoje.slice(0, 4)}-01-01&ate=${hoje.slice(0, 4)}-12-31`,
    },
    { rotulo: "Tudo", href: "/despesas?periodo=tudo" },
  ];
  const consulta = new URLSearchParams();
  if (primeiro(sp.periodo) === "tudo") consulta.set("periodo", "tudo");
  if (filtros.de) consulta.set("de", filtros.de);
  if (filtros.ate) consulta.set("ate", filtros.ate);
  if (filtros.categoria_id)
    consulta.set("categoria_id", String(filtros.categoria_id));
  if (filtros.q) consulta.set("q", filtros.q);
  const voltarPara = `/despesas${consulta.size ? `?${consulta}` : ""}`;
  const lucroPositivo = resumo.lucro_cents >= 0;

  return (
    <>
      <CabecalhoPagina
        titulo="Despesas e lucro"
        descricao="O que o negócio gasta, com IVA quando se aplica, e o que sobra das comissões recebidas no mesmo período."
        acoes={
          <>
            <Link
              href={`/despesas/nova?voltar_para=${encodeURIComponent(voltarPara)}`}
              className="btn btn-principal"
            >
              Nova despesa
            </Link>
            <a href={`/api/despesas/csv?${consulta}`} className="btn">
              Exportar CSV
            </a>
          </>
        }
      />

      <form className="cartao grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <label>
          <span className="rotulo">De</span>
          <input
            type="date"
            name="de"
            defaultValue={filtros.de ?? ""}
            className="campo"
          />
        </label>
        <label>
          <span className="rotulo">Até</span>
          <input
            type="date"
            name="ate"
            defaultValue={filtros.ate ?? ""}
            className="campo"
          />
        </label>
        <label>
          <span className="rotulo">Categoria</span>
          <select
            name="categoria_id"
            defaultValue={
              filtros.categoria_id ? String(filtros.categoria_id) : ""
            }
            className="campo"
          >
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="rotulo">Procurar</span>
          <input
            name="q"
            defaultValue={filtros.q ?? ""}
            placeholder="Descrição, pago a, notas"
            className="campo"
          />
        </label>
        <div className="flex items-end gap-2">
          <button type="submit" className="btn btn-principal">
            Filtrar
          </button>
          <Link href="/despesas" className="btn">
            Limpar
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted sm:col-span-2 lg:col-span-5">
          <span>Períodos rápidos:</span>
          {presets.map((p) => (
            <Link
              key={p.rotulo}
              href={p.href}
              className="rounded-full bg-surface-2 px-2.5 py-1 hover:text-brand"
            >
              {p.rotulo}
            </Link>
          ))}
          {primeiro(sp.periodo) !== "tudo" &&
            !DATA.test(primeiro(sp.de)) &&
            !DATA.test(primeiro(sp.ate)) && (
              <span className="text-muted">· a mostrar o mês atual</span>
            )}
        </div>
      </form>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          rotulo={`Comissões recebidas ${periodo.rotulo}`}
          valor={eurosCompacto(resumo.comissoes_recebidas_cents)}
          detalhe="Pelo dia em que o fornecedor pagou"
          tom="ok"
          href="/comissoes?estado=recebida"
        />
        <Indicador
          rotulo={`Despesas ${periodo.rotulo}`}
          valor={eurosCompacto(resumo.despesas_total_cents)}
          detalhe={`${resumo.num_despesas} despesas · ${eurosCompacto(resumo.despesas_iva_cents)} de IVA incluído`}
          tom={resumo.despesas_total_cents > 0 ? "warn" : undefined}
        />
        <Indicador
          rotulo={`Lucro ${periodo.rotulo}`}
          valor={eurosCompacto(resumo.lucro_cents)}
          detalhe={
            resumo.despesas_iva_cents > 0
              ? `Comissões recebidas − despesas · ${eurosCompacto(resumo.comissoes_recebidas_cents - resumo.despesas_base_cents)} se deduzir o IVA`
              : "Comissões recebidas − despesas"
          }
          tom={lucroPositivo ? "ok" : "bad"}
        />
        <Indicador
          rotulo={`Comissões geradas ${periodo.rotulo}`}
          valor={eurosCompacto(resumo.comissoes_geradas_cents)}
          detalhe={
            resumo.comissoes_por_receber_cents > 0
              ? `${eurosCompacto(resumo.comissoes_por_receber_cents)} ainda por receber dos fornecedores`
              : "Sobre o que os casais pagaram; tudo já recebido"
          }
          tom={resumo.comissoes_por_receber_cents > 0 ? "warn" : undefined}
          href="/comissoes?estado=a_receber"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="cartao overflow-x-auto">
            {despesas.length === 0 ? (
              <SemResultados>
                {resumo.num_despesas === 0 &&
                !filtros.q &&
                !filtros.categoria_id
                  ? `Sem despesas ${periodo.rotulo}. Registe a primeira com “Nova despesa”.`
                  : "Nenhuma despesa com estes filtros."}
              </SemResultados>
            ) : (
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Despesa</th>
                    <th>Categoria</th>
                    <th className="text-right">Base</th>
                    <th className="text-right">IVA</th>
                    <th className="text-right">Total</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {despesas.map((d) => (
                    <tr key={d.id}>
                      <td className="whitespace-nowrap">{data(d.data)}</td>
                      <td>
                        <Link
                          href={`/despesas/${d.id}/editar?voltar_para=${encodeURIComponent(voltarPara)}`}
                          className="font-medium hover:text-brand"
                        >
                          {d.descricao}
                        </Link>
                        <p className="text-xs text-muted">
                          {[
                            d.fornecedor,
                            d.metodo,
                            d.cliente_nome
                              ? `Cliente: ${d.cliente_nome}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </p>
                      </td>
                      <td className="text-sm">
                        {d.categoria_nome ?? (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="text-right tabular-nums">
                        {euros(d.valor_cents)}
                      </td>
                      <td className="text-right tabular-nums">
                        {d.iva_pct === null ? (
                          <span className="text-muted">—</span>
                        ) : (
                          <>
                            {euros(d.iva_cents)}
                            <span className="block text-[11px] text-muted">
                              {percentagem(d.iva_pct)}
                            </span>
                          </>
                        )}
                      </td>
                      <td className="text-right font-medium tabular-nums">
                        {euros(d.total_cents)}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/despesas/${d.id}/editar?voltar_para=${encodeURIComponent(voltarPara)}`}
                            className="btn px-2 py-1 text-xs"
                          >
                            Editar
                          </Link>
                          <form action={apagarDespesa}>
                            <input type="hidden" name="id" value={d.id} />
                            <input
                              type="hidden"
                              name="voltar_para"
                              value={voltarPara}
                            />
                            <BotaoConfirmar
                              mensagem={`Eliminar a despesa "${d.descricao}"?`}
                              className="btn-perigo rounded-lg px-2 py-1 text-xs"
                            >
                              ✕
                            </BotaoConfirmar>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-surface-2">
                    <td
                      colSpan={3}
                      className="text-xs font-medium text-muted uppercase"
                    >
                      Total {periodo.rotulo}
                    </td>
                    <td className="text-right font-semibold tabular-nums">
                      {euros(resumo.despesas_base_cents)}
                    </td>
                    <td className="text-right font-semibold tabular-nums">
                      {euros(resumo.despesas_iva_cents)}
                    </td>
                    <td className="text-right font-semibold tabular-nums">
                      {euros(resumo.despesas_total_cents)}
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Seccao titulo="Lucro por mês" vazio={porMes.length === 0}>
            {porMes.length === 0 ? (
              "Ainda sem comissões recebidas nem despesas neste período."
            ) : (
              <div className="overflow-x-auto">
                <table className="tabela text-sm">
                  <thead>
                    <tr>
                      <th>Mês</th>
                      <th className="text-right">Comissões</th>
                      <th className="text-right">Despesas</th>
                      <th className="text-right">Lucro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {porMes.map((m) => (
                      <tr key={m.mes}>
                        <td>
                          <Link
                            href={`/despesas?de=${m.mes}-01&ate=${somarDias(somarMeses(`${m.mes}-01`, 1), -1)}`}
                            className="hover:text-brand"
                          >
                            {mesRotulo(m.mes)}
                          </Link>
                        </td>
                        <td className="text-right tabular-nums text-[color:var(--ok)]">
                          {euros(m.comissoes_cents)}
                        </td>
                        <td className="text-right tabular-nums">
                          {euros(m.despesas_cents)}
                        </td>
                        <td
                          className={`text-right font-medium tabular-nums ${m.lucro_cents >= 0 ? "" : "text-[color:var(--bad)]"}`}
                        >
                          {euros(m.lucro_cents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Seccao>

          <Seccao
            titulo="Despesas por categoria"
            vazio={porCategoria.length === 0}
          >
            {porCategoria.length === 0 ? (
              "Sem despesas neste período."
            ) : (
              <ul className="divide-y divide-line">
                {porCategoria.map((c) => (
                  <li
                    key={c.categoria_id ?? "sem"}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                  >
                    <Link
                      href={
                        c.categoria_id
                          ? `${voltarPara}${voltarPara.includes("?") ? "&" : "?"}categoria_id=${c.categoria_id}`
                          : voltarPara
                      }
                      className="hover:text-brand"
                    >
                      {c.categoria_nome}
                      <span className="ml-1 text-xs text-muted">
                        ({c.num_despesas})
                      </span>
                    </Link>
                    <span className="font-medium tabular-nums">
                      {euros(c.total_cents)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Seccao>

          <Seccao titulo="Categorias de despesa">
            <FormularioCategoria acao={criarCategoria} />
            <ul className="divide-y divide-line border-t border-line">
              {categorias.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-2 px-4 py-2 text-sm"
                >
                  <form
                    action={renomearCategoria}
                    className="flex min-w-0 flex-1 items-center gap-2"
                  >
                    <input type="hidden" name="id" value={c.id} />
                    <input
                      name="nome"
                      defaultValue={c.nome}
                      maxLength={60}
                      aria-label={`Nome da categoria ${c.nome}`}
                      className="campo min-w-0 flex-1 px-2 py-1 text-sm"
                    />
                    <button
                      type="submit"
                      className="btn px-2 py-1 text-xs"
                      title="Guardar novo nome"
                    >
                      Guardar
                    </button>
                  </form>
                  <span
                    className="w-12 shrink-0 text-right text-xs text-muted"
                    title="Despesas nesta categoria, desde sempre"
                  >
                    {c.num_despesas}
                  </span>
                  {c.num_despesas === 0 ? (
                    <form action={apagarCategoria}>
                      <input type="hidden" name="id" value={c.id} />
                      <BotaoConfirmar
                        mensagem={`Eliminar a categoria "${c.nome}"?`}
                        className="btn-perigo rounded-lg px-2 py-1 text-xs"
                      >
                        ✕
                      </BotaoConfirmar>
                    </form>
                  ) : (
                    <span className="w-7" />
                  )}
                </li>
              ))}
            </ul>
            <p className="px-4 py-2 text-xs text-muted">
              Só se eliminam categorias sem despesas; as outras podem mudar de
              nome.
            </p>
          </Seccao>
        </div>
      </div>
    </>
  );
}
