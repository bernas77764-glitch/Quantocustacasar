import { agora, getDb } from "@/lib/db";
import type { Compromisso, CompromissoDetalhado } from "@/lib/types";

const SELECAO = `
  SELECT co.*, cl.nome AS cliente_nome, f.nome AS fornecedor_nome
  FROM compromissos co
  LEFT JOIN clientes cl ON cl.id = co.cliente_id
  LEFT JOIN fornecedores f ON f.id = co.fornecedor_id
`;

export type DadosCompromisso = Omit<Compromisso, "id" | "criado_em" | "atualizado_em">;

export function listarCompromissos(inicio: string, fim: string): CompromissoDetalhado[] {
  return getDb()
    .prepare(`${SELECAO} WHERE co.data BETWEEN ? AND ? ORDER BY co.data, co.hora_inicio, co.id`)
    .all(inicio, fim) as unknown as CompromissoDetalhado[];
}

export function listarTodosCompromissos(): CompromissoDetalhado[] {
  return getDb()
    .prepare(`${SELECAO} ORDER BY co.data, co.hora_inicio, co.id`)
    .all() as unknown as CompromissoDetalhado[];
}

export function listarCompromissosDoCliente(clienteId: number): CompromissoDetalhado[] {
  return getDb()
    .prepare(`${SELECAO} WHERE co.cliente_id = ? ORDER BY co.data, co.hora_inicio, co.id`)
    .all(clienteId) as unknown as CompromissoDetalhado[];
}

export function obterCompromisso(id: number): CompromissoDetalhado | null {
  return (getDb().prepare(`${SELECAO} WHERE co.id = ?`).get(id) as
    | CompromissoDetalhado
    | undefined) ?? null;
}

export function criarCompromisso(d: DadosCompromisso): number {
  const ts = agora();
  const r = getDb()
    .prepare(
      `INSERT INTO compromissos
         (titulo, data, hora_inicio, hora_fim, local, cliente_id, fornecedor_id, notas, criado_em, atualizado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(d.titulo, d.data, d.hora_inicio, d.hora_fim, d.local, d.cliente_id, d.fornecedor_id, d.notas, ts, ts);
  return Number(r.lastInsertRowid);
}

export function atualizarCompromisso(id: number, d: DadosCompromisso): void {
  getDb()
    .prepare(
      `UPDATE compromissos SET titulo = ?, data = ?, hora_inicio = ?, hora_fim = ?, local = ?,
         cliente_id = ?, fornecedor_id = ?, notas = ?, atualizado_em = ?
       WHERE id = ?`,
    )
    .run(d.titulo, d.data, d.hora_inicio, d.hora_fim, d.local, d.cliente_id, d.fornecedor_id, d.notas, agora(), id);
}

export function eliminarCompromisso(id: number): void {
  getDb().prepare("DELETE FROM compromissos WHERE id = ?").run(id);
}
