/* =====================================================================
   Leitor de cotações — cole o texto do WhatsApp (ou da tabela do
   fornecedor) e extraímos itens + preços, casando com o histórico.

   Formatos reconhecidos:
   A) "7,00 Frango inteiro RF"               → preço na frente
   B) "Acém Resf - Ribeiro *31,90*"          → preço no fim (asteriscos)
   C) "Tiras de carnes\t\tR$ 43,00"          → R$ no fim, com tabulações
   D) "ALHO KG 29,80"                        → tabela com unidade no meio
   E) "WG\tTiras de carnes\t\tR$ 43,00"     → fornecedor prefixando a linha
   ===================================================================== */

import { DADOS, normalizar } from './motor';

export interface LinhaCotacao {
  nome: string; // nome do produto como veio na cotação (limpo)
  preco: number;
  marca: string | null; // marca/frigorífico após " - " quando existe, ou fornecedor
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
const RE_TEM_PRECO = /\d{1,3}(?:\.\d{3})?,\d{2}/;
const UNIDADES = new Set(['kg', 'un', 'cx', 'bd', 'dz', 'pct', 'lt', 'mc', 'mç', 'pc', 'sc']);

/** Palavras de qualificação que não ajudam a identificar o produto. */
const RUIDO = new Set([
  'resf', 'resfriado', 'resfriada', 'cong', 'congelado', 'congelada', 'congelados',
  'rf', 'cg', 'grill', 'fifo', 'premium', 'tradicional', 'nanica', 'ouro', 'in', 'natura',
  'inteira', 'pesado', 'pesada', 'porc', 'fatiado', 'fatiados', 'fatiada', 'val',
  'tipo', 'extra', 'especial', 'novilho', 'solteira', 'temp',
]);

/**
 * Fornecedores conhecidos: regex de detecção → nome canônico.
 * Adicione novos fornecedores aqui quando necessário.
 */
const FORNECEDORES_CONHECIDOS: [RegExp, string][] = [
  [/vita[\s-]*frango/i,  'Vita Frango'],
  [/\bjampac\b/i,        'Jampac'],
  [/apetito/i,           'Apetito Foods'],
  [/\bwg\b/i,            'WG'],
  [/frito[\s-]*sul/i,    'Frito Sul'],
];

/** Retorna o nome canônico se a string contém um fornecedor conhecido. */
function fornecedorConhecido(s: string): string | null {
  for (const [re, nome] of FORNECEDORES_CONHECIDOS) {
    if (re.test(s)) return nome;
  }
  return null;
}

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
    .replace(/^\[[^\]]*\]\s*[^:]*:\s*/, '')    // prefixo WhatsApp "[data] C.:"
    .replace(/\*/g, '')
    .replace(/_([^_]+)_/g, '$1')               // itálico WhatsApp _texto_
    .replace(/[\t ]+/g, ' ')
    .replace(/\bval\.?\s*\d{2}\/\d{2}(\/\d{2,4})?/gi, '') // validade "Val 08/07"
    .replace(/\bvalidade\.?\s*\d{2}\/\d{2}(\/\d{2,4})?/gi, '')
    .replace(/\bcx c\/ ?\d+ ?kgs?\b/gi, '')
    .replace(/\bfifo\b/gi, '')
    // emojis BMP (Misc Symbols, Dingbats, etc.)
    .replace(/[⌀-⏿☀-➿⬀-⯿■-◿]/g, '')
    // emojis nos planos suplementares (surrogate pairs: U+1F000+)
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
    // variation selectors, zero-width joiner, combining enclosing keycap
    .replace(/[︀-️‍⃣]/g, '')
    .trim();
}

/**
 * Detecta se uma linha sem preço é um cabeçalho de fornecedor genérico.
 * Retorna null para saudações, datas, dias da semana e linhas muito longas.
 */
function detectarFornecedor(linha: string): string | null {
  if (linha.length < 2 || linha.length > 80) return null;
  if (RE_TEM_PRECO.test(linha)) return null;
  if (!/[a-zA-ZÀ-ÿ]/.test(linha)) return null;
  // Saudações → não é fornecedor
  if (/^(bom\s+dia|boa\s+tarde|boa\s+noite|oi\b|olá\b|prezad)/i.test(linha)) return null;
  // Dias da semana e datas ("Segunda-feira 08/06/2026") → não é fornecedor
  if (/^(segunda|terça|quarta|quinta|sexta|sábado|domingo)/i.test(linha)) return null;
  const words = linha.trim().split(/\s+/);
  if (words.length > 8) return null;
  // Limpa prefixo "TABELA", datas DD/MM e pontuação final
  const limpo = linha
    .replace(/^tabela\s+/i, '')
    .replace(/\d{2}\/\d{2}(\/\d{2,4})?/g, '')
    .replace(/[-–:.,!?▪•]+\s*$/, '')
    .trim();
  return limpo || null;
}

export function parsearCotacao(texto: string): LinhaCotacao[] {
  const linhas: LinhaCotacao[] = [];
  let fornecedorSecao: string | null = null;

  for (const bruta of texto.split(/\r?\n/)) {
    // Detecta início de mensagem WhatsApp ANTES de limpar a linha
    const temPrefitoWA = /^\[[^\]]*\]\s*[^:]*:/.test(bruta);
    const linha = limparLinha(bruta);
    if (!linha || linha.length < 2) continue;

    const precos = linha.match(RE_PRECO);

    if (!precos) {
      // Fornecedores conhecidos têm prioridade absoluta (Vita Frango, Jampac, WG…)
      const fk = fornecedorConhecido(linha);
      if (fk) {
        fornecedorSecao = fk;
        continue;
      }
      // Detecção genérica: só sobrescreve no início de nova mensagem WA
      // ou quando ainda não há fornecedor ativo.
      // Isso impede que subcategorias como *ACÉM* ou *PALETA* (que aparecem
      // dentro de uma seção do Jampac) substituam o fornecedor correto.
      const forn = detectarFornecedor(linha);
      if (forn && (temPrefitoWA || !fornecedorSecao)) {
        fornecedorSecao = forn;
      }
      continue;
    }

    // Linha tem preço(s).
    // Detecta padrão E: fornecedor prefixando a linha de item após normalização
    // de tabulações. Ex.: "WG Tiras de carnes R$ 43,00"
    let linhaItem = linha;
    const mPrefix = linha.match(/^(\S{2,10})\s(.+)$/);
    if (mPrefix && !RE_TEM_PRECO.test(mPrefix[1])) {
      const fk = fornecedorConhecido(mPrefix[1]);
      if (fk) {
        fornecedorSecao = fk;
        linhaItem = mPrefix[2];
      }
    }

    let nome = '';
    let preco = 0;
    let unid: string | null = null;

    const inicio = linhaItem.match(/^(\d{1,3}(?:\.\d{3})?,\d{2})\s+(.+)$/);
    if (inicio) {
      // Formato A: preço na frente
      preco = paraNumero(inicio[1]);
      nome = inicio[2].replace(/\b(RF|CG)\b\.?\*?/g, '').replace(/\be\b\s*$/i, '');
    } else {
      // Formatos B/C/D: último preço da linha
      const precosItem = linhaItem.match(RE_PRECO) ?? precos;
      const ultimo = precosItem[precosItem.length - 1];
      const pos = linhaItem.lastIndexOf(ultimo);
      preco = paraNumero(ultimo);
      nome = linhaItem.slice(0, pos).replace(/R\$\s*$/i, '');
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
