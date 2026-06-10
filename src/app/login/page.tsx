'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import { Botao } from '@/components/ui';

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

  return (
    <main className="flex min-h-dvh items-center justify-center bg-gray-950 p-4">
      <form onSubmit={entrar} className="w-full max-w-sm space-y-5 rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-2xl">
        <div className="text-center">
          <div className="text-4xl">🍣</div>
          <h1 className="mt-2 text-2xl font-black tracking-widest text-brand-500">TATÁ SUSHI</h1>
          <p className="text-sm font-semibold text-gray-400">
            Operação · Dia dos Namorados ❤️
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-300">Usuário (e-mail)</label>
          <input
            className="min-h-12 w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-base text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-300">Senha</label>
          <input
            className="min-h-12 w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-base text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        {erro && (
          <p className="rounded-xl bg-red-900/50 px-4 py-3 text-sm font-semibold text-red-200">
            {erro}
          </p>
        )}
        <Botao type="submit" className="w-full" disabled={entrando}>
          {entrando ? 'Entrando...' : 'Entrar'}
        </Botao>
        <p className="text-center text-xs text-gray-500">
          Login único da equipe Tatá Sushi
        </p>
      </form>
    </main>
  );
}
