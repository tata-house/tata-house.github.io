/* =====================================================================
   Motor do Cardápio da equipe — regras de negócio em cima do histórico
   (405 dias reais de pedidos: 2025 + Abril/Maio/Junho 2026)
   ===================================================================== */

import dadosJson from './dados.json';
import { receitaDoPrato, RECEITAS_POR_CATEGORIA } from './receitas';
import type {
  Aviso,
  DadosCardapio,
  DadosCombo,
  DiaCardapio,
  EstadoSemana,
  ItemSugerido,
  Proteina,
  StatusItem,
} from './tipos';

export const DADOS = dadosJson as unknown as DadosCardapio;

export const DIAS_SEMANA = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
] as const;

/** Curva de movimento padrão: Seg/Ter menor, Qua/Qui média, Sex–Dom pico. */
export const PESSOAS_PADRAO = [55, 55, 65, 65, 80, 80, 80];

export function normalizar(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/* ------------------------- proteína do prato ------------------------- */

const REGRAS_PROTEINA: [Proteina, RegExp][] = [
  [
    'frango',
    /\bfrango|coxa|sobrecoxa|sobre coxa|galinha|asinha|\basa\b|chester|passarinho/,
  ],
  [
    'suina',
    /suin|porco|bisteca|lombo|pernil|costelinha|calabresa|toscana|feijoada|panceta|barriga|joelho/,
  ],
  ['peixe', /peixe|tilapia|merluza|sardinha|bacalhau|pescad|file de panga/],
  ['ovo', /\bovo\b|\bovos\b|omelete/],
  [
    'bovina',
    /bovin|bife|acem|aranha|patinho|picadinho|churrasco|carreteir|chuleta|chuletinha|cupim|costela|carne|almondega|strogonoff|escondidinho|hamburguer|lagarto|maminha|fraldinha|paleta|musculo|lasanha|panelada/,
  ],
];

export function proteinaDoPrato(prato: string | null | undefined): Proteina {
  const n = normalizar(prato);
  if (!n) return 'outros';
  for (const [prot, re] of REGRAS_PROTEINA) {
    if (re.test(n)) return prot;
  }
  return 'outros';
}

export const ROTULO_PROTEINA: Record<Proteina, string> = {
  bovina: 'Bovina',
  frango: 'Frango',
  suina: 'Suína',
  peixe: 'Peixe',
  ovo: 'Ovo',
  outros: 'Outros',
};

/* --------------------------- validação ------------------------------- */

export function validarSemana(dias: DiaCardapio[]): Aviso[] {
  const avisos: Aviso[] = [];
  const prots = dias.map((d) => (d.principal ? proteinaDoPrato(d.principal) : null));
  const cont: Record<string, number> = {};
  prots.forEach((p) => {
    if (p) cont[p] = (cont[p] ?? 0) + 1;
  });

  const suina = cont['suina'] ?? 0;
  const frango = cont['frango'] ?? 0;
  const preenchidos = prots.filter(Boolean).length;

  if (suina > 2) avisos.push({ nivel: 'erro', msg: `Carne suína ${suina}× — a regra é no máximo 2× na semana.` });
  if (frango > 4) avisos.push({ nivel: 'erro', msg: `Frango ${frango}× — a regra é de 3 a 4× na semana.` });
  if (preenchidos === 7 && frango < 3)
    avisos.push({ nivel: 'alerta', msg: `Frango só ${frango}× — o ideal é de 3 a 4× na semana.` });

  for (let i = 1; i < 7; i++) {
    if (prots[i] && prots[i] === prots[i - 1] && prots[i] !== 'outros') {
      avisos.push({
        nivel: 'alerta',
        msg: `${ROTULO_PROTEINA[prots[i] as Proteina]} repetida em dias seguidos (${DIAS_SEMANA[i - 1]} → ${DIAS_SEMANA[i]}).`,
      });
    }
  }

  const vistos = new Map<string, number>();
  dias.forEach((d, i) => {
    const k = normalizar(d.principal);
    if (!k) return;
    if (vistos.has(k)) {
      avisos.push({
        nivel: 'alerta',
        msg: `“${d.principal}” repetido na semana (${DIAS_SEMANA[vistos.get(k)!]} e ${DIAS_SEMANA[i]}).`,
      });
    } else vistos.set(k, i);
  });

  if (avisos.length === 0 && preenchidos === 7)
    avisos.push({ nivel: 'ok', msg: 'Semana fechada: rotação de proteínas dentro das regras.' });
  return avisos;
}

/* ----------------------- lista de compras ---------------------------- */

const UNIDADES_DECIMAIS = new Set(['kg', 'lt', 'g', 'ml']);

export function arredondar(qtd: number, unid: string): number {
  if (UNIDADES_DECIMAIS.has(unid)) return Math.round(qtd * 10) / 10;
  return Math.ceil(qtd - 1e-9);
}

const porChave = new Map<string, DadosCombo>();
DADOS.combos.forEach((c) => porChave.set(normalizar(c.chave), c));

const porTipoOpcao = new Map<string, { i: string; q: number; u: string | null }[]>();
DADOS.mapas.forEach((m) => porTipoOpcao.set(`${m.tipo}|${normalizar(m.op)}`, m.itens));

const unidadePadrao = new Map<string, string>();
DADOS.itens.forEach((it) => unidadePadrao.set(normalizar(it.n), it.u));

const excluidos = new Set(DADOS.excluir.map(normalizar));

const TIPOS: ['principal' | 'guarnicao_fixa' | 'guarnicao' | 'salada' | 'sobremesa', keyof DiaCardapio][] = [
  ['principal', 'principal'],
  ['guarnicao_fixa', 'guarnicaoFixa'],
  ['guarnicao', 'guarnicao'],
  ['salada', 'salada'],
  ['sobremesa', 'sobremesa'],
];

export function chaveDoDia(dia: DiaCardapio): string {
  return [dia.principal, dia.guarnicaoFixa, dia.guarnicao, dia.salada, dia.sobremesa]
    .map((v) => v ?? '')
    .join('|');
}

/* --------- garantia: o que está escrito no cardápio entra na lista ---- */

function tokensTexto(s: string): string[] {
  return normalizar(s)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
}

/** Encontra o item do catálogo citado num trecho de texto do cardápio. */
function itemDoTexto(parte: string): { n: string; u: string; f: number } | null {
  const toks = new Set(tokensTexto(parte));
  if (toks.size === 0) return null;
  let melhor: { n: string; u: string; f: number } | null = null;
  let melhorNota = 0;
  for (const it of DADOS.itens) {
    const itoks = tokensTexto(it.n);
    if (itoks.length === 0 || itoks.length > 3) continue;
    if (!itoks.every((t) => toks.has(t))) continue;
    const nota = itoks.length * 1000 + Math.min(it.f, 999);
    if (nota > melhorNota) {
      melhorNota = nota;
      melhor = it;
    }
  }
  return melhor;
}

/** Quantidade padrão por pessoa para item completado (heurística do histórico). */
function qtdPadraoPorPessoa(categoria: string, unid: string, ehProteina: boolean): number {
  if (ehProteina) return 0.16; // kg de proteína por pessoa
  const porUnid: Record<string, number> = {
    kg: 0.05,
    un: 0.08,
    mç: 0.04,
    pct: 0.04,
    lata: 0.04,
    lt: 0.03,
    bd: 0.02,
    bag: 0.02,
  };
  let q = porUnid[unid] ?? 0.04;
  if (categoria === 'sobremesa') q *= 0.5;
  if (categoria === 'salada' && unid === 'un') q = 0.1;
  return q;
}

/** Proteína de reserva quando o prato descreve carne e nada veio do histórico. */
const PROTEINA_PADRAO: Partial<Record<Proteina, { item: string; unid: string }>> = {
  bovina: { item: 'Acém', unid: 'kg' },
  frango: { item: 'File de frango sem osso', unid: 'kg' },
  suina: { item: 'Lombo suíno', unid: 'kg' },
  ovo: { item: 'Ovos', unid: 'bd' },
};

/**
 * Gera a lista sugerida do dia: combinação exata do histórico quando existe;
 * senão soma os mapas de cada componente. Em seguida garante que tudo que
 * está DESCRITO no cardápio (proteína, salada, legume, verdura, sobremesa)
 * apareça na lista, mesmo que o histórico esteja incompleto.
 * Escala pela curva de pessoas. `fatores` é o aprendizado da casa.
 */
export interface OpcoesLista {
  mostrarBasicos?: boolean;
}

export function listaDoDia(dia: DiaCardapio, fatores?: Record<string, number>, opts?: OpcoesLista): ItemSugerido[] {
  const fator = dia.pessoas > 0 ? dia.pessoas / DADOS.baseline : 1;
  const acc = new Map<string, { item: string; unid: string; qtd: number }>();

  const adiciona = (nome: string, q: number, u: string | null) => {
    const k = normalizar(nome);
    if (!k || (!opts?.mostrarBasicos && excluidos.has(k))) return;
    const unid = u || unidadePadrao.get(k) || 'un';
    const atual = acc.get(k);
    if (atual) atual.qtd = Math.max(atual.qtd, q);
    else acc.set(k, { item: nome, unid, qtd: q });
  };

  // Receita do principal tem prioridade: garante ingredientes corretos e
  // determinísticos. Sem receita no principal, segue o histórico (combo/mapa).
  const principalComReceita = !!receitaDoPrato(dia.principal);
  const combo = principalComReceita ? undefined : porChave.get(normalizar(chaveDoDia(dia)));
  if (combo) {
    combo.itens.forEach(({ i, q, u }) => adiciona(i, q, u));
  } else {
    for (const [tipo, campo] of TIPOS) {
      const opcao = dia[campo];
      if (!opcao || typeof opcao !== 'string') continue;
      const receita = receitaDoPrato(opcao);
      if (receita) {
        // receita é por pessoa; o acumulador trabalha na base (baseline) e
        // multiplica por `fator` no fim → some porPessoa * baseline.
        receita.ingredientes.forEach((ing) => adiciona(ing.item, ing.porPessoa * DADOS.baseline, ing.unid));
      } else {
        const itens = porTipoOpcao.get(`${tipo}|${normalizar(opcao)}`);
        itens?.forEach(({ i, q, u }) => adiciona(i, q, u));
      }
    }
  }

  // 2ª passada: completa com os ingredientes citados no texto do cardápio
  const completa = (texto: string, categoria: string) => {
    if (!texto) return;
    for (const parte of texto.split(/\s+com\s+|\s+e\s+|,|\+|·|\//i)) {
      const it = itemDoTexto(parte);
      if (!it) continue;
      const k = normalizar(it.n);
      if (acc.has(k) || (!opts?.mostrarBasicos && excluidos.has(k))) continue;
      // já existe um item mais específico? ("Frango inteiro" cobre "Frango")
      const toks = tokensTexto(it.n);
      const coberto = Array.from(acc.values()).some((v) => {
        const vt = new Set(tokensTexto(v.item));
        return toks.every((t) => vt.has(t));
      });
      if (coberto) continue;
      const ehProt = it.u === 'kg' && proteinaDoPrato(it.n) !== 'outros';
      adiciona(it.n, qtdPadraoPorPessoa(categoria, it.u, ehProt) * DADOS.baseline, it.u);
    }
  };
  completa(dia.principal, 'principal');
  completa(dia.guarnicaoFixa, 'guarnicaoFixa');
  completa(dia.guarnicao, 'guarnicao');
  completa(dia.salada, 'salada');
  completa(dia.sobremesa, 'sobremesa');

  // garantia final: prato com carne descrita SEMPRE leva a proteína na lista
  if (dia.principal) {
    const alvo = proteinaDoPrato(dia.principal);
    if (alvo !== 'outros') {
      const tem = Array.from(acc.values()).some((v) => proteinaDoPrato(v.item) === alvo);
      const padrao = PROTEINA_PADRAO[alvo];
      if (!tem && padrao) {
        adiciona(padrao.item, qtdPadraoPorPessoa('principal', padrao.unid, padrao.unid === 'kg') * DADOS.baseline, padrao.unid);
      }
    }
  }

  return Array.from(acc.values())
    .map(({ item, unid, qtd }) => {
      const aprendido = fatores?.[normalizar(item)] ?? 1;
      return { item, unid, qtd: arredondar(qtd * fator * aprendido, unid) };
    })
    .filter((x) => x.qtd > 0)
    .sort((a, b) => a.item.localeCompare(b.item, 'pt-BR'));
}

/**
 * De onde vêm os ingredientes do prato principal do dia — usado para alertar
 * quando a lista é só estimada (sem receita nem histórico coerente).
 *  - 'receita'  : tem receita explícita (ideal).
 *  - 'combo'    : combinação exata já vista no histórico.
 *  - 'mapa'     : opção mapeada no histórico.
 *  - 'estimado' : sem nenhuma das anteriores → ingredientes chutados.
 *  - 'vazio'    : sem prato principal.
 */
export type FonteIngredientes = 'receita' | 'combo' | 'mapa' | 'estimado' | 'vazio';

export function fonteIngredientes(dia: DiaCardapio): FonteIngredientes {
  if (!dia.principal) return 'vazio';
  if (receitaDoPrato(dia.principal)) return 'receita';
  if (porChave.get(normalizar(chaveDoDia(dia)))) return 'combo';
  if (porTipoOpcao.get(`principal|${normalizar(dia.principal)}`)) return 'mapa';
  return 'estimado';
}

/* --------------- linhas de compra do dia (auto + manuais) ------------- */

export interface LinhaCompra {
  chave: string; // item normalizado (ou manual:<idx>:nome)
  item: string;
  unid: string;
  sugerida: number | null; // null = item manual
  qtd: number;
  manual: boolean;
  status: StatusItem;
}

export function linhasDoDia(
  estado: EstadoSemana,
  diaIdx: number,
  fatores?: Record<string, number>,
  opts?: OpcoesLista,
): LinhaCompra[] {
  const dia = estado.dias[diaIdx];
  const ajustes = estado.ajustes[diaIdx] ?? {};
  const status = estado.status[diaIdx] ?? {};
  const linhas: LinhaCompra[] = [];

  if (dia.principal) {
    for (const s of listaDoDia(dia, fatores, opts)) {
      const k = normalizar(s.item);
      const aj = ajustes[k];
      if (aj?.removido) continue;
      linhas.push({
        chave: k,
        item: s.item,
        unid: s.unid,
        sugerida: s.qtd,
        qtd: aj?.qtd ?? s.qtd,
        manual: false,
        status: status[k] ?? {},
      });
    }
  }
  (estado.manuais[diaIdx] ?? []).forEach((m, mi) => {
    const k = `manual:${mi}:` + normalizar(m.item);
    linhas.push({
      chave: k,
      item: m.item,
      unid: m.unid,
      sugerida: null,
      qtd: m.qtd,
      manual: true,
      status: status[k] ?? {},
    });
  });
  return linhas;
}

/** O dia tem registro exato no histórico? (qualidade da sugestão) */
export function temHistoricoExato(dia: DiaCardapio): boolean {
  return porChave.has(normalizar(chaveDoDia(dia)));
}

/* ----------------------- custo estimado ------------------------------ */

/**
 * Converte quantidade para a unidade base do preço (kg ou lt).
 * Preços são sempre armazenados por kg ou lt; quantidades em g/ml
 * precisam ser divididas por 1000 antes da multiplicação.
 */
export function converterParaUnidadeBase(qtd: number, unid: string): number {
  if (unid === 'g') return qtd / 1000;
  if (unid === 'ml') return qtd / 1000;
  return qtd;
}

export interface CustoDia {
  total: number;
  itensComPreco: number;
  itensTotal: number;
}

export function custoDaLista(
  itens: { item: string; unid: string; qtd: number }[],
  precos: Record<string, number>,
): CustoDia {
  let total = 0;
  let com = 0;
  itens.forEach(({ item, unid, qtd }) => {
    const p = precos[normalizar(item)];
    if (p !== undefined && p > 0) {
      total += p * converterParaUnidadeBase(qtd, unid);
      com++;
    }
  });
  return { total, itensComPreco: com, itensTotal: itens.length };
}

/* ------------------- diversidade: técnica & família ------------------ */

/** Técnica de preparo do prato — usada para não repetir o mesmo método. */
const TECNICAS: [string, RegExp][] = [
  ['frito', /frit|empanad|milanesa|a dore|crocante|nuggets|past[eé]l/],
  ['grelhado', /grelhad|chapa|na brasa|churrasc|espet/],
  ['assado', /assad|forno|gratinad|de forno|rost/],
  ['ensopado', /ensopad|cozid|caldo|guisad|panela|sopa|moqueca|vaca atolad/],
  ['refogado', /refogad|saltead|acebolad|picadinho/],
  ['molho', /ao molho|strogonoff|estrogonofe|fricasse|xadrez|curry|parmegiana|rol[eê]|madeira/],
  ['moido', /moid|almondega|kibe|hamburguer|bolinho|croquete|polpetone|escondidinho/],
  ['recheado', /rechead|enrolad|wrap|panqueca|tort/],
];

/** Método de preparo (grelhado, assado, ao molho, …) para medir variedade. */
export function tecnicaDoPrato(prato: string | null | undefined): string {
  const n = normalizar(prato);
  if (!n) return 'outro';
  const r = receitaDoPrato(prato);
  if (r?.tags?.length) {
    for (const [t, re] of TECNICAS) if (r.tags.some((tag) => re.test(normalizar(tag)))) return t;
  }
  for (const [t, re] of TECNICAS) if (re.test(n)) return t;
  return 'outro';
}

/** Pratos que, na prática, são "o mesmo prato" compartilham família. */
const FAMILIAS_ESPECIAIS = [
  'almondega', 'strogonoff', 'estrogonofe', 'lasanha', 'feijoada', 'escondidinho',
  'parmegiana', 'panqueca', 'yakisoba', 'xadrez', 'curry', 'picadinho', 'moqueca',
  'kibe', 'hamburguer', 'nhoque', 'risoto', 'tropeiro', 'virado', 'cuscuz',
  'bobó', 'bobo', 'dobradinha', 'rabada', 'fricasse', 'torta', 'quiche',
  'bolinho', 'croquete', 'polpetone', 'feijoada',
];

/**
 * Família operacional do prato. "Almôndega ao molho" e "Almôndega acebolada"
 * caem na mesma família (almondega) e não devem coexistir na semana. Quando
 * não há família especial, a chave é proteína+técnica — assim "Frango
 * grelhado" e "Frango assado" são famílias diferentes, mas dois grelhados de
 * frango colidem.
 */
export function familiaDoPrato(prato: string | null | undefined): string {
  const n = normalizar(prato);
  if (!n) return '';
  for (const f of FAMILIAS_ESPECIAIS) if (n.includes(f)) return f;
  return `${proteinaDoPrato(prato)}:${tecnicaDoPrato(prato)}`;
}

/** Nota nutricional 0–100 do prato a partir da receita (penaliza excessos). */
export function notaNutricaoPrato(prato: string | null | undefined): number {
  const r = receitaDoPrato(prato);
  if (!r?.nutricao) return 60;
  const nu = r.nutricao;
  let s = 100;
  if (nu.kcal > 600) s -= 16;
  else if (nu.kcal > 500) s -= 8;
  if (nu.sodio > 900) s -= 20;
  else if (nu.sodio > 700) s -= 10;
  if (nu.gord > 28) s -= 14;
  else if (nu.gord > 20) s -= 6;
  if (nu.prot >= 30) s += 6;
  else if (nu.prot < 12) s -= 8;
  if (nu.fibra >= 5) s += 6;
  return Math.max(20, Math.min(100, s));
}

/* -------------------- sugestão automática de semana ------------------ */

function sortear<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

/** Aceitação mínima que a IA precisa para ponderar (nota média 0–5). */
export interface AceitacaoLeve {
  n: number;
  somaNotas: number;
  bom?: number;
  ruim?: number;
}

export interface OpcoesSugestao {
  /** Aceitação histórica por prato (normalizado) — pesa muito na decisão. */
  aceitacao?: Record<string, AceitacaoLeve>;
  /** Frequência de uso recente por prato (normalizado) — penaliza repetição. */
  frequencia?: Record<string, number>;
  /** Estoque disponível por item (normalizado) — leve bônus para o que já há. */
  estoque?: Record<string, number>;
  /** Modo criativo: prioriza combinações inéditas em vez de já aprovadas. */
  criativo?: boolean;
}

/* Principais aptos: têm receita completa e são adequados a refeitório. */
function principaisAptos(): string[] {
  return RECEITAS_POR_CATEGORIA.principal.filter((nome) => {
    const r = receitaDoPrato(nome);
    return !!r && r.adequacaoRefeitorio >= 60;
  });
}

/**
 * Monta uma semana equilibrando, NESTA ordem de prioridade:
 *  1. Viabilidade operacional (receita completa + rotação de proteínas)
 *  2. Aceitação do público (avaliações históricas)
 *  3. Diversidade (proteína, técnica e família sem repetição)
 *  4. Equilíbrio nutricional (nota dos macros)
 *  5. Estoque disponível
 *  6. Custo
 * Regras duras: suína ≤2, frango 3–4, sem proteína em dias seguidos, sem
 * repetir prato. Família repetida (ex.: duas almôndegas) é fortemente
 * penalizada. Busca aleatória — melhor de N tentativas.
 */
function montarSemana(
  pessoas: number[],
  precos: Record<string, number>,
  opts: OpcoesSugestao,
): DiaCardapio[] | null {
  const principais = principaisAptos();
  if (principais.length < 7) return null;
  const guarnicoes = RECEITAS_POR_CATEGORIA.guarnicao;
  const saladas = RECEITAS_POR_CATEGORIA.salada;
  const sobremesas = RECEITAS_POR_CATEGORIA.sobremesa;

  const temPrecos = Object.keys(precos).length > 3;
  const aceit = opts.aceitacao ?? {};
  const freq = opts.frequencia ?? {};
  const estoque = opts.estoque ?? {};

  const notaAceitacao = (nome: string): number => {
    const a = aceit[normalizar(nome)];
    return a && a.n > 0 ? a.somaNotas / a.n : 0; // 0–5
  };

  let melhor: DiaCardapio[] | null = null;
  let melhorNota = -Infinity;

  for (let tent = 0; tent < 400; tent++) {
    const poolP = sortear(principais);
    const dias: DiaCardapio[] = [];
    const usados = new Set<string>();
    let suina = 0;
    let frango = 0;
    let anterior: Proteina | null = null;
    let ok = true;

    for (let d = 0; d < 7; d++) {
      const faltam = 7 - d;
      const cand = poolP.find((p) => {
        const prot = proteinaDoPrato(p);
        if (usados.has(normalizar(p))) return false;
        if (prot === anterior && prot !== 'outros') return false;
        if (prot === 'suina' && suina >= 2) return false;
        if (prot === 'frango' && frango >= 4) return false;
        if (prot !== 'frango' && frango + faltam - 1 < 3) return false;
        return true;
      });
      if (!cand) {
        ok = false;
        break;
      }
      const prot = proteinaDoPrato(cand);
      if (prot === 'suina') suina++;
      if (prot === 'frango') frango++;
      anterior = prot;
      usados.add(normalizar(cand));
      dias.push({
        pessoas: pessoas[d] ?? DADOS.baseline,
        principal: cand,
        guarnicaoFixa: 'Arroz e Feijão',
        guarnicao: '',
        salada: '',
        sobremesa: '',
      });
      poolP.splice(poolP.indexOf(cand), 1);
    }
    if (!ok || frango < 3) continue;

    // acompanhamentos variados (sem repetir ao longo da semana)
    const pg = sortear(guarnicoes);
    const ps = sortear(saladas);
    const psb = sortear(sobremesas);
    dias.forEach((dia, d) => {
      dia.guarnicao = pg[d % Math.max(pg.length, 1)] ?? '';
      dia.salada = ps[d % Math.max(ps.length, 1)] ?? '';
      dia.sobremesa = psb[d % Math.max(psb.length, 1)] ?? '';
    });

    /* ---------- pontuação multi-critério (ordem de prioridade) ---------- */
    let nota = 0;

    // 2) Aceitação do público — peso dominante
    let somaAceit = 0;
    let comAceit = 0;
    dias.forEach((dia) => {
      const a = notaAceitacao(dia.principal);
      if (a > 0) {
        somaAceit += a;
        comAceit++;
      }
    });
    if (comAceit > 0) nota += (somaAceit / comAceit) * 40;

    // 3) Diversidade — proteínas e técnicas distintas; família repetida pune
    const tecnicas = dias.map((dia) => tecnicaDoPrato(dia.principal));
    const familias = dias.map((dia) => familiaDoPrato(dia.principal));
    const protsDistintas = new Set(dias.map((dia) => proteinaDoPrato(dia.principal))).size;
    const tecnicasDistintas = new Set(tecnicas).size;
    nota += protsDistintas * 6 + tecnicasDistintas * 6;
    // técnica repetida acima de 2× incomoda; família repetida é quase proibida
    const contTec: Record<string, number> = {};
    tecnicas.forEach((t) => (contTec[t] = (contTec[t] ?? 0) + 1));
    Object.values(contTec).forEach((c) => {
      if (c > 2) nota -= (c - 2) * 8;
    });
    const famDup = familias.length - new Set(familias).size;
    nota -= famDup * 25;
    // penaliza pratos repetidos nas últimas semanas (anti-monotonia)
    dias.forEach((dia) => {
      const f = freq[normalizar(dia.principal)] ?? 0;
      if (f > 0) nota -= f * 5;
    });

    // 4) Equilíbrio nutricional — média da nota de macros
    const mediaNutri =
      dias.reduce((a, dia) => a + notaNutricaoPrato(dia.principal), 0) / dias.length;
    nota += mediaNutri * 0.4;

    // 5) Estoque disponível — leve bônus para o que já temos
    if (Object.keys(estoque).length > 0) {
      dias.forEach((dia) => {
        const itens = listaDoDia(dia);
        const cobertos = itens.filter((s) => (estoque[normalizar(s.item)] ?? 0) > 0).length;
        nota += cobertos * 0.5;
      });
    }

    // 6) Custo — peso menor (não decide sozinho)
    if (temPrecos) {
      let custoPorPessoa = 0;
      dias.forEach((dia) => {
        const c = custoDaLista(listaDoDia(dia), precos);
        if (c.itensComPreco > 0) custoPorPessoa += c.total / Math.max(dia.pessoas, 1);
      });
      nota -= custoPorPessoa * 2;
    }

    // 7) Ajuste de modo — criativo busca o inédito; padrão valoriza o aprovado
    let novas = 0;
    dias.forEach((dia) => {
      if (temHistoricoExato(dia)) {
        if (!opts.criativo) nota += 1.5;
      } else {
        novas++;
      }
    });
    if (opts.criativo) nota += novas * 3;

    if (nota > melhorNota) {
      melhorNota = nota;
      melhor = dias;
    }
  }
  return melhor;
}

/**
 * Sugestão "aprovada": prioriza pratos com boa aceitação e já testados,
 * mantendo diversidade e equilíbrio nutricional.
 */
export function sugerirSemana(
  pessoas: number[],
  precos: Record<string, number>,
  opts: OpcoesSugestao = {},
): DiaCardapio[] | null {
  return montarSemana(pessoas, precos, { ...opts, criativo: false });
}

/**
 * Sugestão criativa: recombina a biblioteca de receitas priorizando
 * combinações inéditas, sem abrir mão da diversidade nem da nutrição.
 */
export function sugerirSemanaCriativa(
  pessoas: number[],
  precos: Record<string, number>,
  opts: OpcoesSugestao = {},
): DiaCardapio[] | null {
  return montarSemana(pessoas, precos, { ...opts, criativo: true });
}

/* ------------------------------ util --------------------------------- */

export function formatarQtd(qtd: number): string {
  return Number.isInteger(qtd) ? String(qtd) : qtd.toFixed(1).replace('.', ',');
}

export function formatarReais(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
