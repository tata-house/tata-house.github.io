/* =====================================================================
   Previsão evoluída de consumo — intervalos de confiança + ajuste por
   eventos + empurra as quantidades previstas para a lista de compras.

   Usa o histórico real de contagens de refeições (localStorage) para
   calcular mediana + desvio interquartil por dia da semana e retorna
   bandas de confiança: pessimista, esperado, otimista.
   ===================================================================== */

import { PESSOAS_PADRAO } from './motor';
import { mediana } from './memoria';
import type { EstadoSemana, EventoDemanda } from './tipos';

export interface BandaPrevisao {
  dia: number;
  data: Date;
  pessimista: number; // p25
  esperado: number; // mediana
  otimista: number; // p75
  confianca: number; // 0–1: quão confiável é a previsão (mais dados = mais alta)
  base: 'historico' | 'padrao';
  evento?: EventoDemanda;
}

export interface PrevisaoSemana {
  dias: BandaPrevisao[];
  totalEsperado: number;
  totalPessimista: number;
  totalOtimista: number;
  /** Semanas de histórico usadas na previsão. */
  baseSemanas: number;
}

/* ------------------------------------------------------------------ */

const MAX_CONFIANCA_N = 8; // com 8+ semanas, confiança = 1.0

function percentil(arr: number[], p: number): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const idx = (p / 100) * (s.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return lo === hi ? s[lo] : s[lo] + (s[hi] - s[lo]) * (idx - lo);
}

/**
 * Calcula as bandas de previsão por dia da semana a partir do histórico
 * real de contagens. Sem histórico, usa a curva padrão com banda ±20%.
 */
export function calcularPrevisaoSemana(
  semanaId: string,
  /** Histórico de contagens: histContagens[diaDaSemana] = array de qtds reais */
  histContagens: Partial<Record<number, number[]>>,
  eventos: EventoDemanda[],
  datas: Date[],
): PrevisaoSemana {
  const dias: BandaPrevisao[] = datas.map((data, dia) => {
    const hist = histContagens[dia] ?? [];
    const iso = data.toISOString().slice(0, 10);
    const evento = eventos.find((e) => e.data === iso);
    const fatorEvento = evento?.fator ?? 1;

    let pessimista: number;
    let esperado: number;
    let otimista: number;
    let base: BandaPrevisao['base'];
    let confianca: number;

    if (hist.length >= 2) {
      pessimista = Math.round(percentil(hist, 25) * fatorEvento);
      esperado = Math.round(mediana(hist) * fatorEvento);
      otimista = Math.round(percentil(hist, 75) * fatorEvento);
      confianca = Math.min(1, hist.length / MAX_CONFIANCA_N);
      base = 'historico';
    } else {
      const pad = PESSOAS_PADRAO[dia] ?? 65;
      // sem histórico: banda ±20% ao redor do padrão
      pessimista = Math.round(pad * 0.8 * fatorEvento);
      esperado = Math.round(pad * fatorEvento);
      otimista = Math.round(pad * 1.2 * fatorEvento);
      confianca = hist.length === 1 ? 0.3 : 0;
      base = 'padrao';
    }

    return { dia, data, pessimista, esperado, otimista, confianca, base, evento };
  });

  return {
    dias,
    totalEsperado: dias.reduce((a, d) => a + d.esperado, 0),
    totalPessimista: dias.reduce((a, d) => a + d.pessimista, 0),
    totalOtimista: dias.reduce((a, d) => a + d.otimista, 0),
    baseSemanas: Math.max(...Object.values(histContagens).map((a) => a?.length ?? 0), 0),
  };
}

/**
 * Extrai contagens históricas por dia da semana de todas as semanas salvas.
 * Retorna um mapa dia→array de quantidades reais observadas.
 */
export function extrairHistoricoContagens(
  semanas: { estado: EstadoSemana }[],
): Partial<Record<number, number[]>> {
  const acc: Record<number, number[]> = {};
  semanas.forEach(({ estado }) => {
    Object.entries(estado.refeicoes ?? {}).forEach(([diS, qtd]) => {
      if (!(qtd > 0)) return;
      const di = Number(diS);
      (acc[di] ??= []).push(qtd);
    });
  });
  return acc;
}

/**
 * Escala os itens de uma lista de compras de acordo com a previsão
 * evoluída: substitui `pessoas` por `esperado` (ou `otimista` para
 * planejar com folga) para cada dia.
 *
 * Retorna um mapa diaIdx → pessoas a usar no cálculo das quantidades.
 */
export function pessoasPorDia(
  previsao: PrevisaoSemana,
  modo: 'esperado' | 'otimista' | 'pessimista' = 'otimista',
): Record<number, number> {
  const mapa: Record<number, number> = {};
  previsao.dias.forEach((d) => {
    mapa[d.dia] = d[modo];
  });
  return mapa;
}
