import { camposDoPedido, modeloDisponibilidade, preencherModelo } from "@/lib/email";
import { obterCliente } from "@/lib/queries/clientes";
import { obterContratacao } from "@/lib/queries/contratacoes";
import { obterFornecedor } from "@/lib/queries/fornecedores";

/** O pedido de disponibilidade pré-preenchido para uma contratação, para rever antes de enviar. */
export function prepararPedido(contratacaoId: number, remetente: string) {
  const contratacao = obterContratacao(contratacaoId);
  if (!contratacao) return null;
  const cliente = obterCliente(contratacao.cliente_id);
  const fornecedor = obterFornecedor(contratacao.fornecedor_id);
  if (!cliente || !fornecedor) return null;
  const campos = camposDoPedido({ fornecedor, cliente, contratacao, remetente });
  const { modelo } = modeloDisponibilidade();
  return {
    contratacao,
    cliente,
    fornecedor,
    para: fornecedor.email ?? "",
    assunto: preencherModelo(modelo.assunto, campos),
    corpo: preencherModelo(modelo.corpo, campos),
  };
}
