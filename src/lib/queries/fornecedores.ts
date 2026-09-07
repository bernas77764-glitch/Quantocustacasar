import { getDb, agora, hoje } from "@/lib/db";
import type { Fornecedor } from "@/lib/types";
import { CATEGORIAS_ESSENCIAIS } from "@/lib/constants";

export type FornecedorListado = Fornecedor & {
  num_contratacoes: number;
  num_clientes: number;
  contratado_cents: number;
  pago_cents: number;
  em_divida_cents: number;
  atrasado_cents: number;
  comissao_cents: number;
};

const TOTAIS_POR_FORNECEDOR = `
  SELECT
    c.fornecedor_id,
    COUNT(*)                            AS num_contratacoes,
    COUNT(DISTINCT c.cliente_id)        AS num_clientes,
    COALESCE(SUM(c.valor_cents), 0)     AS contratado_cents,
    COALESCE(SUM(CAST(ROUND(c.valor_cents * c.comissao_pct / 100.0) AS INTEGER)), 0)
                                        AS comissao_cents,
    COALESCE(SUM(pg.pago), 0)           AS pago_cents,
    COALESCE(SUM(pg.atrasado), 0)       AS atrasado_cents
  FROM contratacoes c
  LEFT JOIN (
    SELECT
      contratacao_id,
      SUM(CASE WHEN estado = 'pago' THEN valor_cents ELSE 0 END) AS pago,
      SUM(CASE WHEN estado = 'pendente' AND data_prevista IS NOT NULL
                    AND data_prevista < ? THEN valor_cents ELSE 0 END) AS atrasado
    FROM pagamentos
    GROUP BY contratacao_id
  ) pg ON pg.contratacao_id = c.id
  WHERE c.estado IN ('confirmada', 'concluida')
  GROUP BY c.fornecedor_id
`;

const SELECAO_FORNECEDOR = `
  SELECT
    f.*,
    COALESCE(t.num_contratacoes, 0) AS num_contratacoes,
    COALESCE(t.num_clientes, 0)     AS num_clientes,
    COALESCE(t.contratado_cents, 0) AS contratado_cents,
    COALESCE(t.comissao_cents, 0)   AS comissao_cents,
    COALESCE(t.pago_cents, 0)       AS pago_cents,
    COALESCE(t.atrasado_cents, 0)   AS atrasado_cents,
    COALESCE(t.contratado_cents, 0) - COALESCE(t.pago_cents, 0) AS em_divida_cents
  FROM fornecedores f
  LEFT JOIN (${TOTAIS_POR_FORNECEDOR}) t ON t.fornecedor_id = f.id
`;

export type FiltrosFornecedores = {
  q?: string;
  categoria?: string;
  distrito?: string;
  ativo?: string;
  ordenar?: string;
};

export function listarFornecedores(
  f: FiltrosFornecedores = {},
): FornecedorListado[] {
  const where: string[] = [];
  const args: (string | number)[] = [hoje()];

  if (f.q?.trim()) {
    where.push("(f.nome LIKE ? OR f.contacto LIKE ? OR f.email LIKE ?)");
    const termo = `%${f.q.trim()}%`;
    args.push(termo, termo, termo);
  }
  if (f.categoria) {
    where.push("f.categoria = ?");
    args.push(f.categoria);
  }
  if (f.distrito) {
    where.push("f.distrito = ?");
    args.push(f.distrito);
  }
  if (f.ativo === "1" || f.ativo === "0") {
    where.push("f.ativo = ?");
    args.push(Number(f.ativo));
  }

  const ordem =
    {
      valor: "contratado_cents DESC",
      contratacoes: "num_contratacoes DESC",
      categoria: "f.categoria COLLATE NOCASE, f.nome COLLATE NOCASE",
    }[f.ordenar ?? ""] ?? "f.nome COLLATE NOCASE ASC";

  const sql = `${SELECAO_FORNECEDOR}
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY ${ordem}`;
  return getDb().prepare(sql).all(...args) as unknown as FornecedorListado[];
}

export function obterFornecedor(id: number): FornecedorListado | null {
  const linha = getDb()
    .prepare(`${SELECAO_FORNECEDOR} WHERE f.id = ?`)
    .get(hoje(), id);
  return (linha as unknown as FornecedorListado) ?? null;
}

export type DadosFornecedor = {
  nome: string;
  categoria: string;
  contacto?: string | null;
  email?: string | null;
  telefone?: string | null;
  website?: string | null;
  distrito?: string | null;
  preco_min_cents?: number | null;
  preco_max_cents?: number | null;
  comissao_pct?: number;
  ativo?: number;
  notas?: string | null;
};

const CAMPOS_FORNECEDOR = [
  "nome",
  "categoria",
  "contacto",
  "email",
  "telefone",
  "website",
  "distrito",
  "preco_min_cents",
  "preco_max_cents",
  "comissao_pct",
  "ativo",
  "notas",
] as const;

function valoresFornecedor(dados: DadosFornecedor) {
  return CAMPOS_FORNECEDOR.map((campo) => {
    if (campo === "comissao_pct") return dados.comissao_pct ?? 0;
    if (campo === "ativo") return dados.ativo ?? 1;
    return (dados[campo] ?? null) as string | number | null;
  });
}

