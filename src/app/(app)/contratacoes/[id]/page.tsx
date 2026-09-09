import Link from "next/link";
import { notFound } from "next/navigation";
import { obterContratacao } from "@/lib/queries/contratacoes";
import { listarPagamentos } from "@/lib/queries/pagamentos";
import {
  alterarEstadoContratacao,
  apagarContratacao,
  criarPlanoPagamentos,
} from "@/lib/actions/contratacoes";
import {
  alternarComissao,
  alternarPagamento,
  apagarPagamento,
  guardarPagamento,
} from "@/lib/actions/pagamentos";
import { ComissaoBadge } from "@/components/comissao";
import { emailsDaContratacao, ultimoPedidoEnviado } from "@/lib/queries/emails";
import {
  ESTADOS_CONTRATACAO,
  METODOS_PAGAMENTO,
  ROTULO_ESTADO_CONTRATACAO,
} from "@/lib/constants";
import { euros, eurosCompacto, data, dataHora, percentagem } from "@/lib/format";
import {
  BarraProgresso,
  CabecalhoPagina,
  Detalhe,
  EstadoPagamentoBadge,
  Indicador,
  Seccao,
} from "@/components/ui";
import { BotaoConfirmar, FormularioAuto } from "@/components/formulario-auto";

export const dynamic = "force-dynamic";

