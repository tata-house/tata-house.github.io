'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabaseHabilitado, enviarTudo, baixarTudo } from '@/lib/cardapio/supabase';
import { Botao, Cartao, Secao } from '@/components/ui';

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

  useEffect(() => {
    if (!supabaseHabilitado()) return;
    rodar(enviarTudo);
    const timer = setInterval(() => rodar(enviarTudo), 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [rodar]);

  if (!disponivel) return null;

  const baixarERecarregar = async () => {
    await rodar(baixarTudo);
    if (typeof window !== 'undefined') window.location.reload();
  };

  return (
    <Secao titulo="☁️ Nuvem (backup automático)">
      <Cartao className="space-y-3">
        <p className="text-sm text-carvao-600 dark:text-areia-200">
          {sincronizando
            ? 'Sincronizando com a nuvem…'
            : ultimaSync
              ? `✓ Backup automático ativo — última sincronização: ${new Date(ultimaSync).toLocaleString('pt-BR')}`
              : 'Backup automático ativo. Os dados são enviados para a nuvem automaticamente.'}
        </p>
        {erro && <p className="text-xs font-semibold text-[#b04c41]">Erro ao sincronizar: {erro}</p>}
        <Botao variante="secundario" onClick={baixarERecarregar} disabled={sincronizando} className="w-full">
          {sincronizando ? 'Aguarde…' : '⬇️ Trazer dados de outro aparelho'}
        </Botao>
        <p className="text-[11px] text-carvao-400">
          Use este botão apenas para copiar os dados de outro celular ou computador para este aparelho.
        </p>
      </Cartao>
    </Secao>
  );
}
