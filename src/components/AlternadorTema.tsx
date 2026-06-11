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
      className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.05] text-base ring-1 ring-white/[0.07] transition hover:bg-white/10"
    >
      {escuro ? '☀️' : '🌙'}
    </button>
  );
}
