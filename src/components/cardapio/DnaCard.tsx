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
import type { Proteina } from '@/lib/cardapio/tipos';

const COR_PROTEINA: Record<Proteina, string> = {
  bovina: '#8a3b34',
  frango: '#b07c1e',
  suina: '#b05a7e',
  peixe: '#2d6f8e',
  ovo: '#c8a96b',
  outros: '#aab0b9',
};

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
      <div className="bg-gradient-to-r from-carvao-900 via-carvao-800 to-brand-800 px-5 py-4 text-white">
        <div className="flex items-center justify-between gap-2">
          <p className="text-caption font-extrabold uppercase tracking-[0.18em] text-brand-200">
            🧬 DNA Alimentar da casa
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
            <span>📅 {dna.totalDiasHistorico} dias de operação</span>
          )}
          <span>🍽️ {totalPratosUnicos} pratos únicos</span>
          {dna.baseSemanas > 0 && (
            <span>📋 {dna.baseSemanas} semana{dna.baseSemanas > 1 ? 's' : ''} no app</span>
          )}
          {dna.baseAvaliacoes > 0 && (
            <span>⭐ {dna.baseAvaliacoes} avaliação{dna.baseAvaliacoes > 1 ? 'ões' : ''}</span>
          )}
          {dna.mediaPessoas !== null && (
            <span>👥 média {dna.mediaPessoas} pax/dia</span>
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
                📈 Mais servidos no histórico
              </p>
              <div className="divide-y divide-carvao-50 dark:divide-carvao-800">
                {dna.topPorFrequencia.map((p, i) => (
                  <div key={p.prato} className="flex items-center gap-2 py-1.5">
                    <span className="w-5 shrink-0 text-center text-caption font-bold text-carvao-300">
                      {i + 1}
                    </span>
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: COR_PROTEINA[p.proteina] }}
                    />
                    <span className="min-w-0 flex-1 truncate text-nota font-semibold text-carvao-800 dark:text-areia-100">
                      {p.prato}
                    </span>
                    <span className="shrink-0 text-caption text-carvao-400">{p.frequencia}×</span>
                    {p.nota !== null && (
                      <span className={`shrink-0 text-caption font-bold ${notaTom(p.nota)}`}>
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
            <div className="space-y-1.5">
              <p className="text-caption font-bold uppercase tracking-wider text-brand-600 dark:text-brand-300">
                🏆 Campeões da casa
                {dna.baseAvaliacoes === 0 && (
                  <span className="ml-1 font-medium normal-case tracking-normal text-carvao-400">· por frequência no histórico</span>
                )}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {dna.campeoes.map((c) => (
                  <span
                    key={c.prato}
                    className="flex items-center gap-1.5 rounded-full bg-brand-500/10 px-2.5 py-1 text-rotulo font-semibold text-brand-700 ring-1 ring-brand-500/25 dark:text-brand-300"
                    title={`servido ${c.frequencia}×${c.nota !== null ? ` · nota ${c.nota}` : ''}`}
                  >
                    {c.prato}
                    {c.nota !== null ? (
                      <span className="text-caption opacity-70">{c.nota}★</span>
                    ) : (
                      <span className="text-caption opacity-70">{c.frequencia}×</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Problemas */}
          {dna.problemas.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-caption font-bold uppercase tracking-wider text-perigo">⚠️ Pontos de atenção</p>
              <div className="flex flex-wrap gap-1.5">
                {dna.problemas.map((p) => (
                  <span
                    key={p.prato}
                    className="flex items-center gap-1.5 rounded-full bg-perigo/10 px-2.5 py-1 text-rotulo font-semibold text-perigo ring-1 ring-perigo/25"
                    title={`${p.nota !== null ? `nota ${p.nota}` : 'sem nota'}${p.desperdicio !== null ? ` · ${Math.round(p.desperdicio * 100)}% sobra` : ''}`}
                  >
                    {p.prato}
                    {p.desperdicio !== null && p.desperdicio >= 0.2 && (
                      <span className="text-caption opacity-70">{Math.round(p.desperdicio * 100)}% sobra</span>
                    )}
                  </span>
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
      )}
    </Cartao>
  );
}
