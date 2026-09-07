import Link from "next/link";
import { exigirAdministrador } from "@/lib/auth";
import { DOMINIO_DEMO, contarDemonstracao } from "@/lib/demonstracao";
import { inserirDadosDeDemonstracao, removerDadosDeDemonstracao } from "@/lib/actions/demonstracao";
import { CabecalhoPagina, Indicador, Seccao } from "@/components/ui";
import { BotaoConfirmar } from "@/components/formulario-auto";

export const dynamic = "force-dynamic";

function mensagem(sp: Record<string, string | string[] | undefined>): string | null {
  const ins = typeof sp.inseridos === "string" ? sp.inseridos.split("-").map(Number) : null;
  if (ins) {
    if (ins[0] === 0 && ins[1] === 0) return "Os dados de demonstração já existiam; nada foi duplicado.";
    return `Inseridos ${ins[0]} casais e ${ins[1]} pedidos de parceria.`;
  }
  const rem = typeof sp.removidos === "string" ? sp.removidos.split("-").map(Number) : null;
  if (rem) {
    const partes = [`${rem[0]} casais removidos`, `${rem[1]} fornecedores removidos`];
    if (rem[2] > 0) partes.push(`${rem[2]} fornecedores só desativados, por terem contratações com clientes reais`);
    return partes.join(", ") + ".";
  }
  return null;
}

export default async function Demonstracao({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await exigirAdministrador();
  const sp = await searchParams;
  const aviso = mensagem(sp);
  const existentes = contarDemonstracao();
  const haDados = existentes.clientes + existentes.fornecedores > 0;

  return (
    <>
      <CabecalhoPagina
        titulo="Dados de demonstração"
        descricao="Para aprender a trabalhar no CRM sem tocar em clientes reais."
      />

      {aviso && (
        <p role="status" className="mb-4 rounded-lg bg-[color:var(--ok)]/10 px-3 py-2 text-sm text-[color:var(--ok)]">
          {aviso}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Indicador rotulo="Casais de demonstração" valor={String(existentes.clientes)} href="/clientes?q=demo.quantocustacasar" />
        <Indicador rotulo="Pedidos de parceria de demonstração" valor={String(existentes.fornecedores)} href="/fornecedores?q=demo.quantocustacasar" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Seccao titulo="O que é inserido">
          <div className="space-y-3 p-4 text-sm">
            <p>
              <strong>10 casais</strong>, tal como o simulador os envia: entram em{" "}
              <Link href="/clientes" className="text-brand">Clientes</Link> com estado «Novo» e origem
              «Simulador», com a estimativa, as rubricas incluídas e excluídas, as autorizações e as
              observações nas notas. Datas de casamento entre 4 meses e ano e meio, distritos e
              orçamentos variados — há casos apertados e casos de topo.
            </p>
            <p>
              <strong>10 pedidos de parceria</strong>, tal como o formulário «Seja nosso parceiro» os
              envia: entram em{" "}
              <Link href="/fornecedores?ativo=0" className="text-brand">Fornecedores → Inativos</Link>,
              com categorias e distritos escritos à maneira do site (alguns em minúsculas, um «Margem
              Sul», um concelho em vez de distrito) para praticar a revisão e a ativação.
            </p>
            <p className="text-muted">
              Reconhecem-se pelo email, que termina em <code className="rounded bg-surface-2 px-1">@{DOMINIO_DEMO}</code>.
              As contratações e pagamentos que criar a praticar com estes casais são removidos com eles.
            </p>
          </div>
        </Seccao>

        <Seccao titulo="Ações">
          <div className="space-y-4 p-4">
            <form action={inserirDadosDeDemonstracao}>
              <button type="submit" className="btn btn-principal" disabled={haDados}>
                Inserir 10 casais e 10 pedidos de parceria
              </button>
              {haDados && (
                <p className="mt-2 text-xs text-muted">Já estão inseridos. Remova-os primeiro para voltar a inserir.</p>
              )}
            </form>
            <form action={removerDadosDeDemonstracao}>
              <BotaoConfirmar
                mensagem="Remover todos os dados de demonstração? As contratações e pagamentos criados com estes casais também desaparecem."
                className={`btn btn-perigo ${haDados ? "" : "opacity-50"}`}
              >
                Remover dados de demonstração
              </BotaoConfirmar>
            </form>
            <p className="text-xs text-muted">
              Sugestão de percurso: abra um casal, mude o estado para «Contactado», registe uma nota,
              associe um fornecedor (ative primeiro um dos pedidos de parceria), gere o plano de
              pagamentos e marque o sinal como pago. Depois veja o Painel e a Tesouraria.
            </p>
          </div>
        </Seccao>
      </div>
    </>
  );
}
