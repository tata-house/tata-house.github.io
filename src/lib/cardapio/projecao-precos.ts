/* =====================================================================
   Projeção antecipada de preços — regressão linear simples sobre o
   histórico de cada item para prever variação nas próximas semanas.
   ===================================================================== */

import type { HistoricoPrecos } from './tipos';

/** Mínimo de pontos para calcular projeção confiável. */
const MIN_PONTOS = 3;

/** Alta projetada acima deste limiar dispara alerta antecipado. */
const LIMIAR_ALERTA_PCT = 0.08; // 8%

export interface ProjecaoPreco {
  norm: string;
  item: string;
  atual: number;
  /** Variação semanal média observada (fração: +0.03 = +3%/semana). */
  tendenciaSemanal: number;
  /** Preço projetado em 4 semanas. */
  projecao4s: number;
  /** Variação projetada em 4 semanas (fração). */
  projecao4sPct: number;
  /** Emite alerta antecipado se projeção > LIMIAR. */
  alertaAntecipado: boolean;
  /** Quantos pontos de histórico foram usados. */
  pontos: number;
  /** Confiança da projeção (0–1). */
  confianca: number;
}

/** Regressão linear mínimos quadrados: retorna slope e intercept. */
function regressaoLinear(ys: number[]): { slope: number; r2: number } {
  const n = ys.length;
  if (n < 2) return { slope: 0, r2: 0 };
  const xs = ys.map((_, i) => i);
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
  const sumX2 = xs.reduce((a, x) => a + x * x, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { slope: 0, r2: 0 };
  const slope = (n * sumXY - sumX * sumY) / denom;

  // R² para medir qualidade do ajuste
  const meanY = sumY / n;
  const ssTot = ys.reduce((a, y) => a + (y - meanY) ** 2, 0);
  const intercept = (sumY - slope * sumX) / n;
  const ssRes = ys.reduce((a, y, i) => a + (y - (intercept + slope * i)) ** 2, 0);
  const r2 = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;

  return { slope, r2 };
}

/**
 * Analisa o histórico e retorna projeções para itens com dados suficientes.
 * Ordenado por projeção de alta decrescente (maiores riscos primeiro).
 */
export function calcularProjecoes(
  precos: Record<string, number>,
  historico: HistoricoPrecos,
  nomesDe: Map<string, string>,
): ProjecaoPreco[] {
  const resultado: ProjecaoPreco[] = [];

  for (const [norm, serie] of Object.entries(historico)) {
    if (!serie || serie.length < MIN_PONTOS) continue;

    // usa preço atual como último ponto (pode ser mais recente que o histórico)
    const valores = serie.map((p) => p.valor);
    const atual = precos[norm] ?? valores[valores.length - 1];
    if (!(atual > 0)) continue;

    const { slope, r2 } = regressaoLinear(valores);

    // tendência semanal = slope relativo ao preço médio
    const mediaPreco = valores.reduce((a, b) => a + b, 0) / valores.length;
    const tendenciaSemanal = mediaPreco > 0 ? slope / mediaPreco : 0;

    const projecao4s = Math.max(0, atual + slope * 4);
    const projecao4sPct = atual > 0 ? (projecao4s - atual) / atual : 0;

    // confiança: aumenta com mais pontos e com R² mais alto
    const confianca = Math.min(1, (serie.length / 10) * 0.5 + r2 * 0.5);

    resultado.push({
      norm,
      item: nomesDe.get(norm) ?? norm,
      atual,
      tendenciaSemanal,
      projecao4s,
      projecao4sPct,
      alertaAntecipado: projecao4sPct >= LIMIAR_ALERTA_PCT && confianca >= 0.3,
      pontos: serie.length,
      confianca,
    });
  }

  return resultado.sort((a, b) => b.projecao4sPct - a.projecao4sPct);
}
