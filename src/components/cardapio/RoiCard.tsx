'use client';

/* =====================================================================
   Cartão "Valor gerado no mês" — a prova de valor da plataforma. Cruza
   o histórico real (preços, desperdício, custo de cardápio) e estima
   quanto a gestão inteligente economizou no mês, decomposto em três
   fontes. Determinístico (motor calcularRoi em indicadores.ts). Estava
   construído mas só vivia dentro de um painel desativado.
   ===================================================================== */

import { useMemo } from 'react';
import { Cartao, Contador } from '@/components/ui';
import { formatarReais } from '@/lib/cardapio/motor';
import { calcularRoi } from '@/lib/cardapio/indicadores';
import type { HistoricoPrecos } from '@/lib/cardapio/tipos';

export function RoiCard({
  precos,
  historico,
  fatores,
}: {
  precos: Record<string, number>;
  historico: HistoricoPrecos;
  fatores?: Record<string, number>;
}) {
  const roi = useMemo(
    () => calcularRoi(new Date(), precos, historico, fatores),
    [precos, historico, fatores],
  );

  const semBase = roi.semanas === 0 || roi.total <= 0;

  const fontes = [
    { r: 'Compra abaixo da média', v: roi.economiaFornecedor, i: '🏷️' },
    { r: 'Menos desperdício', v: roi.economiaDesperdicio, i: '♻️' },
    { r: 'Cardápio otimizado', v: roi.economiaCardapio, i: '🧠' },
  ];

  return (
    <Cartao className="overflow-hidden !p-0">
      <div className="bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 px-5 py-4 text-white">
        <p className="text-caption font-extrabold uppercase tracking-[0.18em] text-brand-200">
          💎 Valor gerado no mês
        </p>
        <p className="font-display text-3xl font-bold">
          <Contador valor={roi.total} formato={formatarReais} />
        </p>
        <p className="text-xs font-semibold text-brand-100/80">
          {semBase
            ? 'comece a lançar preços e contagens para medir a economia'
            : `economia estimada com gestão inteligente · ${roi.semanas} semana(s) no mês`}
        </p>
      </div>
      <div className="grid grid-cols-1 divide-y divide-carvao-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-carvao-700/60">
        {fontes.map((c) => (
          <div key={c.r} className="px-5 py-3">
            <p className="text-micro font-extrabold uppercase tracking-wider text-carvao-400">
              {c.i} {c.r}
            </p>
            <p className="font-display text-xl font-bold text-brand-700 dark:text-brand-300">
              {formatarReais(c.v)}
            </p>
          </div>
        ))}
      </div>
    </Cartao>
  );
}
