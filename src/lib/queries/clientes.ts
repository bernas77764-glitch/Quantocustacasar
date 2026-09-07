import { getDb, agora, hoje } from "@/lib/db";
import type { Atividade, Cliente } from "@/lib/types";
import type { EstadoCliente } from "@/lib/constants";

export type ClienteListado = Cliente & {
  num_contratacoes: number;
  contratado_cents: number;
  pago_cents: number;
  em_divida_cents: number;
  atrasado_cents: number;
};

/**
 * Totais financeiros por cliente. Só contratações confirmadas ou concluídas
 * contam como valor contratado — propostas ainda não são compromisso.
 */
const TOTAIS_POR_CLIENTE = `
  SELECT
    c.cliente_id,
    COUNT(*)                                                        AS num_contratacoes,
    COALESCE(SUM(c.valor_cents), 0)                                 AS contratado_cents,
    COALESCE(SUM(pg.pago), 0)                                       AS pago_cents,
    COALESCE(SUM(pg.pendente), 0)                                   AS pendente_cents,
    COALESCE(SUM(pg.atrasado), 0)                                   AS atrasado_cents
  FROM contratacoes c
  LEFT JOIN (
    SELECT
      contratacao_id,
      SUM(CASE WHEN estado = 'pago' THEN valor_cents ELSE 0 END)     AS pago,
      SUM(CASE WHEN estado = 'pendente' THEN valor_cents ELSE 0 END) AS pendente,
      SUM(CASE WHEN estado = 'pendente' AND data_prevista IS NOT NULL
                    AND data_prevista < ? THEN valor_cents ELSE 0 END) AS atrasado
    FROM pagamentos
    GROUP BY contratacao_id
  ) pg ON pg.contratacao_id = c.id
  WHERE c.estado IN ('confirmada', 'concluida')
  GROUP BY c.cliente_id
`;

export type FiltrosClientes = {
  q?: string;
  estado?: string;
  origem?: string;
  distrito?: string;
  ordenar?: string;
};

export function listarClientes(f: FiltrosClientes = {}): ClienteListado[] {
  const where: string[] = [];
  const args: (string | number)[] = [hoje()];

  if (f.q?.trim()) {
    where.push(
      "(cl.nome LIKE ? OR cl.parceiro LIKE ? OR cl.email LIKE ? OR cl.telefone LIKE ?)",
    );
    const termo = `%${f.q.trim()}%`;
    args.push(termo, termo, termo, termo);
  }
  if (f.estado) {
    where.push("cl.estado = ?");
    args.push(f.estado);
  }
  if (f.origem) {
    where.push("cl.origem = ?");
    args.push(f.origem);
  }
  if (f.distrito) {
    where.push("cl.distrito = ?");
    args.push(f.distrito);
  }

  const ordem =
    {
      nome: "cl.nome COLLATE NOCASE ASC",
      casamento: "cl.data_casamento IS NULL, cl.data_casamento ASC",
      valor: "contratado_cents DESC",
      divida: "em_divida_cents DESC",
    }[f.ordenar ?? ""] ?? "cl.criado_em DESC";

  const sql = `
    SELECT
      cl.*,
      COALESCE(t.num_contratacoes, 0) AS num_contratacoes,
      COALESCE(t.contratado_cents, 0) AS contratado_cents,
      COALESCE(t.pago_cents, 0)       AS pago_cents,
      COALESCE(t.atrasado_cents, 0)   AS atrasado_cents,
      COALESCE(t.contratado_cents, 0) - COALESCE(t.pago_cents, 0) AS em_divida_cents
    FROM clientes cl
    LEFT JOIN (${TOTAIS_POR_CLIENTE}) t ON t.cliente_id = cl.id
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY ${ordem}
  `;
  return getDb().prepare(sql).all(...args) as unknown as ClienteListado[];
}

