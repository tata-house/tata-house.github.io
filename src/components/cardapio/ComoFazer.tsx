'use client';

/* =====================================================================
   "Como fazer" — botão discreto que abre o modo de preparo do prato para
   a cozinha consultar na hora da dúvida: passo a passo + ingredientes por
   pessoa (da receita). Reaproveitável em qualquer tela. Não altera dados.
   ===================================================================== */

import { useState } from 'react';
import { BottomSheet, Pilula } from '@/components/cardapio/ui';
import { formatarQtd } from '@/lib/cardapio/motor';
import { receitaDoPrato } from '@/lib/cardapio/receitas';
import { preparoDoPrato } from '@/lib/cardapio/preparos';

export function ComoFazer({ prato, className = '' }: { prato: string; className?: string }) {
  const [aberto, setAberto] = useState(false);
  if (!prato) return null;

  const passos = preparoDoPrato(prato);
  const receita = receitaDoPrato(prato);
  const ingredientes = receita?.ingredientes ?? [];

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setAberto(true);
        }}
        className={
          className ||
          'inline-flex items-center gap-1 rounded-full bg-brand-600/10 px-2.5 py-1 text-[11px] font-bold text-brand-700 ring-1 ring-brand-600/20 transition hover:bg-brand-600/20 dark:text-brand-300'
        }
      >
        👨‍🍳 Como fazer
      </button>

      <BottomSheet titulo={`Como fazer · ${prato}`} aberto={aberto} aoFechar={() => setAberto(false)}>
        <div className="space-y-4">
          {passos ? (
            <ol className="space-y-2">
              {passos.map((p, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 text-carvao-700 dark:text-areia-100">{p}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="rounded-2xl bg-areia-100 px-3 py-2.5 text-sm text-carvao-500 dark:bg-carvao-800 dark:text-areia-200">
              Ainda não há um passo a passo cadastrado para este prato. Use os ingredientes abaixo como guia — e combine o
              modo de preparo com a equipe.
            </p>
          )}

          {ingredientes.length > 0 && (
            <div className="space-y-1.5">
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-carvao-400">
                Ingredientes <Pilula tom="neutro">por pessoa</Pilula>
              </p>
              <ul className="divide-y divide-carvao-100 rounded-2xl ring-1 ring-carvao-100 dark:divide-carvao-700/60 dark:ring-carvao-700/60">
                {ingredientes.map((ing, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <span className="text-carvao-700 dark:text-areia-100">
                      {ing.item}
                      {ing.opcional && <span className="ml-1 text-[11px] text-carvao-400">(opcional)</span>}
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums text-carvao-500 dark:text-areia-200">
                      {formatarQtd(ing.porPessoa)} {ing.unid}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-carvao-400">
                Quantidades por pessoa — multiplique pelo nº de pessoas do dia. Temperos a gosto.
              </p>
            </div>
          )}
        </div>
      </BottomSheet>
    </>
  );
}
