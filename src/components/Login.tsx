'use client';

/* =====================================================================
   Tela de login por perfil (Gerência / Compras / Cozinha-Conferência).
   Escolhe o perfil, digita o PIN e entra. Ao entrar, recarrega para o app
   abrir já com a navegação do perfil. Visual premium, mobile-first.
   ===================================================================== */

import { useState } from 'react';
import { PERFIS, useLogin, type PerfilLogin } from '@/lib/cardapio/login';

export function Login() {
  const { entrar } = useLogin();
  const [sel, setSel] = useState<PerfilLogin | null>(null);
  const [pin, setPin] = useState('');
  const [erro, setErro] = useState(false);

  const perfil = PERFIS.find((p) => p.id === sel) ?? null;

  const confirmar = () => {
    if (!sel) return;
    if (entrar(sel, pin)) {
      if (typeof window !== 'undefined') window.location.reload();
    } else {
      setErro(true);
      setPin('');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-900 via-brand-800 to-carvao-950 px-5 py-10 text-white">
      <div className="w-full max-w-sm">
        {/* Marca */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-gradient-to-r from-ouro-300 to-ouro-500" />
          <h1 className="font-display text-3xl font-black tracking-[0.18em]">TATÁ&nbsp;HOUSE</h1>
          <p className="mt-1 text-caption font-extrabold uppercase tracking-[0.3em] text-ouro-300">
            Refeitório do Tatá Sushi
          </p>
        </div>

        {!perfil ? (
          <div className="space-y-3">
            <p className="text-center text-sm font-semibold text-brand-100">Quem está acessando?</p>
            {PERFIS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSel(p.id);
                  setPin('');
                  setErro(false);
                }}
                className="flex w-full items-center gap-3 rounded-2xl bg-white/10 px-4 py-3.5 text-left ring-1 ring-white/15 transition hover:bg-white/20"
              >
                <span className="text-2xl">{p.icone}</span>
                <span className="min-w-0">
                  <span className="block text-subtitulo font-bold">{p.rotulo}</span>
                  <span className="block text-caption leading-tight text-brand-100/80">{p.descricao}</span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => setSel(null)}
              className="text-xs font-bold uppercase tracking-wide text-brand-200 hover:text-white"
            >
              ← Trocar perfil
            </button>
            <div className="rounded-2xl bg-white/10 px-4 py-4 ring-1 ring-white/15">
              <div className="mb-3 flex items-center gap-3">
                <span className="text-2xl">{perfil.icone}</span>
                <span className="text-subtitulo font-bold">{perfil.rotulo}</span>
              </div>
              <label className="block text-caption font-bold uppercase tracking-wide text-brand-100/80">PIN de acesso</label>
              <input
                autoFocus
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setErro(false);
                }}
                onKeyDown={(e) => e.key === 'Enter' && confirmar()}
                placeholder="••••"
                className="mt-1 w-full rounded-xl border-0 bg-white/90 px-4 py-3 text-center text-lg font-bold tracking-[0.4em] text-carvao-900 outline-none ring-2 ring-transparent focus:ring-ouro-300"
              />
              {erro && <p className="mt-2 text-center text-xs font-semibold text-ouro-200">PIN incorreto. Tente de novo.</p>}
            </div>
            <button
              onClick={confirmar}
              className="w-full rounded-2xl bg-gradient-to-r from-ouro-400 to-ouro-500 px-4 py-3.5 text-sm font-extrabold uppercase tracking-wide text-carvao-900 shadow-suave transition hover:from-ouro-300 hover:to-ouro-400"
            >
              Entrar
            </button>
          </div>
        )}

        <p className="mt-8 text-center text-[10px] text-brand-100/50">
          Acesso restrito da equipe · Tatá House
        </p>
      </div>
    </div>
  );
}
