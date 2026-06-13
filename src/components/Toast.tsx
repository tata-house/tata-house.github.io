'use client';

/* =====================================================================
   Toast leve — feedback visual de "salvo / feito". Emissor global para
   qualquer componente disparar sem prop drilling; um único host na tela.
   ===================================================================== */

import { useEffect, useState } from 'react';

interface ToastMsg {
  id: number;
  texto: string;
  tom: 'ok' | 'info' | 'erro';
}

let seq = 0;
const ouvintes = new Set<(t: ToastMsg) => void>();

export function toast(texto: string, tom: ToastMsg['tom'] = 'ok') {
  const msg = { id: ++seq, texto, tom };
  ouvintes.forEach((f) => f(msg));
}

export function ToastHost() {
  const [msgs, setMsgs] = useState<ToastMsg[]>([]);

  useEffect(() => {
    const f = (t: ToastMsg) => {
      setMsgs((m) => [...m, t]);
      setTimeout(() => setMsgs((m) => m.filter((x) => x.id !== t.id)), 2600);
    };
    ouvintes.add(f);
    return () => {
      ouvintes.delete(f);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 print:hidden">
      {msgs.map((m) => (
        <div
          key={m.id}
          className={`animate-subir pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-white shadow-flutuante ${
            m.tom === 'erro' ? 'bg-[#b04c41]' : m.tom === 'info' ? 'bg-carvao-800' : 'bg-brand-600'
          }`}
        >
          <span>{m.tom === 'erro' ? '⚠️' : m.tom === 'info' ? 'ℹ️' : '✅'}</span>
          {m.texto}
        </div>
      ))}
    </div>
  );
}
