'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDados } from '@/lib/data-context';
import { getSupabase } from '@/lib/supabase/client';
import { AlternadorTema } from './AlternadorTema';

const LINKS = [
  { href: '/mapa', rotulo: 'Mapa de mesas', rotuloCurto: 'Mapa' },
  { href: '/caixa', rotulo: 'Caixa', rotuloCurto: 'Caixa' },
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
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-carvao-950/95 text-areia-50 shadow-media backdrop-blur print:hidden">
      {/* fio dourado sutil de acabamento */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-ouro-500/50 to-transparent" />
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4">
        {/* Marca */}
        <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
          <span
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600/15 ring-1 ring-brand-500/40 min-[420px]:flex"
            aria-hidden
          >
            <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
          </span>
          <div className="leading-tight">
            <div className="whitespace-nowrap font-display text-[15px] font-semibold tracking-[0.16em] text-areia-50 sm:text-[17px] sm:tracking-[0.22em]">
              TATÁ&nbsp;SUSHI
            </div>
            <div className="hidden whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.28em] text-areia-300/60 sm:block">
              Dia dos Namorados
            </div>
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex shrink-0 items-center gap-1 rounded-full bg-white/[0.04] p-1 ring-1 ring-white/[0.07]">
          {LINKS.map((l) => {
            const ativo = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-sm font-semibold transition sm:px-5 ${
                  ativo
                    ? 'bg-white/10 text-white ring-1 ring-white/15'
                    : 'text-carvao-300 hover:bg-white/5 hover:text-areia-100'
                }`}
              >
                <span
                  className={`hidden h-1.5 w-1.5 rounded-full transition sm:block ${
                    ativo ? 'bg-brand-500' : 'bg-carvao-600'
                  }`}
                  aria-hidden
                />
                <span className="md:hidden">{l.rotuloCurto}</span>
                <span className="hidden md:inline">{l.rotulo}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sessão */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <span className="hidden sm:block">
            <AlternadorTema />
          </span>
          {perfil && (
            <span className="hidden max-w-32 truncate rounded-full bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-areia-200 ring-1 ring-white/[0.07] lg:inline">
              {perfil.nome}
            </span>
          )}
          <button
            onClick={sair}
            className="min-h-11 whitespace-nowrap rounded-full px-2 text-sm font-semibold text-carvao-300 transition hover:text-white sm:px-3"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
