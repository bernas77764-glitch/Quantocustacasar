import { agora, getDb } from "@/lib/db";
import type { EmailEnviado } from "@/lib/types";

export function registarEmail(e: Omit<EmailEnviado, "id" | "criado_em">): number {
  const r = getDb()
    .prepare(
      `INSERT INTO emails
         (tipo, contratacao_id, cliente_id, fornecedor_id, para, assunto, corpo, estado, erro, id_externo, utilizador_id, anexo_nome, criado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      e.tipo, e.contratacao_id, e.cliente_id, e.fornecedor_id, e.para, e.assunto, e.corpo,
      e.estado, e.erro, e.id_externo, e.utilizador_id, e.anexo_nome, agora(),
    );
  return Number(r.lastInsertRowid);
}

const ORDEM = "ORDER BY criado_em DESC, id DESC";

export function emailsDaContratacao(contratacaoId: number): EmailEnviado[] {
  return getDb()
    .prepare(`SELECT * FROM emails WHERE contratacao_id = ? ${ORDEM}`)
    .all(contratacaoId) as unknown as EmailEnviado[];
}

export function emailsDoCliente(clienteId: number): EmailEnviado[] {
  return getDb().prepare(`SELECT * FROM emails WHERE cliente_id = ? ${ORDEM}`).all(clienteId) as unknown as EmailEnviado[];
}

export function emailsDoFornecedor(fornecedorId: number): EmailEnviado[] {
  return getDb()
    .prepare(`SELECT * FROM emails WHERE fornecedor_id = ? ${ORDEM}`)
    .all(fornecedorId) as unknown as EmailEnviado[];
}

/** Último email de um tipo enviado com sucesso para uma contratação. */
export function ultimoEnviado(contratacaoId: number, tipo: string): EmailEnviado | null {
  return (
    (getDb()
      .prepare(`SELECT * FROM emails WHERE contratacao_id = ? AND tipo = ? AND estado = 'enviado' ${ORDEM} LIMIT 1`)
      .get(contratacaoId, tipo) as EmailEnviado | undefined) ?? null
  );
}

export function ultimosEmails(limite = 30): EmailEnviado[] {
  return getDb().prepare(`SELECT * FROM emails ${ORDEM} LIMIT ?`).all(limite) as unknown as EmailEnviado[];
}
