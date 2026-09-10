"use client";

import { useActionState, useState } from "react";
import type { EstadoFormulario } from "@/lib/actions/email";
import { euros, paraCents } from "@/lib/format";
import {
  CAMPOS_EXEMPLO,
  CAMPOS_MODELO,
  ROTULO_SERVICO,
  SERVICOS_EMAIL,
  preencherModelo,
  type CampoAoEnviar,
  type ModeloEmail,
  type ServicoEmail,
} from "@/lib/email-modelo";

type Acao = (anterior: EstadoFormulario, fd: FormData) => Promise<EstadoFormulario>;

function Mensagens({ estado }: { estado: EstadoFormulario }) {
  if (estado.erro) {
    return (
      <p role="alert" className="rounded-lg bg-[color:var(--bad)]/10 px-3 py-2 text-sm text-[color:var(--bad)]">
        {estado.erro}
      </p>
    );
  }
  if (estado.sucesso) {
    return (
      <p role="status" className="rounded-lg bg-[color:var(--ok)]/10 px-3 py-2 text-sm text-[color:var(--ok)]">
        {estado.sucesso}
      </p>
    );
  }
  return null;
}

/* ------------------------------------------------------------ configuração */

export type ConfiguracaoVisivel = {
  servico: ServicoEmail;
  chave_mascarada: string;
  smtp_servidor: string;
  smtp_porta: number;
  smtp_utilizador: string;
  remetente_nome: string;
  remetente_email: string;
  responder_para: string;
  iban: string;
};

export function FormularioConfiguracaoEmail({ acao, atual }: { acao: Acao; atual: ConfiguracaoVisivel | null }) {
  const [estado, submeter, pendente] = useActionState(acao, {});
  const v = estado.valores ?? {};
  const [servico, setServico] = useState<ServicoEmail>((v.servico as ServicoEmail) || atual?.servico || "smtp");
  const mesmoServico = atual?.servico === servico;
  return (
    <form action={submeter} className="grid gap-3 p-4 sm:grid-cols-2">
      <label className="sm:col-span-2">
        <span className="rotulo">Como enviar</span>
        <select name="servico" value={servico} onChange={(e) => setServico(e.target.value as ServicoEmail)} className="campo">
          {SERVICOS_EMAIL.map((s) => (
            <option key={s} value={s}>
              {ROTULO_SERVICO[s]}
            </option>
          ))}
        </select>
      </label>

      {servico === "smtp" ? (
        <>
          <p className="text-xs text-muted sm:col-span-2">
            Os valores estão no cPanel da dominios.pt, em Email Accounts › Connect Devices. Para a caixa geral@ são
            normalmente <code>webdomain04.dnscpanel.com</code>, porta 465, utilizador igual ao email.
          </p>
          <label>
            <span className="rotulo">Servidor de saída (SMTP)</span>
            <input name="smtp_servidor" required placeholder="webdomain04.dnscpanel.com" defaultValue={v.smtp_servidor ?? atual?.smtp_servidor ?? ""} className="campo" />
          </label>
          <label>
            <span className="rotulo">Porta</span>
            <input name="smtp_porta" inputMode="numeric" defaultValue={v.smtp_porta ?? String(atual?.smtp_porta ?? 465)} className="campo" />
          </label>
          <label>
            <span className="rotulo">Utilizador</span>
            <input name="smtp_utilizador" required placeholder="geral@quantocustacasar.pt" defaultValue={v.smtp_utilizador ?? atual?.smtp_utilizador ?? ""} className="campo" />
          </label>
          <label>
            <span className="rotulo">Palavra-passe da caixa</span>
            <input
              name="chave"
              type="password"
              autoComplete="new-password"
              placeholder={mesmoServico ? `Guardada (${atual!.chave_mascarada}); deixe vazio para manter` : "A palavra-passe da caixa de correio"}
              className="campo"
            />
          </label>
        </>
      ) : (
        <label className="sm:col-span-2">
          <span className="rotulo">Chave da API do {ROTULO_SERVICO[servico]}</span>
          <input
            name="chave"
            type="password"
            autoComplete="off"
            placeholder={mesmoServico ? `Guardada (${atual!.chave_mascarada}); deixe vazio para manter` : "Cole aqui a chave criada no serviço"}
            className="campo font-mono text-xs"
          />
        </label>
      )}

      <label>
        <span className="rotulo">Nome do remetente</span>
        <input name="remetente_nome" placeholder="Bernardo Soares · Quanto Custa Casar" defaultValue={v.remetente_nome ?? atual?.remetente_nome ?? ""} className="campo" />
      </label>
      <label>
        <span className="rotulo">Email do remetente</span>
        <input name="remetente_email" type="email" required placeholder="geral@quantocustacasar.pt" defaultValue={v.remetente_email ?? atual?.remetente_email ?? ""} className="campo" />
      </label>
      <label>
        <span className="rotulo">Respostas para (opcional)</span>
        <input name="responder_para" type="email" placeholder="Se as respostas devem ir para outro endereço" defaultValue={v.responder_para ?? atual?.responder_para ?? ""} className="campo" />
      </label>
      <label>
        <span className="rotulo">IBAN para as faturas (campo {"{iban}"})</span>
        <input name="iban" placeholder="PT50 …" defaultValue={v.iban ?? atual?.iban ?? ""} className="campo font-mono text-xs" />
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={pendente} className="btn btn-principal">
          {pendente ? "A guardar…" : "Guardar configuração"}
        </button>
      </div>
      <div className="sm:col-span-2">
        <Mensagens estado={estado} />
      </div>
    </form>
  );
}

