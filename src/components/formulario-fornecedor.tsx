import Link from "next/link";
import { guardarFornecedor } from "@/lib/actions/fornecedores";
import { CATEGORIAS, DISTRITOS } from "@/lib/constants";
import { centsParaInput } from "@/lib/format";
import { Campo } from "@/components/ui";
import type { Fornecedor } from "@/lib/types";

export function FormularioFornecedor({ fornecedor }: { fornecedor?: Fornecedor }) {
  return (
    <form action={guardarFornecedor} className="cartao space-y-6 p-5">
      {fornecedor && <input type="hidden" name="id" value={fornecedor.id} />}

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-semibold">Identificação</legend>
        <Campo rotulo="Nome *">
          <input
            name="nome"
            required
            defaultValue={fornecedor?.nome ?? ""}
            placeholder="Quinta da Bela Vista"
            className="campo"
          />
        </Campo>
        <Campo rotulo="Categoria *">
          <select
            name="categoria"
            required
            defaultValue={fornecedor?.categoria ?? ""}
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
        <Campo rotulo="Pessoa de contacto">
          <input name="contacto" defaultValue={fornecedor?.contacto ?? ""} className="campo" />
        </Campo>
        <Campo rotulo="Distrito">
          <select name="distrito" defaultValue={fornecedor?.distrito ?? ""} className="campo">
            <option value="">—</option>
            {DISTRITOS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Email">
          <input
            type="email"
            name="email"
            defaultValue={fornecedor?.email ?? ""}
            className="campo"
          />
        </Campo>
        <Campo rotulo="Telefone">
          <input name="telefone" defaultValue={fornecedor?.telefone ?? ""} className="campo" />
        </Campo>
        <Campo rotulo="Website" className="sm:col-span-2">
          <input
            name="website"
            defaultValue={fornecedor?.website ?? ""}
            placeholder="https://…"
            className="campo"
          />
        </Campo>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="mb-2 text-sm font-semibold">Condições comerciais</legend>
        <Campo rotulo="Preço mínimo (€)">
          <input
            name="preco_min"
            inputMode="decimal"
            defaultValue={centsParaInput(fornecedor?.preco_min_cents)}
            className="campo"
          />
        </Campo>
        <Campo rotulo="Preço máximo (€)">
          <input
            name="preco_max"
            inputMode="decimal"
            defaultValue={centsParaInput(fornecedor?.preco_max_cents)}
            className="campo"
          />
        </Campo>
        <Campo rotulo="Comissão (%)">
          <input
            name="comissao_pct"
            inputMode="decimal"
            defaultValue={fornecedor ? String(fornecedor.comissao_pct) : "0"}
            className="campo"
          />
        </Campo>
        <Campo rotulo="Notas" className="sm:col-span-3">
          <textarea
            name="notas"
            rows={3}
            defaultValue={fornecedor?.notas ?? ""}
            className="campo resize-y"
          />
        </Campo>
        <label className="flex items-center gap-2 text-sm sm:col-span-3">
          <input
            type="checkbox"
            name="ativo"
            defaultChecked={fornecedor ? fornecedor.ativo === 1 : true}
            className="size-4 accent-[color:var(--brand)]"
          />
          Fornecedor ativo (disponível para novas contratações)
        </label>
      </fieldset>

      <div className="flex items-center gap-2 border-t border-line pt-4">
        <button type="submit" className="btn btn-principal">
          {fornecedor ? "Guardar alterações" : "Criar fornecedor"}
        </button>
        <Link
          href={fornecedor ? `/fornecedores/${fornecedor.id}` : "/fornecedores"}
          className="btn"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
