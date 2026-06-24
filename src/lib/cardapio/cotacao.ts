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
import { resolverPreco } from './precos';
import { PRECOS_COMPRAS, UNIDADES_COMPRAS } from './precos-compras';

export type Confianca = 'alta' | 'media' | 'baixa' | 'sem-historico';

export interface LinhaCotacao {
  nome: string;
  preco: number;
  marca: string | null;
  unid: string | null;
  item: string | null;
  // Validação contra histórico TATÁ House
  precoHistorico?: number | null;
  deltaHistorico?: number | null; // fração: +0.3 = 30% acima
  confianca?: Confianca;
  alerta?: string | null;
  origemHistorico?: string | null;
}

export interface ItemCotado {
  item: string;
  unid: string;
  preco: number;
  marca: string | null;
  ofertas: number;
  precoHistorico?: number | null;
  deltaHistorico?: number | null;
  confianca?: Confianca;
  alerta?: string | null;
  origemHistorico?: string | null;
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

/** Fornecedores sempre reconhecidos — nunca desabilitados, mesmo quando o usuário cadastra os seus. */
const FORNECEDORES_BASE: [RegExp, string][] = [
  [/vita[\s-]*frango/i, 'Vita Frango'],
  [/\bjampac\b/i,       'Jampac'],
  [/apetito/i,          'Apetito Foods'],
  [/\bwg\b/i,           'WG'],
  [/frito[\s-]*sul/i,   'Frito Sul'],
];

/**
 * Remetentes INTERNOS — pessoas do setor de compras que ENCAMINHAM as
 * cotações dos fornecedores (ex.: a Erika). Nunca são fornecedores. O sistema
 * ignora esses nomes ao detectar/registrar fornecedor e busca o nome REAL do
 * fornecedor no conteúdo da mensagem. Estende-se em runtime via `bloquearRemetente`.
 */
const NAO_FORNECEDORES = new Set<string>(['erika']);

/** Marca um nome como remetente interno (nunca tratado como fornecedor). */
export function bloquearRemetente(nome: string) {
  const n = normalizar(nome);
  if (n) NAO_FORNECEDORES.add(n);
}

/** True se o nome é de alguém interno (quem encaminha), não um fornecedor. */
export function ehRemetenteInterno(nome: string | null | undefined): boolean {
  if (!nome) return false;
  const n = normalizar(nome);
  if (!n) return false;
  if (NAO_FORNECEDORES.has(n)) return true;
  // também pega "Erika Compras", "[10:32] Erika:" → o primeiro nome próprio
  const palavras = n.split(/\s+/);
  return palavras.some((p) => NAO_FORNECEDORES.has(p));
}

/** Gera regex a partir do nome cadastrado (case-insensitive, espaços flexíveis). */
function regexDeFornecedor(nome: string): RegExp {
  const s = nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '[\\s-]+');
  return new RegExp(`\\b${s}\\b`, 'i');
}

/**
 * Constrói lookup: custom tem prioridade, base é sempre incluída como complemento.
 * Nunca inventa fornecedor — só reconhece o que foi cadastrado ou está na base.
 */
