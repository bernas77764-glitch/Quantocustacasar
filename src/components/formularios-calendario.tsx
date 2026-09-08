"use client";

import { useActionState, useState } from "react";
import type { EstadoFormulario } from "@/lib/actions/calendario";

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

type Opcao = { id: number; nome: string };

export function FormularioCompromisso({
  acao,
  clientes,
  fornecedores,
  dataInicial,
  clienteId,
  fornecedorId,
  voltarPara,
}: {
  acao: Acao;
  clientes: Opcao[];
  fornecedores: Opcao[];
  dataInicial: string;
  clienteId?: number;
  fornecedorId?: number;
  voltarPara?: string;
}) {
  const [estado, submeter, pendente] = useActionState(acao, {});
  const v = estado.valores ?? {};
  return (
    <form action={submeter} className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
      {voltarPara && <input type="hidden" name="voltar_para" value={voltarPara} />}
      <label className="sm:col-span-2">
        <span className="rotulo">Título</span>
        <input
          name="titulo"
          required
          maxLength={200}
          placeholder="Reunião com o casal, visita à quinta…"
          defaultValue={v.titulo ?? ""}
          className="campo"
        />
      </label>
      <label>
        <span className="rotulo">Data</span>
        <input type="date" name="data" required defaultValue={v.data ?? dataInicial} className="campo" />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label>
          <span className="rotulo">Início</span>
          <input type="time" name="hora_inicio" defaultValue={v.hora_inicio ?? ""} className="campo" />
        </label>
        <label>
          <span className="rotulo">Fim</span>
          <input type="time" name="hora_fim" defaultValue={v.hora_fim ?? ""} className="campo" />
        </label>
      </div>
      <label>
        <span className="rotulo">Cliente</span>
        <select name="cliente_id" defaultValue={v.cliente_id ?? (clienteId ? String(clienteId) : "")} className="campo">
          <option value="">—</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="rotulo">Fornecedor</span>
        <select
          name="fornecedor_id"
          defaultValue={v.fornecedor_id ?? (fornecedorId ? String(fornecedorId) : "")}
          className="campo"
        >
          <option value="">—</option>
          {fornecedores.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="sm:col-span-2">
        <span className="rotulo">Local</span>
        <input name="local" defaultValue={v.local ?? ""} placeholder="Morada, café, videochamada…" className="campo" />
      </label>
      <label className="sm:col-span-2 lg:col-span-4">
        <span className="rotulo">Notas</span>
        <textarea name="notas" rows={2} defaultValue={v.notas ?? ""} className="campo" />
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-4">
        <button type="submit" disabled={pendente} className="btn btn-principal">
          {pendente ? "A guardar…" : "Guardar compromisso"}
        </button>
        <span className="text-xs text-muted">Sem hora fica como dia inteiro. Entra no feed do Google Calendar automaticamente.</span>
      </div>
      <div className="sm:col-span-2 lg:col-span-4">
        <Mensagens estado={estado} />
      </div>
    </form>
  );
}

export function FormularioLigarGoogle({ acao, urlAtual }: { acao: Acao; urlAtual: string | null }) {
  const [estado, submeter, pendente] = useActionState(acao, {});
  return (
    <form action={submeter} className="grid gap-3 p-4">
      <label>
        <span className="rotulo">Endereço secreto em formato iCal</span>
        <input
          name="url"
          type="url"
          required
          inputMode="url"
          autoComplete="off"
          placeholder="https://calendar.google.com/calendar/ical/…/private-…/basic.ics"
          defaultValue={estado.valores?.url ?? urlAtual ?? ""}
          className="campo font-mono text-xs"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pendente} className="btn btn-principal">
          {pendente ? "A ler o calendário…" : urlAtual ? "Guardar e voltar a ler" : "Ligar"}
        </button>
      </div>
      <Mensagens estado={estado} />
    </form>
  );
}

/** Campo só de leitura com botão de copiar, para a ligação do feed. */
export function LigacaoParaCopiar({ valor, rotulo }: { valor: string; rotulo: string }) {
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      window.prompt("Copie a ligação:", valor);
    }
  }
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <label className="flex-1">
        <span className="rotulo">{rotulo}</span>
        <input readOnly value={valor} onFocus={(e) => e.currentTarget.select()} className="campo font-mono text-xs" />
      </label>
      <button type="button" onClick={copiar} className="btn whitespace-nowrap">
        {copiado ? "Copiado ✓" : "Copiar ligação"}
      </button>
    </div>
  );
}