export function obterCliente(id: number): ClienteListado | null {
  const linha = getDb()
    .prepare(
      `SELECT
         cl.*,
         COALESCE(t.num_contratacoes, 0) AS num_contratacoes,
         COALESCE(t.contratado_cents, 0) AS contratado_cents,
         COALESCE(t.pago_cents, 0)       AS pago_cents,
         COALESCE(t.atrasado_cents, 0)   AS atrasado_cents,
         COALESCE(t.contratado_cents, 0) - COALESCE(t.pago_cents, 0) AS em_divida_cents
       FROM clientes cl
       LEFT JOIN (${TOTAIS_POR_CLIENTE}) t ON t.cliente_id = cl.id
       WHERE cl.id = ?`,
    )
    .get(hoje(), id);
  return (linha as unknown as ClienteListado) ?? null;
}

export type DadosCliente = {
  nome: string;
  parceiro?: string | null;
  email?: string | null;
  telefone?: string | null;
  data_casamento?: string | null;
  num_convidados?: number | null;
  orcamento_cents?: number | null;
  distrito?: string | null;
  local_evento?: string | null;
  origem?: string | null;
  estado?: EstadoCliente;
  responsavel?: string | null;
  notas?: string | null;
};

const CAMPOS_CLIENTE = [
  "nome",
  "parceiro",
  "email",
  "telefone",
  "data_casamento",
  "num_convidados",
  "orcamento_cents",
  "distrito",
  "local_evento",
  "origem",
  "estado",
  "responsavel",
  "notas",
] as const;

export function criarCliente(dados: DadosCliente): number {
  const ts = agora();
  const valores = CAMPOS_CLIENTE.map(
    (campo) => (dados[campo] ?? null) as string | number | null,
  );
  const r = getDb()
    .prepare(
      `INSERT INTO clientes (${CAMPOS_CLIENTE.join(", ")}, criado_em, atualizado_em)
       VALUES (${CAMPOS_CLIENTE.map(() => "?").join(", ")}, ?, ?)`,
    )
    .run(...valores, ts, ts);
  const id = Number(r.lastInsertRowid);
  registarAtividade(id, "sistema", "Cliente criado no CRM.");
  return id;
}

export function atualizarCliente(id: number, dados: DadosCliente): void {
  const valores = CAMPOS_CLIENTE.map(
    (campo) => (dados[campo] ?? null) as string | number | null,
  );
  getDb()
    .prepare(
      `UPDATE clientes SET ${CAMPOS_CLIENTE.map((c) => `${c} = ?`).join(", ")},
       atualizado_em = ? WHERE id = ?`,
    )
    .run(...valores, agora(), id);
}

export function atualizarEstadoCliente(id: number, estado: EstadoCliente): void {
  const db = getDb();
  const atual = db
    .prepare("SELECT estado FROM clientes WHERE id = ?")
    .get(id) as { estado: string } | undefined;
  if (!atual || atual.estado === estado) return;
  db.prepare("UPDATE clientes SET estado = ?, atualizado_em = ? WHERE id = ?").run(
    estado,
    agora(),
    id,
  );
  registarAtividade(id, "sistema", `Estado alterado de "${atual.estado}" para "${estado}".`);
}

export function eliminarCliente(id: number): void {
  getDb().prepare("DELETE FROM clientes WHERE id = ?").run(id);
}

export function registarAtividade(
  clienteId: number,
  tipo: string,
  descricao: string,
): void {
  getDb()
    .prepare(
      "INSERT INTO atividades (cliente_id, tipo, descricao, criado_em) VALUES (?, ?, ?, ?)",
    )
    .run(clienteId, tipo, descricao, agora());
}

export function listarAtividades(clienteId: number): Atividade[] {
  return getDb()
    .prepare(
      "SELECT * FROM atividades WHERE cliente_id = ? ORDER BY criado_em DESC, id DESC",
    )
    .all(clienteId) as unknown as Atividade[];
}

/** Clientes para seletores (formulários de contratação). */
export function listarClientesSimples(): { id: number; nome: string; data_casamento: string | null }[] {
  return getDb()
    .prepare(
      "SELECT id, nome, data_casamento FROM clientes ORDER BY nome COLLATE NOCASE",
    )
    .all() as unknown as { id: number; nome: string; data_casamento: string | null }[];
}
