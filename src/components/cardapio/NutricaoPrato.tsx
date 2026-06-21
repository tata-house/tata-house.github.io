'use client';

/* =====================================================================
   Nutrição por prato — visão principal (item 1). Mostra, direto no card
   do dia, os macros da porção e o índice nutricional do prato, para
   identificar num relance pratos saudáveis, com excesso de sódio,
   proteína insuficiente ou calorias altas. A visão semanal continua
   como complemento (IndicadorNutricional).
   ===================================================================== */

import { infoNutricional } from '@/lib/cardapio/nutricional';

/** Rótulo do índice (mesma faixa do índice semanal). */
function rotuloIndice(v: number): { texto: string; cor: string; bg: string } {
  if (v >= 80) return { texto: 'equilibrado', cor: 'text-brand-700 dark:text-brand-300', bg: 'bg-brand-500' };
  if (v >= 60) return { texto: 'moderado', cor: 'text-[#9a6c17] dark:text-[#e3b45c]', bg: 'bg-ouro-400' };
  return { texto: 'pesado', cor: 'text-perigo', bg: 'bg-perigo' };
}

export function NutricaoPrato({ prato }: { prato: string }) {
  const info = infoNutricional(prato);
  if (!info) return null;

  const idx = rotuloIndice(info.indiceSaudavel);

  // alertas pontuais por prato
  const alertas: string[] = [];
  if (info.sodio > 800) alertas.push('🧂 sódio alto');
  if (info.proteinas < 15) alertas.push('💪 proteína baixa');
  if (info.kcal > 550) alertas.push('🔥 calórico');
  if (info.gorduras > 26) alertas.push('🥑 gorduroso');

  const macros: [string, string][] = [
    ['Kcal', `${info.kcal}`],
    ['Proteína', `${info.proteinas}g`],
    ['Carbo', `${info.carboidratos}g`],
    ['Gordura', `${info.gorduras}g`],
    ['Fibra', `${info.fibras}g`],
    ['Sódio', `${info.sodio}mg`],
  ];

  return (
    <div className="rounded-2xl bg-areia-50/70 p-3 ring-1 ring-carvao-100 dark:bg-carvao-900/40 dark:ring-carvao-700/60">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-carvao-400">
          🥗 Nutrição do prato
          {info.porcao !== '—' && <span className="font-bold text-carvao-400">· {info.porcao}</span>}
        </p>
        <span className={`flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-black ring-1 ring-carvao-100 dark:bg-carvao-800 dark:ring-carvao-700 ${idx.cor}`}>
          {info.indiceSaudavel}% {idx.texto}
        </span>
      </div>

      {/* Barra do índice */}
      <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-carvao-100 dark:bg-carvao-800">
        <div className={`h-full rounded-full ${idx.bg} transition-all duration-500`} style={{ width: `${info.indiceSaudavel}%` }} />
      </div>

      {/* Macros */}
      <div className="grid grid-cols-6 gap-1">
        {macros.map(([rot, val]) => (
          <div key={rot} className="rounded-lg bg-white px-1 py-1 text-center ring-1 ring-carvao-100 dark:bg-carvao-800 dark:ring-carvao-700/60">
            <p className="text-[8px] font-bold uppercase leading-tight text-carvao-400">{rot}</p>
            <p className="text-[12px] font-black leading-tight tabular-nums text-carvao-700 dark:text-areia-100">{val}</p>
          </div>
        ))}
      </div>

      {alertas.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {alertas.map((a) => (
            <span key={a} className="rounded-full bg-perigo/8 px-2 py-0.5 text-[10px] font-bold text-perigo ring-1 ring-perigo/15">
              {a}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
