'use client';

import { useEffect, useState } from 'react';

export function AlternadorTema() {
  const [escuro, setEscuro] = useState(false);

  useEffect(() => {
    const salvo = localStorage.getItem('tema');
    const inicial = salvo ? salvo === 'escuro' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    setEscuro(inicial);
    document.documentElement.classList.toggle('dark', inicial);
  }, []);

  function alternar() {
    const novo = !escuro;
    setEscuro(novo);
    document.documentElement.classList.toggle('dark', novo);
    localStorage.setItem('tema', novo ? 'escuro' : 'claro');
  }

  return (
    <button
      onClick={alternar}
      aria-label="Alternar modo escuro"
      className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-lg dark:bg-gray-700"
    >
      {escuro ? '☀️' : '🌙'}
    </button>
  );
}
