'use client';

/* =====================================================================
   Fronteira de erro de rota (App Router). Se qualquer tela quebrar, em vez
   de tela branca o usuário vê uma mensagem calma com opção de tentar de
   novo (sem perder os dados, que vivem no localStorage) ou recarregar.
   ===================================================================== */

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // registro leve no console para diagnóstico (sem serviço externo)
    console.error('[tata-house] erro de tela:', error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="text-5xl" aria-hidden>🍵</span>
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-carvao-900 dark:text-white">
          Algo saiu do prato
        </h1>
        <p className="max-w-sm text-sm leading-relaxed text-carvao-500 dark:text-texto-suave">
          Tivemos um tropeço ao montar esta tela. Seus dados estão salvos — é só
          tentar de novo.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="min-h-12 rounded-2xl bg-brand-700 px-6 py-3 text-sm font-bold text-white shadow-suave transition hover:bg-brand-800 active:scale-[0.98]"
        >
          Tentar de novo
        </button>
        <button
          onClick={() => { if (typeof window !== 'undefined') window.location.reload(); }}
          className="min-h-12 rounded-2xl border border-carvao-200 px-6 py-3 text-sm font-semibold text-carvao-600 transition hover:bg-carvao-50 dark:border-carvao-700 dark:text-areia-200 dark:hover:bg-carvao-800"
        >
          Recarregar o app
        </button>
      </div>
    </main>
  );
}
