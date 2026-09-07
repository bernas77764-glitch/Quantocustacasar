import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

/**
 * Todos os valores monetários são guardados em cêntimos (INTEGER) para que as
 * somas sejam exatas — nunca em vírgula flutuante.
 */
const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS clientes (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  nome            TEXT    NOT NULL,
  parceiro        TEXT,
  email           TEXT,
  telefone        TEXT,
  data_casamento  TEXT,
  num_convidados  INTEGER,
  orcamento_cents INTEGER,
  distrito        TEXT,
  local_evento    TEXT,
  origem          TEXT,
  estado          TEXT    NOT NULL DEFAULT 'novo',
  responsavel     TEXT,
  notas           TEXT,
  criado_em       TEXT    NOT NULL,
  atualizado_em   TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS fornecedores (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  nome           TEXT    NOT NULL,
  categoria      TEXT    NOT NULL,
  contacto       TEXT,
  email          TEXT,
  telefone       TEXT,
  website        TEXT,
  distrito       TEXT,
  preco_min_cents INTEGER,
  preco_max_cents INTEGER,
  comissao_pct   REAL    NOT NULL DEFAULT 0,
  ativo          INTEGER NOT NULL DEFAULT 1,
  notas          TEXT,
  criado_em      TEXT    NOT NULL,
  atualizado_em  TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS contratacoes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id    INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  fornecedor_id INTEGER NOT NULL REFERENCES fornecedores(id) ON DELETE RESTRICT,
  categoria     TEXT    NOT NULL,
  descricao     TEXT,
  valor_cents   INTEGER NOT NULL DEFAULT 0,
  comissao_pct  REAL    NOT NULL DEFAULT 0,
  estado        TEXT    NOT NULL DEFAULT 'proposta',
  data_servico  TEXT,
  notas         TEXT,
  criado_em     TEXT    NOT NULL,
  atualizado_em TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS pagamentos (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  contratacao_id INTEGER NOT NULL REFERENCES contratacoes(id) ON DELETE CASCADE,
  descricao      TEXT,
  valor_cents    INTEGER NOT NULL DEFAULT 0,
  data_prevista  TEXT,
  data_pagamento TEXT,
  metodo         TEXT,
  estado         TEXT    NOT NULL DEFAULT 'pendente',
  referencia     TEXT,
  notas          TEXT,
  criado_em      TEXT    NOT NULL,
  atualizado_em  TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS atividades (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  tipo       TEXT    NOT NULL DEFAULT 'nota',
  descricao  TEXT    NOT NULL,
  criado_em  TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS utilizadores (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  nome           TEXT    NOT NULL,
  email          TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  palavra_passe  TEXT    NOT NULL,
  ativo          INTEGER NOT NULL DEFAULT 1,
  administrador  INTEGER NOT NULL DEFAULT 0,
  criado_em      TEXT    NOT NULL,
  atualizado_em  TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS sessoes (
  token         TEXT    PRIMARY KEY,
  utilizador_id INTEGER NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
  expira_em     TEXT    NOT NULL,
  criado_em     TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS definicoes (
  chave         TEXT PRIMARY KEY,
  valor         TEXT NOT NULL,
  atualizado_em TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessoes_utilizador ON sessoes(utilizador_id);
CREATE INDEX IF NOT EXISTS idx_clientes_estado       ON clientes(estado);
CREATE INDEX IF NOT EXISTS idx_fornecedores_categoria ON fornecedores(categoria);
CREATE INDEX IF NOT EXISTS idx_contratacoes_cliente  ON contratacoes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_contratacoes_forn     ON contratacoes(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_contratacao ON pagamentos(contratacao_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_estado     ON pagamentos(estado, data_prevista);
CREATE INDEX IF NOT EXISTS idx_atividades_cliente    ON atividades(cliente_id);
`;

/** Valores que o SQLite aceita como parâmetro de uma consulta. */
type Valor = string | number | bigint | null | Uint8Array;

type Alteracoes = { changes: number | bigint; lastInsertRowid: number | bigint };

export type Consulta = {
  all(...args: Valor[]): Record<string, unknown>[];
  get(...args: Valor[]): Record<string, unknown> | undefined;
  run(...args: Valor[]): Alteracoes;
};

export type BaseDados = {
  prepare(sql: string): Consulta;
  exec(sql: string): void;
};

/**
 * O `node:sqlite` devolve linhas com protótipo nulo, que o React não consegue
 * serializar para os Client Components ("Only plain objects... can be passed").
 * Esta camada fina normaliza cada linha para um objeto simples, de uma vez, em
 * vez de obrigar cada consulta a lembrar-se de o fazer.
 */
function simples<T>(linha: T): T {
  return { ...(linha as object) } as T;
}

function envolver(db: DatabaseSync): BaseDados {
  return {
    exec: (sql) => db.exec(sql),
    prepare(sql) {
      const stmt = db.prepare(sql);
      return {
        all: (...args) => stmt.all(...args).map(simples),
        get: (...args) => {
          const linha = stmt.get(...args);
          return linha === undefined ? undefined : simples(linha);
        },
        run: (...args) => stmt.run(...args),
      };
    },
  };
}

function dbPath(): string {
  return (
    process.env.CRM_DB_PATH ?? path.join(process.cwd(), "data", "crm.db")
  );
}

/**
 * Alterações a tabelas que já existem. O `CREATE TABLE IF NOT EXISTS` do
 * esquema não toca numa base já criada, por isso cada coluna acrescentada
 * depois da primeira versão entra aqui, de forma idempotente.
 */
function migrar(db: DatabaseSync): void {
  const colunas = (db.prepare("PRAGMA table_info(utilizadores)").all() as { name: string }[])
    .map((c) => c.name);

  if (!colunas.includes("administrador")) {
    db.exec(
      "ALTER TABLE utilizadores ADD COLUMN administrador INTEGER NOT NULL DEFAULT 0",
    );
    // As contas anteriores aos perfis são de quem montou o CRM: ficam
    // administradoras, senão ninguém poderia gerir contas.
    db.exec("UPDATE utilizadores SET administrador = 1");
  }
}

function open(): BaseDados {
  const file = dbPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(SCHEMA);
  migrar(db);
  return envolver(db);
}

// O `next dev` recarrega os módulos a cada alteração; sem cache global
// abriríamos uma ligação nova (e um lock novo) em cada recarregamento.
const globalForDb = globalThis as unknown as { __crmDb?: BaseDados };

export function getDb(): BaseDados {
  if (!globalForDb.__crmDb) globalForDb.__crmDb = open();
  return globalForDb.__crmDb;
}

/** Abre uma ligação independente (usado por scripts fora do Next). */
export function openStandaloneDb(): BaseDados {
  return open();
}

export function agora(): string {
  return new Date().toISOString();
}

export function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}
