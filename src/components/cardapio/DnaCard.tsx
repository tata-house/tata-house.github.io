'use client';

/* =====================================================================
   Cartão de DNA Alimentar — exibe o perfil da casa cruzando
   3 anos de operação (dados.json) + semanas registradas no app
   + aceitação da equipe + desperdício.
   ===================================================================== */

import { Cartao } from '@/components/ui';
import { Icone } from '@/components/Icones';
import { useDna } from '@/lib/cardapio/estado';
import { TOTAL_DIAS_HISTORICO } from '@/lib/cardapio/dna';
import { DADOS } from '@/lib/cardapio/motor';
import type { DnaAlimentar } from '@/lib/cardapio/dna';
import type { Proteina } from '@/lib/cardapio/tipos';

const COR_PROTEINA: Record<Proteina, string> = {
  bovina: '#8a3b34',
  frango: '#b07c1e',
  suina: '#b05a7e',
  peixe: '#2d6f8e',
  ovo: '#c8a96b',
  outros: '#aab0b9',
};

/* ── Narrativa de descoberta ─────────────────────────────── */

interface Descoberta {
  conclusao: string;      // a frase de abertura — a leitura da casa
  insights: string[];     // observações de apoio
  recomendacao: string | null; // o que o gestor deveria fazer
}

function gerarDescoberta(dna: DnaAlimentar): Descoberta | null {
  const proteinas = dna.perfilProteinas.filter((p) => p.proteina !== 'outros');
  const top = proteinas[0];
  if (!top) return null;

  const melhorProt = [...proteinas]
    .filter((p) => p.notaMedia !== null)
    .sort((a, b) => (b.notaMedia ?? 0) - (a.notaMedia ?? 0))[0];

  // Conclusão de abertura — a casa em uma frase
  const conclusao = top.pct >= 40
    ? `A casa tem preferência clara por ${top.rotulo.toLowerCase()} — ${top.pct}% de todo o cardápio.`
    : `${top.rotulo} é a base do cardápio (${top.pct}%), com boa variedade entre as proteínas.`;

  const insights: string[] = [];

  // Campeão
  const campeaoComNota = dna.campeoes.find((c) => c.nota !== null && !c.porHistorico);
  if (campeaoComNota) {
    insights.push(`O campeão é "${campeaoComNota.prato}" — ${campeaoComNota.nota}★ e servido ${campeaoComNota.frequencia}× na operação.`);
  } else if (dna.campeoes.length > 0) {
    insights.push(`O prato mais servido da casa é "${dna.campeoes[0].prato}" — ${dna.campeoes[0].frequencia}× na operação.`);
  }

  // Proteína com pior aceitação (sinal de atenção)
  const piorProt = [...proteinas]
    .filter((p) => p.notaMedia !== null && p.freq >= 3)
    .sort((a, b) => (a.notaMedia ?? 5) - (b.notaMedia ?? 5))[0];
  if (piorProt && piorProt.notaMedia !== null && piorProt.notaMedia < 3.5 && piorProt.proteina !== melhorProt?.proteina) {
    insights.push(`${piorProt.rotulo} tem a menor aceitação (${piorProt.notaMedia}★) — apesar de ${piorProt.pct}% do cardápio.`);
  }

  // Problema com desperdício
  if (dna.problemas.length > 0 && dna.baseAvaliacoes >= 5) {
    const p = dna.problemas[0];
    const desp = p.desperdicio !== null ? ` e ${Math.round(p.desperdicio * 100)}% de sobra` : '';
    insights.push(`"${p.prato}" acumula nota ${p.nota ?? '—'}★${desp}.`);
  }

  // ── Recomendação: o que fazer com tudo isso ──
  let recomendacao: string | null = null;
  if (melhorProt && top.proteina !== melhorProt.proteina && melhorProt.notaMedia !== null) {
    recomendacao = `Dê mais espaço a ${melhorProt.rotulo.toLowerCase()} (${melhorProt.notaMedia}★, a melhor avaliada) nos dias de maior público — sem perder o ${top.rotulo.toLowerCase()} que a casa já gosta.`;
  } else if (dna.problemas.length > 0 && dna.baseAvaliacoes >= 5) {
    recomendacao = `Considere tirar "${dna.problemas[0].prato}" do rodízio ou reformular a receita — é o que mais pesa contra a operação.`;
  } else if (campeaoComNota) {
    recomendacao = `Mantenha "${campeaoComNota.prato}" frequente no cardápio — é aposta segura de aceitação.`;
  }

  return { conclusao, insights, recomendacao };
}

