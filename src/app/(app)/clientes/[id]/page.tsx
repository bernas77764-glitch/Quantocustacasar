import Link from "next/link";
import { notFound } from "next/navigation";
import { listarAtividades, obterCliente } from "@/lib/queries/clientes";
import { listarContratacoes } from "@/lib/queries/contratacoes";
import { sugestoesParaCliente } from "@/lib/queries/fornecedores";
import { listarPagamentos } from "@/lib/queries/pagamentos";
import { adicionarNota, alterarEstadoCliente, apagarCliente } from "@/lib/actions/clientes";
import { alternarPagamento } from "@/lib/actions/pagamentos";
import {
  ESTADOS_CLIENTE,
  ROTULO_ESTADO_CLIENTE,
  type EstadoContratacao,
} from "@/lib/constants";
import { euros, eurosCompacto, data, dataHora, diasAte } from "@/lib/format";
import {
  BarraProgresso,
  CabecalhoPagina,
  Detalhe,
  EstadoContratacaoBadge,
  EstadoPagamentoBadge,
  Indicador,
  Seccao,
} from "@/components/ui";
import { BotaoConfirmar, FormularioAuto } from "@/components/formulario-auto";

export const dynamic = "force-dynamic";

export default async function DetalheCliente({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idTexto } = await params;
  const id = Number(idTexto);
  const cliente = obterCliente(id);
  if (!cliente) notFound();

  const contratacoes = listarContratacoes({ cliente_id: id });
  const pagamentos = listarPagamentos({ cliente_id: id });
  const atividades = listarAtividades(id);
  const sugestoes = sugestoesParaCliente(id);
  const dias = diasAte(cliente.data_casamento);

  return (
    <>
      <CabecalhoPagina
        titulo={cliente.parceiro ? `${cliente.nome} & ${cliente.parceiro}` : cliente.nome}
        descricao={
          cliente.data_casamento
            ? `Casamento a ${data(cliente.data_casamento)}${
                dias !== null && dias >= 0 ? ` · faltam ${dias} dias` : ""
              }`
            : "Sem data de casamento definida"
        }
        acoes={
          <>
            <FormularioAuto action={alterarEstadoCliente}>
              <input type="hidden" name="id" value={cliente.id} />
              <select
                key={cliente.estado}
                name="estado"
                defaultValue={cliente.estado}
                aria-label="Estado do cliente"
                className="campo w-auto"
              >
                {ESTADOS_CLIENTE.map((e) => (
                  <option key={e} value={e}>
                    {ROTULO_ESTADO_CLIENTE[e]}
                  </option>
                ))}
              </select>
            </FormularioAuto>
            <Link
              href={`/contratacoes/nova?cliente_id=${cliente.id}`}
              className="btn btn-principal"
            >
              Associar fornecedor
            </Link>
            <Link href={`/clientes/${cliente.id}/editar`} className="btn">
              Editar
            </Link>
            <form action={apagarCliente}>
              <input type="hidden" name="id" value={cliente.id} />
              <BotaoConfirmar mensagem={`Eliminar ${cliente.nome} e todas as contratações e pagamentos associados?`}>
                Eliminar
              </BotaoConfirmar>
            </form>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador rotulo="Contratado" valor={eurosCompacto(cliente.contratado_cents)} />
        <Indicador rotulo="Recebido" valor={eurosCompacto(cliente.pago_cents)} tom="ok" />
        <Indicador
          rotulo="Por receber"
          valor={eurosCompacto(cliente.em_divida_cents)}
          tom={cliente.em_divida_cents > 0 ? "warn" : undefined}
        />
        <Indicador
          rotulo="Em atraso"
          valor={eurosCompacto(cliente.atrasado_cents)}
          tom={cliente.atrasado_cents > 0 ? "bad" : undefined}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Seccao
            titulo="Fornecedores contratados"
            acoes={
              <Link
                href={`/contratacoes/nova?cliente_id=${cliente.id}`}
                className="text-xs text-brand"
              >
                + Associar
              </Link>
            }
            vazio={contratacoes.length === 0}
          >
            {contratacoes.length === 0 ? (
              "Ainda não há fornecedores associados a este cliente."
            ) : (
              <div className="overflow-x-auto">
                <table className="tabela">
                  <thead>
                    <tr>
                      <th>Fornecedor</th>
                      <th>Categoria</th>
                      <th>Estado</th>
                      <th className="text-right">Valor</th>
                      <th className="text-right">Por pagar</th>
                      <th className="w-28">Pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contratacoes.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <Link
                            href={`/contratacoes/${c.id}`}
                            className="font-medium hover:text-brand"
                          >
                            {c.fornecedor_nome}
                          </Link>
                          {c.descricao && (
                            <p className="text-xs text-muted">{c.descricao}</p>
                          )}
                        </td>
                        <td className="text-muted">{c.categoria}</td>
                        <td>
                          <EstadoContratacaoBadge
                            estado={c.estado as EstadoContratacao}
                          />
                        </td>
                        <td className="text-right font-medium tabular-nums">
                          {euros(c.valor_cents)}
                        </td>
                        <td className="text-right tabular-nums">
                          {euros(c.valor_cents - c.pago_cents)}
                          {c.atrasado_cents > 0 && (
                            <span className="block text-xs text-[color:var(--bad)]">
                              {euros(c.atrasado_cents)} em atraso
                            </span>
                          )}
                        </td>
                        <td>
                          <BarraProgresso pago={c.pago_cents} total={c.valor_cents} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Seccao>

          {sugestoes.length > 0 && (
            <Seccao
              titulo="Ainda por contratar"
              acoes={
                <span className="text-xs text-muted">
                  Sugestões por categoria e distrito
                </span>
              }
            >
              <ul className="divide-y divide-line">
                {sugestoes.map((s) => (
                  <li key={s.categoria} className="px-4 py-3">
                    <p className="text-sm font-medium">{s.categoria}</p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {s.fornecedores.map((f) => (
                        <li key={f.id}>
                          <Link
                            href={`/contratacoes/nova?cliente_id=${cliente.id}&fornecedor_id=${f.id}`}
                            className="btn px-2.5 py-1 text-xs"
                            title={`Associar ${f.nome} a ${cliente.nome}`}
                          >
                            {f.nome}
                            {f.preco_min_cents && (
                              <span className="text-muted">
                                desde {eurosCompacto(f.preco_min_cents)}
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </Seccao>
          )}

          <Seccao
            titulo="Pagamentos"
            acoes={
              <Link
                href={`/pagamentos?cliente_id=${cliente.id}`}
                className="text-xs text-brand"
              >
                Ver na tesouraria
              </Link>
            }
            vazio={pagamentos.length === 0}
          >
            {pagamentos.length === 0 ? (
              "Sem pagamentos registados. Crie um plano na página da contratação."
            ) : (
              <div className="overflow-x-auto">
                <table className="tabela">
                  <thead>
                    <tr>
                      <th>Descrição</th>
                      <th>Fornecedor</th>
                      <th>Vencimento</th>
                      <th>Estado</th>
                      <th className="text-right">Valor</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {pagamentos.map((p) => (
                      <tr key={p.id}>
                        <td>{p.descricao ?? "—"}</td>
                        <td className="text-muted">{p.fornecedor_nome}</td>
                        <td className={p.atrasado ? "text-[color:var(--bad)]" : ""}>
                          {data(p.data_prevista)}
                        </td>
                        <td>
                          <EstadoPagamentoBadge estado={p.estado} atrasado={p.atrasado} />
                        </td>
                        <td className="text-right font-medium tabular-nums">
                          {euros(p.valor_cents)}
                        </td>
                        <td className="text-right">
                          <form action={alternarPagamento}>
                            <input type="hidden" name="id" value={p.id} />
                            <button type="submit" className="btn px-2 py-1 text-xs">
                              {p.estado === "pago" ? "Reabrir" : "Marcar pago"}
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Seccao>
        </div>

        <div className="space-y-6">
          <Seccao titulo="Dados do cliente">
            <dl className="grid grid-cols-2 gap-4 p-4">
              <Detalhe rotulo="Email">
                {cliente.email ? (
                  <a href={`mailto:${cliente.email}`} className="hover:text-brand">
                    {cliente.email}
                  </a>
                ) : (
                  "—"
                )}
              </Detalhe>
              <Detalhe rotulo="Telefone">
                {cliente.telefone ? (
                  <a href={`tel:${cliente.telefone}`} className="hover:text-brand">
                    {cliente.telefone}
                  </a>
                ) : (
                  "—"
                )}
              </Detalhe>
              <Detalhe rotulo="Convidados">{cliente.num_convidados ?? "—"}</Detalhe>
              <Detalhe rotulo="Orçamento">
                {cliente.orcamento_cents ? euros(cliente.orcamento_cents) : "—"}
              </Detalhe>
              <Detalhe rotulo="Distrito">{cliente.distrito ?? "—"}</Detalhe>
              <Detalhe rotulo="Local">{cliente.local_evento ?? "—"}</Detalhe>
              <Detalhe rotulo="Origem">{cliente.origem ?? "—"}</Detalhe>
              <Detalhe rotulo="Responsável">{cliente.responsavel ?? "—"}</Detalhe>
              {cliente.notas && (
                <div className="col-span-2">
                  <Detalhe rotulo="Notas">
                    <p className="whitespace-pre-wrap">{cliente.notas}</p>
                  </Detalhe>
                </div>
              )}
            </dl>
          </Seccao>

          <Seccao titulo="Atividade">
            <form action={adicionarNota} className="space-y-2 border-b border-line p-4">
              <input type="hidden" name="id" value={cliente.id} />
              <textarea
                name="descricao"
                required
                rows={2}
                placeholder="Registar chamada, email ou nota…"
                className="campo resize-y"
              />
              <div className="flex gap-2">
                <select name="tipo" defaultValue="nota" className="campo w-auto">
                  <option value="nota">Nota</option>
                  <option value="chamada">Chamada</option>
                  <option value="email">Email</option>
                  <option value="reuniao">Reunião</option>
                </select>
                <button type="submit" className="btn btn-principal">
                  Registar
                </button>
              </div>
            </form>
            {atividades.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted">
                Sem atividade registada.
              </p>
            ) : (
              <ul className="max-h-96 divide-y divide-line overflow-y-auto">
                {atividades.map((a) => (
                  <li key={a.id} className="px-4 py-3">
                    <p className="text-sm whitespace-pre-wrap">{a.descricao}</p>
                    <p className="mt-1 text-xs text-muted capitalize">
                      {a.tipo} · {dataHora(a.criado_em)}
                    </p>
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
