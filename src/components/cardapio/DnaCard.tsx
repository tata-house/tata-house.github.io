'use client';

/* =====================================================================
   Cartão de DNA Alimentar — dá rosto visual ao motor dna.ts, que cruza
   histórico de cardápios × aceitação × desperdício para revelar o
   "paladar da casa": proteínas preferidas, pratos campeões e pratos-
   problema. Determinístico (sem IA). Antes era calculado mas nunca
   exibido em tela.
   ===================================================================== */

import { Cartao } from '@/components/ui';
import { Icone } from '@/components/Icones';
import { useDna } from '@/lib/cardapio/estado';
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
  return 'text-[#b04c41]';
}

export function DnaCard() {
  const { dna, recalcular } = useDna();

  if (!dna) return null;

  const semBase = dna.baseSemanas === 0;
  const maxFreq = Math.max(...dna.perfilProteinas.map((p) => p.freq), 1);

  return (
    <Cartao className="space-y-4 !p-0 overflow-hidden">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-carvao-900 via-carvao-800 to-brand-800 px-5 py-4 text-white">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-200">
            🧬 DNA Alimentar da casa
          </p>
          <button
            onClick={recalcular}
            className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white/90 transition hover:bg-white/20"
            title="Recalcular com os dados atuais"
          >
            <Icone nome="raio" tam={12} /> atualizar
          </button>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-areia-100/90">{dna.resumo}</p>
        <p className="mt-2 text-[11px] font-semibold text-brand-200/80">
          base: {dna.baseSemanas} semana(s) · {dna.baseAvaliacoes} avaliação(ões)
        </p>
      </div>

      {semBase ? (
        <div className="px-5 pb-5">
          <p className="text-sm text-carvao-400">
            Sem histórico suficiente ainda. Conforme você montar cardápios e a equipe avaliar os pratos, o
            perfil da casa se forma sozinho aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-4 px-5 pb-5">
          {/* Perfil de proteínas */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-carvao-400">Perfil de proteínas</p>
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
                  <span className="w-10 shrink-0 text-right text-xs font-bold tabular-nums">{p.pct}%</span>
                  <span className={`w-12 shrink-0 text-right text-xs font-bold tabular-nums ${notaTom(p.notaMedia)}`}>
                    {p.notaMedia !== null ? `${p.notaMedia}★` : '—'}
                  </span>
                </div>
              ))}
          </div>

          {/* Campeões */}
          {dna.campeoes.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-300">
                🏆 Campeões da casa
              </p>
              <div className="flex flex-wrap gap-1.5">
                {dna.campeoes.map((c) => (
                  <span
                    key={c.prato}
                    className="flex items-center gap-1.5 rounded-full bg-brand-500/10 px-2.5 py-1 text-[12px] font-semibold text-brand-700 ring-1 ring-brand-500/25 dark:text-brand-300"
                    title={`servido ${c.frequencia}×${c.nota !== null ? ` · nota ${c.nota}` : ''}`}
                  >
                    {c.prato}
                    {c.nota !== null && <span className="text-[11px] opacity-70">{c.nota}★</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Problemas */}
          {dna.problemas.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#b04c41]">⚠️ Pontos de atenção</p>
              <div className="flex flex-wrap gap-1.5">
                {dna.problemas.map((p) => (
                  <span
                    key={p.prato}
                    className="flex items-center gap-1.5 rounded-full bg-[#b04c41]/10 px-2.5 py-1 text-[12px] font-semibold text-[#b04c41] ring-1 ring-[#b04c41]/25"
                    title={`${p.nota !== null ? `nota ${p.nota}` : 'sem nota'}${p.desperdicio !== null ? ` · ${Math.round(p.desperdicio * 100)}% sobra` : ''}`}
                  >
                    {p.prato}
                    {p.desperdicio !== null && p.desperdicio >= 0.2 && (
                      <span className="text-[11px] opacity-70">{Math.round(p.desperdicio * 100)}% sobra</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Cartao>
  );
}
