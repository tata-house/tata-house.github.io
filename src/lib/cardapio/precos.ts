/* =====================================================================
   Núcleo de preços — três estados claros: real, estimado e sem preço.
   - real:     veio da cotação, nota fiscal, fornecedor ou manual confirmado.
   - estimado: média de mercado interna (histórico) — base pronta para IA.
   - sem:      sem cotação e sem estimativa → exige revisão antes de fechar.
   Funções puras, sem efeitos; a camada de UI só consome o resultado.
   ===================================================================== */

import { DADOS, normalizar, converterParaUnidadeBase } from './motor';
import { PRECOS_COMPRAS, UNIDADES_COMPRAS } from './precos-compras';
import type { HistoricoPrecos } from './tipos';

export type TipoPreco = 'real' | 'estimado' | 'sem';

export interface PrecoResolvido {
  valor: number;
  tipo: TipoPreco;
}

const unidadeDe = new Map<string, string>();
DADOS.itens.forEach((i) => unidadeDe.set(normalizar(i.n), i.u));

function media(ns: number[]): number {
  return ns.reduce((a, b) => a + b, 0) / Math.max(ns.length, 1);
}

/** Resolve o preço de um item priorizando o real; depois o estimado; senão "sem". */
export function resolverPreco(
  norm: string,
  precos: Record<string, number>,
  estimativas: Record<string, number> = {},
): PrecoResolvido {
  const real = precos[norm];
  if (real > 0) return { valor: real, tipo: 'real' };
  const est = estimativas[norm];
  if (est > 0) return { valor: est, tipo: 'estimado' };
  return { valor: 0, tipo: 'sem' };
}

/** Normaliza unidades para comparação: g/kg→kg, ml/l→l, resto→un. */
function unidadeBase(u: string): string {
  const s = u.toLowerCase();
  if (s === 'g' || s === 'kg') return 'kg';
  if (s === 'ml' || s === 'l') return 'l';
  return 'un';
}

/**
 * Estimativa de mercado interna — três camadas, da mais para a menos precisa:
 * 1. Histórico local registrado pelo usuário (entradas manuais anteriores).
 * 2. Média dos preços reais das planilhas de compras (Maio+Junho/2026) de
 *    itens com a mesma unidade — base muito mais realista que a heurística
 *    anterior.
 * 3. Média dos preços manuais de DADOS.itens com mesma unidade (fallback).
 */
export function estimarPreco(
  norm: string,
  precos: Record<string, number>,
  historico: HistoricoPrecos,
): number | null {
  // 1. Histórico de preços registrado manualmente
  const serie = historico[norm];
  if (serie && serie.length) return Math.round(media(serie.map((p) => p.valor)) * 100) / 100;

  // 2 + 3. Média por unidade combinando planilhas reais + preços manuais
  const u = unidadeDe.get(norm);
  if (u) {
    const ub = unidadeBase(u);

    // Preços reais das planilhas de compras (mais confiáveis)
    const dasCompras = Object.entries(PRECOS_COMPRAS)
      .filter(([k, v]) => v > 0 && unidadeBase(UNIDADES_COMPRAS[k] ?? '') === ub)
      .map(([, v]) => v);

    // Preços manuais informados para itens de DADOS com mesma unidade
    const dosDados = DADOS.itens
      .filter((it) => unidadeBase(it.u) === ub && precos[normalizar(it.n)] > 0)
      .map((it) => precos[normalizar(it.n)]);

    const setTodos = new Set([...dasCompras, ...dosDados]);
    const todos = Array.from(setTodos);
    if (todos.length >= 2) return Math.round(media(todos) * 100) / 100;
    if (todos.length === 1) return Math.round(todos[0] * 100) / 100;
  }
  return null;
}

/**
 * Estimativa por IA/API externa — seam para a fase futura. Hoje retorna null
 * (cai na estimativa interna); quando houver chave/endpoint, é só implementar
 * aqui sem mudar quem consome.
 */
export async function estimarPrecoIA(_norm: string): Promise<number | null> {
  void _norm;
  return null;
}

export interface CustoTipado {
  total: number; // real + estimado
  real: number;
  estimado: number;
  itensReais: number;
  itensEstimados: number;
  itensSemPreco: number;
  semPreco: string[]; // norms sem preço (real nem estimado)
}

/**
 * Soma o custo separando real, estimado e sem preço.
 * Aceita `unid` opcionalmente — quando presente, converte g→kg e ml→lt
 * antes de multiplicar pelo preço (que é sempre armazenado por kg ou lt).
 */
export function custoTipado(
  itens: { norm: string; qtd: number; unid?: string }[],
  precos: Record<string, number>,
  estimativas: Record<string, number> = {},
): CustoTipado {
  const c: CustoTipado = {
    total: 0,
    real: 0,
    estimado: 0,
    itensReais: 0,
    itensEstimados: 0,
    itensSemPreco: 0,
    semPreco: [],
  };
  itens.forEach(({ norm, qtd, unid }) => {
    const qtdBase = unid ? converterParaUnidadeBase(qtd, unid) : qtd;
    const r = resolverPreco(norm, precos, estimativas);
    if (r.tipo === 'real') {
      c.real += r.valor * qtdBase;
      c.itensReais++;
    } else if (r.tipo === 'estimado') {
      c.estimado += r.valor * qtdBase;
      c.itensEstimados++;
    } else {
      c.itensSemPreco++;
      c.semPreco.push(norm);
    }
  });
  c.total = c.real + c.estimado;
  return c;
}

export const ROTULO_TIPO_PRECO: Record<TipoPreco, string> = {
  real: 'real',
  estimado: 'estimado',
  sem: 'sem preço',
};
