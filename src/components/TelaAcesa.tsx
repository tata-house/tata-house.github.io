'use client';

import { useEffect } from 'react';

/** Mantém a tela do tablet acesa durante a operação (Screen Wake Lock).
 *  Re-pede o bloqueio sempre que a aba volta a ficar visível. */
export function TelaAcesa() {
  useEffect(() => {
    type WakeLockSentinel = { release: () => Promise<void> };
    let trava: WakeLockSentinel | null = null;

    async function pedir() {
      try {
        const wl = (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<WakeLockSentinel> } }).wakeLock;
        if (!wl) return;
        trava = await wl.request('screen');
      } catch {
        // sem suporte ou sem permissão — segue sem travar a tela
      }
    }

    void pedir();
    const aoVisivel = () => {
      if (document.visibilityState === 'visible') void pedir();
    };
    document.addEventListener('visibilitychange', aoVisivel);
    return () => {
      document.removeEventListener('visibilitychange', aoVisivel);
      void trava?.release().catch(() => {});
    };
  }, []);

  return null;
}
