'use client';

/* =====================================================================
   Indicador Nutricional — exibe informações estimadas do prato do dia
   e o Índice Nutricional Tata House da semana.
   ===================================================================== */

import { useMemo } from 'react';
import { infoNutricional, indiceNutricionalSemana } from '@/lib/cardapio/nutricional';
import type { DiaCardapio } from '@/lib/cardapio/tipos';

export function IndicadorNutricional({ dias }: { dias: DiaCardapio[] }) {
  const { score, rotulo, cor, detalhes } = useMemo(
    () => indiceNutricionalSemana(dias),
    [dias],
  );

  const pratosComInfo = useMemo(
    () => dias.map((d, i) => ({ i, dia: d, info: infoNutricional(d.principal) })).filter((x) => x.info),
    [dias],
  );

  if (pratosComInfo.length === 0) return null;

  const corScore =
    cor === 'brand'
      ? { texto: 'text-brand-700 dark:text-brand-300', bg: 'bg-brand-500', anel: 'ring-brand-500/30' }
      : cor === 'ouro'
        ? { texto: 'text-ouro-600 dark:text-ouro-300', bg: 'bg-ouro-400', anel: 'ring-ouro-400/30' }
        : { texto: 'text-perigo', bg: 'bg-perigo', anel: 'ring-perigo/30' };

  /* Media dos macros da semana */
  const infos = pratosComInfo.map((x) => x.info!);
  const media = {
    kcal: Math.round(infos.reduce((a, p) => a + p.kcal, 0) / infos.length),
    proteinas: Math.round(infos.reduce((a, p) => a + p.proteinas, 0) / infos.length),
    carboidratos: Math.round(infos.reduce((a, p) => a + p.carboidratos, 0) / infos.length),
    gorduras: Math.round(infos.reduce((a, p) => a + p.gorduras, 0) / infos.length),
    sodio: Math.round(infos.reduce((a, p) => a + p.sodio, 0) / infos.length),
  };

  return (
    <div className="space-y-3 rounded-2xl bg-carvao-50 p-4 ring-1 ring-carvao-200 dark:bg-carvao-900/60 dark:ring-carvao-700/60">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-caption font-extrabold uppercase tracking-[0.2em] text-carvao-400">
          🥗 Índice Nutricional Tata House
        </p>
        <div className={`flex items-center gap-2 rounded-full px-3 py-1 ring-1 ${corScore.anel} bg-white dark:bg-carvao-800`}>
          <span className={`text-[13px] font-black ${corScore.texto}`}>{score}%</span>
          <span className={`text-caption font-bold ${corScore.texto}`}>{rotulo}</span>
        </div>
      </div>

      {/* Barra de score */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-carvao-100 dark:bg-carvao-800">
        <div
          className={`h-full rounded-full ${corScore.bg} transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Médias nutricionais da semana */}
      <div className="grid grid-cols-5 gap-1.5 text-center">
        {[
          { rot: 'Kcal', val: `${media.kcal}` },
          { rot: 'Proteína', val: `${media.proteinas}g` },
          { rot: 'Carbos', val: `${media.carboidratos}g` },
          { rot: 'Gordura', val: `${media.gorduras}g` },
          { rot: 'Sódio', val: `${media.sodio}mg` },
        ].map(({ rot, val }) => (
          <div key={rot} className="rounded-xl bg-white p-1.5 ring-1 ring-carvao-100 dark:bg-carvao-800 dark:ring-carvao-700/60">
            <p className="text-[9px] font-bold uppercase text-carvao-400">{rot}</p>
            <p className="text-[13px] font-black text-carvao-700 dark:text-areia-100">{val}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-carvao-400">Média por prato principal · {pratosComInfo.length} dia(s) com dados</p>

      {/* Alertas nutricionais */}
      {detalhes.length > 0 && (
        <ul className="space-y-1">
          {detalhes.map((d, i) => (
            <li key={i} className="flex items-start gap-1.5 text-caption text-carvao-500 dark:text-carvao-300">
              <span className="shrink-0 text-[10px]">•</span>
              {d}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
