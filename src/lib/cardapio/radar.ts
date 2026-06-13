/* =====================================================================
   Módulo 5 — Radar inteligente de preços.
   Lê o histórico de preços por item e produz tendência, alertas de alta
   ou queda anormal, e sugestão de substituição quando uma proteína sobe.
   ===================================================================== */

import { DADOS, ROTULO_PROTEINA, normalizar, proteinaDoPrato } from './motor';
import type { HistoricoPrecos } from './tipos';

/** Variação a partir da qual o movimento é considerado anormal. */
export const LIMITE_ALERTA = 0.15;

export interface RadarItem {
  norm: string;
  item: string;
  unid: string;
  atual: number;
  anterior: number | null;
  variacao: number | null; // fração: +0.22 = +22%
  tendencia: 'subindo' | 'caindo' | 'estável';
  alerta: 'alta' | 'queda' | null;
  pontos: number;
  fornecedor?: string;
  substituir?: { item: string; preco: number; economia: number };
}

const unidadeDe = new Map<string, string>();
DADOS.itens.forEach((i) => unidadeDe.set(normalizar(i.n), i.u));

const nomeDe = new Map<string, string>();
DADOS.itens.forEach((i) => nomeDe.set(normalizar(i.n), i.n));

function media(ns: number[]): number {
  return ns.reduce((a, b) => a + b, 0) / Math.max(ns.length, 1);
}

/** Proteína mais barata disponível (com preço) diferente da atual. */
function proteinaMaisBarata(
  precos: Record<string, number>,
  excetoNorm: string,
): { item: string; preco: number } | null {
  let melhor: { item: string; preco: number } | null = null;
  for (const it of DADOS.itens) {
    if (it.u !== 'kg') continue;
    const k = normalizar(it.n);
    if (k === excetoNorm) continue;
    if (proteinaDoPrato(it.n) === 'outros') continue;
    const p = precos[k];
    if (!(p > 0)) continue;
    if (!melhor || p < melhor.preco) melhor = { item: it.n, preco: p };
  }
  return melhor;
}

export function analisarRadar(
  precos: Record<string, number>,
  historico: HistoricoPrecos,
  fornecedores: Record<string, string> = {},
): RadarItem[] {
  const itens: RadarItem[] = [];

  for (const [norm, serie] of Object.entries(historico)) {
    if (!serie || serie.length === 0) continue;
    const valores = serie.map((p) => p.valor);
    const atual = precos[norm] ?? valores[valores.length - 1];
    const anterior = valores.length >= 2 ? valores[valores.length - 2] : null;
    const variacao = anterior && anterior > 0 ? (atual - anterior) / anterior : null;

    const recentes = media(valores.slice(-2));
    const antigos = media(valores.slice(0, Math.max(1, valores.length - 2)));
    let tendencia: RadarItem['tendencia'] = 'estável';
    if (antigos > 0) {
      const d = (recentes - antigos) / antigos;
      tendencia = d > 0.04 ? 'subindo' : d < -0.04 ? 'caindo' : 'estável';
    }

    let alerta: RadarItem['alerta'] = null;
    if (variacao !== null) {
      if (variacao >= LIMITE_ALERTA) alerta = 'alta';
      else if (variacao <= -LIMITE_ALERTA) alerta = 'queda';
    }

    const item: RadarItem = {
      norm,
      item: nomeDe.get(norm) ?? norm,
      unid: unidadeDe.get(norm) ?? '',
      atual,
      anterior,
      variacao,
      tendencia,
      alerta,
      pontos: serie.length,
      fornecedor: fornecedores[norm],
    };

    // sugestão de substituição: proteína que subiu muito → alternativa barata
    if (alerta === 'alta' && proteinaDoPrato(item.item) !== 'outros') {
      const alt = proteinaMaisBarata(precos, norm);
      if (alt && alt.preco < atual) {
        item.substituir = { item: alt.item, preco: alt.preco, economia: atual - alt.preco };
      }
    }

    itens.push(item);
  }

  // alertas primeiro, depois maior variação absoluta
  return itens.sort((a, b) => {
    if (!!a.alerta !== !!b.alerta) return a.alerta ? -1 : 1;
    return Math.abs(b.variacao ?? 0) - Math.abs(a.variacao ?? 0);
  });
}

/** Frase pronta para um alerta (ex.: "Tomate subiu 22% desde a última cotação"). */
export function fraseAlerta(r: RadarItem): string {
  if (!r.alerta || r.variacao === null) return '';
  const pct = Math.round(Math.abs(r.variacao) * 100);
  if (r.alerta === 'alta') {
    let s = `${r.item} subiu ${pct}% desde a última cotação.`;
    if (r.substituir) {
      const prot = ROTULO_PROTEINA[proteinaDoPrato(r.substituir.item)];
      s += ` Considere ${r.substituir.item} (${prot}) — economia de R$ ${r.substituir.economia
        .toFixed(2)
        .replace('.', ',')}/${r.unid}.`;
    }
    return s;
  }
  return `${r.item} caiu ${pct}% — bom momento para reforçar o estoque.`;
}
