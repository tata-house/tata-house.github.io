'use client';

import { useMemo, useState } from 'react';
import { Modal, estiloInput } from '@/components/cardapio/ui';
import { normalizar } from '@/lib/cardapio/motor';

/**
 * Seletor de prato pesquisável (mobile-first): toque abre modal com busca.
 * Digitar um valor fora da lista continua possível — fica como exceção.
 */
export function SeletorPrato({
  rotulo,
  valor,
  opcoes,
  aoEscolher,
  desabilitado = false,
  destaque,
}: {
  rotulo: string;
  valor: string;
  opcoes: string[];
  aoEscolher: (v: string) => void;
  desabilitado?: boolean;
  destaque?: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');

  const filtradas = useMemo(() => {
    const n = normalizar(busca);
    if (!n) return opcoes;
    return opcoes.filter((o) => normalizar(o).includes(n));
  }, [busca, opcoes]);

  const escolher = (v: string) => {
    aoEscolher(v);
    setAberto(false);
    setBusca('');
  };

  return (
    <>
      <button
        type="button"
        disabled={desabilitado}
        onClick={() => setAberto(true)}
        className={`flex w-full items-center justify-between gap-2 rounded-2xl border px-3 py-2.5 text-left transition disabled:opacity-50 ${
          valor
            ? 'border-carvao-200 bg-white dark:border-carvao-600 dark:bg-carvao-900'
            : 'border-dashed border-carvao-300 bg-areia-50 dark:border-carvao-600 dark:bg-carvao-900/60'
        }`}
      >
        <span className="min-w-0">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-carvao-400">
            {rotulo}
          </span>
          <span
            className={`block truncate text-[13px] font-extrabold uppercase tracking-wide ${
              valor ? 'text-carvao-900 dark:text-areia-100' : 'font-semibold normal-case text-carvao-300 dark:text-carvao-500'
            }`}
          >
            {valor || 'Escolher…'}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {destaque}
          <span className="text-carvao-300">▾</span>
        </span>
      </button>

      <Modal titulo={rotulo} aberto={aberto} aoFechar={() => setAberto(false)}>
        <input
          autoFocus
          className={estiloInput}
          placeholder="Buscar ou digitar…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <div className="mt-3 max-h-[50vh] space-y-1 overflow-y-auto">
          {valor && (
            <button
              type="button"
              onClick={() => escolher('')}
              className="w-full rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold text-[#b04c41] hover:bg-areia-100 dark:hover:bg-carvao-700"
            >
              ✕ Limpar seleção
            </button>
          )}
          {busca.trim() && !filtradas.some((o) => normalizar(o) === normalizar(busca)) && (
            <button
              type="button"
              onClick={() => escolher(busca.trim())}
              className="w-full rounded-xl bg-ouro-300/20 px-3 py-2.5 text-left text-[14px] font-semibold text-carvao-800 ring-1 ring-ouro-400/40 hover:bg-ouro-300/30 dark:text-areia-100"
            >
              Usar “{busca.trim()}” (fora da lista — exceção)
            </button>
          )}
          {filtradas.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => escolher(o)}
              className={`w-full rounded-xl px-3 py-2.5 text-left text-[14px] font-medium transition hover:bg-areia-100 dark:hover:bg-carvao-700 ${
                normalizar(o) === normalizar(valor)
                  ? 'bg-brand-50 font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                  : 'text-carvao-700 dark:text-areia-200'
              }`}
            >
              {o}
            </button>
          ))}
          {filtradas.length === 0 && !busca.trim() && (
            <p className="px-3 py-4 text-sm text-carvao-400">Nenhuma opção cadastrada.</p>
          )}
        </div>
      </Modal>
    </>
  );
}
