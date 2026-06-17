'use client';

/* =====================================================================
   Cartão de backup na nuvem (Supabase). Aparece só quando o Supabase está
   configurado (env vars presentes). Deixa enviar o estado do aparelho para a
   nuvem e baixar de volta em outro dispositivo. Sem Supabase, não renderiza
   nada — o app segue 100% local.
   ===================================================================== */

import { useSincronizacao } from '@/lib/cardapio/supabase';
import { Botao, Cartao, Secao } from '@/components/cardapio/ui';

export function CartaoNuvem() {
  const { disponivel, sincronizando, ultimaSync, erro, enviar, baixar } = useSincronizacao();

  if (!disponivel) return null;

  const baixarERecarregar = async () => {
    await baixar();
    // recarrega para a tela refletir os dados que vieram da nuvem
    if (typeof window !== 'undefined') window.location.reload();
  };

  return (
    <Secao titulo="☁️ Nuvem (backup)">
      <Cartao className="space-y-3">
        <p className="text-sm text-carvao-600 dark:text-areia-200">
          Seus dados ficam guardados neste aparelho. Use a nuvem para salvar uma cópia e abrir o app de outro
          celular ou computador com tudo igual.
        </p>
        <div className="flex flex-wrap gap-2">
          <Botao onClick={enviar} disabled={sincronizando} className="flex-1">
            {sincronizando ? 'Enviando…' : '⬆️ Enviar para a nuvem'}
          </Botao>
          <Botao variante="secundario" onClick={baixarERecarregar} disabled={sincronizando} className="flex-1">
            {sincronizando ? 'Baixando…' : '⬇️ Baixar da nuvem'}
          </Botao>
        </div>
        {ultimaSync && !erro && (
          <p className="text-xs font-semibold text-brand-600 dark:text-brand-300">
            ✓ Última sincronização: {new Date(ultimaSync).toLocaleString('pt-BR')}
          </p>
        )}
        {erro && <p className="text-xs font-semibold text-[#b04c41]">Erro ao sincronizar: {erro}</p>}
        <p className="text-[11px] text-carvao-400">
          <strong>Enviar</strong> sobe o que está neste aparelho. <strong>Baixar</strong> traz o que está na nuvem
          (e recarrega a tela). Use o mesmo botão em cada dispositivo para manter tudo igual.
        </p>
      </Cartao>
    </Secao>
  );
}
