/* =====================================================================
   Motor do Cardápio da equipe — regras de negócio em cima do histórico
   (405 dias reais de pedidos: 2025 + Abril/Maio/Junho 2026)
   ===================================================================== */

import dadosJson from './dados.json';
import type {
  Aviso,
  DadosCardapio,
  DadosCombo,
  DiaCardapio,
  ItemSugerido,
  Proteina,
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

/**
 * Gera a lista sugerida do dia: combinação exata do histórico quando existe;
 * senão soma os mapas de cada componente. Escala pela curva de pessoas.
 */
export function listaDoDia(dia: DiaCardapio): ItemSugerido[] {
  const fator = dia.pessoas > 0 ? dia.pessoas / DADOS.baseline : 1;
  const acc = new Map<string, { item: string; unid: string; qtd: number }>();

  const adiciona = (nome: string, q: number, u: string | null) => {
    const k = normalizar(nome);
    if (!k || excluidos.has(k)) return;
    const unid = u || unidadePadrao.get(k) || 'un';
    const atual = acc.get(k);
    if (atual) atual.qtd = Math.max(atual.qtd, q);
    else acc.set(k, { item: nome, unid, qtd: q });
  };

  const combo = porChave.get(normalizar(chaveDoDia(dia)));
  if (combo) {
    combo.itens.forEach(({ i, q, u }) => adiciona(i, q, u));
  } else {
    for (const [tipo, campo] of TIPOS) {
      const opcao = dia[campo];
      if (!opcao || typeof opcao !== 'string') continue;
      const itens = porTipoOpcao.get(`${tipo}|${normalizar(opcao)}`);
      itens?.forEach(({ i, q, u }) => adiciona(i, q, u));
    }
  }

  return Array.from(acc.values())
    .map(({ item, unid, qtd }) => ({ item, unid, qtd: arredondar(qtd * fator, unid) }))
    .filter((x) => x.qtd > 0)
    .sort((a, b) => a.item.localeCompare(b.item, 'pt-BR'));
}

/** O dia tem registro exato no histórico? (qualidade da sugestão) */
export function temHistoricoExato(dia: DiaCardapio): boolean {
  return porChave.has(normalizar(chaveDoDia(dia)));
}

/* ----------------------- custo estimado ------------------------------ */

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
  itens.forEach(({ item, qtd }) => {
    const p = precos[normalizar(item)];
    if (p !== undefined && p > 0) {
      total += p * qtd;
      com++;
    }
  });
  return { total, itensComPreco: com, itensTotal: itens.length };
}

/* -------------------- sugestão automática de semana ------------------ */

/** Combos do histórico bons para sugestão (cardápio completo). */
const COMBOS_COMPLETOS = DADOS.combos.filter((c) => c.p && c.gf && c.s && c.sb);

function comboParaDia(c: DadosCombo, pessoas: number): DiaCardapio {
  return {
    pessoas,
    principal: c.p ?? '',
    guarnicaoFixa: c.gf ?? '',
    guarnicao: c.g ?? '',
    salada: c.s ?? '',
    sobremesa: c.sb ?? '',
  };
}

/**
 * Monta uma semana a partir do histórico real respeitando a rotação de
 * proteínas (suína ≤2, frango 3–4, sem repetir proteína em dias seguidos,
 * sem repetir prato). Busca aleatória com pontuação — melhor de N tentativas.
 */
export function sugerirSemana(pessoas: number[], precos: Record<string, number>): DiaCardapio[] | null {
  if (COMBOS_COMPLETOS.length < 7) return null;
  const temPrecos = Object.keys(precos).length > 3;

  let melhor: DiaCardapio[] | null = null;
  let melhorNota = -Infinity;

  for (let tent = 0; tent < 220; tent++) {
    const pool = [...COMBOS_COMPLETOS].sort(() => Math.random() - 0.5);
    const dias: DiaCardapio[] = [];
    const usados = new Set<string>();
    let suina = 0;
    let frango = 0;
    let anterior: Proteina | null = null;
    let ok = true;

    for (let d = 0; d < 7; d++) {
      const faltam = 7 - d;
      const cand = pool.find((c) => {
        const prot = proteinaDoPrato(c.p);
        if (usados.has(normalizar(c.p ?? ''))) return false;
        if (prot === anterior && prot !== 'outros') return false;
        if (prot === 'suina' && suina >= 2) return false;
        if (prot === 'frango' && frango >= 4) return false;
        // garante espaço para fechar frango 3×
        if (prot !== 'frango' && frango + faltam - 1 < 3) return false;
        return true;
      });
      if (!cand) {
        ok = false;
        break;
      }
      const prot = proteinaDoPrato(cand.p);
      if (prot === 'suina') suina++;
      if (prot === 'frango') frango++;
      anterior = prot;
      usados.add(normalizar(cand.p ?? ''));
      dias.push(comboParaDia(cand, pessoas[d] ?? DADOS.baseline));
      pool.splice(pool.indexOf(cand), 1);
    }
    if (!ok || frango < 3) continue;

    let nota = 0;
    dias.forEach((dia, d) => {
      const lista = listaDoDia(dia);
      if (temPrecos) {
        const c = custoDaLista(lista, precos);
        // custo por pessoa: quanto menor, melhor (peso principal)
        if (c.itensComPreco > 0) nota -= (c.total / Math.max(dia.pessoas, 1)) * 10;
      }
      // confiabilidade: combos mais usados no histórico pontuam mais
      const combo = porChave.get(normalizar(chaveDoDia(dia)));
      nota += Math.min(combo?.occ ?? 0, 5);
      void d;
    });
    if (nota > melhorNota) {
      melhorNota = nota;
      melhor = dias;
    }
  }
  return melhor;
}

/* ------------------------------ util --------------------------------- */

export function formatarQtd(qtd: number): string {
  return Number.isInteger(qtd) ? String(qtd) : qtd.toFixed(1).replace('.', ',');
}

export function formatarReais(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
