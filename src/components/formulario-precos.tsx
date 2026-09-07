"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { EstadoPrecos } from "@/lib/actions/precos";
import type { Dimensao, RubricaBase, TabelaPrecos } from "@/lib/precos";

type Acao = (anterior: EstadoPrecos, fd: FormData) => Promise<EstadoPrecos>;

function Submeter({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-principal">
      {pending ? "A guardar…" : children}
    </button>
  );
}

function Mensagens({ estado }: { estado: EstadoPrecos }) {
  if (estado.erros?.length) {
    return (
      <div role="alert" className="rounded-lg bg-[color:var(--bad)]/10 px-3 py-2 text-sm text-[color:var(--bad)]">
        <p className="font-medium">Não guardado. Corrija:</p>
        <ul className="mt-1 list-disc pl-5">
          {estado.erros.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </div>
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

const ROTULO_UN = { fixo: "valor fixo", convidado: "por convidado" };

export function FormularioPrecos({
  acao,
  rubricas,
  multiplicadores,
  tabela,
}: {
  acao: Acao;
  rubricas: RubricaBase[];
  multiplicadores: Record<Dimensao, { chave: string; nome: string }[]>;
  tabela: TabelaPrecos;
}) {
  const [estado, submeter] = useActionState(acao, {});
  const valorDe = (id: string) => tabela.rubricas.find((r) => r.id === id)!;
  const grupos = [...new Set(rubricas.map((r) => r.grupo))];
  const rotulos: Record<Dimensao, string> = { regiao: "Região", epoca: "Época", estilo: "Estilo" };

  return (
    <form action={submeter} className="space-y-6">
      <div className="cartao overflow-x-auto">
        <table className="tabela">
          <thead>
            <tr>
              <th>Rubrica</th>
              <th>Cobrança</th>
              <th className="w-28 text-right">Mínimo (€)</th>
              <th className="w-28 text-right">Estimativa (€)</th>
              <th className="w-28 text-right">Máximo (€)</th>
            </tr>
          </thead>
          <tbody>
            {grupos.map((grupo) => (
              <GrupoLinhas
                key={grupo}
                grupo={grupo}
                rubricas={rubricas.filter((r) => r.grupo === grupo)}
                valorDe={valorDe}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {(Object.keys(multiplicadores) as Dimensao[]).map((dim) => (
          <div key={dim} className="cartao p-4">
            <h3 className="mb-3 text-sm font-semibold">{rotulos[dim]}</h3>
            <div className="space-y-2">
              {multiplicadores[dim].map((m) => (
                <label key={m.chave} className="flex items-center justify-between gap-3 text-sm">
                  <span>{m.nome}</span>
                  <input
                    name={`m.${dim}.${m.chave}`}
                    inputMode="decimal"
                    defaultValue={String(tabela.mult[dim][m.chave])}
                    aria-label={`${rotulos[dim]}: ${m.nome}`}
                    className="campo w-20 text-right tabular-nums"
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Mensagens estado={estado} />

      <div className="flex flex-wrap items-center gap-2">
        <Submeter>Guardar tabela</Submeter>
        <p className="text-xs text-muted">
          Multiplicador 1,00 = preço de referência; 1,15 = 15% acima; 0,88 = 12% abaixo.
        </p>
      </div>
    </form>
  );
}

function GrupoLinhas({
  grupo,
  rubricas,
  valorDe,
}: {
  grupo: string;
  rubricas: RubricaBase[];
  valorDe: (id: string) => { min: number; base: number; max: number };
}) {
  return (
    <>
      <tr className="bg-surface-2">
        <td colSpan={5} className="text-xs font-semibold tracking-wide text-muted uppercase">
          {grupo}
        </td>
      </tr>
      {rubricas.map((r) => {
        const v = valorDe(r.id);
        return (
          <tr key={r.id}>
            <td className="font-medium">{r.nome}</td>
            <td className="text-muted">{ROTULO_UN[r.un]}</td>
            {(["min", "base", "max"] as const).map((campo) => (
              <td key={campo}>
                <input
                  name={`r.${r.id}.${campo}`}
                  inputMode="numeric"
                  defaultValue={String(v[campo])}
                  aria-label={`${r.nome}: ${campo}`}
                  className="campo text-right tabular-nums"
                />
              </td>
            ))}
          </tr>
        );
      })}
    </>
  );
}

export function FormularioImportar({ acao }: { acao: Acao }) {
  const [estado, submeter] = useActionState(acao, {});
  return (
    <form action={submeter} className="space-y-3 p-4">
      <p className="text-sm text-muted">
        Na área da equipa do site, «Copiar tabela (JSON)» copia os valores desse
        navegador. Cole-os aqui para os tornar os valores de toda a gente.
      </p>
      <textarea
        name="json"
        rows={6}
        required
        placeholder='{ "rubricas": [ … ], "mult": { … } }'
        className="campo resize-y font-mono text-xs"
      />
      <Mensagens estado={estado} />
      <Submeter>Importar</Submeter>
    </form>
  );
}
