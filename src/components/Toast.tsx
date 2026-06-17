'use client';

/* =====================================================================
   Toast leve — feedback visual de "salvo / feito", com ação opcional de
   desfazer. Emissor global; um único host na tela.
   ===================================================================== */

import { useEffect, useState } from 'react';

interface AcaoToast {
  rotulo: string;
  fn: () => void;
}

interface ToastMsg {
  id: number;
  texto: string;
  tom: 'ok' | 'info' | 'erro';
  acao?: AcaoToast;
}

let seq = 0;
const ouvintes = new Set<(t: ToastMsg) => void>();

export function toast(texto: string, tom: ToastMsg['tom'] = 'ok', acao?: AcaoToast) {
  const msg = { id: ++seq, texto, tom, acao };
  ouvintes.forEach((f) => f(msg));
}

export function ToastHost() {
  const [msgs, setMsgs] = useState<ToastMsg[]>([]);

  useEffect(() => {
    const f = (t: ToastMsg) => {
      setMsgs((m) => [...m, t]);
      setTimeout(() => setMsgs((m) => m.filter((x) => x.id !== t.id)), t.acao ? 5000 : 2600);
    };
    ouvintes.add(f);
    return () => {
      ouvintes.delete(f);
    };
  }, []);

  const fechar = (id: number) => setMsgs((m) => m.filter((x) => x.id !== id));

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 print:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {msgs.map((m) => (
        <div
          key={m.id}
          className={`animate-subir pointer-events-auto flex items-center gap-3 rounded-full py-2.5 pl-4 pr-2 text-sm font-semibold text-white shadow-flutuante ${
            m.tom === 'erro' ? 'bg-[#b04c41]' : m.tom === 'info' ? 'bg-carvao-800' : 'bg-brand-600'
          }`}
        >
          <span className="flex items-center gap-2">
            <span>{m.tom === 'erro' ? '⚠️' : m.tom === 'info' ? 'ℹ️' : '✅'}</span>
            {m.texto}
          </span>
          {m.acao ? (
            <button
              onClick={() => {
                m.acao!.fn();
                fechar(m.id);
              }}
              className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold transition hover:bg-white/30"
            >
              {m.acao.rotulo}
            </button>
          ) : (
            <span className="w-1" />
          )}
        </div>
      ))}
    </div>
  );
}
