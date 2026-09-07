import Link from "next/link";
import { notFound } from "next/navigation";
import { obterFornecedor } from "@/lib/queries/fornecedores";
import { listarContratacoes } from "@/lib/queries/contratacoes";
import { apagarFornecedor } from "@/lib/actions/fornecedores";
import { euros, eurosCompacto, data, percentagem } from "@/lib/format";
import type { EstadoContratacao } from "@/lib/constants";
import {
  BarraProgresso,
  CabecalhoPagina,
  Detalhe,
  EstadoContratacaoBadge,
  Etiqueta,
  Indicador,
  Seccao,
} from "@/components/ui";
import { BotaoConfirmar } from "@/components/formulario-auto";

export const dynamic = "force-dynamic";

export default async function DetalheFornecedor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idTexto } = await params;
  const id = Number(idTexto);
  const f = obterFornecedor(id);
  if (!f) notFound();

  const contratacoes = listarContratacoes({ fornecedor_id: id });
  const faixa =
    f.preco_min_cents || f.preco_max_cents
      ? `${f.preco_min_cents ? euros(f.preco_min_cents) : "—"} a ${
          f.preco_max_cents ? euros(f.preco_max_cents) : "—"
        }`
      : "—";

  return (
    <>
      <CabecalhoPagina
        titulo={f.nome}
        descricao={`${f.categoria}${f.distrito ? ` · ${f.distrito}` : ""}`}
        acoes={
          <>
            <Link
              href={`/contratacoes/nova?fornecedor_id=${f.id}`}
              className="btn btn-principal"
            >
              Associar a cliente
            </Link>
            <Link href={`/fornecedores/${f.id}/editar`} className="btn">
              Editar
            </Link>
            <form action={apagarFornecedor}>
              <input type="hidden" name="id" value={f.id} />
              <BotaoConfirmar
                mensagem={
                  contratacoes.length > 0
                    ? `${f.nome} tem contratações associadas, por isso será desativado em vez de eliminado. Continuar?`
                    : `Eliminar ${f.nome}?`
                }
              >
                {contratacoes.length > 0 ? "Desativar" : "Eliminar"}
              </BotaoConfirmar>
            </form>
          </>
        }
      />

      {f.ativo === 0 && (
        <p className="mb-4">
          <Etiqueta tom="cinza">
            Fornecedor inativo — não aparece em novas contratações
          </Etiqueta>
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          rotulo="Contratado"
          valor={eurosCompacto(f.contratado_cents)}
          detalhe={`${f.num_contratacoes} contratações · ${f.num_clientes} clientes`}
        />
        <Indicador rotulo="Recebido" valor={eurosCompacto(f.pago_cents)} tom="ok" />
        <Indicador
          rotulo="Por receber"
          valor={eurosCompacto(f.em_divida_cents)}
          tom={f.em_divida_cents > 0 ? "warn" : undefined}
        />
        <Indicador
          rotulo="Comissão"
          valor={eurosCompacto(f.comissao_cents)}
          detalhe={percentagem(f.comissao_pct)}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Seccao titulo="Clientes associados" vazio={contratacoes.length === 0}>
            {contratacoes.length === 0 ? (
              "Este fornecedor ainda não está associado a nenhum cliente."
            ) : (
              <div className="overflow-x-auto">
                <table className="tabela">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Data do serviço</th>
                      <th>Estado</th>
                      <th className="text-right">Valor</th>
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
                            {c.cliente_nome}
                          </Link>
                        </td>
                        <td>{data(c.data_servico)}</td>
                        <td>
                          <EstadoContratacaoBadge estado={c.estado as EstadoContratacao} />
                        </td>
                        <td className="text-right font-medium tabular-nums">
                          {euros(c.valor_cents)}
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
        </div>

        <Seccao titulo="Ficha">
          <dl className="grid grid-cols-2 gap-4 p-4">
            <Detalhe rotulo="Contacto">{f.contacto ?? "—"}</Detalhe>
            <Detalhe rotulo="Telefone">
              {f.telefone ? (
                <a href={`tel:${f.telefone}`} className="hover:text-brand">
                  {f.telefone}
                </a>
              ) : (
                "—"
              )}
            </Detalhe>
            <Detalhe rotulo="Email">
              {f.email ? (
                <a href={`mailto:${f.email}`} className="hover:text-brand">
                  {f.email}
                </a>
              ) : (
                "—"
              )}
            </Detalhe>
            <Detalhe rotulo="Website">
              {f.website ? (
                <a
                  href={f.website}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-brand"
                >
                  Abrir
                </a>
              ) : (
                "—"
              )}
            </Detalhe>
            <div className="col-span-2">
              <Detalhe rotulo="Faixa de preço">{faixa}</Detalhe>
            </div>
            {f.notas && (
              <div className="col-span-2">
                <Detalhe rotulo="Notas">
                  <p className="whitespace-pre-wrap">{f.notas}</p>
                </Detalhe>
              </div>
            )}
          </dl>
        </Seccao>
      </div>
    </>
  );
}
