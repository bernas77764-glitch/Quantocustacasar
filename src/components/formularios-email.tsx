"use client";

import { useActionState, useState } from "react";
import type { EstadoFormulario } from "@/lib/actions/email";
import { CAMPOS_EXEMPLO, CAMPOS_MODELO, ROTULO_SERVICO, SERVICOS_EMAIL, preencherModelo, type ModeloEmail } from "@/lib/email-modelo";

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

export function FormularioConfiguracaoEmail({
  acao,
  atual,
}: {
  acao: Acao;
  atual: { servico: string; chave_mascarada: string; remetente_nome: string; remetente_email: string; responder_para: string } | null;
}) {
  const [estado, submeter, pendente] = useActionState(acao, {});
  const v = estado.valores ?? {};
  return (
    <form action={submeter} className="grid gap-3 p-4 sm:grid-cols-2">
      <label>
        <span className="rotulo">Serviço de envio</span>
        <select name="servico" defaultValue={v.servico ?? atual?.servico ?? "resend"} className="campo">
          {SERVICOS_EMAIL.map((s) => (
            <option key={s} value={s}>
              {ROTULO_SERVICO[s]}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="rotulo">Chave da API</span>
        <input
          name="chave"
          type="password"
          autoComplete="off"
          placeholder={atual ? `Guardada (${atual.chave_mascarada}); deixe vazio para manter` : "Cole aqui a chave criada no serviço"}
          className="campo font-mono text-xs"
        />
      </label>
      <label>
        <span className="rotulo">Nome do remetente</span>
        <input name="remetente_nome" placeholder="Bernardo · Quanto Custa Casar" defaultValue={v.remetente_nome ?? atual?.remetente_nome ?? ""} className="campo" />
      </label>
      <label>
        <span className="rotulo">Email do remetente</span>
        <input
          name="remetente_email"
          type="email"
          required
          placeholder="geral@quantocustacasar.pt"
          defaultValue={v.remetente_email ?? atual?.remetente_email ?? ""}
          className="campo"
        />
      </label>
      <label className="sm:col-span-2">
        <span className="rotulo">Respostas para (opcional)</span>
        <input
          name="responder_para"
          type="email"
          placeholder="Se os fornecedores devem responder para outro endereço"
          defaultValue={v.responder_para ?? atual?.responder_para ?? ""}
          className="campo"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={pendente} className="btn btn-principal">
          {pendente ? "A guardar…" : "Guardar configuração"}
        </button>
        <span className="text-xs text-muted">O email do remetente tem de ser de um domínio verificado no serviço.</span>
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

export function FormularioModelo({ acao, modelo }: { acao: Acao; modelo: ModeloEmail }) {
  const [estado, submeter, pendente] = useActionState(acao, {});
  const [assunto, setAssunto] = useState(estado.valores?.assunto ?? modelo.assunto);
  const [corpo, setCorpo] = useState(estado.valores?.corpo ?? modelo.corpo);
  return (
    <form action={submeter} className="grid gap-4 p-4 lg:grid-cols-2">
      <div className="space-y-3">
        <label>
          <span className="rotulo">Assunto</span>
          <input name="assunto" required maxLength={200} value={assunto} onChange={(e) => setAssunto(e.target.value)} className="campo" />
        </label>
        <label>
          <span className="rotulo">Texto</span>
          <textarea name="corpo" required rows={16} value={corpo} onChange={(e) => setCorpo(e.target.value)} className="campo font-mono text-xs" />
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
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pendente} className="btn btn-principal">
            {pendente ? "A guardar…" : "Guardar modelo"}
          </button>
        </div>
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

export function FormularioPedido({
  acao,
  contratacaoId,
  para,
  assunto,
  corpo,
  configurado,
}: {
  acao: Acao;
  contratacaoId: number;
  para: string;
  assunto: string;
  corpo: string;
  configurado: boolean;
}) {
  const [estado, submeter, pendente] = useActionState(acao, {});
  const v = estado.valores ?? {};
  return (
    <form action={submeter} className="space-y-3 p-4">
      <input type="hidden" name="contratacao_id" value={contratacaoId} />
      <label>
        <span className="rotulo">Para</span>
        <input name="para" type="email" required defaultValue={v.para ?? para} placeholder="email do fornecedor" className="campo" />
      </label>
      <label>
        <span className="rotulo">Assunto</span>
        <input name="assunto" required maxLength={200} defaultValue={v.assunto ?? assunto} className="campo" />
      </label>
      <label>
        <span className="rotulo">Texto</span>
        <textarea name="corpo" required rows={16} defaultValue={v.corpo ?? corpo} className="campo" />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pendente || !configurado} className="btn btn-principal">
          {pendente ? "A enviar…" : "Enviar ao fornecedor"}
        </button>
        <span className="text-xs text-muted">Pode alterar o texto antes de enviar. O envio fica registado na ficha do cliente.</span>
      </div>
      <Mensagens estado={estado} />
    </form>
  );
}
