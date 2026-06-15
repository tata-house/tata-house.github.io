'use client';

/* =====================================================================
   Navegação inferior (mobile) — polegar-first. As 6 áreas principais,
   com o set de ícones da casa. Vidro fosco sobre o conteúdo, respeitando
   a safe-area.
   ===================================================================== */

import { Icone, type NomeIcone } from './Icones';

export interface Grupo {
  id: NomeIcone;
  rotulo: string;
  abas: string[];
}

export const GRUPOS: Grupo[] = [
  { id: 'painel', rotulo: 'Painel', abas: ['painel'] },
  { id: 'cotacao', rotulo: 'Cotação', abas: ['cotacao'] },
  { id: 'cardapio', rotulo: 'Cardápio', abas: ['cardapio'] },
  { id: 'simulador', rotulo: 'Simular', abas: ['simulador'] },
  { id: 'compras', rotulo: 'Compras', abas: ['compras'] },
  { id: 'feedback', rotulo: 'Feedback', abas: ['feedback'] },
];

export function BottomNav({
  grupoAtivo,
  aoSelecionar,
  grupos = GRUPOS,
}: {
  grupoAtivo: string;
  aoSelecionar: (grupoId: string) => void;
  grupos?: Grupo[];
}) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-carvao-200/70 bg-white/85 backdrop-blur-xl lg:hidden dark:border-carvao-700/70 dark:bg-carvao-900/85 print:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-between px-1">
        {grupos.map((g) => {
          const ativo = g.id === grupoAtivo;
          return (
            <button
              key={g.id}
              onClick={() => aoSelecionar(g.id)}
              aria-current={ativo ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors ${
                ativo ? 'text-brand-600 dark:text-brand-400' : 'text-carvao-400'
              }`}
            >
              <span
                className={`flex h-8 w-11 items-center justify-center rounded-full transition-all ${
                  ativo ? 'bg-brand-500/12' : ''
                }`}
              >
                <Icone nome={g.id} tam={21} />
              </span>
              <span className="text-[10px] font-semibold tracking-tight">{g.rotulo}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
