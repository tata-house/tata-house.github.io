'use client';

/* =====================================================================
   Configurações — troca dos PINs de acesso por perfil. Aparece no Painel
   (visível só para a Gerência). Substitui o uso dos PINs padrão.
   ===================================================================== */

import { useState } from 'react';
import { toast } from '@/components/Toast';
import { Botao, Cartao, Secao } from '@/components/ui';
import { PERFIS, useLogin } from '@/lib/cardapio/login';

export function Configuracoes() {
  const { definirPin } = useLogin();
  const [pins, setPins] = useState<Record<string, string>>({});

  const salvar = (id: string, rotulo: string) => {
    const v = (pins[id] ?? '').trim();
    if (v.length < 4) {
      toast('Use um PIN de pelo menos 4 dígitos', 'erro');
      return;
    }
    definirPin(id as never, v);
    toast(`PIN de ${rotulo} atualizado`);
    setPins((s) => ({ ...s, [id]: '' }));
  };

  return (
    <Secao titulo="Configurações — PINs de acesso">
      <Cartao className="space-y-3">
        <p className="text-xs text-carvao-500 dark:text-areia-200">
          Defina um PIN próprio para cada perfil (substitui os PINs padrão). Guarde com segurança e compartilhe só com
          quem deve ter acesso.
        </p>
        {PERFIS.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-2">
            <span className="w-44 shrink-0 text-sm font-semibold">
              {p.icone} {p.rotulo}
            </span>
            <input
              type="password"
              inputMode="numeric"
              value={pins[p.id] ?? ''}
              onChange={(e) => setPins((s) => ({ ...s, [p.id]: e.target.value }))}
              placeholder="novo PIN"
              className="min-w-0 flex-1 rounded-xl border border-carvao-200 bg-white px-3 py-2 text-sm font-bold tracking-widest dark:border-carvao-600 dark:bg-carvao-900"
            />
            <Botao variante="secundario" className="!min-h-9 !px-3 !py-1.5 text-xs" onClick={() => salvar(p.id, p.rotulo)}>
              Salvar
            </Botao>
          </div>
        ))}
        <p className="text-caption text-carvao-400">
          Dica de segurança: troque os PINs padrão (1234 / 1111 / 2222) por números só seus. Para acesso individual por
          pessoa (e auditoria por usuário), a etapa de banco de dados (Supabase Auth) é o próximo passo.
        </p>
      </Cartao>
    </Secao>
  );
}
