'use client';

import { useEffect, useRef, useState } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icone } from './Icones';

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
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-[14px] font-bold tracking-tight transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-400 hover:-translate-y-px active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transform-none ${estilos[variante]} ${className}`}
      {...props}
    />
  );
}

export function Cartao({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-3xl border border-carvao-100 bg-white p-5 shadow-suave transition-shadow duration-200 dark:border-carvao-700/70 dark:bg-carvao-850 ${className}`}
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

/* ---------------------------------------------------------------------
   Primitivos de leitura gerencial (dashboard, indicadores, rankings).
   --------------------------------------------------------------------- */

const TOM_PILULA = {
  neutro: 'bg-carvao-100 text-carvao-600 ring-carvao-200 dark:bg-carvao-700 dark:text-areia-200 dark:ring-carvao-600',
  verde: 'bg-brand-500/12 text-brand-700 ring-brand-500/30 dark:text-brand-300',
  ouro: 'bg-ouro-400/15 text-[#8a6a2e] ring-ouro-400/30 dark:text-ouro-300',
  vermelho: 'bg-[#b04c41]/12 text-[#b04c41] ring-[#b04c41]/30 dark:text-[#e89a90]',
  azul: 'bg-[#2d6f8e]/12 text-[#2d6f8e] ring-[#2d6f8e]/30 dark:text-[#7cb8d4]',
} as const;

