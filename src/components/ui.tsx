'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { PIX_BADGE, PIX_LABEL, STATUS_BADGE, STATUS_LABEL } from '@/lib/constants';
import type { PixStatus, ReservaStatus } from '@/lib/types';

export function Botao({
  variante = 'primario',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: 'primario' | 'secundario' | 'perigo' | 'sucesso' | 'alerta';
}) {
  const estilos = {
    primario: 'bg-brand-600 hover:bg-brand-700 text-white',
    secundario:
      'bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100',
    perigo: 'bg-red-600 hover:bg-red-700 text-white',
    sucesso: 'bg-green-600 hover:bg-green-700 text-white',
    alerta: 'bg-orange-500 hover:bg-orange-600 text-white',
  };
  return (
    <button
      className={`min-h-12 rounded-xl px-4 py-3 text-base font-semibold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${estilos[variante]} ${className}`}
      {...props}
    />
  );
}

export function Cartao({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 ${className}`}
    >
      {children}
    </div>
  );
}

export function BadgeStatus({ status }: { status: ReservaStatus }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold ${STATUS_BADGE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function BadgePix({ status }: { status: PixStatus }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold ${PIX_BADGE[status]}`}>
      Pix: {PIX_LABEL[status]}
    </span>
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" onClick={aoFechar}>
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 dark:bg-gray-800 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{titulo}</h2>
          <button
            onClick={aoFechar}
            aria-label="Fechar"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl dark:bg-gray-700"
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
  'w-full min-h-12 rounded-xl border border-gray-300 bg-white px-4 py-3 text-base dark:border-gray-600 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500';

export const estiloRotulo = 'mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300';
