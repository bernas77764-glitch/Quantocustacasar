import Link from "next/link";
import { listarClientes } from "@/lib/queries/clientes";
import { euros, eurosCompacto, data, diasAte } from "@/lib/format";
import {
  DISTRITOS,
  ESTADOS_CLIENTE,
  ORIGENS,
  ROTULO_ESTADO_CLIENTE,
  type EstadoCliente,
} from "@/lib/constants";
import {
  BarraProgresso,
  CabecalhoPagina,
  EstadoClienteBadge,
  SemResultados,
} from "@/components/ui";

export const dynamic = "force-dynamic";

type Params = Promise<Record<string, string | string[] | undefined>>;

function primeiro(v: string | string[] | undefined): string {
  return typeof v === "string" ? v : "";
}

export default async function Clientes({ searchParams }: { searchParams: Params }) {
  const sp = await searchParams;
  const filtros = {
    q: primeiro(sp.q),
    estado: primeiro(sp.estado),
    origem: primeiro(sp.origem),
    distrito: primeiro(sp.distrito),
    ordenar: primeiro(sp.ordenar),
  };
  const clientes = listarClientes(filtros);

  const totalContratado = clientes.reduce((s, c) => s + c.contratado_cents, 0);
  const totalDivida = clientes.reduce((s, c) => s + c.em_divida_cents, 0);

  return (
    <>
      <CabecalhoPagina
        titulo="Clientes"
        descricao={`${clientes.length} ${clientes.length === 1 ? "cliente" : "clientes"} · ${eurosCompacto(totalContratado)} contratado · ${eurosCompacto(totalDivida)} por receber`}
        acoes={
          <Link href="/clientes/novo" className="btn btn-principal">
            Novo cliente
          </Link>
        }
      />

      <form className="cartao mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="lg:col-span-2">
          <span className="rotulo">Pesquisar</span>
          <input
            name="q"
            defaultValue={filtros.q}
            placeholder="Nome, email ou telefone"
            className="campo"
          />
        </label>
        <label>
          <span className="rotulo">Estado</span>
          <select name="estado" defaultValue={filtros.estado} className="campo">
            <option value="">Todos</option>
            {ESTADOS_CLIENTE.map((e) => (
              <option key={e} value={e}>
                {ROTULO_ESTADO_CLIENTE[e]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="rotulo">Origem</span>
          <select name="origem" defaultValue={filtros.origem} className="campo">
            <option value="">Todas</option>
            {ORIGENS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="rotulo">Distrito</span>
          <select name="distrito" defaultValue={filtros.distrito} className="campo">
            <option value="">Todos</option>
            {DISTRITOS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="rotulo">Ordenar por</span>
          <select name="ordenar" defaultValue={filtros.ordenar} className="campo">
            <option value="">Mais recentes</option>
            <option value="nome">Nome</option>
            <option value="casamento">Data do casamento</option>
            <option value="valor">Valor contratado</option>
            <option value="divida">Valor em dívida</option>
          </select>
        </label>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
          <button type="submit" className="btn btn-principal">
            Filtrar
          </button>
          <Link href="/clientes" className="btn">
            Limpar
          </Link>
        </div>
      </form>

      <div className="cartao overflow-x-auto">
        {clientes.length === 0 ? (
          <SemResultados>
            Nenhum cliente encontrado com estes filtros.
          </SemResultados>
        ) : (
          <table className="tabela">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Casamento</th>
                <th>Fornec.</th>
                <th className="text-right">Contratado</th>
                <th className="text-right">Por receber</th>
                <th className="w-32">Recebido</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => {
                const dias = diasAte(c.data_casamento);
                return (
                  <tr key={c.id}>
                    <td>
                      <Link
                        href={`/clientes/${c.id}`}
                        className="font-medium hover:text-brand"
                      >
                        {c.nome}
                      </Link>
                      {c.parceiro && (
                        <span className="text-muted"> &amp; {c.parceiro}</span>
                      )}
                      <p className="text-xs text-muted">
                        {[c.email, c.telefone, c.distrito]
                          .filter(Boolean)
                          .join(" · ") || "Sem contacto"}
                      </p>
                    </td>
                    <td>
                      <EstadoClienteBadge estado={c.estado as EstadoCliente} />
                    </td>
                    <td className="whitespace-nowrap">
                      {data(c.data_casamento)}
                      {dias !== null && dias >= 0 && (
                        <span className="block text-xs text-muted">
                          faltam {dias} dias
                        </span>
                      )}
                    </td>
                    <td className="text-center tabular-nums">{c.num_contratacoes}</td>
                    <td className="text-right font-medium tabular-nums">
                      {euros(c.contratado_cents)}
                    </td>
                    <td className="text-right tabular-nums">
                      <span
                        className={
                          c.atrasado_cents > 0 ? "text-[color:var(--bad)] font-medium" : ""
                        }
                      >
                        {euros(c.em_divida_cents)}
                      </span>
                      {c.atrasado_cents > 0 && (
                        <span className="block text-xs text-[color:var(--bad)]">
                          {euros(c.atrasado_cents)} em atraso
                        </span>
                      )}
                    </td>
                    <td>
                      <BarraProgresso pago={c.pago_cents} total={c.contratado_cents} />
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
