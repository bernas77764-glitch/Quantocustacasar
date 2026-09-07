import {
  anexarNotaFornecedor,
  criarFornecedor,
  procurarFornecedorPorEmail,
} from "@/lib/queries/fornecedores";
import { CATEGORIAS, DISTRITOS, type Categoria } from "@/lib/constants";

/**
 * Registo de um fornecedor tal como chega do formulário "Seja nosso
 * parceiro" do site. Partilhado pela rota pública e pelos dados de
 * demonstração, para que ambos produzam exatamente o mesmo resultado.
 *
 * O fornecedor entra **inativo**: não aparece em novas contratações até a
 * equipa rever as condições de parceria e o ativar na ficha. Se o email já
 * existir no catálogo, não se cria um duplicado — fica uma nota na ficha
 * existente a dizer que voltou a pedir.
 *
 * O site tem a sua própria lista de categorias e pede o distrito em texto
 * livre; aqui convertem-se para o vocabulário do CRM e, quando a conversão
 * não é exata, o texto original fica nas notas.
 */

export type PedidoDeParceria = {
  empresa: string;
  categoria?: string | null;
  distrito?: string | null;
  responsavel?: string | null;
  email?: string | null;
  telefone?: string | null;
  website?: string | null;
  notas?: string | null;
};

export type ResultadoRegisto =
  | { repetido: false; id: number }
  | { repetido: true; id: number; ativo: number };

/** Pistas para levar uma categoria escrita à maneira do site à do CRM. */
const PISTAS: [RegExp, Categoria][] = [
  [/quinta|espa[cç]o|sal[aã]o|venue/i, "Espaço / Quinta"],
  [/catering|bebida|comida|restaura/i, "Catering"],
  [/foto/i, "Fotografia"],
  [/v[ií]deo|film/i, "Vídeo"],
  [/m[uú]sica|\bdj\b|banda|som\b/i, "Música & DJ"],
  [/flor|decora/i, "Flores & Decoração"],
  [/bolo|do[cç]aria|doce/i, "Bolo & Doçaria"],
  [/convite|papelaria/i, "Convites & Papelaria"],
  [/beleza|cabelo|maquilh|est[eé]tica/i, "Beleza & Estética"],
  [/vestido|fato|vestu|noiv[ao]s?\b/i, "Vestuário"],
  [/alian/i, "Alianças"],
  [/transporte|carro|autocarro/i, "Transporte"],
  [/anima|fotobooth|photobooth/i, "Animação"],
  [/planner|coordena|organiza/i, "Wedding Planner"],
];

function semAcentos(texto: string): string {
  // NFD separa cada letra do seu acento; os acentos ficam em U+0300–U+036F.
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function normalizarCategoria(original: string | null | undefined): Categoria {
  if (!original) return "Outro";
  const exata = CATEGORIAS.find((c) => semAcentos(c) === semAcentos(original));
  if (exata) return exata;
  const pista = PISTAS.find(([padrao]) => padrao.test(original));
  return pista ? pista[1] : "Outro";
}

/** Devolve o distrito do CRM quando reconhece o texto; senão, o texto tal qual. */
export function normalizarDistrito(original: string | null | undefined): string | null {
  if (!original) return null;
  const alvo = semAcentos(original);
  return DISTRITOS.find((d) => semAcentos(d) === alvo) ?? original;
}

export function registarPedidoDeParceria(
  pedido: PedidoDeParceria,
  hoje = new Date().toISOString().slice(0, 10),
): ResultadoRegisto {
  const categoria = normalizarCategoria(pedido.categoria);
  const distrito = normalizarDistrito(pedido.distrito);
  const email = pedido.email?.trim() || null;

  const existente = email ? procurarFornecedorPorEmail(email) : null;
  if (existente) {
    anexarNotaFornecedor(
      existente.id,
      `Voltou a registar-se pelo site em ${hoje} (${pedido.empresa}, ${pedido.categoria ?? categoria}).`,
    );
    return { repetido: true, id: existente.id, ativo: existente.ativo };
  }

  const notas = [
    `Registou-se pelo site em ${hoje}. Fica inativo até a equipa rever as condições de parceria.`,
    pedido.categoria && pedido.categoria !== categoria
      ? `Categoria indicada no site: ${pedido.categoria}.`
      : null,
    pedido.distrito && pedido.distrito !== distrito
      ? `Distrito escrito no site: ${pedido.distrito}.`
      : null,
    pedido.notas?.trim() || null,
  ]
    .filter(Boolean)
    .join("\n");

  const id = criarFornecedor({
    nome: pedido.empresa,
    categoria,
    contacto: pedido.responsavel?.trim() || null,
    email,
    telefone: pedido.telefone?.trim() || null,
    website: pedido.website?.trim() || null,
    distrito,
    comissao_pct: 0,
    ativo: 0,
    notas,
  });
  return { repetido: false, id };
}
