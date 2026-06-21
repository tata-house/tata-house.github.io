/* =====================================================================
   Leitor de cotações — cole o texto do WhatsApp (ou da tabela do
   fornecedor) e extraímos itens + preços, casando com o histórico.

   Formatos reconhecidos:
   A) "7,00 Frango inteiro RF"               → preço na frente
   B) "Acém Resf - Ribeiro *31,90*"          → preço no fim (asteriscos)
   C) "Tiras de carnes\t\tR$ 43,00"          → R$ no fim, com tabulações
   D) "ALHO KG 29,80"                        → tabela com unidade no meio
   ===================================================================== */

import { DADOS, normalizar } from './motor';

export interface LinhaCotacao {
  nome: string; // nome do produto como veio na cotação (limpo)
  preco: number;
  marca: string | null; // marca/frigorífico após " - " quando existe
  unid: string | null; // unidade declarada (formato D)
  /** item do histórico casado automaticamente (nome canônico) ou null */
  item: string | null;
}

export interface ItemCotado {
  item: string; // nome canônico no histórico
  unid: string; // unidade padrão do item no histórico
  preco: number; // menor preço entre as ofertas
  marca: string | null; // marca da oferta mais barata
  ofertas: number; // quantas linhas da cotação apontaram para este item
}

const RE_PRECO = /\d{1,3}(?:\.\d{3})?,\d{2}/g;
const UNIDADES = new Set(['kg', 'un', 'cx', 'bd', 'dz', 'pct', 'lt', 'mc', 'mç', 'pc', 'sc']);

/** Palavras de qualificação que não ajudam a identificar o produto. */
const RUIDO = new Set([
  'resf', 'resfriado', 'resfriada', 'cong', 'congelado', 'congelada', 'congelados',
  'rf', 'cg', 'grill', 'fifo', 'premium', 'tradicional', 'nanica', 'ouro', 'in', 'natura',
  'inteira', 'pesado', 'pesada', 'porc', 'fatiado', 'fatiados', 'fatiada', 'val',
  'tipo', 'extra', 'especial', 'novilho', 'solteira', 'temp',
]);

function paraNumero(s: string): number {
  return Number(s.replace(/\./g, '').replace(',', '.'));
}

/** Tokens informativos de um nome (sem acento, sem ruído, sem números). */
function tokens(nome: string): string[] {
  return normalizar(nome)
    .replace(/\bs\/(\w)/g, 'sem $1')
    .replace(/\bc\/(\w)/g, 'com $1')
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !RUIDO.has(t) && !/^\d/.test(t));
}

/* ---------------- aliases: cotação → item canônico do histórico -------- */

const ALIASES: [RegExp, string][] = [
  [/file.*(peito|frango).*(s|sem).*osso|^file (de )?frango/, 'File de frango sem osso'],
  [/file de peito|peito.*(s\/|sem )sassami|meio file peito|sassami/, 'Peito de Frango sem osso'],
  [/peito (c\/|com )?osso/, 'Peito de Frango'],
  [/tiras? de carnes?/, 'Tiras de Carne'],
  [/tiras? de frangos?/, 'Tiras de frango'],
  [/acem moido|carne moida acem/, 'Acém moído'],
  [/acem em pecas?/, 'Acem em peça'],
  [/acem.*(cubos|iscas)/, 'Acem em cubos'],
  [/^acem\b/, 'Acém'],
  [/carne moida/, 'Carne Moída'],
  [/costelinha|costela.*(suina|churrasco|tiras)/, 'Costelinha suína'],
  [/costela (ripa|janela|minga|inteira|bovina|em cubos)?/, 'Costela Bovina'],
  [/lombo/, 'Lombo suíno'],
  [/bisteca/, 'Bisteca suína'],
  [/bife a role/, 'Bife a Role'],
  [/^bife\b/, 'Bife'],
  [/linguica toscana|ling toscana/, 'Linguiça Toscana'],
  [/calabresa/, 'Linguiça Calabresa'],
  [/linguica suina|ling suina/, 'Linguiça Fresca'],
  [/frango inteiro|frango (s\/|sem )miudos/, 'Frango inteiro'],
  [/coxa (c\/|com )?(sobrecoxa|sobre coxa)|sobrecoxa|sobre coxa/, 'Sobre coxa'],
  [/pernil/, 'Pernil de porco fatiado'],
  [/mussarela/, 'Mussarela'],
  [/batata (palito|canoa|crinkle|rustica|9mm|surecrisp|frita)/, 'Batata Frita'],
  [/^ovos?( de galinha| vermelhos| extra)?$/, 'Ovos'],
];