export function criarFornecedor(dados: DadosFornecedor): number {
  const ts = agora();
  const r = getDb()
    .prepare(
      `INSERT INTO fornecedores (${CAMPOS_FORNECEDOR.join(", ")}, criado_em, atualizado_em)
       VALUES (${CAMPOS_FORNECEDOR.map(() => "?").join(", ")}, ?, ?)`,
    )
    .run(...valoresFornecedor(dados), ts, ts);
  return Number(r.lastInsertRowid);
}

export function atualizarFornecedor(id: number, dados: DadosFornecedor): void {
  getDb()
    .prepare(
      `UPDATE fornecedores SET ${CAMPOS_FORNECEDOR.map((c) => `${c} = ?`).join(", ")},
       atualizado_em = ? WHERE id = ?`,
    )
    .run(...valoresFornecedor(dados), agora(), id);
}

/**
 * Fornecedores só podem ser removidos sem contratações associadas — caso
 * contrário desativam-se, para não perder o histórico financeiro.
 */
export function eliminarFornecedor(id: number): boolean {
  const { total } = getDb()
    .prepare("SELECT COUNT(*) AS total FROM contratacoes WHERE fornecedor_id = ?")
    .get(id) as unknown as { total: number };
  if (total > 0) {
    getDb()
      .prepare("UPDATE fornecedores SET ativo = 0, atualizado_em = ? WHERE id = ?")
      .run(agora(), id);
    return false;
  }
  getDb().prepare("DELETE FROM fornecedores WHERE id = ?").run(id);
  return true;
}

export function listarFornecedoresSimples(): {
  id: number;
  nome: string;
  categoria: string;
  comissao_pct: number;
}[] {
  return getDb()
    .prepare(
      `SELECT id, nome, categoria, comissao_pct FROM fornecedores
       WHERE ativo = 1 ORDER BY categoria COLLATE NOCASE, nome COLLATE NOCASE`,
    )
    .all() as unknown as {
    id: number;
    nome: string;
    categoria: string;
    comissao_pct: number;
  }[];
}

/**
 * Fornecedores sugeridos numa categoria: ativos, preferindo os do mesmo
 * distrito e os que cabem no orçamento do cliente.
 */
function sugerirFornecedores(
  categoria: string,
  distrito: string | null,
  tetoCents: number | null,
  limite: number,
): Fornecedor[] {
  return getDb()
    .prepare(
      `SELECT * FROM fornecedores
       WHERE ativo = 1 AND categoria = ?
       ORDER BY
         (distrito IS NOT NULL AND distrito = ?) DESC,
         (? IS NULL OR preco_min_cents IS NULL OR preco_min_cents <= ?) DESC,
         nome COLLATE NOCASE
       LIMIT ?`,
    )
    .all(categoria, distrito, tetoCents, tetoCents, limite) as unknown as Fornecedor[];
}

export type SugestaoCategoria = {
  categoria: string;
  fornecedores: Fornecedor[];
};

/**
 * Categorias essenciais que o cliente ainda não fechou, com fornecedores
 * sugeridos para cada uma — o "o que falta contratar" da ficha do cliente.
 */
export function sugestoesParaCliente(clienteId: number): SugestaoCategoria[] {
  const db = getDb();
  const cliente = db
    .prepare("SELECT distrito, orcamento_cents FROM clientes WHERE id = ?")
    .get(clienteId) as
    | { distrito: string | null; orcamento_cents: number | null }
    | undefined;
  if (!cliente) return [];

  const fechadas = new Set(
    (
      db
        .prepare(
          `SELECT DISTINCT categoria FROM contratacoes
           WHERE cliente_id = ? AND estado <> 'cancelada'`,
        )
        .all(clienteId) as unknown as { categoria: string }[]
    ).map((l) => l.categoria),
  );

  return CATEGORIAS_ESSENCIAIS.filter((c) => !fechadas.has(c))
    .map((categoria) => ({
      categoria,
      fornecedores: sugerirFornecedores(
        categoria,
        cliente.distrito,
        cliente.orcamento_cents,
        3,
      ),
    }))
    .filter((s) => s.fornecedores.length > 0);
}

/** Procura por email, sem distinguir maiúsculas — usado para evitar duplicados vindos do site. */
export function procurarFornecedorPorEmail(
  email: string,
): { id: number; ativo: number } | null {
  const linha = getDb()
    .prepare("SELECT id, ativo FROM fornecedores WHERE email = ? COLLATE NOCASE")
    .get(email.trim()) as { id: number; ativo: number } | undefined;
  return linha ?? null;
}

/** Acrescenta uma linha às notas da ficha, preservando o que lá estava. */
export function anexarNotaFornecedor(id: number, nota: string): void {
  getDb()
    .prepare(
      `UPDATE fornecedores
       SET notas = CASE WHEN notas IS NULL OR notas = '' THEN ? ELSE notas || char(10) || ? END,
           atualizado_em = ?
       WHERE id = ?`,
    )
    .run(nota, nota, agora(), id);
}
