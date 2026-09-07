import Link from "next/link";
import { listarContratacoes } from "@/lib/queries/contratacoes";
import { euros, eurosCompacto, data } from "@/lib/format";
import {
  CATEGORIAS,
  ESTADOS_CONTRATACAO,
  ROTULO_ESTADO_CONTRATACAO,
  type EstadoContratacao,
} from "@/lib/constants";
import {
  BarraProgresso,
  CabecalhoPagina,
  EstadoContratacaoBadge,
  SemResultados,
} from "@/components/ui";

export const dynamic = "force-dynamic";

type Params = Promise<Record<string, string | string[] | undefined>>;

function primeiro(v: string | string[] | undefined): string {
  return typeof v === "string" ? v : "";
}

export default async function Contratacoes({
  searchParams,
}: {
  searchParams: Params;
}) {
  const sp = await searchParams;
  const filtros = {
    q: primeiro(sp.q),
    estado: primeiro(sp.estado),
    categoria: primeiro(sp.categoria),
  };
  const contratacoes = listarContratacoes(filtros);
  const total = contratacoes.reduce((s, c) => s + c.valor_cents, 0);
  const pago = contratacoes.reduce((s, c) => s + c.pago_cents, 0);

  return (
    <>
      <CabecalhoPagina
        titulo="Contratações"
        descricao={`${contratacoes.length} ligações cliente–fornecedor · ${eurosCompacto(total)} contratado · ${eurosCompacto(pago)} recebido`}
        acoes={
          <Link href="/contratacoes/nova" className="btn btn-principal">
            Nova contratação
          </Link>
        }
      />

      <form className="cartao mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="lg:col-span-2">
          <span className="rotulo">Pesquisar</span>
          <input
            name="q"
            defaultValue={filtros.q}
            placeholder="Cliente, fornecedor ou descrição"
            className="campo"
          />
        </label>
        <label>
          <span className="rotulo">Estado</span>
          <select name="estado" defaultValue={filtros.estado} className="campo">
            <option value="">Todos</option>
            {ESTADOS_CONTRATACAO.map((e) => (
              <option key={e} value={e}>
                {ROTULO_ESTADO_CONTRATACAO[e]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="rotulo">Categoria</span>
          <select name="categoria" defaultValue={filtros.categoria} className="campo">
            <option value="">Todas</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
          <button type="submit" className="btn btn-principal">
            Filtrar
          </button>
          <Link href="/contratacoes" className="btn">
            Limpar
          </Link>
        </div>
      </form>

      <div className="cartao overflow-x-auto">
        {contratacoes.length === 0 ? (
          <SemResultados>Nenhuma contratação encontrada.</SemResultados>
        ) : (
          <table className="tabela">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Fornecedor</th>
                <th>Categoria</th>
                <th>Serviço</th>
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
                    <Link href={`/clientes/${c.cliente_id}`} className="hover:text-brand">
                      {c.cliente_nome}
                    </Link>
                  </td>
                  <td>
                    <Link
                      href={`/contratacoes/${c.id}`}
                      className="font-medium hover:text-brand"
                    >
                      {c.fornecedor_nome}
                    </Link>
                    {c.descricao && <p className="text-xs text-muted">{c.descricao}</p>}
                  </td>
                  <td className="text-muted">{c.categoria}</td>
                  <td className="whitespace-nowrap">{data(c.data_servico)}</td>
                  <td>
                    <EstadoContratacaoBadge estado={c.estado as EstadoContratacao} />
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
        )}
      </div>
    </>
  );
}
