'use client';

import { useMemo } from 'react';
import { calcularPrevisaoSemana, extrairHistoricoContagens, pessoasPorDia } from '@/lib/cardapio/previsao';
import { datasDaSemana, lerDesperdicio, lerSemana, semanasComConteudo } from '@/lib/cardapio/estado';
import { lerEventos } from '@/lib/cardapio/estado';

const DIAS_PT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

interface Props {
  semanaId: string;
  onPessoasAtualizadas?: (pessoasPorDia: Record<number, number>) => void;
}

export function PrevisaoCard({ semanaId, onPessoasAtualizadas }: Props) {
  const previsao = useMemo(() => {
    const ids = semanasComConteudo();
    const semanas = ids
      .filter((id) => id < semanaId)
      .sort()
      .slice(-12)
      .map((id) => ({ estado: lerSemana(id) }));
    const hist = extrairHistoricoContagens(semanas);
    const eventos = lerEventos();
    const datas = datasDaSemana(semanaId);
    return calcularPrevisaoSemana(semanaId, hist, eventos, datas);
  }, [semanaId]);

  const pessoas = useMemo(() => pessoasPorDia(previsao, 'otimista'), [previsao]);

  const barraMax = Math.max(...previsao.dias.map((d) => d.otimista), 1);

  function aplicar() {
    onPessoasAtualizadas?.(pessoas);
  }

  return (
    <section className="rounded-3xl bg-white p-5 shadow-suave ring-1 ring-carvao-100 dark:bg-carvao-850 dark:ring-carvao-700">
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <h2 className="font-display text-base font-bold text-carvao-800 dark:text-areia-100">Previsão de consumo</h2>
        </div>
        {previsao.baseSemanas > 0 && (
          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-carvao-700 dark:text-brand-300">
            {previsao.baseSemanas} semana{previsao.baseSemanas > 1 ? 's' : ''}
          </span>
        )}
      </div>
      <p className="mb-4 text-[12px] text-carvao-500 dark:text-areia-400">
        Pessimista · Esperado · Otimista por dia (com intervalo de confiança)
      </p>

      {/* barras por dia */}
      <div className="grid grid-cols-7 gap-1">
        {previsao.dias.map((d) => {
          const altEsp = Math.round((d.esperado / barraMax) * 100);
          const altPes = Math.round((d.pessimista / barraMax) * 100);
          const altOt = Math.round((d.otimista / barraMax) * 100);
          const conf = Math.round(d.confianca * 100);
          return (
            <div key={d.dia} className="flex flex-col items-center gap-1">
              {/* barra empilhada */}
              <div className="relative flex h-24 w-full items-end overflow-hidden rounded-lg bg-areia-100 dark:bg-carvao-700">
                {/* banda pessimista→otimista (fundo) */}
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-lg bg-brand-100 dark:bg-brand-900/30"
                  style={{ height: `${altOt}%` }}
                />
                {/* esperado (frente) */}
                <div
                  className="absolute bottom-0 left-1/4 right-1/4 rounded-lg bg-brand-500"
                  style={{ height: `${altEsp}%` }}
                />
                {/* confiança como opacidade da banda */}
                {d.base === 'padrao' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-carvao-400">est.</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] font-bold text-carvao-600 dark:text-areia-300">{DIAS_PT[d.dia]}</span>
              <span className="text-[11px] font-semibold text-brand-700 dark:text-brand-300">{d.esperado}</span>
              <span className="text-[9px] text-carvao-400">
                {d.pessimista}–{d.otimista}
              </span>
              {conf > 0 && (
                <span className="text-[8px] text-carvao-400">{conf}%</span>
              )}
            </div>
          );
        })}
      </div>

      {/* totais */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-areia-50 py-2 dark:bg-carvao-800">
          <p className="text-[11px] text-carvao-500">Pessimista</p>
          <p className="font-display text-lg font-bold text-carvao-700 dark:text-areia-100">{previsao.totalPessimista}</p>
        </div>
        <div className="rounded-2xl bg-brand-50 py-2 dark:bg-carvao-800">
          <p className="text-[11px] text-brand-600">Esperado</p>
          <p className="font-display text-lg font-bold text-brand-700 dark:text-brand-300">{previsao.totalEsperado}</p>
        </div>
        <div className="rounded-2xl bg-ouro-50 py-2 dark:bg-carvao-800">
          <p className="text-[11px] text-ouro-600">Otimista</p>
          <p className="font-display text-lg font-bold text-ouro-700 dark:text-ouro-300">{previsao.totalOtimista}</p>
        </div>
      </div>

      {/* aplicar à lista de compras */}
      {onPessoasAtualizadas && (
        <button
          onClick={aplicar}
          className="mt-4 w-full rounded-2xl bg-brand-600 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 active:scale-95"
        >
          Usar previsão otimista na lista de compras
        </button>
      )}

      {previsao.baseSemanas === 0 && (
        <p className="mt-3 text-center text-[11px] text-carvao-400">
          Registre as contagens reais de refeições para afinar a previsão semana a semana.
        </p>
      )}
    </section>
  );
}
