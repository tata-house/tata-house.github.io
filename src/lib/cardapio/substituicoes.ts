/* =====================================================================
   Inteligência de substituição — captura, detecta e aprende quais
   pratos funcionam bem como substitutos de outros.

   Fluxo:
     1. Ao concluir uma semana, detectarSubstituicoesSemana() compara
        o cardápio atual com a semana anterior no mesmo dia da semana.
        Prato diferente → substitution candidato.
     2. O resultado pode ser enriquecido com a aceitação e desperdício
        real do substituto nessa semana (via enriquecerComResultados).
     3. consolidarAprendizado() agrega todos os registros e retorna
        as substituições mais confiáveis por prato original.
   ===================================================================== */

import { normalizar } from './motor';
import { mediana } from './memoria';
import type {
  Aceitacao,
  EstadoSemana,
  RegistroDesperdicio,
  SubstituicaoAprendida,
  SubstituicaoRegistro,
} from './tipos';

/* ------------------------------------------------------------------ */
/* Detecção automática                                                  */
/* ------------------------------------------------------------------ */

/**
 * Compara o cardápio desta semana com a semana imediatamente anterior
 * (mesma posição de dia). Retorna os pares (original, substituto) detectados.
 * Filtra dias sem prato em ambas as semanas.
 */
export function detectarSubstituicoesSemana(
  semanaAtual: { semanaId: string; estado: EstadoSemana },
  semanaAnterior: { semanaId: string; estado: EstadoSemana } | null,
): Omit<SubstituicaoRegistro, 'id' | 'motivo' | 'registradoEm' | 'aceitacaoSubstituto' | 'desperdicioSubstituto'>[] {
  if (!semanaAnterior) return [];

  const resultado: Omit<SubstituicaoRegistro, 'id' | 'motivo' | 'registradoEm' | 'aceitacaoSubstituto' | 'desperdicioSubstituto'>[] = [];

  for (let di = 0; di < 5; di++) {
    const pratoAtual = semanaAtual.estado.dias[di]?.principal ?? '';
    const pratoAnterior = semanaAnterior.estado.dias[di]?.principal ?? '';

    if (!pratoAtual || !pratoAnterior) continue;

    const normAtual = normalizar(pratoAtual);
    const normAnterior = normalizar(pratoAnterior);

    if (normAtual === normAnterior) continue; // mesmo prato = sem substituição

    resultado.push({
      semanaId: semanaAtual.semanaId,
      dia: di,
      nomeOriginal: pratoAnterior,
      nomeSubstituto: pratoAtual,
      normOriginal: normAnterior,
      normSubstituto: normAtual,
    });
  }

  return resultado;
}

/* ------------------------------------------------------------------ */
/* Enriquecimento com resultados reais                                  */
/* ------------------------------------------------------------------ */

/**
 * Preenche aceitacaoSubstituto e desperdicioSubstituto nos registros
 * detectados, usando os dados reais de aceitação e desperdício da semana
 * em que o substituto foi servido.
 */
export function enriquecerComResultados(
  registros: SubstituicaoRegistro[],
  aceitacao: Aceitacao,
  desps: RegistroDesperdicio[],
): SubstituicaoRegistro[] {
  // pré-computa aceitação por prato
  const acMap: Record<string, number> = {};
  for (const [norm, r] of Object.entries(aceitacao)) {
    if (r.n > 0) acMap[norm] = r.somaNotas / r.n;
  }

  // pré-computa desperdício médio por prato
  const despMap: Record<string, number[]> = {};
  for (const r of desps) {
    if (r.produzido <= 0) continue;
    const k = normalizar(r.prato);
    const taxa = Math.max(0, r.produzido - r.consumido) / r.produzido;
    despMap[k] = [...(despMap[k] ?? []), taxa];
  }

  return registros.map((r) => ({
    ...r,
    aceitacaoSubstituto: acMap[r.normSubstituto],
    desperdicioSubstituto: despMap[r.normSubstituto]
      ? mediana(despMap[r.normSubstituto])
      : undefined,
  }));
}

/* ------------------------------------------------------------------ */
/* Consolidação e aprendizado                                           */
/* ------------------------------------------------------------------ */

/**
 * Agrega todos os registros de substituição em pares (original → substituto)
 * e calcula médias de aceitação e desperdício. Retorna apenas pares com
 * pelo menos `minN` registros (padrão: 2).
 */
export function consolidarAprendizado(
  registros: SubstituicaoRegistro[],
  minN = 2,
): SubstituicaoAprendida[] {
  const map = new Map<string, {
    normOriginal: string;
    normSubstituto: string;
    nomeOriginal: string;
    nomeSubstituto: string;
    aceitacoes: number[];
    desperdicios: number[];
    n: number;
  }>();

  for (const r of registros) {
    const chave = `${r.normOriginal}→${r.normSubstituto}`;
    const prev = map.get(chave) ?? {
      normOriginal: r.normOriginal,
      normSubstituto: r.normSubstituto,
      nomeOriginal: r.nomeOriginal,
      nomeSubstituto: r.nomeSubstituto,
      aceitacoes: [],
      desperdicios: [],
      n: 0,
    };
    if (r.aceitacaoSubstituto != null) prev.aceitacoes.push(r.aceitacaoSubstituto);
    if (r.desperdicioSubstituto != null) prev.desperdicios.push(r.desperdicioSubstituto);
    prev.n++;
    map.set(chave, prev);
  }

  return Array.from(map.values())
    .filter((e) => e.n >= minN)
    .map((e) => ({
      normOriginal: e.normOriginal,
      normSubstituto: e.normSubstituto,
      nomeOriginal: e.nomeOriginal,
      nomeSubstituto: e.nomeSubstituto,
      n: e.n,
      aceitacaoMedia: e.aceitacoes.length >= 2 ? mediana(e.aceitacoes) : e.aceitacoes[0] ?? null,
      desperdicioMedio: e.desperdicios.length >= 2 ? mediana(e.desperdicios) : e.desperdicios[0] ?? null,
      confianca: e.n >= 4 ? 'alta' : e.n >= 2 ? 'media' : 'baixa',
    } satisfies SubstituicaoAprendida))
    .sort((a, b) => b.n - a.n);
}

/* ------------------------------------------------------------------ */
/* Sugestão de substituto                                               */
/* ------------------------------------------------------------------ */

/**
 * Dado um prato que está com problema (caro, indisponível, baixa aceitação),
 * retorna os melhores substitutos já testados por esta operação,
 * ordenados por aceitação (desc) e confiança.
 */
export function sugerirSubstitutos(
  normOriginal: string,
  aprendizado: SubstituicaoAprendida[],
): SubstituicaoAprendida[] {
  return aprendizado
    .filter((a) => a.normOriginal === normOriginal)
    .sort((a, b) => {
      // prioriza: alta confiança → melhor aceitação → menos desperdício
      const confOrdem = { alta: 0, media: 1, baixa: 2 };
      if (confOrdem[a.confianca] !== confOrdem[b.confianca])
        return confOrdem[a.confianca] - confOrdem[b.confianca];
      const ac = (b.aceitacaoMedia ?? 0) - (a.aceitacaoMedia ?? 0);
      if (ac !== 0) return ac;
      return (a.desperdicioMedio ?? 1) - (b.desperdicioMedio ?? 1);
    });
}
