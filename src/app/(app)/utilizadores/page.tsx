import { exigirAdministrador, listarUtilizadores } from "@/lib/auth";
import {
  alternarAdministrador,
  alternarAtivo,
  criarConta,
  redefinirPalavraPasseDeOutrem,
} from "@/lib/actions/utilizadores";
import { data } from "@/lib/format";
import { CabecalhoPagina, Etiqueta, Seccao } from "@/components/ui";
import { FormularioNovaConta, FormularioRedefinir } from "@/components/formularios-utilizadores";
import { BotaoConfirmar } from "@/components/formulario-auto";

export const dynamic = "force-dynamic";

const AVISOS: Record<string, string> = {
  "propria-conta": "Não pode desativar nem despromover a sua própria conta. Peça a outro administrador.",
  "ultimo-administrador": "Tem de ficar pelo menos um administrador ativo.",
};

export default async function Utilizadores({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const eu = await exigirAdministrador();
  const sp = await searchParams;
  const aviso = typeof sp.aviso === "string" ? AVISOS[sp.aviso] : undefined;
  const utilizadores = listarUtilizadores();

  return (
    <>
      <CabecalhoPagina
        titulo="Utilizadores"
        descricao="Quem pode entrar no CRM. Só administradores veem esta página."
      />

      {aviso && (
        <p role="alert" className="mb-4 rounded-lg bg-[color:var(--warn)]/10 px-3 py-2 text-sm text-[color:var(--warn)]">
          {aviso}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Seccao titulo="Contas">
            <div className="overflow-x-auto">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Perfil</th>
                    <th>Estado</th>
                    <th>Criada</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {utilizadores.map((u) => {
                    const souEu = u.id === eu.id;
                    return (
                      <tr key={u.id}>
                        <td>
                          <span className="font-medium">{u.nome}</span>
                          {souEu && <span className="ml-1 text-xs text-muted">(eu)</span>}
                          <p className="text-xs break-all text-muted">{u.email}</p>
                        </td>
                        <td>
                          {u.administrador ? (
                            <Etiqueta tom="violeta">Administrador</Etiqueta>
                          ) : (
                            <Etiqueta tom="cinza">Utilizador</Etiqueta>
                          )}
                        </td>
                        <td>
                          {u.ativo ? (
                            <Etiqueta tom="verde">Ativo</Etiqueta>
                          ) : (
                            <Etiqueta tom="vermelho">Inativo</Etiqueta>
                          )}
                        </td>
                        <td className="whitespace-nowrap text-muted">{data(u.criado_em)}</td>
                        <td>
                          <div className="flex flex-wrap items-start justify-end gap-1">
                            <form action={alternarAdministrador}>
                              <input type="hidden" name="id" value={u.id} />
                              <button type="submit" className="btn px-2 py-1 text-xs" disabled={souEu}>
                                {u.administrador ? "Retirar administrador" : "Tornar administrador"}
                              </button>
                            </form>
                            <form action={alternarAtivo}>
                              <input type="hidden" name="id" value={u.id} />
                              {u.ativo ? (
                                <BotaoConfirmar
                                  mensagem={`Desativar ${u.nome}? As sessões abertas dessa conta terminam.`}
                                  className="btn-perigo rounded-lg px-2 py-1 text-xs"
                                >
                                  Desativar
                                </BotaoConfirmar>
                              ) : (
                                <button type="submit" className="btn px-2 py-1 text-xs">
                                  Reativar
                                </button>
                              )}
                            </form>
                            {!souEu && (
                              <FormularioRedefinir
                                acao={redefinirPalavraPasseDeOutrem}
                                id={u.id}
                                email={u.email}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Seccao>
        </div>

        <Seccao titulo="Nova conta">
          <FormularioNovaConta acao={criarConta} />
        </Seccao>
      </div>
    </>
  );
}
