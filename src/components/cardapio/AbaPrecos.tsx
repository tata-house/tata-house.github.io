'use client';

import { useMemo, useState } from 'react';
import { Cartao, estiloInput } from '@/components/ui';
import { DADOS, normalizar } from '@/lib/cardapio/motor';

/**
 * Tabela de preços por item (R$ por unidade padrão). Opcional: alimenta o
 * custo estimado do cardápio e a otimização da sugestão automática.
 */
export function AbaPrecos({
  precos,
  definirPreco,
  fornecedores = {},
}: {
  precos: Record<string, number>;
  definirPreco: (itemNorm: string, valor: number | null) => void;
  fornecedores?: Record<string, string>;
}) {
  const [busca, setBusca] = useState('');

  const itens = useMemo(() => {
    const n = normalizar(busca);
    const base = n ? DADOS.itens.filter((i) => normalizar(i.n).includes(n)) : DADOS.itens;
    return base.slice(0, 60);
  }, [busca]);

  const cadastrados = Object.keys(precos).length;

  return (
    <div className="space-y-4">
      <Cartao className="space-y-3">
        <p className="text-sm text-carvao-500 dark:text-carvao-300">
          Preço médio pago por unidade de compra (ex.: Cenoura → R$ por <strong>kg</strong>). Com os preços dos
          itens mais usados, o app estima o custo de cada cardápio e compara com o orçamento.{' '}
          <strong>{cadastrados}</strong> itens já têm preço.
        </p>
        <input
          className={estiloInput}
          placeholder="Buscar item… (os mais usados aparecem primeiro)"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </Cartao>

      <Cartao className="!p-0">
        <ul className="divide-y divide-carvao-100 dark:divide-carvao-700/60">
          {itens.map((i) => {
            const k = normalizar(i.n);
            return (
              <li key={i.n} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{i.n}</p>
                  <p className="text-[11px] text-carvao-400">
                    {i.u} · usado {i.f}× no histórico
                    {fornecedores[k] && (
                      <span className="font-semibold text-brand-600"> · ↓ {fornecedores[k]}</span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 text-sm">
                  <span className="text-carvao-400">R$</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    value={precos[k] ?? ''}
                    placeholder="0,00"
                    onChange={(e) =>
                      definirPreco(k, e.target.value === '' ? null : Number(e.target.value))
                    }
                    className="w-24 rounded-xl border border-carvao-200 bg-white px-2 py-1.5 text-right font-bold dark:border-carvao-600 dark:bg-carvao-900"
                  />
                  <span className="w-7 text-[11px] text-carvao-400">/{i.u}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </Cartao>
    </div>
  );
}
