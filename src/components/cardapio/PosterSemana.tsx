'use client';

import type { EstadoSemana } from '@/lib/cardapio/tipos';

export function PosterSemana({
  estado,
  semanaId,
  aoFechar,
}: {
  estado: EstadoSemana;
  semanaId: string;
  aoFechar: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-carvao-950/80 p-6">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-flutuante dark:bg-carvao-850">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Poster da Semana</h2>
          <button onClick={aoFechar} className="text-carvao-400 hover:text-carvao-700">✕</button>
        </div>
        <p className="text-sm text-carvao-400">Semana: {semanaId}</p>
      </div>
    </div>
  );
}