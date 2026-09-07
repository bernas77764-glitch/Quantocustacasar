import Link from "next/link";
import { listarFornecedores } from "@/lib/queries/fornecedores";
import { euros, eurosCompacto, percentagem } from "@/lib/format";
import { CATEGORIAS, DISTRITOS } from "@/lib/constants";
import { CabecalhoPagina, Etiqueta, SemResultados } from "@/components/ui";

export const dynamic = "force-dynamic";

type Params = Promise<Record<string, string | string[] | undefined>>;

function primeiro(v: string | string[] | undefined): string {
  return typeof v === "string" ? v : "";
}

export default async function Fornecedores({
  searchParams,
}: {
  searchParams: Params;
}) {
  const sp = await searchParams;
  const filtros = {
    q: primeiro(sp.q),
    categoria: primeiro(sp.categoria),
    distrito: primeiro(sp.distrito),
    ativo: primeiro(sp.ativo),
    ordenar: primeiro(sp.ordenar),
  };
  const fornecedores = listarFornecedores(filtros);
  const totalContratado = fornecedores.reduce((s, f) => s + f.contratado_cents, 0);
  const totalComissao = fornecedores.reduce((s, f) => s + f.comissao_cents, 0);

  return (
    <>
      <CabecalhoPagina
        titulo="Fornecedores"
        descricao={`${fornecedores.length} no catálogo · ${eurosCompacto(totalContratado)} contratado · ${eurosCompacto(totalComissao)} de comissão`}
        acoes={
          <Link href="/fornecedores/novo" className="btn btn-principal">
            Novo fornecedor
          </Link>
        }
      />

      <form className="cartao mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="lg:col-span-2">
          <span className="rotulo">Pesquisar</span>
          <input
            name="q"
            defaultValue={filtros.q}
            placeholder="Nome, contacto ou email"
            className="campo"
          />
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
          <span className="rotulo">Situação</span>
          <select name="ativo" defaultValue={filtros.ativo} className="campo">
            <option value="">Todas</option>
            <option value="1">Ativos</option>
            <option value="0">Inativos</option>
          </select>
        </label>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
          <button type="submit" className="btn btn-principal">
            Filtrar
          </button>
          <Link href="/fornecedores" className="btn">
            Limpar
          </Link>
        </div>
      </form>

      <div className="cartao overflow-x-auto">
        {fornecedores.length === 0 ? (
          <SemResultados>Nenhum fornecedor encontrado.</SemResultados>
        ) : (
          <table className="tabela">
            <thead>
              <tr>
                <th>Fornecedor</th>
                <th>Categoria</th>
                <th>Distrito</th>
                <th className="text-center">Clientes</th>
                <th className="text-right">Contratado</th>
                <th className="text-right">Comissão</th>
                <th className="text-right">Por receber</th>
              </tr>
            </thead>
            <tbody>
              {fornecedores.map((f) => (
                <tr key={f.id}>
                  <td>
                    <Link
                      href={`/fornecedores/${f.id}`}
                      className="font-medium hover:text-brand"
                    >
                      {f.nome}
                    </Link>
                    {f.ativo === 0 && (
                      <span className="ml-2">
                        <Etiqueta tom="cinza">Inativo</Etiqueta>
                      </span>
                    )}
                    <p className="text-xs text-muted">
                      {[f.contacto, f.email, f.telefone].filter(Boolean).join(" · ") ||
                        "Sem contacto"}
                    </p>
                  </td>
                  <td className="text-muted">{f.categoria}</td>
                  <td className="text-muted">{f.distrito ?? "—"}</td>
                  <td className="text-center tabular-nums">{f.num_clientes}</td>
                  <td className="text-right font-medium tabular-nums">
                    {euros(f.contratado_cents)}
                  </td>
                  <td className="text-right tabular-nums">
                    {euros(f.comissao_cents)}
                    {f.comissao_pct > 0 && (
                      <span className="block text-xs text-muted">
                        {percentagem(f.comissao_pct)}
                      </span>
                    )}
                  </td>
                  <td className="text-right tabular-nums">
                    <span
                      className={
                        f.atrasado_cents > 0 ? "font-medium text-[color:var(--bad)]" : ""
                      }
                    >
                      {euros(f.em_divida_cents)}
                    </span>
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
