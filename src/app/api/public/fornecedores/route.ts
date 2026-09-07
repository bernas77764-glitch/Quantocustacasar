import {
  anexarNotaFornecedor,
  criarFornecedor,
  procurarFornecedorPorEmail,
} from "@/lib/queries/fornecedores";
import { CATEGORIAS, DISTRITOS, type Categoria } from "@/lib/constants";
import { aceitarPedido, responder, responderPreflight } from "@/lib/api-publica";

export const dynamic = "force-dynamic";

/**
 * Registo de fornecedores vindo do formulário "Seja nosso parceiro" do site.
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
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function normalizarCategoria(original: string | null): Categoria {
  if (!original) return "Outro";
  const exata = CATEGORIAS.find((c) => semAcentos(c) === semAcentos(original));
  if (exata) return exata;
  const pista = PISTAS.find(([padrao]) => padrao.test(original));
  return pista ? pista[1] : "Outro";
}

/** Devolve o distrito do CRM quando reconhece o texto; senão, o texto tal qual. */
function normalizarDistrito(original: string | null): string | null {
  if (!original) return null;
  const alvo = semAcentos(original);
  return DISTRITOS.find((d) => semAcentos(d) === alvo) ?? original;
}

export async function OPTIONS(pedido: Request) {
  return responderPreflight(pedido);
}

export async function POST(pedido: Request) {
  const aceite = await aceitarPedido(pedido);
  if (aceite instanceof Response) return aceite;
  const { cors, texto } = aceite;

  const nome = texto("empresa") ?? texto("nome");
  if (!nome) {
    return responder({ erro: 'O campo "empresa" é obrigatório.' }, 400, cors);
  }

  const email = texto("email");
  const categoriaOriginal = texto("categoria");
  const categoria = normalizarCategoria(categoriaOriginal);
  const distritoOriginal = texto("distrito");
  const distrito = normalizarDistrito(distritoOriginal);
  const hoje = new Date().toISOString().slice(0, 10);

  const existente = email ? procurarFornecedorPorEmail(email) : null;
  if (existente) {
    anexarNotaFornecedor(
      existente.id,
      `Voltou a registar-se pelo site em ${hoje} (${nome}, ${categoriaOriginal ?? categoria}).`,
    );
    return responder({ id: existente.id, ativo: existente.ativo, repetido: true }, 200, cors);
  }

  const notas = [
    `Registou-se pelo site em ${hoje}. Fica inativo até a equipa rever as condições de parceria.`,
    categoriaOriginal && categoriaOriginal !== categoria
      ? `Categoria indicada no site: ${categoriaOriginal}.`
      : null,
    distritoOriginal && distritoOriginal !== distrito
      ? `Distrito escrito no site: ${distritoOriginal}.`
      : null,
    texto("notas"),
  ]
    .filter(Boolean)
    .join("\n");

  const id = criarFornecedor({
    nome,
    categoria,
    contacto: texto("responsavel") ?? texto("contacto"),
    email,
    telefone: texto("telefone"),
    website: texto("website"),
    distrito,
    comissao_pct: 0,
    ativo: 0,
    notas,
  });

  return responder({ id, ativo: 0 }, 201, cors);
}
