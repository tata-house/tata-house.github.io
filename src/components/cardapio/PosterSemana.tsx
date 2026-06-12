'use client';

import { useEffect } from 'react';
import { Botao } from '@/components/ui';
import { datasDaSemana } from '@/lib/cardapio/estado';
import { proteinaDoPrato } from '@/lib/cardapio/motor';
import type { EstadoSemana } from '@/lib/cardapio/tipos';

/* =====================================================================
   Pôster da semana — a arte impressa para os funcionários, gerada
   automaticamente a partir do cardápio montado. Formato A4 retrato.
   ===================================================================== */

const DIAS_CURTOS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];

const COR_PROTEINA: Record<string, string> = {
  bovina: '#8a3b34',
  frango: '#b07c1e',
  suina: '#b05a7e',
  peixe: '#2d6f8e',
  ovo: '#b08d4f',
  outros: '#7c828c',
};

function ddmm(d: Date): string {
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function Filete() {
  return (
    <div className="flex items-center gap-3" aria-hidden>
      <span className="h-px grow bg-gradient-to-r from-transparent via-ouro-500/60 to-ouro-500/60" />
      <span className="h-1.5 w-1.5 rotate-45 bg-ouro-500/80" />
      <span className="h-px grow bg-gradient-to-l from-transparent via-ouro-500/60 to-ouro-500/60" />
    </div>
  );
}

export function PosterSemana({
  estado,
  semanaId,
  aoFechar,
}: {
  estado: EstadoSemana;
  semanaId: string;
  aoFechar: () => void;
}) {
  const datas = datasDaSemana(semanaId);
  const periodo = `${ddmm(datas[0])} até ${ddmm(datas[6])}`;

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [aoFechar]);

  return (
    <div className="min-h-screen bg-carvao-200 py-6 dark:bg-carvao-950 print:bg-white print:py-0">
      {/* Controles (somem na impressão) */}
      <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-2 px-4 print:hidden">
        <button
          onClick={aoFechar}
          className="text-sm font-semibold text-carvao-500 hover:text-carvao-800 dark:text-areia-200"
        >
          ← Voltar ao app
        </button>
        <Botao variante="sucesso" onClick={() => window.print()} className="!min-h-10 !px-5 !py-2 text-sm">
          🖨️ Imprimir pôster
        </Botao>
      </div>

      {/* Folha A4 */}
      <div className="poster mx-auto flex min-h-[287mm] w-full max-w-[210mm] flex-col overflow-hidden bg-areia-50 text-carvao-900 shadow-flutuante print:min-h-[275mm] print:max-w-none print:shadow-none">
        {/* Cabeçalho */}
        <header className="relative bg-carvao-950 px-10 pb-7 pt-8 text-areia-50">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-ouro-600 via-ouro-300 to-ouro-600" />
          <div className="flex items-center justify-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600/15 ring-1 ring-brand-500/50">
              <span className="h-3 w-3 rounded-full bg-brand-500" />
            </span>
            <div className="text-center">
              <div className="font-display text-xl font-semibold tracking-[0.3em]">TATÁ SUSHI</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.42em] text-ouro-300">
                Cozinha da equipe
              </div>
            </div>
          </div>
          <h1 className="mt-5 text-center font-display text-[44px] font-semibold leading-none tracking-tight">
            Cardápio da Semana
          </h1>
          <p className="mt-3 text-center text-sm font-bold uppercase tracking-[0.35em] text-areia-300/80">
            {periodo}
          </p>
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-ouro-500/70 to-transparent" />
        </header>

        {/* Dias */}
        <main className="flex grow flex-col justify-evenly gap-2.5 px-10 py-7">
          {estado.dias.map((dia, i) => {
            const prot = dia.principal ? proteinaDoPrato(dia.principal) : 'outros';
            const guarnicoes = [dia.guarnicaoFixa, dia.guarnicao].filter(Boolean).join(' · ');
            const fimDeSemana = i >= 5;
            return (
              <section
                key={i}
                className={`flex items-stretch gap-5 rounded-2xl border px-6 py-3.5 ${
                  fimDeSemana
                    ? 'border-ouro-400/40 bg-gradient-to-r from-ouro-300/15 via-white to-white'
                    : 'border-carvao-100 bg-white'
                }`}
              >
                <div className="flex w-16 shrink-0 flex-col items-center justify-center border-r border-carvao-100 pr-5">
                  <span className="font-display text-xl font-bold tracking-wide text-carvao-900">
                    {DIAS_CURTOS[i]}
                  </span>
                  <span className="text-[11px] font-bold tracking-wider text-ouro-600">{ddmm(datas[i])}</span>
                </div>
                <div className="min-w-0 grow py-0.5">
                  {dia.principal ? (
                    <>
                      <p className="font-display text-[19px] font-semibold leading-snug tracking-tight">
                        <span
                          className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle"
                          style={{ backgroundColor: COR_PROTEINA[prot] }}
                          aria-hidden
                        />
                        {dia.principal}
                      </p>
                      {guarnicoes && (
                        <p className="mt-0.5 text-[13px] font-medium text-carvao-500">{guarnicoes}</p>
                      )}
                      {(dia.salada || dia.sobremesa) && (
                        <p className="mt-1 text-[12px] text-carvao-500">
                          {dia.salada && (
                            <>
                              <span className="font-bold uppercase tracking-wider text-brand-600">
                                Salada
                              </span>{' '}
                              {dia.salada}
                            </>
                          )}
                          {dia.salada && dia.sobremesa && (
                            <span className="mx-2 text-ouro-500" aria-hidden>
                              ◆
                            </span>
                          )}
                          {dia.sobremesa && (
                            <>
                              <span className="font-bold uppercase tracking-wider text-ouro-600">
                                Sobremesa
                              </span>{' '}
                              {dia.sobremesa}
                            </>
                          )}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="py-2 text-sm italic text-carvao-300">A definir</p>
                  )}
                </div>
              </section>
            );
          })}
        </main>

        {/* Rodapé */}
        <footer className="px-10 pb-7">
          <Filete />
          <div className="mt-3 flex items-baseline justify-between text-carvao-500">
            <p className="font-display text-base italic">Bom apetite! — Cozinha TATÁ</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em]">
              Cardápio sujeito a alteração
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
