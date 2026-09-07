"use client";

import { useRef, useTransition, type ReactNode } from "react";

/**
 * Formulário que se submete assim que um controlo muda — usado nos seletores
 * de estado, onde um botão "guardar" extra só acrescentaria cliques.
 *
 * A ação é chamada diretamente numa transição em vez de passar pela submissão
 * do formulário: assim o React não repõe os campos nos valores iniciais depois
 * de gravar (o que fazia o seletor "saltar" para o estado antigo) e não depende
 * de `requestSubmit`, que falta em versões antigas do Safari.
 */
export function FormularioAuto({
  action,
  children,
  className,
}: {
  action: (fd: FormData) => Promise<void>;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [pendente, iniciar] = useTransition();

  function enviar() {
    const form = ref.current;
    if (!form || pendente) return;
    const dados = new FormData(form);
    iniciar(async () => {
      await action(dados);
    });
  }

  return (
    <form
      ref={ref}
      action={action}
      className={[className, pendente ? "pointer-events-none opacity-60" : ""].filter(Boolean).join(" ") || undefined}
      aria-busy={pendente || undefined}
      onSubmit={(e) => {
        e.preventDefault();
        enviar();
      }}
      onChange={enviar}
    >
      {children}
    </form>
  );
}

/** Botão de submissão que pede confirmação antes de agir. */
export function BotaoConfirmar({
  children,
  mensagem,
  className = "btn btn-perigo",
}: {
  children: ReactNode;
  mensagem: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(mensagem)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
