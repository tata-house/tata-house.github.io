'use client';

/* =====================================================================
   Lista de compras — modo compacto (item 15) + conferência cardápio ×
   compras (item 16). Agrupada por dia, com checkbox de conferência,
   cabeçalho mostrando o que será servido e o status do dia. Limpa no
   celular e fácil de imprimir.
   ===================================================================== */

import { useMemo, useState } from 'react';
import { Cartao, Pilula, estiloInput } from '@/components/ui';
import { DIAS_SEMANA, formatarQtd, linhasDoDia, normalizar } from '@/lib/cardapio/motor';
import type { EstadoSemana } from '@/lib/cardapio/tipos';

function hojeIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ListaCompras({
  estado,
  fatores,
  atualizar,
  podeComprar,
}: {
  estado: EstadoSemana;
  fatores?: Record<string, number>;
  atualizar: (fn: (e: EstadoSemana) => EstadoSemana) => void;
  podeComprar: boolean;
}) {
  const [busca, setBusca] = useState('');
  const n = normalizar(busca);

  const toggle = (di: number, chave: string, comprado: boolean) =>
    atualizar((e) => ({
      ...e,
      status: {
        ...e.status,
        [di]: {
          ...(e.status[di] ?? {}),
          [chave]: { ...(e.status[di]?.[chave] ?? {}), compradoEm: comprado ? undefined : hojeIso() },
        },
      },
    }));

  const dias = useMemo(
    () =>
      estado.dias.map((dia, di) => {
        const todas = linhasDoDia(estado, di, fatores);
        const linhas = n ? todas.filter((l) => normalizar(l.item).includes(n)) : todas;
        const comprados = todas.filter((l) => l.status.compradoEm).length;
        const servido = [dia.principal, dia.guarnicaoFixa, dia.guarnicao, dia.salada, dia.sobremesa].filter(Boolean);
        return { di, dia, linhas, total: todas.length, comprados, servido };
      }),
    [estado, fatores, n],
  );

  const algumDia = dias.some((d) => d.dia.principal || d.total > 0);

  return (
    <div className="space-y-3">
      <input
        className={`${estiloInput} print:hidden`}
        placeholder="🔎 Buscar item…"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      {!algumDia && (
        <p className="text-sm text-carvao-400">Monte o cardápio para gerar a lista de compras.</p>
      )}

      {dias.map(({ di, dia, linhas, total, comprados, servido }) => {
        if (!dia.principal && total === 0) return null;
        const status = total === 0 ? 'vazio' : comprados === total ? 'completo' : comprados > 0 ? 'parcial' : 'pendente';
        return (
          <Cartao key={di} className="overflow-hidden !p-0">
            {/* Cabeçalho do dia — conferência (servido × status) */}
            <div className="bg-areia-100/70 px-4 py-2.5 dark:bg-carvao-800/60">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-base font-bold">{DIAS_SEMANA[di]}</h3>
                {status === 'completo' ? (
                  <Pilula tom="verde">✓ completo</Pilula>
                ) : status === 'parcial' ? (
                  <Pilula tom="ouro">faltam {total - comprados}</Pilula>
                ) : status === 'pendente' ? (
                  <Pilula tom="neutro">a comprar</Pilula>
                ) : null}
              </div>
              {servido.length > 0 && (
                <p className="mt-0.5 text-[11px] text-carvao-500 dark:text-areia-200">
                  <span className="font-semibold">Cardápio:</span> {servido.join(' · ')}
                </p>
              )}
            </div>

            {/* Checklist compacto */}
            {linhas.length === 0 ? (
              <p className="px-4 py-3 text-sm text-carvao-400">
                {total === 0 ? 'Sem itens de compra.' : 'Nenhum item encontrado na busca.'}
              </p>
            ) : (
              <ul className="divide-y divide-carvao-100 dark:divide-carvao-700/60">
                {linhas.map((l) => {
                  const comprado = !!l.status.compradoEm;
                  return (
                    <li key={l.chave}>
                      <button
                        type="button"
                        disabled={!podeComprar}
                        onClick={() => toggle(di, l.chave, comprado)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-areia-50 disabled:cursor-default dark:hover:bg-carvao-800/40"
                      >
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold ${
                            comprado
                              ? 'border-brand-600 bg-brand-600 text-white'
                              : 'border-carvao-300 text-transparent dark:border-carvao-500'
                          }`}
                        >
                          ✓
                        </span>
                        <span className={`min-w-0 flex-1 text-sm ${comprado ? 'text-carvao-400 line-through' : 'font-medium'}`}>
                          {l.item}
                          {l.manual && <span className="ml-1 text-[10px] font-bold uppercase text-ouro-600">extra</span>}
                        </span>
                        <span className={`shrink-0 text-sm font-bold tabular-nums ${comprado ? 'text-carvao-400' : ''}`}>
                          {formatarQtd(l.qtd)} {l.unid}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Cartao>
        );
      })}
    </div>
  );
}
