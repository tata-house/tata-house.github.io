'use client';

/* =====================================================================
   Sincronização localStorage ⇄ Supabase (tabela KV tata_estado). Tudo é
   opt-in: enquanto o Supabase estiver desligado, o hook reporta indisponível
   e nada acontece. Quando ligado, dá para "enviar" (subir o estado local) e
   "baixar" (trazer o remoto para o dispositivo). É a base para, num próximo
   passo, fazer o app ler/gravar direto no remoto.
   ===================================================================== */

import { useCallback, useEffect, useState } from 'react';
import { supabaseHabilitado } from './config';
import { armazenamentoLocal, armazenamentoSupabase } from './armazenamento';

/** Sobe todas as chaves do localStorage para o Supabase. */
export async function enviarTudo(): Promise<number> {
  if (!supabaseHabilitado()) return 0;
  const chaves = await armazenamentoLocal.listarChaves();
  let n = 0;
  for (const chave of chaves) {
    const valor = await armazenamentoLocal.ler<unknown>(chave, null);
    if (valor !== null) {
      await armazenamentoSupabase.gravar(chave, valor);
      n++;
    }
  }
  return n;
}

/** Traz todas as chaves do Supabase para o localStorage deste dispositivo. */
export async function baixarTudo(): Promise<number> {
  if (!supabaseHabilitado()) return 0;
  const chaves = await armazenamentoSupabase.listarChaves();
  let n = 0;
  for (const chave of chaves) {
    const valor = await armazenamentoSupabase.ler<unknown>(chave, null);
    if (valor !== null) {
      await armazenamentoLocal.gravar(chave, valor);
      n++;
    }
  }
  return n;
}

export interface EstadoSync {
  disponivel: boolean;
  sincronizando: boolean;
  ultimaSync: string | null;
  erro: string | null;
  enviar: () => Promise<void>;
  baixar: () => Promise<void>;
}

/** Hook de sincronização — no-op seguro quando o Supabase está desligado. */
export function useSincronizacao(): EstadoSync {
  const [disponivel, setDisponivel] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [ultimaSync, setUltimaSync] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => setDisponivel(supabaseHabilitado()), []);

  const rodar = useCallback(async (fn: () => Promise<number>) => {
    if (!supabaseHabilitado()) return;
    setSincronizando(true);
    setErro(null);
    try {
      await fn();
      setUltimaSync(new Date().toISOString());
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha na sincronização');
    } finally {
      setSincronizando(false);
    }
  }, []);

  const enviar = useCallback(() => rodar(enviarTudo), [rodar]);
  const baixar = useCallback(() => rodar(baixarTudo), [rodar]);

  return { disponivel, sincronizando, ultimaSync, erro, enviar, baixar };
}
