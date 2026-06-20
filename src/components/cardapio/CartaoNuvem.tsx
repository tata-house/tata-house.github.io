'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabaseHabilitado, enviarTudo, baixarTudo } from '@/lib/cardapio/supabase';
import { Botao, Cartao, Secao } from '@/components/ui';

const CHAVE_SESSAO = 'tata_sync_inicial';

export function CartaoNuvem() {
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

  // Sincronização automática nos dois sentidos.
  useEffect(() => {
    if (!supabaseHabilitado()) return;

    let cancelado = false;

    // 1) Ao abrir o app (uma vez por sessão): baixa o que há de mais novo na
    //    nuvem e recarrega para a tela refletir os dados de outros aparelhos.
    const jaBaixou = typeof window !== 'undefined' && sessionStorage.getItem(CHAVE_SESSAO);
    if (!jaBaixou) {
      (async () => {
        try {
          await baixarTudo();
        } catch {
          /* ignora — segue com o que está no aparelho */
        }
        if (cancelado) return;
        sessionStorage.setItem(CHAVE_SESSAO, '1');
        window.location.reload();
      })();
      return () => {
        cancelado = true;
      };
    }

    // 2) Já baixou nesta sessão: a partir daqui sobe as alterações para a
    //    nuvem automaticamente (ao abrir, a cada minuto e ao sair da tela).
    rodar(enviarTudo);
    const timer = setInterval(() => rodar(enviarTudo), 60 * 1000);

    const aoEsconder = () => {
      if (document.visibilityState === 'hidden') enviarTudo();
    };
    document.addEventListener('visibilitychange', aoEsconder);

    return () => {
      cancelado = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', aoEsconder);
    };
  }, [rodar]);

  if (!disponivel) return null;

  const atualizarAgora = async () => {
    await rodar(baixarTudo);
    if (typeof window !== 'undefined') window.location.reload();
  };

  return (
    <Secao titulo="☁️ Nuvem (sincronização automática)">
      <Cartao className="space-y-3">
        <p className="text-sm text-carvao-600 dark:text-areia-200">
          {sincronizando
            ? 'Sincronizando com a nuvem…'
            : ultimaSync
              ? `✓ Sincronização automática ativa — última: ${new Date(ultimaSync).toLocaleString('pt-BR')}`
              : 'Sincronização automática ativa. Os dados são salvos e atualizados entre aparelhos automaticamente.'}
        </p>
        {erro && <p className="text-xs font-semibold text-[#b04c41]">Erro ao sincronizar: {erro}</p>}
        <Botao variante="secundario" onClick={atualizarAgora} disabled={sincronizando} className="w-full">
          {sincronizando ? 'Aguarde…' : '🔄 Atualizar agora'}
        </Botao>
        <p className="text-[11px] text-carvao-400">
          Ao abrir o app, ele já traz o que há de mais novo da nuvem, e suas alterações sobem sozinhas.
          Use "Atualizar agora" se quiser puxar as novidades sem reabrir o app.
        </p>
      </Cartao>
    </Secao>
  );
}
