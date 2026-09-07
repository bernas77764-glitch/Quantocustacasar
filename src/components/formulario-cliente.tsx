import Link from "next/link";
import { guardarCliente } from "@/lib/actions/clientes";
import {
  DISTRITOS,
  ESTADOS_CLIENTE,
  ORIGENS,
  ROTULO_ESTADO_CLIENTE,
} from "@/lib/constants";
import { centsParaInput } from "@/lib/format";
import { Campo } from "@/components/ui";
import type { Cliente } from "@/lib/types";

export function FormularioCliente({ cliente }: { cliente?: Cliente }) {
  return (
    <form action={guardarCliente} className="cartao space-y-6 p-5">
      {cliente && <input type="hidden" name="id" value={cliente.id} />}

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-semibold">Contacto</legend>
        <Campo rotulo="Nome do cliente *">
          <input
            name="nome"
            required
            defaultValue={cliente?.nome ?? ""}
            placeholder="Ana Ferreira"
            className="campo"
          />
        </Campo>
        <Campo rotulo="Parceiro/a">
          <input
            name="parceiro"
            defaultValue={cliente?.parceiro ?? ""}
            placeholder="Rui Ferreira"
            className="campo"
          />
        </Campo>
        <Campo rotulo="Email">
          <input
            type="email"
            name="email"
            defaultValue={cliente?.email ?? ""}
            className="campo"
          />
        </Campo>
        <Campo rotulo="Telefone">
          <input name="telefone" defaultValue={cliente?.telefone ?? ""} className="campo" />
        </Campo>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <legend className="mb-2 text-sm font-semibold">Casamento</legend>
        <Campo rotulo="Data do casamento">
          <input
            type="date"
            name="data_casamento"
            defaultValue={cliente?.data_casamento ?? ""}
            className="campo"
          />
        </Campo>
        <Campo rotulo="Nº de convidados">
          <input
            type="number"
            min="0"
            name="num_convidados"
            defaultValue={cliente?.num_convidados ?? ""}
            className="campo"
          />
        </Campo>
        <Campo rotulo="Orçamento previsto (€)">
          <input
            name="orcamento"
            inputMode="decimal"
            defaultValue={centsParaInput(cliente?.orcamento_cents)}
            placeholder="25000"
            className="campo"
          />
        </Campo>
        <Campo rotulo="Distrito">
          <select name="distrito" defaultValue={cliente?.distrito ?? ""} className="campo">
            <option value="">—</option>
            {DISTRITOS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Local do evento" className="lg:col-span-2">
          <input
            name="local_evento"
            defaultValue={cliente?.local_evento ?? ""}
            placeholder="Quinta da Bela Vista"
            className="campo"
          />
        </Campo>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="mb-2 text-sm font-semibold">Gestão</legend>
        <Campo rotulo="Estado">
          <select name="estado" defaultValue={cliente?.estado ?? "novo"} className="campo">
            {ESTADOS_CLIENTE.map((e) => (
              <option key={e} value={e}>
                {ROTULO_ESTADO_CLIENTE[e]}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Origem">
          <select name="origem" defaultValue={cliente?.origem ?? ""} className="campo">
            <option value="">—</option>
            {ORIGENS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Responsável">
          <input
            name="responsavel"
            defaultValue={cliente?.responsavel ?? ""}
            className="campo"
          />
        </Campo>
        <Campo rotulo="Notas" className="sm:col-span-3">
          <textarea
            name="notas"
            rows={3}
            defaultValue={cliente?.notas ?? ""}
            className="campo resize-y"
          />
        </Campo>
      </fieldset>

      <div className="flex items-center gap-2 border-t border-line pt-4">
        <button type="submit" className="btn btn-principal">
          {cliente ? "Guardar alterações" : "Criar cliente"}
        </button>
        <Link href={cliente ? `/clientes/${cliente.id}` : "/clientes"} className="btn">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
