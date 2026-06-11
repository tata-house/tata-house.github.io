'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getSupabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [entrando, setEntrando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEntrando(true);
    setErro('');
    const { error } = await getSupabase().auth.signInWithPassword({ email, password: senha });
    if (error) {
      setErro('Usuário ou senha inválidos.');
      setEntrando(false);
      return;
    }
    router.push('/mapa');
    router.refresh();
  }

  const estiloCampo =
    'min-h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-base text-areia-50 placeholder:text-carvao-400 transition focus:border-brand-500/60 focus:outline-none focus:ring-2 focus:ring-brand-500/25';

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-carvao-950 p-4">
      {/* brilho ambiente discreto */}
      <div
        className="pointer-events-none absolute left-1/2 top-[-20%] h-[60vh] w-[120vw] -translate-x-1/2 rounded-full bg-brand-600/[0.07] blur-3xl"
        aria-hidden
      />
      <form
        onSubmit={entrar}
        className="relative w-full max-w-sm space-y-6 rounded-[28px] border border-white/[0.08] bg-carvao-900/70 p-8 shadow-flutuante backdrop-blur animate-subir"
      >
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-600/15 ring-1 ring-brand-500/40">
            <span className="h-3 w-3 rounded-full bg-brand-500" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-semibold tracking-[0.22em] text-areia-50">
            TATÁ&nbsp;SUSHI
          </h1>
          <div className="mx-auto mt-3 h-px w-16 bg-gradient-to-r from-transparent via-ouro-500/60 to-transparent" />
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-areia-300/60">
            Operação · Dia dos Namorados
          </p>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-carvao-300">
            Usuário (e-mail)
          </label>
          <input
            className={estiloCampo}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-carvao-300">
            Senha
          </label>
          <input
            className={estiloCampo}
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        {erro && (
          <p className="rounded-2xl bg-[#7e342c]/40 px-4 py-3 text-sm font-semibold text-[#f0b5ad] ring-1 ring-[#b04c41]/40">
            {erro}
          </p>
        )}
        <button
          type="submit"
          disabled={entrando}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-brand-600 px-5 py-3 text-[15px] font-semibold text-white shadow-suave transition-all duration-150 hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {entrando ? 'Entrando...' : 'Entrar na operação'}
        </button>
        <p className="text-center text-xs text-carvao-400">Login único da equipe TATÁ Sushi</p>
      </form>
    </main>
  );
}