export function FormularioTeste({ acao, emailPorOmissao }: { acao: Acao; emailPorOmissao: string }) {
  const [estado, submeter, pendente] = useActionState(acao, {});
  return (
    <form action={submeter} className="space-y-2 p-4">
      <label>
        <span className="rotulo">Enviar email de teste para</span>
        <div className="flex gap-2">
          <input name="para" type="email" required defaultValue={estado.valores?.para ?? emailPorOmissao} className="campo" />
          <button type="submit" disabled={pendente} className="btn whitespace-nowrap">
            {pendente ? "A enviar…" : "Enviar teste"}
          </button>
        </div>
      </label>
      <Mensagens estado={estado} />
    </form>
  );
}

/* ------------------------------------------------------------------ modelos */

export function FormularioModelo({ acao, chave, modelo }: { acao: Acao; chave: string; modelo: ModeloEmail }) {
  const [estado, submeter, pendente] = useActionState(acao, {});
  const [assunto, setAssunto] = useState(estado.valores?.assunto ?? modelo.assunto);
  const [corpo, setCorpo] = useState(estado.valores?.corpo ?? modelo.corpo);
  return (
    <form action={submeter} className="grid gap-4 p-4 lg:grid-cols-2">
      <input type="hidden" name="chave" value={chave} />
      <div className="space-y-3">
        <label>
          <span className="rotulo">Assunto</span>
          <input name="assunto" required maxLength={200} value={assunto} onChange={(e) => setAssunto(e.target.value)} className="campo" />
        </label>
        <label>
          <span className="rotulo">Texto</span>
          <textarea name="corpo" required rows={14} value={corpo} onChange={(e) => setCorpo(e.target.value)} className="campo font-mono text-xs" />
        </label>
        <details className="text-xs text-muted">
          <summary className="cursor-pointer">Campos que pode usar</summary>
          <ul className="mt-2 space-y-0.5">
            {CAMPOS_MODELO.map((c) => (
              <li key={c.campo}>
                <code className="rounded bg-surface-2 px-1">{c.campo}</code> {c.descricao}
              </li>
            ))}
          </ul>
        </details>
        <button type="submit" disabled={pendente} className="btn btn-principal">
          {pendente ? "A guardar…" : "Guardar modelo"}
        </button>
        <Mensagens estado={estado} />
      </div>
      <div className="rounded-lg bg-surface-2 p-4 text-sm" data-previa>
        <p className="mb-2 text-[11px] tracking-wide text-muted uppercase">Pré-visualização com dados de exemplo</p>
        <p className="font-medium">{preencherModelo(assunto, CAMPOS_EXEMPLO)}</p>
        <pre className="mt-3 font-sans whitespace-pre-wrap">{preencherModelo(corpo, CAMPOS_EXEMPLO)}</pre>
      </div>
    </form>
  );
}

/* ---------------------------------------------------------------- composição */

