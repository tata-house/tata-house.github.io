'use client';

/* =====================================================================
   Pesquisa de satisfação do prato do dia (Módulo de feedback / QR).
   Página pública e enxuta: o funcionário abre pelo QR do pôster e avalia
   o prato de hoje com um toque. Os votos alimentam a aba Aceitação.
   Modelo quiosque (um tablet na saída) no protótipo; a agregação entre
   vários celulares vem com o Supabase (ver ROADMAP, fase 5).
   ===================================================================== */

import { useEffect, useState } from 'react';
import { idSemanaIso, useAceitacao, useSemana } from '@/lib/cardapio/estado';
import { DIAS_SEMANA } from '@/lib/cardapio/motor';

const VOTOS: { v: 'bom' | 'ok' | 'ruim'; emoji: string; rotulo: string; cor: string }[] = [
  { v: 'bom', emoji: '😋', rotulo: 'Gostei', cor: 'from-brand-500 to-brand-700' },
  { v: 'ok', emoji: '😐', rotulo: 'Mais ou menos', cor: 'from-ouro-400 to-ouro-600' },
  { v: 'ruim', emoji: '👎', rotulo: 'Não gostei', cor: 'from-[#c96a5f] to-[#b04c41]' },
];

export default function PaginaAvaliar() {
  const hoje = new Date();
  const semanaId = idSemanaIso(hoje);
  const diaIdx = (hoje.getDay() + 6) % 7; // 0 = segunda … 6 = domingo

  const { estado, pronto } = useSemana(semanaId);
  const { avaliar } = useAceitacao();
  const [votou, setVotou] = useState<string | null>(null);

  const dia = estado.dias[diaIdx];
  const prato = dia?.principal?.trim();

  useEffect(() => {
    if (!votou) return;
    const t = setTimeout(() => setVotou(null), 4000);
    return () => clearTimeout(t);
  }, [votou]);

  const registrar = (voto: 'bom' | 'ok' | 'ruim', emoji: string) => {
    if (!prato) return;
    try {
      navigator.vibrate?.(15);
    } catch {
      /* sem suporte a vibração */
    }
    avaliar(prato, voto);
    setVotou(emoji);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-brand-800 via-brand-700 to-brand-900 px-6 py-10 text-center text-white">
      <div className="space-y-1">
        <div className="font-display text-sm font-bold uppercase tracking-[0.4em] text-brand-200">Tatá Sushi</div>
        <div className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-ouro-300">Como foi o almoço de hoje?</div>
      </div>

      {!pronto ? (
        <p className="text-brand-100">Carregando…</p>
      ) : votou ? (
        <div className="flex flex-col items-center gap-3 animate-subir">
          <span className="text-7xl">{votou}</span>
          <p className="font-display text-2xl font-bold">Obrigado pelo voto!</p>
          <p className="text-sm text-brand-100">Sua opinião ajuda a melhorar o cardápio. 💚</p>
        </div>
      ) : !prato ? (
        <div className="space-y-2">
          <span className="text-6xl">🍽️</span>
          <p className="font-display text-2xl font-bold">Cardápio de hoje a definir</p>
          <p className="text-sm text-brand-100">Volte na hora do almoço para avaliar o prato do dia.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-brand-200">
              {DIAS_SEMANA[diaIdx]} · prato do dia
            </p>
            <h1 className="max-w-2xl font-display text-4xl font-black uppercase leading-tight sm:text-5xl">{prato}</h1>
            {[dia.guarnicao, dia.salada].filter(Boolean).length > 0 && (
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-100">
                {[dia.guarnicao, dia.salada].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>

          <div className="flex w-full max-w-md flex-col gap-3">
            {VOTOS.map((b) => (
              <button
                key={b.v}
                onClick={() => registrar(b.v, b.emoji)}
                className={`flex items-center justify-center gap-3 rounded-3xl bg-gradient-to-r ${b.cor} px-6 py-5 text-xl font-extrabold uppercase tracking-wide shadow-flutuante ring-1 ring-white/20 transition active:scale-95`}
              >
                <span className="text-4xl">{b.emoji}</span>
                {b.rotulo}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-brand-200/70">Toque na carinha que combina com o que você achou.</p>
        </>
      )}
    </main>
  );
}
