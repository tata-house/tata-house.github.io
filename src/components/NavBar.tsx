'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDados } from '@/lib/data-context';
import { ROLE_LABEL } from '@/lib/constants';
import { getSupabase } from '@/lib/supabase/client';
import { AlternadorTema } from './AlternadorTema';

const LINKS = [
  { href: '/dashboard', rotulo: 'Painel', icone: '📊' },
  { href: '/checkin', rotulo: 'Check-in', icone: '✅' },
  { href: '/mapa', rotulo: 'Mapa', icone: '🗺️' },
  { href: '/reservas', rotulo: 'Reservas', icone: '📋' },
  { href: '/passantes', rotulo: 'Passantes', icone: '🚶' },
  { href: '/caixa', rotulo: 'Caixa', icone: '💰' },
  { href: '/relatorios', rotulo: 'Relatórios', icone: '📄' },
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
      {/* Barra superior */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800 print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍣</span>
            <div>
              <div className="text-sm font-black leading-tight text-brand-600 dark:text-brand-500">TATA SUSHI</div>
              <div className="text-xs leading-tight text-gray-500 dark:text-gray-400">Dia dos Namorados</div>
            </div>
          </div>
          <nav className="hidden gap-1 md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  pathname.startsWith(l.href)
                    ? 'bg-brand-100 text-brand-700 dark:bg-brand-700 dark:text-white'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {l.rotulo}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <AlternadorTema />
            {perfil && (
              <span className="hidden rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300 sm:inline">
                {perfil.nome} · {ROLE_LABEL[perfil.role]}
              </span>
            )}
            <button
              onClick={sair}
              className="rounded-lg px-2 py-1 text-sm font-semibold text-gray-500 hover:text-red-600 dark:text-gray-400"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Navegação inferior (celular/tablet) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-7 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-gray-700 dark:bg-gray-800 md:hidden print:hidden">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold ${
              pathname.startsWith(l.href)
                ? 'text-brand-600 dark:text-brand-500'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <span className="text-lg leading-none">{l.icone}</span>
            {l.rotulo}
          </Link>
        ))}
      </nav>
    </>
  );
}
