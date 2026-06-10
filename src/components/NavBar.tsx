'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDados } from '@/lib/data-context';
import { getSupabase } from '@/lib/supabase/client';
import { AlternadorTema } from './AlternadorTema';

const LINKS = [
  { href: '/mapa', rotulo: 'Mapa', icone: '🗺️' },
  { href: '/caixa', rotulo: 'Caixa', icone: '💰' },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { perfil } = useDados();

  async function sair() {
    await getSupabase().auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      {/* Barra superior — identidade TATÁ Sushi */}
      <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-950 px-4 py-2 text-white print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍣</span>
            <div>
              <div className="text-sm font-black leading-tight tracking-widest text-brand-500">TATÁ SUSHI</div>
              <div className="text-xs leading-tight text-gray-400">Dia dos Namorados ❤️</div>
            </div>
          </div>
          <nav className="flex gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-4 py-2 text-sm font-bold ${
                  pathname.startsWith(l.href)
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                {l.icone} {l.rotulo}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <AlternadorTema />
            {perfil && (
              <span className="hidden rounded-full bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-300 sm:inline">
                {perfil.nome}
              </span>
            )}
            <button
              onClick={sair}
              className="rounded-lg px-2 py-1 text-sm font-semibold text-gray-400 hover:text-red-400"
            >
              Sair
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