/** Casa um nome de cotação com um item do histórico (ou null). */
export function casarItem(nome: string): string | null {
  const n = tokens(nome).join(' ');
  if (!n) return null;

  for (const [re, alvo] of ALIASES) {
    if (re.test(n)) return alvo;
  }

  // pontuação por cobertura de tokens do item dentro do nome cotado
  const nomeTokens = new Set(tokens(nome));
  let melhor: string | null = null;
  let melhorNota = 0;
  for (const it of DADOS.itens) {
    const itTokens = tokens(it.n);
    if (itTokens.length === 0) continue;
    const cobertos = itTokens.filter((t) => nomeTokens.has(t)).length;
    if (cobertos === 0) continue;
    // todos os tokens do item precisam aparecer no nome cotado
    if (cobertos < itTokens.length) continue;
    // nota: itens mais específicos (mais tokens) e mais frequentes vencem
    const nota = itTokens.length * 1000 + Math.min(it.f, 999);
    if (nota > melhorNota) {
      melhorNota = nota;
      melhor = it.n;
    }
  }
  return melhor;
}

/* --------------------------- parser de texto -------------------------- */

function limparLinha(bruta: string): string {
  return bruta
    .replace(/^\[[^\]]*\]\s*[^:]*:\s*/, '') // prefixo do WhatsApp "[data] C.:"
    .replace(/\*/g, '')
    .replace(/[\t ]+/g, ' ')
    .replace(/\bval\.?\s*\d{2}\/\d{2}(\/\d{2,4})?/gi, '') // validade "Val 08/07"
    .replace(/\bcx c\/ ?\d+ ?kgs?\b/gi, '')
    .replace(/\bfifo\b/gi, '')
    .trim();
}

/**
 * Detecta se uma linha sem preço é um cabeçalho de fornecedor.
 * Heurística: linha curta (≤60 chars), sem vírgula-decimal, contém letras.
 * Exemplos: "VITAFRANGO WG", "Jampac", "BOVINOS", "C. Frango"
 */
function detectarFornecedor(linha: string): string | null {
  if (linha.length < 2 || linha.length > 80) return null;
  // se tiver preço (N,NN) não é cabeçalho
  if (/\d,\d\d/.test(linha)) return null;
  // precisa ter pelo menos uma letra
  if (!/[a-zA-ZÀ-ÿ]/.test(linha)) return null;
  // linhas muito longas provavelmente são descrições ou frases, não fornecedores
  const words = linha.trim().split(/\s+/);
  if (words.length > 6) return null;
  return linha.replace(/[:.\-–]+$/, '').trim() || null;
}