export function FormularioEmail({
  acao,
  chave,
  ids,
  para,
  assunto,
  corpo,
  camposAoEnviar,
  anexo,
  configurado,
  rotuloDestinatario,
  voltarPara,
}: {
  acao: Acao;
  chave: string;
  ids: { cliente_id?: number | null; fornecedor_id?: number | null; contratacao_id?: number | null };
  para: string;
  assunto: string;
  /** Corpo já preenchido com as fichas; os campos do envio ficam entre chavetas. */
  corpo: string;
  camposAoEnviar: CampoAoEnviar[];
  anexo: boolean;
  configurado: boolean;
  rotuloDestinatario: string;
  voltarPara?: string;
}) {
  const [estado, submeter, pendente] = useActionState(acao, {});
  const v = estado.valores ?? {};
  const [valores, setValores] = useState<Record<string, string>>(() =>
    Object.fromEntries(camposAoEnviar.map((c) => [c.campo, v[`campo_${c.campo}`] ?? ""])),
  );
  // Enquanto não se toca no texto, os campos do envio entram nele ao vivo.
  const [corpoManual, setCorpoManual] = useState<string | null>(v.corpo ?? null);
  const [assuntoManual, setAssuntoManual] = useState<string | null>(v.assunto ?? null);
  const previa: Record<string, string> = {};
  for (const c of camposAoEnviar) {
    const bruto = valores[c.campo] ?? "";
    if (c.tipo === "data" && bruto) previa[c.campo] = bruto.split("-").reverse().join("/");
    else if (c.tipo === "valor" && bruto) {
      const cents = paraCents(bruto);
      previa[c.campo] = cents === null ? bruto : euros(cents);
    } else if (c.campo === "servicos" && bruto) {
      previa[c.campo] = `Segue desde já o que tenho para vos propor:\n${bruto
        .split(/\r?\n/)
        .filter((l) => l.trim())
        .map((l) => (l.trim().startsWith("-") ? l.trim() : `- ${l.trim()}`))
        .join("\n")}`;
    } else previa[c.campo] = bruto;
  }
  const corpoVisivel = corpoManual ?? preencherModelo(corpo, previa).replace(/\{[a-z_]+\}/g, "");
  const assuntoVisivel = assuntoManual ?? preencherModelo(assunto, previa).replace(/\{[a-z_]+\}/g, "").trim();

  return (
    <form action={submeter} className="space-y-3 p-4" encType="multipart/form-data">
      <input type="hidden" name="chave" value={chave} />
      {ids.cliente_id ? <input type="hidden" name="cliente_id" value={ids.cliente_id} /> : null}
      {ids.fornecedor_id ? <input type="hidden" name="fornecedor_id" value={ids.fornecedor_id} /> : null}
      {ids.contratacao_id ? <input type="hidden" name="contratacao_id" value={ids.contratacao_id} /> : null}
      {voltarPara && <input type="hidden" name="voltar_para" value={voltarPara} />}
      <label>
        <span className="rotulo">Para</span>
        <input name="para" type="email" required defaultValue={v.para ?? para} placeholder={`email ${rotuloDestinatario}`} className="campo" />
      </label>
      <label>
        <span className="rotulo">Assunto</span>
        <input name="assunto" required maxLength={200} value={assuntoVisivel} onChange={(e) => setAssuntoManual(e.target.value)} className="campo" />
      </label>

      {camposAoEnviar.length > 0 && (
        <div className="grid gap-3 rounded-lg bg-surface-2 p-3 sm:grid-cols-2">
          {camposAoEnviar.map((c) => (
            <label key={c.campo} className={c.tipo === "textarea" ? "sm:col-span-2" : ""}>
              <span className="rotulo">{c.rotulo}</span>
              {c.tipo === "textarea" ? (
                <textarea
                  name={`campo_${c.campo}`}
                  rows={3}
                  value={valores[c.campo]}
                  onChange={(e) => setValores({ ...valores, [c.campo]: e.target.value })}
                  placeholder={c.dica}
                  className="campo"
                />
              ) : (
                <input
                  name={`campo_${c.campo}`}
                  type={c.tipo === "data" ? "date" : "text"}
                  inputMode={c.tipo === "valor" ? "decimal" : undefined}
                  value={valores[c.campo]}
                  onChange={(e) => setValores({ ...valores, [c.campo]: e.target.value })}
                  placeholder={c.dica}
                  className="campo"
                />
              )}
            </label>
          ))}
          {corpoManual !== null && (
            <p className="text-xs text-muted sm:col-span-2">
              Como já alterou o texto, estes campos deixam de entrar nele sozinhos.{" "}
              <button type="button" className="underline" onClick={() => { setCorpoManual(null); setAssuntoManual(null); }}>
                Voltar a preencher a partir do modelo
              </button>
            </p>
          )}
        </div>
      )}

      <label>
        <span className="rotulo">Texto</span>
        <textarea
          name="corpo"
          required
          rows={16}
          value={corpoVisivel}
          onChange={(e) => setCorpoManual(e.target.value)}
          className="campo"
        />
      </label>

      {anexo && (
        <label>
          <span className="rotulo">Anexo (PDF ou imagem, até 8 MB)</span>
          <input name="anexo" type="file" accept="application/pdf,image/jpeg,image/png" className="campo" />
        </label>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pendente || !configurado} className="btn btn-principal">
          {pendente ? "A enviar…" : "Enviar"}
        </button>
        <span className="text-xs text-muted">Pode alterar o texto antes de enviar. O envio fica registado na ficha.</span>
      </div>
      <Mensagens estado={estado} />
    </form>
  );
}
