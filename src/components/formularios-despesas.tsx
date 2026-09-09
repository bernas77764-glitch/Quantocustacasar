"use client";

import { useActionState, useState } from "react";
import type { EstadoFormulario } from "@/lib/actions/despesas";
import type { CategoriaDespesa, Despesa } from "@/lib/types";
import { euros, paraCents } from "@/lib/format";
import { METODOS_PAGAMENTO } from "@/lib/constants";
import { calcularIva } from "@/lib/iva";

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

/** Taxas de IVA em Portugal continental; "Outra" cobre Madeira, Açores e casos especiais. */
const TAXAS = [
  { valor: "nao", rotulo: "Não se aplica" },
  { valor: "0", rotulo: "0% (isento)" },
  { valor: "6", rotulo: "6% (reduzida)" },
  { valor: "13", rotulo: "13% (intermédia)" },
  { valor: "23", rotulo: "23% (normal)" },
  { valor: "outra", rotulo: "Outra…" },
];

function escolhaInicial(ivaPct: number | null | undefined): string {
  if (ivaPct === null || ivaPct === undefined) return "nao";
  return TAXAS.some((t) => t.valor === String(ivaPct)) ? String(ivaPct) : "outra";
}

export function FormularioDespesa({
  acao,
  categorias,
  clientes,
  despesa,
  dataInicial,
  voltarPara,
}: {
  acao: Acao;
  categorias: CategoriaDespesa[];
  clientes: { id: number; nome: string }[];
  despesa?: Despesa | null;
  dataInicial: string;
  voltarPara?: string;
}) {
  const [estado, submeter, pendente] = useActionState(acao, {});
  const v = estado.valores ?? {};

  // Pré-visualização de base, IVA e total enquanto se escreve.
  const [valorTexto, setValorTexto] = useState(
    v.valor ?? (despesa ? ((despesa.iva_cents > 0 ? despesa.total_cents : despesa.valor_cents) / 100).toFixed(2).replace(".", ",") : ""),
  );
  const [escolha, setEscolha] = useState(v.iva_pct ?? escolhaInicial(despesa?.iva_pct));
  const [outra, setOutra] = useState(v.iva_outra ?? (despesa?.iva_pct !== null && despesa?.iva_pct !== undefined ? String(despesa.iva_pct) : ""));
  const [comIva, setComIva] = useState(v.valor_com_iva ? v.valor_com_iva === "sim" : !despesa || despesa.iva_cents > 0);

  const taxa = escolha === "nao" ? null : escolha === "outra" ? Number(outra.replace(",", ".")) || 0 : Number(escolha);
  const valorCents = paraCents(valorTexto) ?? 0;
  const previa = calcularIva(valorCents, taxa, comIva);
  const temIva = taxa !== null && taxa > 0;

  return (
    <form action={submeter} className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
      {despesa && <input type="hidden" name="id" value={despesa.id} />}
      {voltarPara && <input type="hidden" name="voltar_para" value={voltarPara} />}
      <label className="sm:col-span-2">
        <span className="rotulo">Descrição</span>
        <input
          name="descricao"
          required
          maxLength={200}
          placeholder="Anúncios Instagram, gasolina, contabilista…"
          defaultValue={v.descricao ?? despesa?.descricao ?? ""}
          className="campo"
        />
      </label>
      <label>
        <span className="rotulo">Data</span>
        <input type="date" name="data" required defaultValue={v.data ?? despesa?.data ?? dataInicial} className="campo" />
      </label>
      <label>
        <span className="rotulo">Categoria</span>
        <select name="categoria_id" defaultValue={v.categoria_id ?? (despesa?.categoria_id ? String(despesa.categoria_id) : "")} className="campo">
          <option value="">Sem categoria</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className="rotulo">Valor (€)</span>
        <input
          name="valor"
          required
          inputMode="decimal"
          placeholder="0,00"
          value={valorTexto}
          onChange={(e) => setValorTexto(e.target.value)}
          className="campo"
        />
      </label>
      <label>
        <span className="rotulo">Taxa de IVA</span>
        <select name="iva_pct" value={escolha} onChange={(e) => setEscolha(e.target.value)} className="campo">
          {TAXAS.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.rotulo}
            </option>
          ))}
        </select>
      </label>
      {escolha === "outra" ? (
        <label>
          <span className="rotulo">Taxa (%)</span>
          <input
            name="iva_outra"
            inputMode="decimal"
            placeholder="16"
            value={outra}
            onChange={(e) => setOutra(e.target.value)}
            className="campo"
            aria-label="Outra taxa de IVA em percentagem"
          />
        </label>
      ) : (
        <input type="hidden" name="iva_outra" value="" />
      )}
      <fieldset className={`${escolha === "outra" ? "" : "sm:col-span-1"} ${temIva ? "" : "opacity-50"}`} disabled={!temIva}>
        <legend className="rotulo">O valor escrito…</legend>
        <div className="flex gap-3 pt-1 text-sm">
          <label className="flex items-center gap-1.5">
            <input type="radio" name="valor_com_iva" value="sim" checked={comIva} onChange={() => setComIva(true)} />
            já inclui IVA
          </label>
          <label className="flex items-center gap-1.5">
            <input type="radio" name="valor_com_iva" value="nao" checked={!comIva} onChange={() => setComIva(false)} />
            é sem IVA
          </label>
        </div>
      </fieldset>

      <div
        className="grid grid-cols-3 gap-2 rounded-lg bg-surface-2 px-3 py-2 text-sm sm:col-span-2 lg:col-span-4"
        aria-live="polite"
        data-previa
      >
        <div>
          <p className="text-[11px] tracking-wide text-muted uppercase">Base sem IVA</p>
          <p className="font-medium tabular-nums">{euros(previa.valor_cents)}</p>
        </div>
        <div>
          <p className="text-[11px] tracking-wide text-muted uppercase">IVA{temIva ? ` ${taxa}%` : ""}</p>
          <p className="font-medium tabular-nums">{euros(previa.iva_cents)}</p>
        </div>
        <div>
          <p className="text-[11px] tracking-wide text-muted uppercase">Total</p>
          <p className="font-semibold tabular-nums">{euros(previa.total_cents)}</p>
        </div>
      </div>

      <label>
        <span className="rotulo">Pago a</span>
        <input name="fornecedor" placeholder="Loja, serviço, pessoa" defaultValue={v.fornecedor ?? despesa?.fornecedor ?? ""} className="campo" />
      </label>
      <label>
        <span className="rotulo">Método</span>
        <select name="metodo" defaultValue={v.metodo ?? despesa?.metodo ?? ""} className="campo">
          <option value="">—</option>
          {METODOS_PAGAMENTO.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>
      <label className="sm:col-span-2">
        <span className="rotulo">Cliente (se a despesa for de um casamento em concreto)</span>
        <select name="cliente_id" defaultValue={v.cliente_id ?? (despesa?.cliente_id ? String(despesa.cliente_id) : "")} className="campo">
          <option value="">—</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="sm:col-span-2 lg:col-span-4">
        <span className="rotulo">Notas</span>
        <textarea name="notas" rows={2} defaultValue={v.notas ?? despesa?.notas ?? ""} className="campo" />
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-4">
        <button type="submit" disabled={pendente} className="btn btn-principal">
          {pendente ? "A guardar…" : despesa ? "Guardar alterações" : "Registar despesa"}
        </button>
      </div>
      <div className="sm:col-span-2 lg:col-span-4">
        <Mensagens estado={estado} />
      </div>
    </form>
  );
}

export function FormularioCategoria({ acao }: { acao: Acao }) {
  const [estado, submeter, pendente] = useActionState(acao, {});
  return (
    <form action={submeter} className="space-y-2 p-4">
      <label>
        <span className="rotulo">Nova categoria</span>
        <div className="flex gap-2">
          <input name="nome" required maxLength={60} placeholder="Ex.: Seguros" defaultValue={estado.valores?.nome ?? ""} className="campo" />
          <button type="submit" disabled={pendente} className="btn whitespace-nowrap">
            Criar
          </button>
        </div>
      </label>
      <Mensagens estado={estado} />
    </form>
  );
}
