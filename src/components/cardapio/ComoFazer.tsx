'use client';

/* =====================================================================
   "Como fazer" — manual operacional do prato para a cozinha consultar no
   celular: passo a passo, ingredientes por pessoa, rendimento, tempo,
   complexidade, classe, nutrição por porção, substituições e observações
   operacionais. Lê tudo da biblioteca de receitas (fonte única). Para
   pratos antigos sem receita, cai no passo a passo legado.
   ===================================================================== */

import { useState } from 'react';
import { BottomSheet, Pilula } from '@/components/ui';
import { formatarQtd } from '@/lib/cardapio/motor';
import { receitaDoPrato } from '@/lib/cardapio/receitas';
import { preparoDoPrato } from '@/lib/cardapio/preparos';

const ROTULO_CLASSE: Record<string, string> = {
  economica: '💰 Econômica',
  equilibrada: '⚖️ Equilibrada',
  premium: '⭐ Premium',
};

const ROTULO_COMPLEX: Record<string, string> = {
  baixa: 'Fácil',
  media: 'Médio',
  alta: 'Elaborado',
};

export function ComoFazer({ prato, className = '' }: { prato: string; className?: string }) {
  const [aberto, setAberto] = useState(false);
  if (!prato) return null;

  const receita = receitaDoPrato(prato);
  const passos = receita?.preparo?.length ? receita.preparo : preparoDoPrato(prato);
  const ingredientes = receita?.ingredientes ?? [];
  const nu = receita?.nutricao;

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
          {/* Resumo operacional — chips de leitura rápida */}
          {receita && (
            <div className="flex flex-wrap gap-1.5">
              {receita.classe && <Pilula tom="verde">{ROTULO_CLASSE[receita.classe] ?? receita.classe}</Pilula>}
              {receita.tempoMin > 0 && <Pilula tom="neutro">⏱️ {receita.tempoMin} min</Pilula>}
              {receita.complexidade && (
                <Pilula tom="ouro">🔥 {ROTULO_COMPLEX[receita.complexidade] ?? receita.complexidade}</Pilula>
              )}
              {receita.rendimentoPorcaoG > 0 && <Pilula tom="neutro">🍽️ {receita.rendimentoPorcaoG} g/porção</Pilula>}
              {receita.adequacaoRefeitorio > 0 && (
                <Pilula tom="azul">👍 {receita.adequacaoRefeitorio}% refeitório</Pilula>
              )}
            </div>
          )}

          {/* Modo de preparo */}
          {passos && passos.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-carvao-400">Modo de preparo</p>
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
            </div>
          ) : (
            <p className="rounded-2xl bg-areia-100 px-3 py-2.5 text-sm text-carvao-500 dark:bg-carvao-800 dark:text-areia-200">
              Ainda não há passo a passo cadastrado. Use os ingredientes abaixo como guia.
            </p>
          )}

          {/* Ingredientes (por pessoa) */}
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
                Quantidades por pessoa — o app multiplica pelo nº de refeições do dia. Temperos a gosto.
              </p>
            </div>
          )}

          {/* Nutrição por porção */}
          {nu && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-carvao-400">Nutrição por porção</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  ['Calorias', `${nu.kcal} kcal`],
                  ['Proteínas', `${nu.prot} g`],
                  ['Carboidratos', `${nu.carb} g`],
                  ['Gorduras', `${nu.gord} g`],
                  ['Fibras', `${nu.fibra} g`],
                  ['Sódio', `${nu.sodio} mg`],
                ].map(([rot, val]) => (
                  <div key={rot} className="rounded-xl bg-areia-100 px-2 py-1.5 text-center dark:bg-carvao-800">
                    <p className="text-[10px] uppercase tracking-wide text-carvao-400">{rot}</p>
                    <p className="text-sm font-bold tabular-nums text-carvao-700 dark:text-areia-100">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Substituições */}
          {receita?.substituicoes && receita.substituicoes.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-carvao-400">Substituições</p>
              <ul className="flex flex-wrap gap-1.5">
                {receita.substituicoes.map((s, i) => (
                  <li key={i} className="rounded-full bg-carvao-100 px-2.5 py-1 text-[12px] text-carvao-600 dark:bg-carvao-700 dark:text-areia-200">
                    🔄 {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Observação operacional */}
          {receita?.obsOperacional && (
            <div className="rounded-2xl bg-brand-500/8 px-3 py-2.5 ring-1 ring-brand-500/20">
              <p className="text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                💡 Dica de produção
              </p>
              <p className="mt-0.5 text-sm text-carvao-700 dark:text-areia-100">{receita.obsOperacional}</p>
            </div>
          )}
        </div>
      </BottomSheet>
    </>
  );
}
