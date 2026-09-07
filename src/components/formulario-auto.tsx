"use client";

import { useRef, type ReactNode } from "react";

/**
 * Formulário que se submete assim que um controlo muda — usado nos seletores
 * de estado, onde um botão "guardar" extra só acrescentaria cliques.
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
  return (
    <form
      ref={ref}
      action={action}
      className={className}
      onChange={() => ref.current?.requestSubmit()}
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