function buildLookupFornecedor(custom: string[]): (s: string) => string | null {
  // Remetentes internos (Erika etc.) nunca entram como fornecedor, mesmo se
  // foram cadastrados por engano antes desta regra existir.
  const customValido = custom.filter((n) => !ehRemetenteInterno(n));
  const customPares: [RegExp, string][] = customValido.map((n) => [regexDeFornecedor(n), n]);
  const customNomes = new Set(customValido.map((n) => n.toLowerCase()));
  const basePares = FORNECEDORES_BASE.filter(([, nome]) => !customNomes.has(nome.toLowerCase()));
  const lista = [...customPares, ...basePares];
  return (s: string) => {
    for (const [re, nome] of lista) if (re.test(s)) return ehRemetenteInterno(nome) ? null : nome;
    return null;
  };
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

/* ─── Validação histórica ──────────────────────────────────────────── */

/**
 * Cruza o preço cotado com o histórico real do TATÁ (planilhas Mai/Jun 2026).
 * Atribui confiança e alerta sem inventar nada.
 */
function validarLinha(l: LinhaCotacao): LinhaCotacao {
  const normItem = l.item ? normalizar(l.item) : null;
  const normNome = normalizar(l.nome);

  // Tenta resolver pelo item canônico primeiro, depois pelo nome bruto
  let hist = normItem ? resolverPreco(normItem, {}) : { valor: 0, tipo: 'sem' as const };
  if (hist.valor === 0) hist = resolverPreco(normNome, {});

  if (hist.valor === 0 || hist.tipo === 'sem') {
    return { ...l, precoHistorico: null, deltaHistorico: null, confianca: 'sem-historico', alerta: null, origemHistorico: null };
  }

  const precoHist = hist.valor;
  const delta = (l.preco - precoHist) / precoHist;
  const deltaAbs = Math.abs(delta);

  let confianca: Confianca = deltaAbs <= 0.12 ? 'alta' : deltaAbs <= 0.30 ? 'media' : 'baixa';
  let alerta: string | null = null;

  if (confianca === 'baixa') {
    const sinal = delta > 0 ? '+' : '';
    alerta = `${sinal}${(delta * 100).toFixed(0)}% vs histórico R$${precoHist.toFixed(2)}`;
    if (delta < -0.45) alerta += ' — verificar unidade';
  }

  // Valida unidade: se a cotação declarou uma unidade diferente do padrão, alerta
  const keyHist = normItem ?? normNome;
  const unidEsperada = (UNIDADES_COMPRAS[keyHist] ?? '').toLowerCase();
  if (l.unid && unidEsperada && l.unid !== unidEsperada) {
    const avisoUnid = `unidade "${l.unid}" ≠ padrão "${unidEsperada}" — confirmar`;
    alerta = alerta ? `${alerta} · ${avisoUnid}` : avisoUnid;
    if (confianca === 'alta') confianca = 'media';
  }

  const origemHistorico = hist.tipo === 'historico' ? 'planilha Mai/Jun 2026' : 'estimado';
  return { ...l, precoHistorico: precoHist, deltaHistorico: delta, confianca, alerta, origemHistorico };
}

/** Top 40 itens do histórico formatados para incluir no prompt do Groq. */
function buildContextoHistorico(): string {
  const linhas = Object.entries(PRECOS_COMPRAS)
    .filter(([, v]) => v > 0)
    .slice(0, 40)
    .map(([item, preco]) => {
      const unid = (UNIDADES_COMPRAS[item] ?? 'kg').toLowerCase();
      return `  ${item}: R$${preco.toFixed(2)}/${unid}`;
    });
  return `PREÇOS REAIS TATÁ HOUSE (Mai/Jun 2026 — use para validar, nunca para inventar):\n${linhas.join('\n')}`;
}

export function parsearCotacao(texto: string, fornecedoresCustom: string[] = []): LinhaCotacao[] {
  const linhas: LinhaCotacao[] = [];
  let fornecedorSecao: string | null = null;
  const fornecedorConhecido = buildLookupFornecedor(fornecedoresCustom);

  for (const bruta of texto.split(/\r?\n/)) {
    // Extrai remetente do prefixo WA "[data] Remetente:" ANTES de limpar
    const mWA = bruta.match(/^\[[^\]]*\]\s*([^:\n]{1,60}):/);
    const temPrefitoWA = !!mWA;
    if (mWA) {
      const fk = fornecedorConhecido(mWA[1].trim());
      if (fk) fornecedorSecao = fk;
    }
    const linha = limparLinha(bruta);
    if (!linha || linha.length < 2) continue;

    const precos = linha.match(RE_PRECO);

    if (!precos) {
      // Só reconhece fornecedor se está na lista cadastrada ou na base — nunca inventa.
      const fk = fornecedorConhecido(linha);
      if (fk) fornecedorSecao = fk;
      continue;
    }

    // Linha tem preço(s).
    // Detecta padrão E: fornecedor prefixando a linha de item.
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

    // Marca após " - ": limpa o nome sempre, mas só registra marca se for fornecedor conhecido.
    // Evita que "Acém - Ribeiro" vire fornecedor "Ribeiro" (Ribeiro é frigorifico, não cadastrado).
    let marca: string | null = null;
    const sep = nome.split(/\s[-–]\s/);
    if (sep.length > 1) {
      const candidato = sep[sep.length - 1].trim();
      marca = fornecedorConhecido(candidato);
      nome = sep.slice(0, -1).join(' - ').trim();
    }

    // se não veio marca inline, herda o fornecedor do cabeçalho de seção
    if (!marca && fornecedorSecao) {
      marca = fornecedorSecao;
    }

    const novaLinha: LinhaCotacao = { nome, preco, marca, unid, item: casarItem(nome) };
    linhas.push(validarLinha(novaLinha));
  }
  return linhas;
}

/* ------------------- integração Gemini IA ----------------------------- */

const GROQ_MODELO = 'llama-3.3-70b-versatile';

function buildPromptIA(fornecedores: string[]): string {
  const listForn = fornecedores.length
    ? fornecedores.join(', ')
    : 'Vita Frango, Jampac, Apetito Foods, WG, Frito Sul';
  return `Você é o comprador do TATÁ House, restaurante industrial em SP.
Extraia TODOS os produtos com preço desta cotação recebida de fornecedores.

${buildContextoHistorico()}

FORNECEDORES CADASTRADOS: ${listForn}

QUEM ENCAMINHA (NÃO é fornecedor): ${Array.from(NAO_FORNECEDORES).join(', ') || '—'}

REGRAS:
- Cabeçalhos de categoria (*ACÉM*, *SUÍNOS*, *BOVINOS* etc.) → IGNORE
- Saudações, datas, dias da semana, status → IGNORE
- A pessoa do setor de compras que ENCAMINHA a cotação (ex.: ${Array.from(NAO_FORNECEDORES).join(', ') || 'Erika'}) NÃO é fornecedor. Nunca use o nome de quem encaminhou como marca. Identifique o fornecedor REAL pelo conteúdo/cabeçalho da própria mensagem.
- Remova qualificadores: Resf/Resfriado/Cong/Congelado/RF/CG/FIFO do nome
- "Produto - Marca valor" → marca é o texto após o traço
- Preço como número com ponto decimal (ex: 31.90)
- Nunca invente preço — extraia apenas do texto fornecido
- Nunca invente fornecedor — use apenas os cadastrados acima

Responda APENAS com JSON no formato {"items":[...]} (sem markdown):
{"items":[{"nome":"Frango inteiro","preco":7.00,"marca":"Vita Frango"},...]}`;

}

