import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirSessao } from "@/lib/auth";
import { configuracaoEmail } from "@/lib/email";
import { prepararEmail } from "@/lib/email-preparar";
import { emailsDaContratacao, emailsDoCliente, emailsDoFornecedor } from "@/lib/queries/emails";
import { enviarEmailPreparado, guardarEmailDoDestinatario } from "@/lib/actions/email";
import { dataHora } from "@/lib/format";
import { CabecalhoPagina, Etiqueta, Seccao } from "@/components/ui";
import { FormularioEmail } from "@/components/formularios-email";

export const dynamic = "force-dynamic";

type Params = Promise<Record<string, string | string[] | undefined>>;

function primeiro(v: string | string[] | undefined): string {
  return typeof v === "string" ? v : "";
}

export default async function NovoEmail({ searchParams }: { searchParams: Params }) {
  const utilizador = await exigirSessao();
  const sp = await searchParams;
  const chave = primeiro(sp.modelo);
  const ids = {
    cliente_id: Number(primeiro(sp.cliente_id)) || null,
    fornecedor_id: Number(primeiro(sp.fornecedor_id)) || null,
    contratacao_id: Number(primeiro(sp.contratacao_id)) || null,
  };
  const preparado = prepararEmail(chave, ids, utilizador.nome);
  if (!preparado) notFound();
  const { definicao, cliente, fornecedor, contratacao } = preparado;
  const config = configuracaoEmail();
  const voltar = primeiro(sp.voltar_para).startsWith("/")
    ? primeiro(sp.voltar_para)
    : contratacao
      ? `/contratacoes/${contratacao.id}`
      : definicao.destinatario === "cliente" && cliente
        ? `/clientes/${cliente.id}`
        : fornecedor
          ? `/fornecedores/${fornecedor.id}`
          : "/";
  const paginaAtual = `/emails/novo?modelo=${chave}${ids.cliente_id ? `&cliente_id=${ids.cliente_id}` : ""}${ids.fornecedor_id ? `&fornecedor_id=${ids.fornecedor_id}` : ""}${ids.contratacao_id ? `&contratacao_id=${ids.contratacao_id}` : ""}`;
  const anteriores = (
    contratacao ? emailsDaContratacao(contratacao.id) : definicao.destinatario === "cliente" && cliente ? emailsDoCliente(cliente.id) : fornecedor ? emailsDoFornecedor(fornecedor.id) : []
  ).filter((e) => e.tipo === chave);
  const destinatarioNome = definicao.destinatario === "cliente" ? cliente?.nome : fornecedor?.nome;
  const rotuloDestinatario = definicao.destinatario === "cliente" ? "do casal" : "do fornecedor";

  return (
    <>
      <CabecalhoPagina
        titulo={definicao.rotulo}
        descricao={[fornecedor?.nome, cliente ? `${cliente.nome}${cliente.parceiro ? ` & ${cliente.parceiro}` : ""}` : null].filter(Boolean).join(" · ")}
        acoes={
          <Link href={voltar} className="btn">
            {anteriores.length ? "Voltar à ficha" : "Não enviar agora"}
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

      {!preparado.para && (
        <form action={guardarEmailDoDestinatario} className="mb-4 flex flex-wrap items-end gap-3 rounded-lg bg-[color:var(--warn)]/10 px-4 py-3 text-sm">
          {definicao.destinatario === "cliente" && cliente ? (
            <input type="hidden" name="cliente_id" value={cliente.id} />
          ) : fornecedor ? (
            <input type="hidden" name="fornecedor_id" value={fornecedor.id} />
          ) : null}
          <input type="hidden" name="voltar_para" value={paginaAtual} />
          <span className="flex-1">
            <span className="font-medium">{destinatarioNome}</span> não tem email na ficha. Escreva-o aqui para ficar guardado.
          </span>
          <label className="flex items-end gap-2">
            <input name="email" type="email" required placeholder={`email ${rotuloDestinatario}`} className="campo w-64" aria-label={`Email ${rotuloDestinatario}`} />
            <button type="submit" className="btn px-2 py-1.5 text-xs whitespace-nowrap">
              Guardar na ficha
            </button>
          </label>
        </form>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="cartao lg:col-span-2">
          <FormularioEmail
            acao={enviarEmailPreparado}
            chave={chave}
            ids={ids}
            para={preparado.para}
            assunto={preparado.assunto}
            corpo={preparado.corpo}
            camposAoEnviar={definicao.campos_ao_enviar}
            anexo={definicao.anexo}
            configurado={config !== null}
            rotuloDestinatario={rotuloDestinatario}
            voltarPara={primeiro(sp.voltar_para).startsWith("/") ? primeiro(sp.voltar_para) : undefined}
          />
        </div>
        <div className="space-y-6">
          <Seccao titulo="Dados usados">
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 p-4 text-sm">
              {(["casal", "data", "convidados", "distrito", "local", "orcamento", "fornecedor", "contacto", "categoria", "comissao", "valor"] as const)
                .filter((c) => preparado.corpo.includes(`{${c}}`) === false && (definicao.modelo.corpo + definicao.modelo.assunto).includes(`{${c}}`))
                .map((c) => (
                  <div key={c} className="contents">
                    <dt className="text-muted capitalize">{c}</dt>
                    <dd className={preparado.campos[c] === "a definir" ? "text-[color:var(--warn)]" : ""}>{preparado.campos[c]}</dd>
                  </div>
                ))}
            </dl>
            <p className="border-t border-line px-4 py-2 text-xs text-muted">
              Se faltar algo, corrija na ficha
              {cliente && (
                <>
                  {" "}
                  <Link href={`/clientes/${cliente.id}/editar`} className="hover:text-brand">
                    do cliente
                  </Link>
                </>
              )}
              {fornecedor && (
                <>
                  {cliente ? " ou" : ""}{" "}
                  <Link href={`/fornecedores/${fornecedor.id}/editar`} className="hover:text-brand">
                    do fornecedor
                  </Link>
                </>
              )}
              {contratacao && (
                <>
                  {" "}
                  ou na{" "}
                  <Link href={`/contratacoes/${contratacao.id}/editar`} className="hover:text-brand">
                    contratação
                  </Link>
                </>
              )}{" "}
              e volte aqui.
            </p>
          </Seccao>
          <Seccao titulo="Envios anteriores deste email" vazio={anteriores.length === 0}>
            {anteriores.length === 0 ? (
              "Ainda não foi enviado."
            ) : (
              <ul className="divide-y divide-line text-sm">
                {anteriores.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-2 px-4 py-2">
                    <span className="text-xs text-muted">
                      {dataHora(e.criado_em)} · {e.para}
                    </span>
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
