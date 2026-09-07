"use client";

import Link from "next/link";
import { useState } from "react";
import { guardarContratacao } from "@/lib/actions/contratacoes";
import {
  CATEGORIAS,
  ESTADOS_CONTRATACAO,
  ROTULO_ESTADO_CONTRATACAO,
} from "@/lib/constants";
import { centsParaInput } from "@/lib/format";
import { Campo } from "@/components/ui";
import type { Contratacao } from "@/lib/types";

type OpcaoCliente = { id: number; nome: string; data_casamento: string | null };
type OpcaoFornecedor = {
  id: number;
  nome: string;
  categoria: string;
  comissao_pct: number;
};

export function FormularioContratacao({
  clientes,
  fornecedores,
  contratacao,
  clienteIdInicial,
  fornecedorIdInicial,
}: {
  clientes: OpcaoCliente[];
  fornecedores: OpcaoFornecedor[];
  contratacao?: Contratacao;
  clienteIdInicial?: number;
  fornecedorIdInicial?: number;
}) {
  const [fornecedorId, setFornecedorId] = useState(
    String(contratacao?.fornecedor_id ?? fornecedorIdInicial ?? ""),
  );
  const [categoria, setCategoria] = useState(contratacao?.categoria ?? "");
  const [comissao, setComissao] = useState(
    String(contratacao?.comissao_pct ?? ""),
  );

  const escolhido = fornecedores.find((f) => String(f.id) === fornecedorId);

  /* Ao escolher um fornecedor herdamos a sua categoria e comissão — ambas
     continuam editáveis, porque podem ser negociadas caso a caso. */
  function escolherFornecedor(valor: string) {
    setFornecedorId(valor);
    const f = fornecedores.find((x) => String(x.id) === valor);
    if (!f) return;
    setCategoria(f.categoria);
    if (!contratacao) setComissao(String(f.comissao_pct));
  }

  return (
    <form action={guardarContratacao} className="cartao space-y-6 p-5">
      {contratacao && <input type="hidden" name="id" value={contratacao.id} />}

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-semibold">Ligação</legend>
        <Campo rotulo="Cliente *">
          <select
            name="cliente_id"
            required
            defaultValue={String(contratacao?.cliente_id ?? clienteIdInicial ?? "")}
            className="campo"
          >
            <option value="">Selecionar…</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
                {c.data_casamento ? ` — ${c.data_casamento}` : ""}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Fornecedor *">
          <select
            name="fornecedor_id"
            required
            value={fornecedorId}
            onChange={(e) => escolherFornecedor(e.target.value)}
            className="campo"
          >
            <option value="">Selecionar…</option>
            {fornecedores.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome} — {f.categoria}
              </option>
            ))}
          </select>
          {escolhido && (
            <p className="mt-1 text-xs text-muted">
              Comissão habitual: {escolhido.comissao_pct}%
            </p>
          )}
        </Campo>
        <Campo rotulo="Categoria do serviço *">
          <select
            name="categoria"
            required
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="campo"
          >
            <option value="">Selecionar…</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Descrição">
          <input
            name="descricao"
            defaultValue={contratacao?.descricao ?? ""}
            placeholder="Menu completo para 120 pessoas"
            className="campo"
          />
        </Campo>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <legend className="mb-2 text-sm font-semibold">Valores</legend>
        <Campo rotulo="Valor acordado (€) *">
          <input
            name="valor"
            required
            inputMode="decimal"
            defaultValue={centsParaInput(contratacao?.valor_cents)}
            placeholder="4500"
            className="campo"
          />
        </Campo>
        <Campo rotulo="Comissão (%)">
          <input
            name="comissao_pct"
            inputMode="decimal"
            value={comissao}
            onChange={(e) => setComissao(e.target.value)}
            className="campo"
          />
        </Campo>
        <Campo rotulo="Estado">
          <select
            name="estado"
            defaultValue={contratacao?.estado ?? "proposta"}
            className="campo"
          >
            {ESTADOS_CONTRATACAO.map((e) => (
              <option key={e} value={e}>
                {ROTULO_ESTADO_CONTRATACAO[e]}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Data do serviço">
          <input
            type="date"
            name="data_servico"
            defaultValue={contratacao?.data_servico ?? ""}
            className="campo"
          />
        </Campo>
        <Campo rotulo="Notas" className="sm:col-span-2 lg:col-span-4">
          <textarea
            name="notas"
            rows={3}
            defaultValue={contratacao?.notas ?? ""}
            className="campo resize-y"
          />
        </Campo>
      </fieldset>

      {!contratacao && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="gerar_plano"
            defaultChecked
            className="size-4 accent-[color:var(--brand)]"
          />
          Gerar plano de pagamentos (sinal de 30% a 30 dias + liquidação)
        </label>
      )}

      <div className="flex items-center gap-2 border-t border-line pt-4">
        <button type="submit" className="btn btn-principal">
          {contratacao ? "Guardar alterações" : "Criar contratação"}
        </button>
        <Link
          href={contratacao ? `/contratacoes/${contratacao.id}` : "/contratacoes"}
          className="btn"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
