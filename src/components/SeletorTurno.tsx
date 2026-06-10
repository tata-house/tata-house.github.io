'use client';

import { TURNOS } from '@/lib/constants';
import type { Turno } from '@/lib/types';

export function SeletorTurno({
  valor,
  aoMudar,
  permitirTodos = false,
}: {
  valor: Turno | 'todos';
  aoMudar: (t: Turno | 'todos') => void;
  permitirTodos?: boolean;
}) {
  const opcoes: (Turno | 'todos')[] = permitirTodos ? ['todos', ...TURNOS] : TURNOS;
  return (
    <div className="flex gap-2">
      {opcoes.map((t) => (
        <button
          key={t}
          onClick={() => aoMudar(t)}
          className={`min-h-12 flex-1 rounded-xl px-4 text-base font-bold transition ${
            valor === t
              ? 'bg-brand-600 text-white shadow'
              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
          }`}
        >
          {t === 'todos' ? 'Todos' : `Turno ${t}`}
        </button>
      ))}
    </div>
  );
}
