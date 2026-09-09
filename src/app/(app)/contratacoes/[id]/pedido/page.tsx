import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirSessao } from "@/lib/auth";
import { configuracaoEmail } from "@/lib/email";
import { prepararPedido } from "@/lib/pedido-disponibilidade";
import { emailsDaContratacao } from "@/lib/queries/emails";
import { enviarPedidoDisponibilidade, guardarEmailDoFornecedor } from "@/lib/actions/email";
import { data, dataHora, euros } from "@/lib/format";
import { CabecalhoPagina, Etiqueta, Seccao } from "@/components/ui";
import { FormularioPedido } from "@/components/formularios-email";

export const dynamic = "force-dynamic";

export default async function PedidoDisponibilidade({ params }: { params: Promise<{ id: string }> }) {
  const utilizador = await exigirSessao();
  const { id: idTexto } = await params;
  const id = Number(idTexto);
  const pedido = prepararPedido(id, utilizador.nome);
  if (!pedido) notFound();
  const config = configuracaoEmail();
  const anteriores = emailsDaContratacao(id).filter((e) => e.tipo === "pedido_disponibilidade");
  const voltar = `/contratacoes/${id}`;

  return (
    <>
      <CabecalhoPagina
        titulo="Pedido de disponibilidade"
        descricao={`${pedido.fornecedor.nome} · ${pedido.cliente.nome}${pedido.cliente.parceiro ? ` & ${pedido.cliente.parceiro}` : ""}`}
        acoes={
          <Link href={voltar} className="btn">
            {anteriores.length ? "Voltar à contratação" : "Não enviar agora"}
          </Link>
        }
      />

      {!config && (
        <p className="mb-4 rounded-lg bg-[color:var(--warn)]/10 px-4 py-3 text-sm">
          O envio de email ainda não está configurado.{" "}
          {utilizador.administrador === 1 ? (
            <Link href="/definicoes/email" className="font-medium hover:text-brand">
              Configurar em Definições › Email →
            </Link>
          ) : (
            "Peça a um administrador para o fazer em Definições › Email."
          )}
        </p>
      )}

      {!pedido.fornecedor.email && (
        <form action={guardarEmailDoFornecedor} className="mb-4 flex flex-wrap items-end gap-3 rounded-lg bg-[color:var(--warn)]/10 px-4 py-3 text-sm">
          <input type="hidden" name="fornecedor_id" value={pedido.fornecedor.id} />
          <input type="hidden" name="voltar_para" value={`/contratacoes/${id}/pedido`} />
          <span className="flex-1">
            <span className="font-medium">{pedido.fornecedor.nome}</span> não tem email na ficha. Escreva-o aqui para ficar guardado.
          </span>
          <label className="flex items-end gap-2">
            <input name="email" type="email" required placeholder="email do fornecedor" className="campo w-64" aria-label="Email do fornecedor" />
            <button type="submit" className="btn px-2 py-1.5 text-xs whitespace-nowrap">
              Guardar na ficha
            </button>
          </label>
        </form>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="cartao lg:col-span-2">
          <FormularioPedido
            acao={enviarPedidoDisponibilidade}
            contratacaoId={id}
            para={pedido.para}
            assunto={pedido.assunto}
            corpo={pedido.corpo}
            configurado={config !== null}
          />
        </div>
        <div className="space-y-6">
          <Seccao titulo="Dados usados">
            <dl className="grid grid-cols-2 gap-3 p-4 text-sm">
              <dt className="text-muted">Data</dt>
              <dd>{data(pedido.contratacao.data_servico ?? pedido.cliente.data_casamento) === "—" ? "a definir" : data(pedido.contratacao.data_servico ?? pedido.cliente.data_casamento)}</dd>
              <dt className="text-muted">Convidados</dt>
              <dd>{pedido.cliente.num_convidados ?? "a definir"}</dd>
              <dt className="text-muted">Local</dt>
              <dd>{pedido.cliente.local_evento || "a definir"}</dd>
              <dt className="text-muted">Valor</dt>
              <dd>{pedido.contratacao.valor_cents > 0 ? euros(pedido.contratacao.valor_cents) : "a definir"}</dd>
            </dl>
            <p className="border-t border-line px-4 py-2 text-xs text-muted">
              Se faltar algo, corrija na{" "}
              <Link href={`/clientes/${pedido.cliente.id}/editar`} className="hover:text-brand">
                ficha do cliente
              </Link>{" "}
              ou na{" "}
              <Link href={`/contratacoes/${id}/editar`} className="hover:text-brand">
                contratação
              </Link>{" "}
              e volte aqui.
            </p>
          </Seccao>
          <Seccao titulo="Envios anteriores" vazio={anteriores.length === 0}>
            {anteriores.length === 0 ? (
              "Ainda não foi enviado nenhum pedido a este fornecedor para esta contratação."
            ) : (
              <ul className="divide-y divide-line text-sm">
                {anteriores.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-2 px-4 py-2">
                    <span className="text-xs text-muted">{dataHora(e.criado_em)} · {e.para}</span>
                    <Etiqueta tom={e.estado === "enviado" ? "verde" : "vermelho"}>{e.estado === "enviado" ? "Enviado" : "Erro"}</Etiqueta>
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
