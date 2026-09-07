import Link from "next/link";
import { listarPagamentos } from "@/lib/queries/pagamentos";
import { listarClientesSimples } from "@/lib/queries/clientes";
import { alternarPagamento } from "@/lib/actions/pagamentos";
import { euros, eurosCompacto, data, diasAte } from "@/lib/format";
import {
  CabecalhoPagina,
  EstadoPagamentoBadge,
  Indicador,
  SemResultados,
} from "@/components/ui";

export const dynamic = "force-dynamic";

type Params = Promise<Record<string, string | string[] | undefined>>;

function primeiro(v: string | string[] | undefined): string {
  return typeof v === "string" ? v : "";
}

export default async function Pagamentos({ searchParams }: { searchParams: Params }) {
  const sp = await searchParams;
  const filtros = {
    q: primeiro(sp.q),
    estado: primeiro(sp.estado),
    cliente_id: Number(sp.cliente_id) || undefined,
    desde: primeiro(sp.desde),
    ate: primeiro(sp.ate),
  };
  const pagamentos = listarPagamentos(filtros);
  const clientes = listarClientesSimples();

  const soma = (fn: (p: (typeof pagamentos)[number]) => boolean) =>
    pagamentos.filter(fn).reduce((s, p) => s + p.valor_cents, 0);

  const recebido = soma((p) => p.estado === "pago");
  const pendente = soma((p) => p.estado === "pendente");
  const atrasado = soma((p) => p.atrasado);

  const consulta = new URLSearchParams(
    Object.entries(filtros).flatMap(([k, v]) =>
      v ? [[k, String(v)] as [string, string]] : [],
    ),
  ).toString();

  return (
    <>
      <CabecalhoPagina
        titulo="Tesouraria"
        descricao={`${pagamentos.length} pagamentos correspondem aos filtros`}
        acoes={
          <a
            href={`/api/pagamentos/csv${consulta ? `?${consulta}` : ""}`}
            className="btn"
          >
            Exportar CSV
          </a>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Indicador rotulo="Recebido" valor={eurosCompacto(recebido)} tom="ok" />
        <Indicador
          rotulo="Por receber"
          valor={eurosCompacto(pendente)}
          tom={pendente > 0 ? "warn" : undefined}
        />
        <Indicador
          rotulo="Em atraso"
          valor={eurosCompacto(atrasado)}
          tom={atrasado > 0 ? "bad" : undefined}
        />
      </div>

      <form className="cartao my-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <label>
          <span className="rotulo">Pesquisar</span>
          <input
            name="q"
            defaultValue={filtros.q}
            placeholder="Cliente, fornecedor, referência"
            className="campo"
          />
        </label>
        <label>
          <span className="rotulo">Estado</span>
          <select name="estado" defaultValue={filtros.estado} className="campo">
            <option value="">Todos</option>
            <option value="pendente">Pendentes</option>
            <option value="atrasado">Em atraso</option>
            <option value="pago">Pagos</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </label>
        <label>
          <span className="rotulo">Cliente</span>
          <select
            name="cliente_id"
            defaultValue={filtros.cliente_id ? String(filtros.cliente_id) : ""}
            className="campo"
          >
            <option value="">Todos</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="rotulo">De</span>
          <input type="date" name="desde" defaultValue={filtros.desde} className="campo" />
        </label>
        <label>
          <span className="rotulo">Até</span>
          <input type="date" name="ate" defaultValue={filtros.ate} className="campo" />
        </label>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
          <button type="submit" className="btn btn-principal">
            Filtrar
          </button>
          <Link href="/pagamentos" className="btn">
            Limpar
          </Link>
        </div>
      </form>

      <div className="cartao overflow-x-auto">
        {pagamentos.length === 0 ? (
          <SemResultados>Nenhum pagamento corresponde a estes filtros.</SemResultados>
        ) : (
          <table className="tabela">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Fornecedor</th>
                <th>Descrição</th>
                <th>Vencimento</th>
                <th>Pago em</th>
                <th>Estado</th>
                <th className="text-right">Valor</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pagamentos.map((p) => {
                const dias = diasAte(p.data_prevista);
                return (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/clientes/${p.cliente_id}`} className="hover:text-brand">
                        {p.cliente_nome}
                      </Link>
                    </td>
                    <td className="text-muted">
                      <Link
                        href={`/contratacoes/${p.contratacao_id}`}
                        className="hover:text-brand"
                      >
                        {p.fornecedor_nome}
                      </Link>
                    </td>
                    <td>{p.descricao ?? "—"}</td>
                    <td
                      className={`whitespace-nowrap ${p.atrasado ? "text-[color:var(--bad)]" : ""}`}
                    >
                      {data(p.data_prevista)}
                      {p.estado === "pendente" && dias !== null && (
                        <span className="block text-xs text-muted">
                          {dias < 0 ? `há ${-dias} dias` : `em ${dias} dias`}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap">{data(p.data_pagamento)}</td>
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
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
