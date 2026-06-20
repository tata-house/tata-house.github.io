'use client';

/* =====================================================================
   Motor de sincronização automática com a nuvem (Supabase) + PWA.
   - Registra o service worker (app abre offline).
   - Toda gravação local é espelhada na nuvem (fire-and-forget).
   - Ao abrir, traz o que está na nuvem e recarrega só se algo mudou.
   - AO VIVO: escuta mudanças de outros aparelhos (Supabase Realtime) e
     aplica na hora, recarregando quando seguro (nunca no meio de uma edição).
   Quando o Supabase está desligado, só o service worker é registrado.
   ===================================================================== */

import { useEffect } from 'react';
import {
  armazenamentoSupabase,
  supabaseHabilitado,
  getSupabase,
  ESPACO_DADOS,
} from '@/lib/cardapio/supabase';

const PREFIXO = 'cardapio.v1.';

/** True quando o foco está num campo editável (para não recarregar no meio). */
function editando(): boolean {
  if (typeof document === 'undefined') return false;
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

export function BootNuvem() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 0) Service worker (PWA offline) — independe do Supabase.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    if (!supabaseHabilitado()) return;

    const orig = localStorage.setItem.bind(localStorage);

    // chaves que ESTE aparelho acabou de gravar — para ignorar o próprio eco
    // quando o Realtime devolver a mudança que nós mesmos fizemos.
    const recentes: Map<string, number> =
      (window as unknown as { __nuvemRecentes?: Map<string, number> }).__nuvemRecentes ??
      ((window as unknown as { __nuvemRecentes?: Map<string, number> }).__nuvemRecentes = new Map());

    // 1) Espelha toda gravação local (cardapio.v1.*) na nuvem.
    if (!(window as unknown as { __nuvemPatched?: boolean }).__nuvemPatched) {
      localStorage.setItem = (chave: string, valor: string) => {
        orig(chave, valor);
        if (typeof chave === 'string' && chave.startsWith(PREFIXO)) {
          const k = chave.slice(PREFIXO.length);
          recentes.set(k, Date.now());
          try {
            armazenamentoSupabase.gravar(k, JSON.parse(valor)).catch(() => {});
          } catch {
            /* valor não-JSON: ignora */
          }
        }
      };
      (window as unknown as { __nuvemPatched?: boolean }).__nuvemPatched = true;
    }

    // Aplica um valor vindo da nuvem ao local (sem reenviar). Retorna se mudou.
    const aplicarLocal = (chave: string, valorNuvem: unknown): boolean => {
      if (valorNuvem === null || valorNuvem === undefined) return false;
      const novo = JSON.stringify(valorNuvem);
      if (novo !== localStorage.getItem(PREFIXO + chave)) {
        orig(PREFIXO + chave, novo); // grava sem reenviar à nuvem
        return true;
      }
      return false;
    };

    // Recarrega quando for seguro (espera você terminar de digitar).
    let reloadAgendado = false;
    const agendarReload = () => {
      if (reloadAgendado) return;
      reloadAgendado = true;
      const tentar = () => {
        if (editando()) {
          setTimeout(tentar, 2500);
          return;
        }
        window.location.reload();
      };
      setTimeout(tentar, 800);
    };

    // 2) Uma vez por sessão: traz a nuvem e recarrega só se houver mudança.
    if (!sessionStorage.getItem('nuvem.boot')) {
      sessionStorage.setItem('nuvem.boot', '1');
      (async () => {
        try {
          const chaves = await armazenamentoSupabase.listarChaves();
          let mudou = false;
          for (const chave of chaves) {
            const valorNuvem = await armazenamentoSupabase.ler<unknown>(chave, null);
            if (aplicarLocal(chave, valorNuvem)) mudou = true;
          }
          if (mudou) window.location.reload();
        } catch {
          /* offline/erro: segue com os dados locais */
        }
      })();
    }

    // 3) AO VIVO: escuta mudanças de outros aparelhos e aplica na hora.
    let canal: { unsubscribe: () => void } | null = null;
    (async () => {
      try {
        const sb = await getSupabase();
        if (!sb) return;
        const cliente = sb as unknown as { channel: (nome: string) => unknown };
        const ch = cliente.channel('tata_estado_rt') as {
          on: (ev: string, cfg: unknown, cb: (p: { new?: { chave?: string; valor?: unknown } }) => void) => typeof ch;
          subscribe: () => { unsubscribe: () => void };
        };
        canal = ch
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'tata_estado', filter: `espaco=eq.${ESPACO_DADOS}` },
            (payload) => {
              const linha = payload.new;
              if (!linha || typeof linha.chave !== 'string') return;
              const ts = recentes.get(linha.chave);
              if (ts && Date.now() - ts < 8000) return; // eco da nossa própria escrita
              if (aplicarLocal(linha.chave, linha.valor)) agendarReload();
            },
          )
          .subscribe();
      } catch {
        /* realtime indisponível: segue com boot + espelhamento */
      }
    })();

    return () => {
      try {
        canal?.unsubscribe();
      } catch {
        /* ignore */
      }
    };
  }, []);

  return null;
}
