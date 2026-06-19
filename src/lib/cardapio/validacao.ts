/* =====================================================================
   Camada anti-erro humano — compara operações com o histórico do Tatá
   House antes de aprovar. Dois níveis:
     alerta   → passa com confirmação explícita do usuário
     bloqueio → não avança sem correção
   Tudo determinístico (sem IA). O LLM só escreve a frase explicativa.
   ===================================================================== */

import { normalizar, proteinaDoPrato } from './motor';
import { BASELINE_PROTEINAS, BASELINE_CUSTO_PADRAO, type BaselineCusto } from './baselines';

export type NivelValidacao = 'ok' | 'alerta' | 'bloqueio';

export interface ResultadoValidacao {
  nivel: NivelValidacao;
  codigo: string;      // chave única para deduplicar e fazer snooze
  msg: string;
  detalhe?: string;
  impactoReais?: number; // R$ estimado quando aplicável
}

/** Valida quantidade de proteína/kg por pessoa vs. mediana histórica. */
export function validarQuantidadeProteina(
  item: string,
  qtd: number,
  unid: string,
  pessoas: number,
): ResultadoValidacao | null {
  if (unid !== 'kg') return null;
  const prot = proteinaDoPrato(item);
  if (prot === 'outros') return null;

  const b = BASELINE_PROTEINAS[prot];
  if (!b) return null;

  const pp = qtd / Math.max(pessoas, 1);

  if (pp > b.max * 3) {
    return {
      nivel: 'bloqueio',
      codigo: `prot-excesso-${normalizar(item)}`,
      msg: `${item}: ${pp.toFixed(2)} kg/pessoa — ${Math.round(pp / b.mediana)}× acima do normal.`,
      detalhe: `Histórico Tatá House: mediana ${b.mediana.toFixed(2)} kg/pessoa, máx. ${b.max.toFixed(2)} kg/pessoa. Verifique se unidade ou quantidade estão corretos.`,
    };
  }
  if (pp > b.max * 1.5) {
    return {
      nivel: 'alerta',
      codigo: `prot-alto-${normalizar(item)}`,
      msg: `${item}: ${pp.toFixed(2)} kg/pessoa — acima do padrão histórico (máx. ${b.max.toFixed(2)} kg/pessoa).`,
    };
  }
  return null;
}

/** Valida custo/pessoa/dia vs. faixas normais. */
export function validarCustoPorPessoa(
  custoPP: number,
  contexto: string,
  baseline: BaselineCusto = BASELINE_CUSTO_PADRAO,
): ResultadoValidacao | null {
  if (custoPP >= baseline.muitoAlto) {
    return {
      nivel: 'bloqueio',
      codigo: `custo-muitoalto-${normalizar(contexto)}`,
      msg: `${contexto}: R$${custoPP.toFixed(0)}/pessoa — ${Math.round(custoPP / baseline.mediana)}× acima do normal.`,
      detalhe: `Custo normal do Tatá House: R$${baseline.mediana.toFixed(0)}/pessoa. Verifique unidades ou ingredientes duplicados na lista.`,
    };
  }
  if (custoPP >= baseline.alto) {
    return {
      nivel: 'alerta',
      codigo: `custo-alto-${normalizar(contexto)}`,
      msg: `${contexto}: R$${custoPP.toFixed(0)}/pessoa — ${Math.round((custoPP / baseline.mediana - 1) * 100)}% acima da média.`,
      impactoReais: Math.round((custoPP - baseline.mediana) * 65 * 7),
    };
  }
  return null;
}

/** Valida se um preço novo está dentro da faixa histórica do item. */
export function validarPrecoItem(
  norm: string,
  item: string,
  precoNovo: number,
  historico: { valor: number; em: string }[],
): ResultadoValidacao | null {
  if (historico.length < 2 || !(precoNovo > 0)) return null;

  const valores = historico.map((p) => p.valor);
  const media = valores.reduce((a, b) => a + b, 0) / valores.length;
  const desvio = Math.sqrt(valores.reduce((a, b) => a + (b - media) ** 2, 0) / valores.length);
  const teto = media + Math.max(media * 0.5, 3 * desvio);
  const piso = Math.max(0.01, media - Math.max(media * 0.4, 2 * desvio));

  if (precoNovo > teto) {
    return {
      nivel: 'alerta',
      codigo: `preco-alto-${norm}`,
      msg: `${item}: R$${precoNovo.toFixed(2)} está ${Math.round((precoNovo / media - 1) * 100)}% acima da média histórica (R$${media.toFixed(2)}).`,
      detalhe: 'Confirme se o preço está correto antes de salvar.',
    };
  }
  if (precoNovo < piso) {
    return {
      nivel: 'alerta',
      codigo: `preco-baixo-${norm}`,
      msg: `${item}: R$${precoNovo.toFixed(2)} está muito abaixo da média histórica (R$${media.toFixed(2)}). Possível erro de digitação.`,
    };
  }
  return null;
}

/** Detecta itens duplicados na lista de compras. */
export function validarDuplicatas(
  itens: { item: string; qtd: number; unid: string }[],
): ResultadoValidacao[] {
  const contagem = new Map<string, { item: string; n: number }>();
  itens.forEach(({ item }) => {
    const k = normalizar(item);
    const prev = contagem.get(k) ?? { item, n: 0 };
    contagem.set(k, { ...prev, n: prev.n + 1 });
  });
  return Array.from(contagem.values())
    .filter((v) => v.n > 1)
    .map((v) => ({
      nivel: 'bloqueio' as NivelValidacao,
      codigo: `dup-${normalizar(v.item)}`,
      msg: `"${v.item}" aparece ${v.n}× na lista — remova o item duplicado.`,
    }));
}

/** Agrega todos os resultados: mais grave primeiro, remove nulos. */
export function agruparResultados(
  resultados: (ResultadoValidacao | null)[],
): ResultadoValidacao[] {
  const ordem: Record<NivelValidacao, number> = { bloqueio: 0, alerta: 1, ok: 2 };
  return resultados
    .filter((r): r is ResultadoValidacao => r !== null)
    .sort((a, b) => ordem[a.nivel] - ordem[b.nivel]);
}

/** Nível geral da lista (o mais grave). */
export function nivelGeral(resultados: ResultadoValidacao[]): NivelValidacao {
  if (resultados.some((r) => r.nivel === 'bloqueio')) return 'bloqueio';
  if (resultados.some((r) => r.nivel === 'alerta')) return 'alerta';
  return 'ok';
}