export function parsearCotacao(texto: string): LinhaCotacao[] {
  const linhas: LinhaCotacao[] = [];
  let fornecedorSecao: string | null = null; // supplier detected from section header

  for (const bruta of texto.split(/\r?\n/)) {
    const linha = limparLinha(bruta);
    if (!linha || linha.length < 2) continue;

    const precos = linha.match(RE_PRECO);
    if (!precos) {
      // Sem preço → pode ser cabeçalho de fornecedor ou categoria
      const forn = detectarFornecedor(linha);
      if (forn) fornecedorSecao = forn;
      continue;
    }

    let nome = '';
    let preco = 0;
    let unid: string | null = null;

    const inicio = linha.match(/^(\d{1,3}(?:\.\d{3})?,\d{2})\s+(.+)$/);
    if (inicio) {
      // Formato A: preço na frente
      preco = paraNumero(inicio[1]);
      nome = inicio[2].replace(/\b(RF|CG)\b\.?\*?/g, '').replace(/\be\b\s*$/i, '');
    } else {
      // Formatos B/C/D: último preço da linha
      const ultimo = precos[precos.length - 1];
      const pos = linha.lastIndexOf(ultimo);
      preco = paraNumero(ultimo);
      nome = linha.slice(0, pos).replace(/R\$\s*$/i, '');
      // Formato D: unidade como último token do nome ("ALHO KG 29,80")
      const m = nome.trim().match(/^(.*\S)\s+([A-Za-zÇç]{2,3})$/);
      if (m && UNIDADES.has(normalizar(m[2]))) {
        nome = m[1];
        unid = normalizar(m[2]);
      }
    }

    nome = nome.replace(/[-–:.,]+\s*$/, '').replace(/\s+/g, ' ').trim();
    if (!nome || !(preco > 0)) continue;

    // marca/frigorífico após " - " (ex.: "Acém Resf - Ribeiro")
    let marca: string | null = null;
    const sep = nome.split(/\s[-–]\s/);
    if (sep.length > 1) {
      marca = sep[sep.length - 1].trim() || null;
      nome = sep.slice(0, -1).join(' - ').trim();
    }

    // se não veio marca inline, herda o fornecedor do cabeçalho de seção
    if (!marca && fornecedorSecao) {
      marca = fornecedorSecao;
    }

    linhas.push({ nome, preco, marca, unid, item: casarItem(nome) });
  }
  return linhas;
}

/**
 * Extrai o remetente mais frequente de uma conversa exportada do WhatsApp.
 * Útil para detectar o nome do fornecedor automaticamente quando o usuário
 * cola uma cotação recebida pelo WhatsApp.
 */
export function extrairRemetenteWhatsApp(texto: string): string | null {
  const re = /^\[[^\]]+\]\s*([^:\n]+):/gm;
  const freq: Record<string, number> = {};
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto)) !== null) {
    const nome = m[1].trim();
    if (nome) freq[nome] = (freq[nome] ?? 0) + 1;
  }
  if (!Object.keys(freq).length) return null;
  return Object.entries(freq).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;
}

/* ----------------- agregação: menor preço por item -------------------- */

const unidadeDoItem = new Map<string, string>();
DADOS.itens.forEach((it) => unidadeDoItem.set(it.n, it.u));

export function agruparCotacao(
  linhas: LinhaCotacao[],
  itensExtras?: Record<string, { n: string; u: string }>,
): {
  casados: ItemCotado[];
  soltos: LinhaCotacao[];
} {
  const porItem = new Map<string, ItemCotado>();
  const soltos: LinhaCotacao[] = [];

  for (const bruta of linhas) {
    // itens cadastrados pelo usuário em cotações anteriores são conhecidos
    const extra = !bruta.item ? itensExtras?.[normalizar(bruta.nome)] : undefined;
    const l = extra ? { ...bruta, item: extra.n } : bruta;
    if (!l.item) {
      soltos.push(l);
      continue;
    }
    const atual = porItem.get(l.item);
    if (!atual) {
      porItem.set(l.item, {
        item: l.item,
        unid: unidadeDoItem.get(l.item) ?? extra?.u ?? l.unid ?? 'kg',
        preco: l.preco,
        marca: l.marca,
        ofertas: 1,
      });
    } else {
      atual.ofertas++;
      if (l.preco < atual.preco) {
        atual.preco = l.preco;
        atual.marca = l.marca;
      }
    }
  }

  return {
    casados: Array.from(porItem.values()).sort((a, b) => a.item.localeCompare(b.item, 'pt-BR')),
    soltos,
  };
}
