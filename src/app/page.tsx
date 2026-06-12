'use client';

import { useState } from 'react';
import { AlternadorTema } from '@/components/AlternadorTema';
import { AbaCardapio } from '@/components/cardapio/AbaCardapio';
import { AbaCompras } from '@/components/cardapio/AbaCompras';
import { AbaCotacao } from '@/components/cardapio/AbaCotacao';
import { AbaFluxo } from '@/components/cardapio/AbaFluxo';
import { AbaPrecos } from '@/components/cardapio/AbaPrecos';
import {
  idSemanaIso,
  idsSemanas,
  rotuloSemana,
  usePapel,
  usePrecos,
  useSemana,
} from '@/lib/cardapio/estado';
import type { Etapa, Papel } from '@/lib/cardapio/tipos';

const ABAS = [
  { id: 'cotacao', rotulo: '📋 Cotação' },
  { id: 'cardapio', rotulo: '🍽️ Cardápio' },
  { id: 'compras', rotulo: '🛒 Compras' },
  { id: 'fluxo', rotulo: '🚦 Acompanhar' },
  { id: 'precos', rotulo: '💰 Preços' },
] as const;

const PAPEIS: { id: Papel; rotulo: string }[] = [
  { id: 'gestor', rotulo: 'Gestor' },
  { id: 'cozinha', rotulo: 'Cozinha' },
  { id: 'compras', rotulo: 'Compras' },
  { id: 'recebimento', rotulo: 'Recebimento' },
];

const ROTULO_ETAPA: Record<Etapa, string> = {
  rascunho: 'Rascunho',
  cozinha: 'Na cozinha',
  compras: 'Em compra',
  recebimento: 'Recebendo',
  concluido: 'Concluída',
};

const COR_ETAPA: Record<Etapa, string> = {
  rascunho: 'bg-carvao-400/10 text-carvao-500 ring-carvao-400/25',
  cozinha: 'bg-[#b07c1e]/10 text-[#9a6c17] ring-[#b07c1e]/25 dark:text-[#e3b45c]',
  compras: 'bg-[#2d6f8e]/10 text-[#2d6f8e] ring-[#2d6f8e]/25 dark:text-[#7cb8d4]',
  recebimento: 'bg-ouro-400/10 text-ouro-600 ring-ouro-400/25 dark:text-ouro-300',
  concluido: 'bg-brand-500/10 text-brand-600 ring-brand-500/25',
};

export default function PaginaCardapios() {
  const [semanaId, setSemanaId] = useState(() => idSemanaIso(new Date()));
  const [aba, setAba] = useState<(typeof ABAS)[number]['id']>('cardapio');
  const { estado, atualizar, pronto } = useSemana(semanaId);
  const { precos, definirPreco } = usePrecos();
  const { papel, setPapel } = usePapel();

  const podeEditarCardapio = papel === 'gestor' && (estado.etapa === 'rascunho' || estado.etapa === 'cozinha');

  return (
    <>
      {/* Cabeçalho da marca */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-carvao-950/95 text-areia-50 shadow-media backdrop-blur print:hidden">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-ouro-500/50 to-transparent" />
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600/15 ring-1 ring-brand-500/40"
              aria-hidden
            >
              <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
            </span>
            <div className="leading-tight">
              <div className="whitespace-nowrap font-display text-[15px] font-semibold tracking-[0.16em] text-areia-50 sm:text-[17px] sm:tracking-[0.22em]">
                TATÁ&nbsp;SUSHI
              </div>
              <div className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.28em] text-areia-300/60">
                Cardápios da Equipe
              </div>
            </div>
          </div>
          <AlternadorTema />
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 px-4 py-5">
        {/* Cabeçalho do módulo */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Semana
              <span
                className={`ml-2.5 inline-flex translate-y-[-2px] items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ${COR_ETAPA[estado.etapa]}`}
              >
                {ROTULO_ETAPA[estado.etapa]}
              </span>
            </h1>
            <p className="text-sm text-carvao-400">
              Refeição dos funcionários — do orçamento à entrega, com o histórico de 405 dias trabalhando por
              você.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={semanaId}
              onChange={(e) => setSemanaId(e.target.value)}
              className="min-h-10 rounded-2xl border border-carvao-200 bg-white px-3 py-2 text-sm font-semibold dark:border-carvao-600 dark:bg-carvao-900"
            >
              {idsSemanas().map((id) => (
                <option key={id} value={id}>
                  {rotuloSemana(id)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Papel (simulação dos setores no protótipo) */}
        <div className="flex flex-wrap items-center gap-1.5 print:hidden">
          <span className="text-[11px] font-bold uppercase tracking-wider text-carvao-400">Estou vendo como:</span>
          {PAPEIS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPapel(p.id)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${
                papel === p.id
                  ? 'bg-carvao-900 text-white dark:bg-areia-100 dark:text-carvao-900'
                  : 'bg-white text-carvao-500 ring-1 ring-carvao-200 hover:bg-areia-100 dark:bg-carvao-800 dark:text-areia-200 dark:ring-carvao-600'
              }`}
            >
              {p.rotulo}
            </button>
          ))}
        </div>

        {/* Abas */}
        <nav className="flex gap-1 overflow-x-auto rounded-full bg-white p-1 ring-1 ring-carvao-200 dark:bg-carvao-800 dark:ring-carvao-600 print:hidden">
          {ABAS.map((a) => (
            <button
              key={a.id}
              onClick={() => setAba(a.id)}
              className={`min-h-10 grow whitespace-nowrap rounded-full px-4 text-[13px] font-bold transition ${
                aba === a.id
                  ? 'bg-carvao-900 text-white dark:bg-areia-100 dark:text-carvao-900'
                  : 'text-carvao-500 hover:bg-areia-100 dark:text-areia-200 dark:hover:bg-carvao-700'
              }`}
            >
              {a.rotulo}
            </button>
          ))}
        </nav>

        {!pronto ? (
          <p className="py-10 text-center text-sm text-carvao-400">Carregando semana…</p>
        ) : (
          <>
            {aba === 'cotacao' && <AbaCotacao definirPreco={definirPreco} />}
            {aba === 'cardapio' && (
              <AbaCardapio
                estado={estado}
                atualizar={atualizar}
                podeEditar={podeEditarCardapio}
                precos={precos}
              />
            )}
            {aba === 'compras' && (
              <AbaCompras estado={estado} atualizar={atualizar} papel={papel} precos={precos} />
            )}
            {aba === 'fluxo' && <AbaFluxo estado={estado} atualizar={atualizar} papel={papel} />}
            {aba === 'precos' && <AbaPrecos precos={precos} definirPreco={definirPreco} />}
          </>
        )}
      </main>
    </>
  );
}