export default async function DetalheContratacao({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id: idTexto } = await params;
  const sp = await searchParams;
  const id = Number(idTexto);
  const c = obterContratacao(id);
  if (!c) notFound();
  const pedidoEnviado = ultimoPedidoEnviado(id);
  const emails = emailsDaContratacao(id);

  const pagamentos = listarPagamentos({ contratacao_id: id });
  const comissao = Math.round((c.valor_cents * c.comissao_pct) / 100);
  const comissaoAReceber = pagamentos
    .filter((p) => p.comissao_a_receber)
    .reduce((s, p) => s + p.comissao_cents, 0);
  const comissaoRecebida = pagamentos
    .filter((p) => p.estado === "pago" && p.comissao_recebida_em)
    .reduce((s, p) => s + p.comissao_cents, 0);
  const voltarPara = `/contratacoes/${id}`;

  return (
    <>
      <CabecalhoPagina
        titulo={`${c.cliente_nome} · ${c.fornecedor_nome}`}
        descricao={`${c.categoria}${c.descricao ? ` — ${c.descricao}` : ""}`}
        acoes={
          <>
            <FormularioAuto action={alterarEstadoContratacao}>
              <input type="hidden" name="id" value={c.id} />
              <select
                key={c.estado}
                name="estado"
                defaultValue={c.estado}
                aria-label="Estado da contratação"
                className="campo w-auto"
              >
                {ESTADOS_CONTRATACAO.map((e) => (
                  <option key={e} value={e}>
                    {ROTULO_ESTADO_CONTRATACAO[e]}
                  </option>
                ))}
              </select>
            </FormularioAuto>
            <Link href={`/contratacoes/${c.id}/pedido`} className="btn">
              {pedidoEnviado ? "Reenviar pedido" : "Pedido de disponibilidade"}
            </Link>
            <Link href={`/contratacoes/${c.id}/editar`} className="btn">
              Editar
            </Link>
            <form action={apagarContratacao}>
              <input type="hidden" name="id" value={c.id} />
              <BotaoConfirmar mensagem="Eliminar esta contratação e os seus pagamentos?">
                Eliminar
              </BotaoConfirmar>
            </form>
          </>
        }
      />

      {sp.email === "enviado" && (
        <p role="status" className="mb-4 rounded-lg bg-[color:var(--ok)]/10 px-4 py-3 text-sm text-[color:var(--ok)]">
          Pedido de disponibilidade enviado a {c.fornecedor_nome}. A resposta chega à sua caixa de correio.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          rotulo="Valor acordado"
          valor={eurosCompacto(c.valor_cents)}
          detalhe={`Comissão prevista ${eurosCompacto(comissao)} (${percentagem(c.comissao_pct)})`}
        />
        <Indicador rotulo="Pago pelo casal" valor={eurosCompacto(c.pago_cents)} tom="ok" />
        <Indicador
          rotulo="Agendado por pagar"
          valor={eurosCompacto(c.pendente_cents)}
          tom={c.pendente_cents > 0 ? "warn" : undefined}
          detalhe={
            c.por_agendar_cents > 0
              ? `${eurosCompacto(c.por_agendar_cents)} ainda por agendar${c.atrasado_cents > 0 ? ` · ${eurosCompacto(c.atrasado_cents)} em atraso` : ""}`
              : c.atrasado_cents > 0
                ? `${eurosCompacto(c.atrasado_cents)} em atraso`
                : "Plano completo"
          }
        />
        <Indicador
          rotulo="Comissão a receber do fornecedor"
          valor={eurosCompacto(comissaoAReceber)}
          tom={comissaoAReceber > 0 ? "warn" : undefined}
          detalhe={`${eurosCompacto(comissaoRecebida)} já recebida`}
          href={`/comissoes?estado=todas&fornecedor_id=${c.fornecedor_id}`}
        />
      </div>

      <div className="mt-4">
        <BarraProgresso pago={c.pago_cents} total={c.valor_cents} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Seccao
            titulo="Plano de pagamentos"
            acoes={
              pagamentos.length === 0 ? (
                <form action={criarPlanoPagamentos} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <input
                    type="number"
                    name="sinal_pct"
                    defaultValue={30}
                    min={0}
                    max={100}
                    aria-label="Percentagem do sinal"
                    className="campo w-20 px-2 py-1 text-xs"
                  />
                  <button type="submit" className="btn px-2 py-1 text-xs">
                    Gerar plano (% sinal)
                  </button>
                </form>
              ) : null
            }
          >
            <div className="overflow-x-auto">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th>Vencimento</th>
                    <th>Pago em</th>
                    <th>Método</th>
                    <th>Estado</th>
                    <th className="text-right">Valor</th>
                    <th>Comissão</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {pagamentos.map((p) => (
                    <tr key={p.id} className={p.comissao_a_receber ? "bg-[color:var(--warn)]/5" : ""}>
                      <td>{p.descricao ?? "—"}</td>
                      <td className={p.atrasado ? "text-[color:var(--bad)]" : ""}>
                        {data(p.data_prevista)}
                      </td>
                      <td>{data(p.data_pagamento)}</td>
                      <td className="text-muted">{p.metodo ?? "—"}</td>
                      <td>
                        <EstadoPagamentoBadge estado={p.estado} atrasado={p.atrasado} />
                      </td>
                      <td className="text-right font-medium tabular-nums">
                        {euros(p.valor_cents)}
                      </td>
                      <td>
                        <ComissaoBadge p={p} />
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <form action={alternarPagamento}>
                            <input type="hidden" name="id" value={p.id} />
                            <button type="submit" className="btn px-2 py-1 text-xs">
                              {p.estado === "pago" ? "Reabrir" : "Marcar pago"}
                            </button>
                          </form>
                          {p.estado === "pago" && p.comissao_cents > 0 && (
                            <form action={alternarComissao}>
                              <input type="hidden" name="id" value={p.id} />
                              <button
                                type="submit"
                                className={`px-2 py-1 text-xs whitespace-nowrap ${p.comissao_a_receber ? "btn btn-principal" : "btn"}`}
                              >
                                {p.comissao_a_receber ? "Recebi a comissão" : "Comissão por receber"}
                              </button>
                            </form>
                          )}
                          <form action={apagarPagamento}>
                            <input type="hidden" name="id" value={p.id} />
                            <BotaoConfirmar
                              mensagem="Eliminar este pagamento?"
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
                    <td colSpan={5} className="text-xs font-medium text-muted uppercase">
                      Total agendado
                    </td>
                    <td className="text-right font-semibold tabular-nums">
                      {euros(c.pago_cents + c.pendente_cents)}
                    </td>
                    <td colSpan={2} className="text-xs text-muted">
                      {comissaoAReceber > 0
                        ? `Comissão a receber: ${euros(comissaoAReceber)}`
                        : comissaoRecebida > 0
                          ? "Comissões em dia"
                          : ""}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <form
              action={guardarPagamento}
              className="grid gap-3 border-t border-line p-4 sm:grid-cols-2 lg:grid-cols-5"
            >
              <input type="hidden" name="contratacao_id" value={c.id} />
              <input type="hidden" name="voltar_para" value={voltarPara} />
              <label className="lg:col-span-2">
                <span className="rotulo">Descrição</span>
                <input
                  name="descricao"
                  placeholder="2.ª prestação"
                  className="campo"
                />
              </label>
              <label>
                <span className="rotulo">Valor (€)</span>
                <input
                  name="valor"
                  required
                  inputMode="decimal"
                  defaultValue={
                    c.por_agendar_cents > 0 ? (c.por_agendar_cents / 100).toFixed(2) : ""
                  }
                  className="campo"
                />
              </label>
              <label>
                <span className="rotulo">Vencimento</span>
                <input type="date" name="data_prevista" className="campo" />
              </label>
              <label>
                <span className="rotulo">Método</span>
                <select name="metodo" defaultValue="" className="campo">
                  <option value="">—</option>
                  {METODOS_PAGAMENTO.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <div className="sm:col-span-2 lg:col-span-5">
                <button type="submit" className="btn btn-principal">
                  Adicionar pagamento
                </button>
              </div>
            </form>
          </Seccao>
        </div>

        <Seccao titulo="Detalhes">
          <dl className="grid grid-cols-2 gap-4 p-4">
            <Detalhe rotulo="Cliente">
              <Link href={`/clientes/${c.cliente_id}`} className="hover:text-brand">
                {c.cliente_nome}
              </Link>
            </Detalhe>
            <Detalhe rotulo="Fornecedor">
              <Link href={`/fornecedores/${c.fornecedor_id}`} className="hover:text-brand">
                {c.fornecedor_nome}
              </Link>
            </Detalhe>
            <Detalhe rotulo="Categoria">{c.categoria}</Detalhe>
            <Detalhe rotulo="Data do serviço">{data(c.data_servico)}</Detalhe>
            <Detalhe rotulo="Comissão">{percentagem(c.comissao_pct)}</Detalhe>
            <Detalhe rotulo="Criada em">{data(c.criado_em)}</Detalhe>
            <div className="col-span-2">
              <Detalhe rotulo="Pedido de disponibilidade">
                {pedidoEnviado ? (
                  <>
                    Enviado a {dataHora(pedidoEnviado.criado_em)} para {pedidoEnviado.para}
                    {emails.length > 1 ? ` · ${emails.length} envios` : ""}
                  </>
                ) : (
                  <span className="text-muted">Ainda não enviado</span>
                )}
              </Detalhe>
            </div>
            {c.notas && (
              <div className="col-span-2">
                <Detalhe rotulo="Notas">
                  <p className="whitespace-pre-wrap">{c.notas}</p>
                </Detalhe>
              </div>
            )}
          </dl>
        </Seccao>
      </div>
    </>
  );
}