function NarrativaDescoberta({ dna }: { dna: DnaAlimentar }) {
  const d = gerarDescoberta(dna);
  if (!d) return null;
  return (
    <div className="border-b border-carvao-100 px-5 pb-4 pt-4 dark:border-carvao-800">
      {/* Frase principal — destaque visual */}
      <p className="text-base font-bold leading-snug text-carvao-900 dark:text-white">{d.conclusao}</p>

      {/* Insights como chips/cartões pequenos */}
      {d.insights.length > 0 && (
        <div className="mt-3 space-y-2">
          {d.insights.map((txt, i) => (
            <div key={i} className="rounded-xl bg-carvao-50 px-3 py-2 dark:bg-carvao-800/60">
              <p className="text-rotulo leading-snug text-carvao-700 dark:text-areia-200">{txt}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recomendação — bloco de ação destacado */}
      {d.recomendacao && (
        <div className="mt-3 rounded-2xl bg-brand-600 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-100/70">O que fazer agora</p>
          <p className="mt-1 text-sm font-semibold leading-snug text-white">{d.recomendacao}</p>
        </div>
      )}
    </div>
  );
}

/** Medalhão de posição — ouro/prata/bronze no top 3, número discreto no resto. */
function RankBadge({ pos }: { pos: number }) {
  const estilo =
    pos === 0
      ? 'bg-gradient-to-br from-ouro-300 to-ouro-500 text-white shadow-suave'
      : pos === 1
        ? 'bg-gradient-to-br from-carvao-200 to-carvao-400 text-white'
        : pos === 2
          ? 'bg-gradient-to-br from-[#c89466] to-[#a06a3a] text-white'
          : 'bg-carvao-100 text-carvao-400 dark:bg-carvao-700 dark:text-carvao-300';
  return (
    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-caption font-black tabular-nums ${estilo}`}>
      {pos + 1}
    </span>
  );
}

function notaTom(nota: number | null): string {
  if (nota === null) return 'text-carvao-400';
  if (nota >= 4) return 'text-brand-600 dark:text-brand-300';
  if (nota >= 3) return 'text-[#9a6c17] dark:text-[#e3b45c]';
  return 'text-perigo';
}

export function DnaCard() {
  const { dna, recalcular } = useDna();

  if (!dna) return null;

  const semBase = dna.baseSemanas === 0 && dna.totalDiasHistorico === 0;
  const maxFreq = Math.max(...dna.perfilProteinas.map((p) => p.freq), 1);
  const totalPratosUnicos = DADOS.listas.principais.length;

  return (
    <Cartao className="space-y-4 !p-0 overflow-hidden">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-br from-carvao-900 via-carvao-850 to-brand-900 px-5 py-4 text-white">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-caption font-extrabold uppercase tracking-[0.18em] text-brand-200">
            <Icone nome="gerencial" tam={14} /> DNA alimentar da casa
          </p>
          <button
            onClick={recalcular}
            className="rounded-full bg-white/10 px-2.5 py-1 text-caption font-bold text-white/90 transition hover:bg-white/20"
            title="Recalcular com os dados atuais"
          >
            <Icone nome="raio" tam={12} /> atualizar
          </button>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-areia-100/90">{dna.resumo}</p>

        {/* Stats históricos */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-caption text-brand-200/80">
          {dna.totalDiasHistorico > 0 && (
            <span>{dna.totalDiasHistorico} dias de operação</span>
          )}
          <span>{totalPratosUnicos} pratos únicos</span>
          {dna.baseSemanas > 0 && (
            <span>{dna.baseSemanas} semana{dna.baseSemanas > 1 ? 's' : ''} no app</span>
          )}
          {dna.baseAvaliacoes > 0 && (
            <span>{dna.baseAvaliacoes} avaliação{dna.baseAvaliacoes > 1 ? 'ões' : ''}</span>
          )}
          {dna.mediaPessoas !== null && (
            <span>média {dna.mediaPessoas} pax/dia</span>
          )}
        </div>
      </div>

      {semBase ? (
        <div className="px-5 pb-5">
          <p className="text-sm text-carvao-400">
            Sem histórico suficiente ainda. Conforme você montar cardápios e a equipe avaliar os pratos, o
            perfil da casa se forma sozinho aqui.
          </p>
        </div>
      ) : (
        <>
        <NarrativaDescoberta dna={dna} />
        <div className="space-y-5 px-5 pb-5">
          {/* Perfil de proteínas */}
          <div className="space-y-2">
            <p className="text-caption font-bold uppercase tracking-wider text-carvao-400">
              Perfil de proteínas — {TOTAL_DIAS_HISTORICO} dias
            </p>
            {dna.perfilProteinas
              .filter((p) => p.proteina !== 'outros')
              .map((p) => (
                <div key={p.proteina} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-xs font-semibold capitalize">{p.rotulo}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-carvao-100 dark:bg-carvao-700">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(p.freq / maxFreq) * 100}%`, backgroundColor: COR_PROTEINA[p.proteina] }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-xs font-bold tabular-nums text-carvao-500">{p.pct}%</span>
                  <span className="w-12 shrink-0 text-right text-xs tabular-nums text-carvao-400">{p.freq}×</span>
                  <span className={`w-12 shrink-0 text-right text-xs font-bold tabular-nums ${notaTom(p.notaMedia)}`}>
                    {p.notaMedia !== null ? `${p.notaMedia}★` : '—'}
                  </span>
                </div>
              ))}
          </div>

          {/* Mais servidos no histórico */}
          {dna.topPorFrequencia.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-caption font-bold uppercase tracking-wider text-carvao-400">
                Mais servidos no histórico
              </p>
              <div className="space-y-1">
                {dna.topPorFrequencia.map((p, i) => (
                  <div
                    key={p.prato}
                    className={`flex items-center gap-3 rounded-xl px-2.5 py-2 ${i < 3 ? 'bg-areia-50 dark:bg-carvao-800/60' : ''}`}
                  >
                    <RankBadge pos={i} />
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white dark:ring-carvao-850"
                      style={{ backgroundColor: COR_PROTEINA[p.proteina] }}
                    />
                    <span className="min-w-0 flex-1 truncate text-nota font-semibold text-carvao-800 dark:text-areia-100">
                      {p.prato}
                    </span>
                    <span className="shrink-0 text-caption font-semibold tabular-nums text-carvao-400">{p.frequencia}×</span>
                    {p.nota !== null && (
                      <span className={`shrink-0 text-caption font-bold tabular-nums ${notaTom(p.nota)}`}>
                        {p.nota}★
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campeões de qualidade */}
          {dna.campeoes.length > 0 && (
            <div className="space-y-2">
              <p className="text-caption font-bold uppercase tracking-wider text-brand-600 dark:text-brand-300">
                Campeões da casa
                {dna.baseAvaliacoes === 0 && (
                  <span className="ml-1 font-medium normal-case tracking-normal text-carvao-400">· por frequência</span>
                )}
              </p>
              <ul className="space-y-1">
                {dna.campeoes.map((c, i) => (
                  <li key={c.prato} className="flex items-center gap-2.5">
                    <span className="shrink-0 text-sm">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                    </span>
                    <span className="flex-1 text-sm font-semibold text-carvao-800 dark:text-areia-100">{c.prato}</span>
                    <span className="shrink-0 text-xs text-carvao-400">
                      {c.nota !== null ? `${c.nota}★` : `${c.frequencia}×`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pontos de atenção */}
          {dna.problemas.length > 0 && (
            <div className="space-y-2">
              <p className="text-caption font-bold uppercase tracking-wider text-perigo">Pontos de atenção</p>
              <div className="space-y-1.5">
                {dna.problemas.map((p) => (
                  <div
                    key={p.prato}
                    className="rounded-xl bg-perigo/5 px-3 py-2.5 ring-1 ring-perigo/15"
                  >
                    <p className="text-sm font-semibold text-carvao-800 dark:text-areia-100">{p.prato}</p>
                    <p className="mt-0.5 text-xs text-carvao-400">
                      {p.nota !== null ? `Nota ${p.nota} ` : ''}
                      {p.desperdicio !== null && p.desperdicio >= 0.1
                        ? `· ${Math.round(p.desperdicio * 100)}% de sobra — revise a quantidade`
                        : p.nota !== null
                        ? '— verifique preparo e temperatura'
                        : 'avalie com a equipe'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dna.baseAvaliacoes === 0 && (
            <p className="text-caption text-carvao-400">
              Os campeões acima vêm da frequência no histórico. Conforme a equipe avaliar os pratos, o ranking
              passa a considerar as notas e os pontos de atenção aparecem.
            </p>
          )}
        </div>
        </>
      )}
    </Cartao>
  );
}
