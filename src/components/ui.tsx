'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

/* =====================================================================
   Mini design system TATÁ Sushi — Cardápios da Equipe
   Tom: hospitalidade premium, grafite + areia + verde da marca.
   Tablet-first: alvos de toque ≥ 48px, cantos generosos, sombras suaves.
   ===================================================================== */

export function Botao({
  variante = 'primario',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: 'primario' | 'secundario' | 'perigo' | 'sucesso' | 'alerta';
}) {
  const estilos = {
    primario: 'bg-brand-700 text-white hover:bg-brand-800 shadow-suave',
    secundario:
      'bg-white text-brand-700 ring-2 ring-brand-600/40 hover:bg-brand-50 hover:ring-brand-600 dark:bg-carvao-800 dark:text-brand-300 dark:ring-brand-500/40 dark:hover:bg-carvao-700',
    perigo: 'bg-[#b04c41] text-white hover:bg-[#9b4038] shadow-suave',
    sucesso: 'bg-brand-600 text-white hover:bg-brand-700 shadow-suave',
    alerta: 'bg-[#d18a3a] text-white hover:bg-[#bd7a2f] shadow-suave',
  };
  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-[14px] font-extrabold uppercase tracking-wide transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${estilos[variante]} ${className}`}
      {...props}
    />
  );
}

export function Cartao({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-3xl border border-carvao-100 bg-white p-5 shadow-suave dark:border-carvao-700/70 dark:bg-carvao-850 ${className}`}
    >
      {children}
    </div>
  );
}

export function Modal({
  titulo,
  aberto,
  aoFechar,
  children,
}: {
  titulo: string;
  aberto: boolean;
  aoFechar: () => void;
  children: ReactNode;
}) {
  if (!aberto) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-carvao-950/55 backdrop-blur-[2px] animate-aparecer sm:items-center sm:p-6"
      onClick={aoFechar}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-flutuante animate-subir dark:bg-carvao-850 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold tracking-tight">{titulo}</h2>
          <button
            onClick={aoFechar}
            aria-label="Fechar"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-areia-100 text-base text-carvao-500 transition hover:bg-areia-200 hover:text-carvao-800 dark:bg-carvao-700 dark:text-areia-200 dark:hover:bg-carvao-600"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const estiloInput =
  'w-full min-h-12 rounded-2xl border border-carvao-200 bg-white px-4 py-3 text-base text-carvao-900 placeholder:text-carvao-300 transition focus:border-carvao-400 focus:outline-none focus:ring-2 focus:ring-carvao-900/10 dark:border-carvao-600 dark:bg-carvao-900 dark:text-areia-100 dark:placeholder:text-carvao-500 dark:focus:border-carvao-400 dark:focus:ring-white/10';

export const estiloRotulo =
  'mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-carvao-400 dark:text-carvao-300';
