import Link from "next/link";
import {
  pagamentosEmAtraso,
  pipeline,
  proximosCasamentos,
  proximosPagamentos,
  recebimentosPorMes,
  resumo,
  valorPorCategoria,
} from "@/lib/queries/dashboard";
import { euros, eurosCompacto, data, diasAte, percentagem } from "@/lib/format";
import {
  ESTADOS_CLIENTE,
  ROTULO_ESTADO_CLIENTE,
  type EstadoCliente,
} from "@/lib/constants";
import {
  CabecalhoPagina,
  EstadoClienteBadge,
  Indicador,
  Seccao,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export default function Painel() {
  const r = resumo();
  const porEstado = new Map(pipeline().map((p) => [p.estado, p]));
  const atraso = pagamentosEmAtraso(6);
  const proximos = proximosPagamentos(6);
  const casamentos = proximosCasamentos(5);
  const meses = recebimentosPorMes(6);
  const categorias = valorPorCategoria().slice(0, 6);
  const maxMes = Math.max(1, ...meses.map((m) => m.valor_cents));
  const emDivida = r.contratado_cents - r.pago_cents;

  return (
    <>
      <CabecalhoPagina
        titulo="Painel"
        descricao="Visão geral do negócio: clientes, contratações e tesouraria."
        acoes={
          <>
            <Link href="/clientes/novo" className="btn btn-principal">
              Novo cliente
            </Link>
            <Link href="/contratacoes/nova" className="btn">
              Nova contratação
            </Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          rotulo="Clientes ativos"
          valor={String(r.clientes_ativos)}
          detalhe={`${r.clientes_total} no total · ${r.clientes_ganhos} ganhos`}
          href="/clientes"
        />
        <Indicador
          rotulo="Valor contratado"
          valor={eurosCompacto(r.contratado_cents)}
          detalhe={`${r.contratacoes_ativas} contratações · comissão ${eurosCompacto(r.comissao_cents)}`}
          href="/contratacoes"
        />
        <Indicador
          rotulo="Recebido"
          valor={eurosCompacto(r.pago_cents)}
          detalhe={`${percentagem(
            r.contratado_cents > 0 ? (r.pago_cents / r.contratado_cents) * 100 : 0,
          )} do contratado`}
          tom="ok"
          href="/pagamentos?estado=pago"
        />
        <Indicador
          rotulo="Em atraso"
          valor={eurosCompacto(r.atrasado_cents)}
          detalhe={`Por receber: ${eurosCompacto(emDivida)}`}
          tom={r.atrasado_cents > 0 ? "bad" : undefined}
          href="/pagamentos?estado=atrasado"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Seccao
            titulo="Pipeline de clientes"
            acoes={
              <span className="text-xs text-muted">
                Conversão {percentagem(r.taxa_conversao)}
              </span>
            }
          >
            <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 lg:grid-cols-6">
              {ESTADOS_CLIENTE.map((estado: EstadoCliente) => {
                const linha = porEstado.get(estado);
                return (
                  <Link
                    key={estado}
                    href={`/clientes?estado=${estado}`}
                    className="bg-surface px-4 py-4 transition hover:bg-surface-2"
                  >
                    <p className="text-xs text-muted">
                      {ROTULO_ESTADO_CLIENTE[estado]}
                    </p>
                    <p className="mt-1 text-xl font-semibold tabular-nums">
                      {linha?.total ?? 0}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {eurosCompacto(linha?.valor_cents ?? 0)}
                    </p>
                  </Link>
                );
              })}
            </div>
          </Seccao>

          <Seccao
            titulo="Pagamentos em atraso"
            acoes={
              <Link href="/pagamentos?estado=atrasado" className="text-xs text-brand">
                Ver todos
              </Link>
            }
            vazio={atraso.length === 0}
          >
            {atraso.length === 0 ? (
              "Sem pagamentos em atraso. 🎉"
            ) : (
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Fornecedor</th>
                    <th>Vencimento</th>
                    <th className="text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {atraso.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/clientes/${p.cliente_id}`} className="hover:text-brand">
                          {p.cliente_nome}
                        </Link>
                      </td>
                      <td className="text-muted">{p.fornecedor_nome}</td>
                      <td className="text-[color:var(--bad)]">
                        {data(p.data_prevista)}{" "}
                        <span className="text-xs">
                          ({Math.abs(diasAte(p.data_prevista) ?? 0)} d)
                        </span>
                      </td>
                      <td className="text-right font-medium tabular-nums">
                        {euros(p.valor_cents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Seccao>

          <Seccao
            titulo="Próximos pagamentos (60 dias)"
            acoes={
              <span className="text-xs text-muted">
                A vencer em 30 dias: {eurosCompacto(r.a_vencer_30d_cents)}
              </span>
            }
            vazio={proximos.length === 0}
          >
            {proximos.length === 0 ? (
              "Nada agendado para os próximos 60 dias."
            ) : (
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Descrição</th>
                    <th>Vencimento</th>
                    <th className="text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {proximos.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/clientes/${p.cliente_id}`} className="hover:text-brand">
                          {p.cliente_nome}
                        </Link>
                      </td>
                      <td className="text-muted">
                        {p.descricao ?? "—"} · {p.fornecedor_nome}
                      </td>
                      <td>{data(p.data_prevista)}</td>
                      <td className="text-right font-medium tabular-nums">
                        {euros(p.valor_cents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Seccao>
        </div>

        <div className="space-y-6">
          <Seccao titulo="Recebimentos por mês">
            <div className="flex h-40 gap-2 px-4 pt-4">
              {meses.map((m) => (
                <div key={m.mes} className="flex h-full flex-1 flex-col items-center">
                  <span className="h-4 text-[10px] text-muted tabular-nums">
                    {m.valor_cents > 0 ? eurosCompacto(m.valor_cents) : ""}
                  </span>
                  {/* A coluna tem altura definida, por isso a percentagem da
                      barra resolve corretamente. */}
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t bg-brand/70"
                      style={{
                        height: `${Math.max(2, (m.valor_cents / maxMes) * 100)}%`,
                      }}
                      title={eurosCompacto(m.valor_cents)}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 px-4 pt-2 pb-4">
              {meses.map((m) => (
                <span key={m.mes} className="flex-1 text-center text-[10px] text-muted">
                  {m.mes.slice(5)}/{m.mes.slice(2, 4)}
                </span>
              ))}
            </div>
          </Seccao>

          <Seccao titulo="Próximos casamentos" vazio={casamentos.length === 0}>
            {casamentos.length === 0 ? (
              "Sem datas de casamento agendadas."
            ) : (
              <ul className="divide-y divide-line">
                {casamentos.map((c) => (
                  <li key={c.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/clientes/${c.id}`}
                        className="text-sm font-medium hover:text-brand"
                      >
                        {c.nome}
                      </Link>
                      <EstadoClienteBadge estado={c.estado as EstadoCliente} />
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {data(c.data_casamento)} · faltam {diasAte(c.data_casamento)} dias
                      {c.local_evento ? ` · ${c.local_evento}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Seccao>

          <Seccao titulo="Valor por categoria" vazio={categorias.length === 0}>
            {categorias.length === 0 ? (
              "Ainda não há contratações confirmadas."
            ) : (
              <ul className="divide-y divide-line">
                {categorias.map((c) => (
                  <li
                    key={c.categoria}
                    className="flex items-center justify-between px-4 py-2.5 text-sm"
                  >
                    <span>
                      {c.categoria}{" "}
                      <span className="text-xs text-muted">({c.total})</span>
                    </span>
                    <span className="font-medium tabular-nums">
                      {eurosCompacto(c.valor_cents)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Seccao>
        </div>
      </div>
    </>
  );
}
