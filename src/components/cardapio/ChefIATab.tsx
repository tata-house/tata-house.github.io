'use client';

/* =====================================================================
   Aba dedicada do Chef IA — versão expandida com histórico de feedback,
   análise de semanas anteriores e visão completa das recomendações.
   ===================================================================== */

import { useMemo } from 'react';
import { Cartao } from '@/components/ui';
import { useChefFeedback, semanasComConteudo, lerSemana } from '@/lib/cardapio/estado';
import { DIAS_SEMANA, normalizar, proteinaDoPrato } from '@/lib/cardapio/motor';
import { ChefIA } from './ChefIA';
import type { EstadoSemana } from '@/lib/cardapio/tipos';

export function ChefIATab({
  estado,
  precos,
  semanaId,
}: {
  estado: EstadoSemana;
  precos: Record<string, number>;
  semanaId: string;
}) {
  const { feedbacks } = useChefFeedback();

  /* Resumo proteínas das últimas 4 semanas */
  const resumoProteinasRecentes = useMemo(() => {
    const cont: Record<string, number> = { frango: 0, bovina: 0, suina: 0, peixe: 0, ovo: 0, outros: 0 };
    const semanas = semanasComConteudo().slice(-4);
    let total = 0;
    for (const sid of semanas) {
      const s = lerSemana(sid);
      s.dias.forEach((d) => {
        if (d.principal) {
          const p = proteinaDoPrato(d.principal);
          cont[p] = (cont[p] ?? 0) + 1;
          total++;
        }
      });
    }
    return { cont, total };
  }, []);

  /* Feedback recente (últimos 20) */
  const feedbackRecente = feedbacks.slice(0, 20);
  const vetados = feedbacks.filter((f) => f.voto === 'ruim');

  const ROTULO_P: Record<string, string> = {
    frango: '🍗 Frango', bovina: '🥩 Bovina', suina: '🥓 Suína',
    peixe: '🐟 Peixe', ovo: '🥚 Ovo', outros: '🍽️ Outros',
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="rounded-2xl bg-gradient-to-r from-brand-800 to-brand-600 p-5 text-white">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🤖</span>
          <div>
            <h2 className="font-display text-xl font-bold">Chef IA</h2>
            <p className="text-sm text-brand-200">
              Centro de recomendações inteligentes — aprende com o uso e respeita a lógica do refeitório
            </p>
          </div>
        </div>
      </div>

      {/* Recomendações da semana atual (versão expandida) */}
      <ChefIA estado={estado} precos={precos} expandido />

      {/* Distribuição de proteínas (últimas 4 semanas) */}
      {resumoProteinasRecentes.total > 0 && (
        <Cartao className="space-y-3">
          <h3 className="font-display text-sm font-bold">📊 Distribuição de proteínas — últimas 4 semanas</h3>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {Object.entries(resumoProteinasRecentes.cont).map(([p, n]) => {
              if (n === 0) return null;
              const pct = resumoProteinasRecentes.total > 0 ? Math.round((n / resumoProteinasRecentes.total) * 100) : 0;
              const excesso = (p === 'frango' && n > 4 * 4) || (p === 'suina' && n > 2 * 4);
              return (
                <div key={p} className={`rounded-xl p-2.5 text-center ring-1 ${excesso ? 'bg-[#b04c41]/8 ring-[#b04c41]/20' : 'bg-carvao-50 ring-carvao-100 dark:bg-carvao-800/60 dark:ring-carvao-700/60'}`}>
                  <p className="text-[11px] font-bold">{ROTULO_P[p]}</p>
                  <p className={`font-display text-xl font-black ${excesso ? 'text-[#b04c41]' : 'text-brand-700 dark:text-brand-300'}`}>{n}×</p>
                  <p className="text-[10px] text-carvao-400">{pct}%</p>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-carvao-400">
            Referência: frango até 16× (4 semanas × 4×), suína até 8× (4 semanas × 2×)
          </p>
        </Cartao>
      )}

      {/* Aprendizados do time */}
      {vetados.length > 0 && (
        <Cartao className="space-y-3">
          <h3 className="font-display text-sm font-bold">🧠 O que o time descartou</h3>
          <ul className="space-y-1.5">
            {vetados.slice(0, 8).map((f) => (
              <li key={f.id} className="flex items-start gap-2 rounded-xl bg-[#b04c41]/5 px-3 py-2 text-sm ring-1 ring-[#b04c41]/15">
                <span className="shrink-0">👎</span>
                <div>
                  {f.motivo && <p className="font-semibold text-[#b04c41]">{f.motivo}</p>}
                  <p className="text-[11px] text-carvao-400">{new Date(f.em).toLocaleDateString('pt-BR')}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-carvao-400">
            Sugestões descartadas ficam registradas e não são repetidas.
          </p>
        </Cartao>
      )}

      {/* Cardápio desta semana em resumo */}
      {estado.dias.some((d) => d.principal) && (
        <Cartao className="space-y-3">
          <h3 className="font-display text-sm font-bold">🍽️ Semana atual — visão do Chef</h3>
          <div className="space-y-1.5">
            {estado.dias.map((d, i) => {
              if (!d.principal) return (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-carvao-50 px-3 py-2 text-sm text-carvao-400 dark:bg-carvao-800/50">
                  <span className="w-16 shrink-0 text-[11px] font-bold uppercase tracking-wide">{DIAS_SEMANA[i].slice(0, 3)}</span>
                  <span className="italic">Sem prato</span>
                </div>
              );
              const p = proteinaDoPrato(d.principal);
              const EMOJI_P: Record<string, string> = { frango: '🍗', bovina: '🥩', suina: '🥓', peixe: '🐟', ovo: '🥚', outros: '🍽️' };
              return (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-areia-50/70 px-3 py-2 ring-1 ring-carvao-100 dark:bg-carvao-800/40 dark:ring-carvao-700/50">
                  <span className="w-16 shrink-0 text-[11px] font-bold uppercase tracking-wide text-carvao-500">{DIAS_SEMANA[i].slice(0, 3)}</span>
                  <span className="flex-1 text-sm font-semibold">{d.principal}</span>
                  <span title={p}>{EMOJI_P[p]}</span>
                  <span className="text-[11px] text-carvao-400">{d.pessoas} pess.</span>
                </div>
              );
            })}
          </div>
        </Cartao>
      )}
    </div>
  );
}
