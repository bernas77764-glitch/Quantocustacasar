"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { EstadoAutenticacao } from "@/lib/actions/auth";

function Submeter({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-principal w-full">
      {pending ? "A processar…" : children}
    </button>
  );
}

export function FormularioLogin({
  acao,
  primeiraConta,
}: {
  acao: (
    anterior: EstadoAutenticacao,
    fd: FormData,
  ) => Promise<EstadoAutenticacao>;
  primeiraConta: boolean;
}) {
  const [estado, submeter] = useActionState(acao, {});

  return (
    <form action={submeter} className="space-y-4">
      {primeiraConta && (
        <label className="block">
          <span className="rotulo">Nome</span>
          <input
            name="nome"
            required
            autoComplete="name"
            defaultValue={estado.valores?.nome ?? ""}
            className="campo"
          />
        </label>
      )}

      <label className="block">
        <span className="rotulo">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="username"
          autoFocus={!primeiraConta}
          defaultValue={estado.valores?.email ?? ""}
          className="campo"
        />
      </label>

      <label className="block">
        <span className="rotulo">Palavra-passe</span>
        <input
          type="password"
          name="palavra_passe"
          required
          autoComplete={primeiraConta ? "new-password" : "current-password"}
          className="campo"
        />
      </label>

      {primeiraConta && (
        <label className="block">
          <span className="rotulo">Confirmar palavra-passe</span>
          <input
            type="password"
            name="confirmacao"
            required
            autoComplete="new-password"
            className="campo"
          />
        </label>
      )}

      {estado.erro && (
        <p
          role="alert"
          className="rounded-lg bg-[color:var(--bad)]/10 px-3 py-2 text-sm text-[color:var(--bad)]"
        >
          {estado.erro}
        </p>
      )}

      <Submeter>{primeiraConta ? "Criar conta e entrar" : "Entrar"}</Submeter>
    </form>
  );
}
