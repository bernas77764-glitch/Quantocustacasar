import { after } from "next/server";
import { registarPedidoDeParceria } from "@/lib/registo-site";
import { enviarAutomatico } from "@/lib/email-automatico";
import { aceitarPedido, responder, responderPreflight } from "@/lib/api-publica";

export const dynamic = "force-dynamic";

/**
 * Registo de fornecedores vindo do formulário "Seja nosso parceiro" do site.
 * A lógica (normalização, duplicados, entrada como inativo) está em
 * `@/lib/registo-site`, partilhada com os dados de demonstração.
 */

export async function OPTIONS(pedido: Request) {
  return responderPreflight(pedido);
}

export async function POST(pedido: Request) {
  const aceite = await aceitarPedido(pedido);
  if (aceite instanceof Response) return aceite;
  const { cors, texto } = aceite;

  const empresa = texto("empresa") ?? texto("nome");
  if (!empresa) {
    return responder({ erro: 'O campo "empresa" é obrigatório.' }, 400, cors);
  }

  const resultado = registarPedidoDeParceria({
    empresa,
    categoria: texto("categoria"),
    distrito: texto("distrito"),
    responsavel: texto("responsavel") ?? texto("contacto"),
    email: texto("email"),
    telefone: texto("telefone"),
    website: texto("website"),
    notas: texto("notas"),
  });

  if (resultado.repetido) {
    return responder({ id: resultado.id, ativo: resultado.ativo, repetido: true }, 200, cors);
  }
  after(() => enviarAutomatico("fornecedor_candidatura", { fornecedor_id: resultado.id }));
  return responder({ id: resultado.id, ativo: 0 }, 201, cors);
}
