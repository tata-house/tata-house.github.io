'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import { Botao, estiloInput, estiloRotulo } from '@/components/ui';

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
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <form onSubmit={entrar} className="w-full max-w-sm space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <div className="text-center">
          <div className="text-4xl">🍣</div>
          <h1 className="mt-2 text-2xl font-black text-brand-600">TATA SUSHI</h1>
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            Reservas · Dia dos Namorados ❤️
          </p>
        </div>
        <div>
          <label className={estiloRotulo}>Usuário (e-mail)</label>
          <input
            className={estiloInput}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div>
          <label className={estiloRotulo}>Senha</label>
          <input
            className={estiloInput}
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        {erro && (
          <p className="rounded-xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-700 dark:bg-red-900/50 dark:text-red-200">
            {erro}
          </p>
        )}
        <Botao type="submit" className="w-full" disabled={entrando}>
          {entrando ? 'Entrando...' : 'Entrar'}
        </Botao>
        <p className="text-center text-xs text-gray-400">
          Perfis: gerente · recepção · caixa
        </p>
      </form>
    </main>
  );
}