export function Pilula({
  children,
  tom = 'neutro',
  className = '',
}: {
  children: ReactNode;
  tom?: keyof typeof TOM_PILULA;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-tight ring-1 ${TOM_PILULA[tom]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Kpi({
  rotulo,
  valor,
  detalhe,
  tom = 'neutro',
  icone,
}: {
  rotulo: string;
  valor: ReactNode;
  detalhe?: ReactNode;
  tom?: keyof typeof TOM_PILULA;
  icone?: ReactNode;
}) {
  const barra = {
    neutro: 'from-carvao-300 to-carvao-400',
    verde: 'from-brand-500 to-brand-600',
    ouro: 'from-ouro-300 to-ouro-500',
    vermelho: 'from-[#c96a5f] to-[#b04c41]',
    azul: 'from-[#4d92b0] to-[#2d6f8e]',
  }[tom];
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-carvao-100 bg-white p-4 shadow-suave transition-all duration-200 hover:-translate-y-0.5 hover:shadow-flutuante motion-reduce:transform-none motion-reduce:transition-none dark:border-carvao-700/70 dark:bg-carvao-850">
      <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r transition-all duration-200 group-hover:h-1.5 ${barra}`} />
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-carvao-500 dark:text-carvao-300">{rotulo}</p>
        {icone && <span className="text-base leading-none opacity-70">{icone}</span>}
      </div>
      <p className="mt-1 font-display text-[26px] font-bold leading-none text-carvao-900 tabular-nums dark:text-areia-50">{valor}</p>
      {detalhe && <p className="mt-1.5 text-[11px] font-semibold text-carvao-400">{detalhe}</p>}
    </div>
  );
}

export function EstadoVazio({
  icone = '✨',
  titulo,
  texto,
  acao,
}: {
  icone?: ReactNode;
  titulo: string;
  texto?: string;
  acao?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-carvao-200 bg-white/60 px-6 py-12 text-center dark:border-carvao-700 dark:bg-carvao-850/60">
      <span className="text-4xl">{icone}</span>
      <p className="font-display text-lg font-semibold text-carvao-700 dark:text-areia-100">{titulo}</p>
      {texto && <p className="max-w-sm text-sm text-carvao-400">{texto}</p>}
      {acao && <div className="mt-2">{acao}</div>}
    </div>
  );
}

export function BarraMini({ valor, tom = 'verde' }: { valor: number; tom?: keyof typeof TOM_PILULA }) {
  const cor = {
    neutro: 'bg-carvao-300',
    verde: 'bg-brand-500',
    ouro: 'bg-ouro-400',
    vermelho: 'bg-[#b04c41]',
    azul: 'bg-[#2d6f8e]',
  }[tom];
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-carvao-100 dark:bg-carvao-700">
      <div className={`h-full rounded-full ${cor} transition-all`} style={{ width: `${Math.max(0, Math.min(100, valor * 100))}%` }} />
    </div>
  );
}

export function Secao({ titulo, acao, children }: { titulo: ReactNode; acao?: ReactNode; children?: ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-semibold text-carvao-800 dark:text-areia-100">{titulo}</h2>
        {acao}
      </div>
      {children}
    </div>
  );
}

/** Placeholder de carregamento com brilho (performance percebida). */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-carvao-100 dark:bg-carvao-800/80 ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-brilho bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/5" />
    </div>
  );
}

/** Folha inferior — modal mobile-first que sobe de baixo, com pegador. */
export function BottomSheet({
  titulo,
  aberto,
  aoFechar,
  children,
}: {
  titulo?: string;
  aberto: boolean;
  aoFechar: () => void;
  children: ReactNode;
}) {
  if (!aberto) return null;
  return (
    <div
      className="fixed inset-0 z-[55] flex items-end justify-center bg-carvao-950/55 backdrop-blur-[2px] animate-aparecer sm:items-center sm:p-6"
      onClick={aoFechar}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-flutuante animate-deslizar dark:bg-carvao-850 sm:rounded-3xl"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-carvao-200 dark:bg-carvao-600" />
        {titulo && (
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">{titulo}</h2>
            <button
              onClick={aoFechar}
              aria-label="Fechar"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-areia-100 text-carvao-500 transition hover:bg-areia-200 dark:bg-carvao-700 dark:text-areia-200"
            >
              <Icone nome="fechar" tam={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/** Controle numérico − valor + (sem teclado; alvos de 44px). */
export function Stepper({
  valor,
  aoMudar,
  min = 0,
  passo = 1,
  sufixo,
}: {
  valor: number;
  aoMudar: (v: number) => void;
  min?: number;
  passo?: number;
  sufixo?: string;
}) {
  const bt =
    'flex h-11 w-11 items-center justify-center rounded-xl text-carvao-600 transition hover:bg-carvao-100 active:scale-95 disabled:opacity-30 dark:text-areia-200 dark:hover:bg-carvao-700';
  return (
    <div className="inline-flex items-center gap-1 rounded-2xl border border-carvao-200 bg-white p-1 dark:border-carvao-600 dark:bg-carvao-900">
      <button type="button" className={bt} onClick={() => aoMudar(Math.max(min, valor - passo))} disabled={valor <= min} aria-label="Diminuir">
        <Icone nome="subtrair" tam={18} />
      </button>
      <span className="min-w-[3ch] px-1 text-center text-base font-bold tabular-nums">
        {valor}
        {sufixo ? <span className="ml-0.5 text-xs font-semibold text-carvao-400">{sufixo}</span> : null}
      </span>
      <button type="button" className={bt} onClick={() => aoMudar(valor + passo)} aria-label="Aumentar">
        <Icone nome="somar" tam={18} />
      </button>
    </div>
  );
}

/** Número que "conta" até o valor (recompensa visual sutil em KPIs/ROI). */
export function Contador({
  valor,
  formato,
  duracao = 650,
  className = '',
}: {
  valor: number;
  formato?: (n: number) => string;
  duracao?: number;
  className?: string;
}) {
  const [n, setN] = useState(valor);
  const de = useRef(valor);

  useEffect(() => {
    const inicio = de.current;
    const delta = valor - inicio;
    if (delta === 0) return;
    const reduz =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduz) {
      de.current = valor;
      setN(valor);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duracao);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(inicio + delta * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else de.current = valor;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [valor, duracao]);

  return <span className={className}>{formato ? formato(n) : Math.round(n).toLocaleString('pt-BR')}</span>;
}
