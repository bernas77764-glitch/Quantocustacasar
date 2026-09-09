import { agora, getDb } from "@/lib/db";
import type { EmailEnviado } from "@/lib/types";

export function registarEmail(e: Omit<EmailEnviado, "id" | "criado_em">): number {
  const r = getDb()
    .prepare(
      `INSERT INTO emails
         (tipo, contratacao_id, cliente_id, para, assunto, corpo, estado, erro, id_externo, utilizador_id, criado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(e.tipo, e.contratacao_id, e.cliente_id, e.para, e.assunto, e.corpo, e.estado, e.erro, e.id_externo, e.utilizador_id, agora());
  return Number(r.lastInsertRowid);
}

export function emailsDaContratacao(contratacaoId: number): EmailEnviado[] {
  return getDb()
    .prepare("SELECT * FROM emails WHERE contratacao_id = ? ORDER BY criado_em DESC, id DESC")
    .all(contratacaoId) as unknown as EmailEnviado[];
}

/** Último pedido de disponibilidade enviado com sucesso, para a ficha da contratação. */
export function ultimoPedidoEnviado(contratacaoId: number): EmailEnviado | null {
  return (
    (getDb()
      .prepare(
        `SELECT * FROM emails WHERE contratacao_id = ? AND tipo = 'pedido_disponibilidade' AND estado = 'enviado'
         ORDER BY criado_em DESC, id DESC LIMIT 1`,
      )
      .get(contratacaoId) as EmailEnviado | undefined) ?? null
  );
}

export function ultimosEmails(limite = 30): EmailEnviado[] {
  return getDb()
    .prepare("SELECT * FROM emails ORDER BY criado_em DESC, id DESC LIMIT ?")
    .all(limite) as unknown as EmailEnviado[];
}
