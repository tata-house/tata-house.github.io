/* =====================================================================
   Rastreamento de ações e resultados — fecha o loop de recomendação.

   Fluxo:
     1. Gestor seleciona um objetivo em InteligenciaCard e clica
        "Vou fazer isso" numa ação → cria AcaoComprometida com o valor
        atual da métrica como baseline (valorAntes).
     2. Na semana seguinte, ao carregar InteligenciaCard, o hook chama
        medirResultadoAcao() para as ações sem resultado da semana passada.
     3. O delta é calculado e salvo em AcaoComprometida.resultado.
     4. A InteligenciaCard mostra badges de resultado ao lado das ações.

   Métricas suportadas:
     custo_pp         → dossie.custoPP (menor = melhor)
     desperdicio_pct  → média de dossie.maisDesperdicio[].taxaMedia (menor = melhor)
     aceitacao_media  → média de dossie.melhoresAceitacao[].media (maior = melhor)
   ===================================================================== */

import type { AcaoComprometida, MetricaRastreada, ResultadoAcao } from './tipos';
import type { DossieIA } from './dossie';

/* ------------------------------------------------------------------ */
/* Extração de métrica do dossiê                                        */
/* ------------------------------------------------------------------ */

export function extrairMetrica(metrica: MetricaRastreada, dossie: DossieIA): number | null {
  switch (metrica) {
    case 'custo_pp':
      return dossie.custoPP;
    case 'desperdicio_pct': {
      const d = dossie.maisDesperdicio;
      if (!d.length) return null;
      return d.reduce((s, r) => s + r.taxaMedia, 0) / d.length;
    }
    case 'aceitacao_media': {
      const a = [...dossie.melhoresAceitacao, ...dossie.pioresAceitacao];
      if (!a.length) return null;
      return a.reduce((s, r) => s + r.media, 0) / a.length;
    }
  }
}

/* ------------------------------------------------------------------ */
/* Cálculo do resultado                                                  */
/* ------------------------------------------------------------------ */

function avaliar(metrica: MetricaRastreada, delta: number): ResultadoAcao['avaliacao'] {
  const limiar = 0.05; // 5% de variação é ruído
  if (Math.abs(delta) < limiar * Math.abs(delta + 1 || 1)) return 'igual';
  switch (metrica) {
    case 'custo_pp':
    case 'desperdicio_pct':
      // menor = melhor
      return delta < -limiar ? 'melhorou' : 'piorou';
    case 'aceitacao_media':
      // maior = melhor
      return delta > limiar ? 'melhorou' : 'piorou';
  }
}

/**
 * Mede o resultado de uma ação comprometida comparando o valor atual
 * da métrica com o baseline registrado. Retorna null se não há dados.
 */
export function medirResultadoAcao(
  acao: AcaoComprometida,
  semanaAtual: string,
  dossieAtual: DossieIA,
): ResultadoAcao | null {
  if (acao.resultado) return acao.resultado; // já medido
  if (acao.semanaId >= semanaAtual) return null; // ainda na mesma semana

  const valorDepois = extrairMetrica(acao.metrica, dossieAtual);
  if (valorDepois === null) return null;

  const delta = valorDepois - acao.valorAntes;

  return {
    semanaId: semanaAtual,
    valorDepois,
    delta,
    avaliacao: avaliar(acao.metrica, delta),
    avaliadoEm: new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/* Helpers de UI                                                         */
/* ------------------------------------------------------------------ */

/** Ações comprometidas em semanas anteriores ainda sem resultado. */
export function acoesParaMedir(
  acoes: AcaoComprometida[],
  semanaAtual: string,
): AcaoComprometida[] {
  return acoes.filter((a) => a.semanaId < semanaAtual && !a.resultado);
}

/** Ações desta semana (ainda ativas, sem resultado). */
export function acoesAtivasSemana(
  acoes: AcaoComprometida[],
  semanaId: string,
): AcaoComprometida[] {
  return acoes.filter((a) => a.semanaId === semanaId && !a.resultado);
}

export function rotuloMetrica(metrica: MetricaRastreada): string {
  switch (metrica) {
    case 'custo_pp': return 'custo/pessoa';
    case 'desperdicio_pct': return 'desperdício';
    case 'aceitacao_media': return 'aceitação';
  }
}

export function rotuloResultado(resultado: ResultadoAcao, metrica: MetricaRastreada): string {
  const emoji = resultado.avaliacao === 'melhorou' ? '✅' : resultado.avaliacao === 'piorou' ? '⚠️' : '➡️';
  const delta = Math.abs(resultado.delta);
  const fmt = metrica === 'custo_pp'
    ? `R$ ${delta.toFixed(2)}`
    : metrica === 'desperdicio_pct' || metrica === 'aceitacao_media'
    ? `${(delta * (metrica === 'aceitacao_media' ? 1 : 100)).toFixed(1)}${metrica === 'aceitacao_media' ? '★' : '%'}`
    : '';
  const dir = resultado.avaliacao === 'melhorou' ? '↓' : resultado.avaliacao === 'piorou' ? '↑' : '→';
  return `${emoji} ${dir}${fmt} no ${rotuloMetrica(metrica)}`;
}

/** Métrica mais relevante para um tipo de objetivo. */
export function metricaParaObjetivo(tipoObjetivo: string): MetricaRastreada {
  switch (tipoObjetivo) {
    case 'reduzir_custo': return 'custo_pp';
    case 'reduzir_desperdicio': return 'desperdicio_pct';
    case 'melhorar_aceitacao': return 'aceitacao_media';
    default: return 'custo_pp';
  }
}