type ItemIA = { nome: string; preco: number; marca?: string };

async function chamarGroq(texto: string, apiKey: string, fornecedores: string[]): Promise<LinhaCotacao[]> {
  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: GROQ_MODELO,
      messages: [
        { role: 'user', content: `${buildPromptIA(fornecedores)}\n\nCOTAÇÃO:\n${texto.slice(0, 16000)}` },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
  });
  if (!resp.ok) {
    const err: { error?: { message?: string } } = await resp.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `HTTP ${resp.status}`);
  }
  const data: { choices?: { message?: { content?: string } }[] } = await resp.json();
  const txt = data?.choices?.[0]?.message?.content ?? '{}';
  const parsed: { items?: ItemIA[] } | ItemIA[] = JSON.parse(txt);
  const items: ItemIA[] = Array.isArray(parsed) ? parsed : (parsed as { items?: ItemIA[] }).items ?? [];
  return items
    .filter((it) => it.nome && it.preco > 0)
    .map((it) => {
      // Se a IA escorregou e pôs o remetente interno como marca, descarta.
      const marca = it.marca?.trim() || null;
      return {
        nome: it.nome.trim(),
        preco: it.preco,
        marca: marca && !ehRemetenteInterno(marca) ? marca : null,
        unid: null,
        item: casarItem(it.nome),
      };
    });
}

/**
 * Combina resultados da lógica (preços confiáveis) e da IA (contexto e nomes):
 * - Lógica é autoritativa em preços e matches já conhecidos
 * - IA preenche gaps: fornecedor não detectado, item canônico para "soltos"
 * - Itens que a IA achou mas a lógica não capturou são adicionados ao final
 */
function combinarResultados(logica: LinhaCotacao[], ia: LinhaCotacao[]): LinhaCotacao[] {
  if (!ia.length) return logica;

  // Fila de itens IA por preço (em centavos) para consumo sequencial
  const filaIA = new Map<number, LinhaCotacao[]>();
  for (const l of ia) {
    const k = Math.round(l.preco * 100);
    filaIA.set(k, [...(filaIA.get(k) ?? []), l]);
  }

  const iaConsumidos = new Set<LinhaCotacao>();

  const resultado = logica.map((l): LinhaCotacao => {
    const k = Math.round(l.preco * 100);
    const fila = filaIA.get(k) ?? [];
    const par = fila.shift();
    if (par) iaConsumidos.add(par);
    const merged: LinhaCotacao = {
      nome: l.nome,
      preco: l.preco,
      marca: l.marca || par?.marca || null,
      unid: l.unid,
      item: l.item || par?.item || null,
    };
    return validarLinha(merged);
  });

  // Itens que a IA achou mas a lógica não capturou
  for (const l of ia) {
    if (!iaConsumidos.has(l)) resultado.push(l);
  }

  return resultado;
}

/**
 * Versão combo: lógica + Gemini.
 * A lógica cuida de preços e formatos conhecidos; a IA resolve gaps de contexto
 * (fornecedor, nomes ambíguos, formatos inesperados). Se a IA falhar, retorna
 * o resultado da lógica pura sem interromper o fluxo.
 */
export async function parsearCotacaoComIA(
  texto: string,
  apiKey: string,
  fornecedoresCustom: string[] = [],
): Promise<{ linhas: LinhaCotacao[]; comIA: boolean; erroIA?: string }> {
  const logica = parsearCotacao(texto, fornecedoresCustom);
  try {
    const ia = await chamarGroq(texto, apiKey, fornecedoresCustom);
    return { linhas: combinarResultados(logica, ia), comIA: true };
  } catch (e) {
    return { linhas: logica, comIA: false, erroIA: e instanceof Error ? e.message : String(e) };
  }
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
        precoHistorico: l.precoHistorico,
        deltaHistorico: l.deltaHistorico,
        confianca: l.confianca,
        alerta: l.alerta,
        origemHistorico: l.origemHistorico,
      });
    } else {
      atual.ofertas++;
      if (l.preco < atual.preco) {
        atual.preco = l.preco;
        atual.marca = l.marca;
        atual.precoHistorico = l.precoHistorico;
        atual.deltaHistorico = l.deltaHistorico;
        atual.confianca = l.confianca;
        atual.alerta = l.alerta;
        atual.origemHistorico = l.origemHistorico;
      }
    }
  }

  return {
    casados: Array.from(porItem.values()).sort((a, b) => a.item.localeCompare(b.item, 'pt-BR')),
    soltos,
  };
}
