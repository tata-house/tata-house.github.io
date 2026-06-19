/* =====================================================================
   Baselines operacionais — faixas normais derivadas do histórico real
   do Tatá House. Usadas pela camada anti-erro para detectar discrepâncias
   antes de aprovar cardápio, compras ou cotação.
   ===================================================================== */

import { DADOS, normalizar, proteinaDoPrato } from './motor';
import type { Proteina } from './tipos';

export interface BaselineProteina {
  mediana: number; // kg/pessoa mediana histórica (ex: frango ≈ 0.30)
  p75: number;     // 75th percentile
  max: number;     // p90 — acima disso é provável erro de unidade
  n: number;
}

export interface BaselineCusto {
  mediana: number;    // R$/pessoa/dia normal
  alto: number;       // alerta (~140% mediana)
  muitoAlto: number;  // bloqueio (~250% mediana)
}

export interface Baselines {
  proteinas: Partial<Record<Proteina, BaselineProteina>>;
  custo: BaselineCusto;
  geradoEm: string;
}

function mediana(arr: number[]): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function percentil(arr: number[], p: number): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)];
}

/** Baselines de quantidade de proteína por pessoa, de 115 mapas reais. */
export function calcularBaselineProteinas(): Partial<Record<Proteina, BaselineProteina>> {
  const acc: Record<string, number[]> = {};
  DADOS.mapas
    .filter((m) => m.tipo === 'principal')
    .forEach((m) => {
      m.itens.forEach(({ i, q, u }) => {
        if (u === 'kg' && q > 0) {
          const prot = proteinaDoPrato(i);
          if (prot !== 'outros') {
            (acc[prot] ??= []).push(q / DADOS.baseline);
          }
        }
      });
    });

  const result: Partial<Record<Proteina, BaselineProteina>> = {};
  for (const [prot, qtds] of Object.entries(acc)) {
    if (qtds.length < 2) continue;
    result[prot as Proteina] = {
      mediana: Math.round(mediana(qtds) * 1000) / 1000,
      p75: Math.round(percentil(qtds, 75) * 1000) / 1000,
      max: Math.round(percentil(qtds, 90) * 1000) / 1000,
      n: qtds.length,
    };
  }
  return result;
}

/** Baselines prontas — derivadas dos 115 mapas históricos, sempre disponíveis. */
export const BASELINE_PROTEINAS = calcularBaselineProteinas();

/** Faixas de custo/pessoa padrão (refinadas em runtime quando há histórico). */
export const BASELINE_CUSTO_PADRAO: BaselineCusto = {
  mediana: 10,
  alto: 15,
  muitoAlto: 25,
};
