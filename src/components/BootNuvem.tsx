'use client';

/* =====================================================================
   Motor de sincronização automática com a nuvem (Supabase). Sem botões:
   - toda gravação local é espelhada na nuvem (fire-and-forget);
   - ao abrir, traz o que está na nuvem e recarrega só se algo mudou.
   Quando o Supabase está desligado, não faz nada — o app segue local.
   ===================================================================== */

import { useEffect } from 'react';
import { armazenamentoSupabase, supabaseHabilitado } from '@/lib/cardapio/supabase';

const PREFIXO = 'cardapio.v1.';

export function BootNuvem() {
  useEffect(() => {
    if (typeof window === 'undefined' || !supabaseHabilitado()) return;

    const orig = localStorage.setItem.bind(localStorage);

    // 1) Espelha toda gravação local (cardapio.v1.*) na nuvem.
    if (!(window as unknown as { __nuvemPatched?: boolean }).__nuvemPatched) {
      localStorage.setItem = (chave: string, valor: string) => {
        orig(chave, valor);
        if (typeof chave === 'string' && chave.startsWith(PREFIXO)) {
          try {
            armazenamentoSupabase.gravar(chave.slice(PREFIXO.length), JSON.parse(valor)).catch(() => {});
          } catch {
            /* valor não-JSON: ignora */
          }
        }
      };
      (window as unknown as { __nuvemPatched?: boolean }).__nuvemPatched = true;
    }

    // 2) Uma vez por sessão: traz a nuvem e recarrega apenas se houver mudança.
    if (sessionStorage.getItem('nuvem.boot')) return;
    sessionStorage.setItem('nuvem.boot', '1');
    (async () => {
      try {
        const chaves = await armazenamentoSupabase.listarChaves();
        let mudou = false;
        for (const chave of chaves) {
          const valorNuvem = await armazenamentoSupabase.ler<unknown>(chave, null);
          if (valorNuvem === null) continue;
          const novo = JSON.stringify(valorNuvem);
          if (novo !== localStorage.getItem(PREFIXO + chave)) {
            orig(PREFIXO + chave, novo); // grava sem reenviar à nuvem
            mudou = true;
          }
        }
        if (mudou) window.location.reload();
      } catch {
        /* offline/erro: segue com os dados locais */
      }
    })();
  }, []);

  return null;
}
