'use client';

/* =====================================================================
   Radar de Monotonia — detecta padrões repetitivos no cardápio da semana:
   mesma textura no prato principal 3× ou mais, mesma guarnição variável
   3× ou mais, mesma salada 3× ou mais. Alertas visuais para o planejador
   variar antes de publicar. Retorna null se a semana está variada.
   ===================================================================== */

import { useMemo } from 'react';
import type { EstadoSemana } from '@/lib/cardapio/tipos';
import { DIAS_SEMANA } from '@/lib/cardapio/motor';
import { tagsDoPrato } from '@/lib/cardapio/tags';

const ROTULO_TEXTURA: Record<string, string> = {
  cremoso: 'pratos cremosos (molho/creme)',
  ensopado: 'pratos ensopados/caldo',
  seco: 'pratos grelhados ou secos',
  crocante: 'pratos crocantes/salteados',
  leve: 'pratos leves',
};

type Alerta = { msg: string; detalhe: string; critico: boolean };

export function AntiMonotonia({ estado }: { estado: EstadoSemana }) {
  const alertas = useMemo<Alerta[]>(() => {
    const { dias } = estado;
    const resultado: Alerta[] = [];

    /* Textura dos pratos principais */
    const texturaCont: Record<string, string[]> = {};
    dias.forEach((d, i) => {
      const tags = tagsDoPrato(d.principal);
      if (!tags) return;
      (texturaCont[tags.textura] ??= []).push(DIAS_SEMANA[i]);
    });
    Object.entries(texturaCont).forEach(([tex, ds]) => {
      if (ds.length >= 3) {
        resultado.push({
          msg: `${ds.length} ${ROTULO_TEXTURA[tex] ?? tex} na semana`,
          detalhe: ds.join(', '),
          critico: ds.length >= 5,
        });
      }
    });

    /* Guarnição variável repetida */
    const guaCont: Record<string, string[]> = {};
    dias.forEach((d, i) => {
      if (!d.guarnicao) return;
      (guaCont[d.guarnicao] ??= []).push(DIAS_SEMANA[i]);
    });
    Object.entries(guaCont).forEach(([g, ds]) => {
      if (ds.length >= 3)
        resultado.push({
          msg: `Guarnição "${g}" repetida ${ds.length}× — varie o acompanhamento`,
          detalhe: ds.join(', '),
          critico: false,
        });
    });

    /* Salada repetida */
    const salCont: Record<string, string[]> = {};
    dias.forEach((d, i) => {
      if (!d.salada) return;
      (salCont[d.salada] ??= []).push(DIAS_SEMANA[i]);
    });
    Object.entries(salCont).forEach(([s, ds]) => {
      if (ds.length >= 3)
        resultado.push({
          msg: `Salada "${s}" repetida ${ds.length}× — substitua ao menos uma`,
          detalhe: ds.join(', '),
          critico: false,
        });
    });

    return resultado;
  }, [estado.dias]);

  if (alertas.length === 0) return null;

  return (
    <div className="space-y-2.5 rounded-2xl bg-ouro-300/10 p-4 ring-1 ring-ouro-400/30">
      <p className="text-caption font-extrabold uppercase tracking-[0.2em] text-ouro-600 dark:text-ouro-300">
        Radar de monotonia
      </p>
      {alertas.map((a, i) => (
        <div
          key={i}
          className={`flex items-start gap-2 text-sm ${
            a.critico ? 'text-perigo' : 'text-[#9a6c17] dark:text-[#e3b45c]'
          }`}
        >
          <span aria-hidden>{a.critico ? '' : ''}</span>
          <div>
            <p className="font-semibold leading-snug">{a.msg}</p>
            <p className="text-caption opacity-60">{a.detalhe}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
