"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { EstadoFormulario } from "@/lib/actions/utilizadores";

type Acao = (anterior: EstadoFormulario, fd: FormData) => Promise<EstadoFormulario>;

function Submeter({ children, className = "btn btn-principal" }: { children: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? "A processar…" : children}
    </button>
  );
}

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

/* ------------------------------------------------------------ nova conta */

export function FormularioNovaConta({ acao }: { acao: Acao }) {
  const [estado, submeter] = useActionState(acao, {});
  return (
    <form action={submeter} className="grid gap-4 p-4 sm:grid-cols-2">
      <label className="block">
        <span className="rotulo">Nome</span>
        <input name="nome" required defaultValue={estado.valores?.nome ?? ""} className="campo" />
      </label>
      <label className="block">
        <span className="rotulo">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="off"
          defaultValue={estado.valores?.email ?? ""}
          className="campo"
        />
      </label>
      <label className="block">
        <span className="rotulo">Palavra-passe inicial</span>
        <input type="password" name="palavra_passe" required autoComplete="new-password" className="campo" />
      </label>
      <label className="block">
        <span className="rotulo">Confirmar</span>
        <input type="password" name="confirmacao" required autoComplete="new-password" className="campo" />
      </label>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="administrador" className="size-4 accent-[color:var(--brand)]" />
        Administrador (pode gerir contas)
      </label>
      <div className="sm:col-span-2">
        <Mensagens estado={estado} />
      </div>
      <div className="sm:col-span-2">
        <Submeter>Criar conta</Submeter>
      </div>
      <p className="text-xs text-muted sm:col-span-2">
        Comunique a palavra-passe inicial à pessoa por um canal seguro; ela pode
        mudá-la em «A minha conta» depois de entrar.
      </p>
    </form>
  );
}

/* --------------------------------------------- redefinir (por administrador) */

export function FormularioRedefinir({ acao, id, email }: { acao: Acao; id: number; email: string }) {
  const [aberto, setAberto] = useState(false);
  const [estado, submeter] = useActionState(acao, {});

  if (!aberto) {
    return (
      <button type="button" onClick={() => setAberto(true)} className="btn px-2 py-1 text-xs">
        Redefinir palavra-passe
      </button>
    );
  }

  return (
    <form action={submeter} className="flex flex-col gap-2 rounded-lg border border-line bg-surface-2 p-3">
      <input type="hidden" name="id" value={id} />
      <p className="text-xs text-muted">Nova palavra-passe para {email}</p>
      <input type="password" name="palavra_passe" required autoComplete="new-password" placeholder="Nova palavra-passe" className="campo" />
      <input type="password" name="confirmacao" required autoComplete="new-password" placeholder="Confirmar" className="campo" />
      <Mensagens estado={estado} />
      <div className="flex gap-2">
        <Submeter className="btn btn-principal px-2 py-1 text-xs">Guardar</Submeter>
        <button type="button" onClick={() => setAberto(false)} className="btn px-2 py-1 text-xs">
          Fechar
        </button>
      </div>
    </form>
  );
}

/* --------------------------------------------------------- a própria conta */

export function FormularioMinhaPalavraPasse({ acao }: { acao: Acao }) {
  const [estado, submeter] = useActionState(acao, {});
  return (
    <form action={submeter} className="space-y-4 p-4">
      <label className="block">
        <span className="rotulo">Palavra-passe atual</span>
        <input type="password" name="atual" required autoComplete="current-password" className="campo" />
      </label>
      <label className="block">
        <span className="rotulo">Nova palavra-passe</span>
        <input type="password" name="palavra_passe" required autoComplete="new-password" className="campo" />
      </label>
      <label className="block">
        <span className="rotulo">Confirmar nova palavra-passe</span>
        <input type="password" name="confirmacao" required autoComplete="new-password" className="campo" />
      </label>
      <Mensagens estado={estado} />
      <Submeter>Alterar palavra-passe</Submeter>
    </form>
  );
}
