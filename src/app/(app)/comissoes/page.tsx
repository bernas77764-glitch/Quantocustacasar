import Link from "next/link";
import { exigirSessao } from "@/lib/auth";
import {
  comissoesPorFornecedor,
  listarComissoes,
  totaisComissoes,
} from "@/lib/queries/pagamentos";
import { listarFornecedoresSimples } from "@/lib/queries/fornecedores";
import { alternarComissao, receberComissoesDoFornecedor } from "@/lib/actions/pagamentos";
import { euros, eurosCompacto, data, percentagem } from "@/lib/format";
import { CabecalhoPagina, Indicador, Seccao, SemResultados } from "@/components/ui";
import { ComissaoBadge } from "@/components/comissao";
import { BotaoConfirmar } from "@/components/formulario-auto";

export const dynamic = "force-dynamic";

type Params = Promise<Record<string, string | string[] | undefined>>;

function primeiro(v: string | string[] | undefined): string {
  return typeof v === "string" ? v : "";
}

export default async function Comissoes({ searchParams }: { searchParams: Params }) {
  await exigirSessao();
  const sp = await searchParams;
  const filtros = {
    estado: primeiro(sp.estado) || "a_receber",
    fornecedor_id: Number(sp.fornecedor_id) || undefined,
  };
  const totais = totaisComissoes();
  const porFornecedor = comissoesPorFornecedor();
  const linhas = listarComissoes({
    estado: filtros.estado === "todas" ? undefined : filtros.estado,
    fornecedor_id: filtros.fornecedor_id,
  });
  const fornecedores = listarFornecedoresSimples();
  const consulta = `estado=${filtros.estado}${filtros.fornecedor_id ? `&fornecedor_id=${filtros.fornecedor_id}` : ""}`;
  const voltarPara = `/comissoes?${consulta}`;

  return (
    <>
      <CabecalhoPagina
        titulo="Comissões"
        descricao="O que os fornecedores devem ao negócio. Uma comissão fica a receber quando o casal paga; fica recebida quando o fornecedor a paga."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          rotulo="A receber dos fornecedores"
          valor={eurosCompacto(totais.a_receber_cents)}
          detalhe="O casal já pagou; o fornecedor ainda não"
          tom={totais.a_receber_cents > 0 ? "warn" : undefined}
          href="/comissoes?estado=a_receber"
        />
        <Indicador
          rotulo="Recebidas este mês"
          valor={eurosCompacto(totais.recebida_mes_cents)}
          detalhe={`${eurosCompacto(totais.recebida_cents)} no total`}
          tom="ok"
          href="/comissoes?estado=recebida"
        />
        <Indicador
          rotulo="Ainda não devidas"
          valor={eurosCompacto(totais.ainda_nao_devida_cents)}
          detalhe="Sobre o que os casais ainda não pagaram"
        />
        <Indicador
          rotulo="Previstas"
          valor={eurosCompacto(totais.prevista_cents)}
          detalhe="Contratações confirmadas e concluídas"
          href="/contratacoes"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <form className="cartao grid gap-3 p-4 sm:grid-cols-3">
            <label>
              <span className="rotulo">Estado</span>
              <select name="estado" defaultValue={filtros.estado} className="campo">
                <option value="a_receber">A receber</option>
                <option value="recebida">Recebidas</option>
                <option value="todas">Todas</option>
              </select>
            </label>
            <label>
              <span className="rotulo">Fornecedor</span>
              <select
                name="fornecedor_id"
                defaultValue={filtros.fornecedor_id ? String(filtros.fornecedor_id) : ""}
                className="campo"
              >
                <option value="">Todos</option>
                {fornecedores.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end gap-2">
              <button type="submit" className="btn btn-principal">
                Filtrar
              </button>
              <Link href="/comissoes" className="btn">
                Limpar
              </Link>
            </div>
          </form>

          <div className="cartao overflow-x-auto">
            {linhas.length === 0 ? (
              <SemResultados>
                {filtros.estado === "a_receber"
                  ? "Nenhuma comissão a receber. Quando marcar um pagamento de um casal como pago, a comissão aparece aqui."
                  : "Nenhuma comissão com estes filtros."}
              </SemResultados>
            ) : (
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Fornecedor</th>
                    <th>Cliente · pagamento</th>
                    <th>Casal pagou em</th>
                    <th className="text-right">Valor pago</th>
                    <th>Comissão</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((p) => (
                    <tr key={p.id} className={p.comissao_a_receber ? "bg-[color:var(--warn)]/5" : ""}>
                      <td>
                        <Link href={`/fornecedores/${p.fornecedor_id}`} className="font-medium hover:text-brand">
                          {p.fornecedor_nome}
                        </Link>
                        <p className="text-xs text-muted">{percentagem(p.comissao_pct)}</p>
                      </td>
                      <td>
                        <Link href={`/contratacoes/${p.contratacao_id}`} className="hover:text-brand">
                          {p.cliente_nome}
                        </Link>
                        <p className="text-xs text-muted">{p.descricao ?? "—"} · {p.categoria}</p>
                      </td>
                      <td className="whitespace-nowrap">{data(p.data_pagamento)}</td>
                      <td className="text-right tabular-nums">{euros(p.valor_cents)}</td>
                      <td>
                        <ComissaoBadge p={p} />
                      </td>
                      <td className="text-right">
                        <form action={alternarComissao}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="voltar_para" value={voltarPara} />
                          <button type="submit" className={`px-2 py-1 text-xs ${p.comissao_a_receber ? "btn btn-principal" : "btn"}`}>
                            {p.comissao_a_receber ? "Recebi a comissão" : "Voltar a 'a receber'"}
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <Seccao titulo="Por fornecedor" vazio={porFornecedor.length === 0}>
          {porFornecedor.length === 0 ? (
            "Ainda não há comissões geradas."
          ) : (
            <ul className="divide-y divide-line">
              {porFornecedor.map((f) => (
                <li key={f.fornecedor_id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/comissoes?estado=todas&fornecedor_id=${f.fornecedor_id}`}
                        className="text-sm font-medium hover:text-brand"
                      >
                        {f.fornecedor_nome}
                      </Link>
                      <p className="text-xs text-muted">
                        {f.a_receber_cents > 0 ? (
                          <span className="font-medium text-[color:var(--warn)]">
                            {euros(f.a_receber_cents)} a receber
                          </span>
                        ) : (
                          "Em dia"
                        )}
                        {" · "}
                        {euros(f.recebida_cents)} recebidos
                      </p>
                    </div>
                    {f.a_receber_cents > 0 && (
                      <form action={receberComissoesDoFornecedor}>
                        <input type="hidden" name="fornecedor_id" value={f.fornecedor_id} />
                        <input type="hidden" name="voltar_para" value={voltarPara} />
                        <BotaoConfirmar
                          mensagem={`Marcar as ${f.num_a_receber} comissões de ${f.fornecedor_nome} (${euros(f.a_receber_cents)}) como recebidas hoje?`}
                          className="btn px-2 py-1 text-xs whitespace-nowrap"
                        >
                          Recebi tudo
                        </BotaoConfirmar>
                      </form>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Seccao>
      </div>
    </>
  );
}
