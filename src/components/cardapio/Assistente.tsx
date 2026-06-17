'use client';

import { useMemo, useState } from 'react';
import { PERGUNTAS_SUGERIDAS, insightProativo, responder, type ContextoAssistente } from '@/lib/cardapio/assistente';

interface Fala {
  de: 'voce' | 'assistente';
  texto: string;
  itens?: string[];
}

export function Assistente({ contexto }: { contexto: ContextoAssistente }) {
  const [aberto, setAberto] = useState(false);
  const [entrada, setEntrada] = useState('');
  const [falas, setFalas] = useState<Fala[]>([
    { de: 'assistente', texto: 'Oi! Sou o assistente da Tatá House. Posso analisar custos, preços, aceitação e estoque. Pergunte ou escolha abaixo 👇' },
  ]);

  const proativo = useMemo(() => insightProativo(contexto), [contexto]);

  const perguntar = (pergunta: string) => {
    const p = pergunta.trim();
    if (!p) return;
    const r = responder(p, contexto);
    setFalas((f) => [...f, { de: 'voce', texto: p }, { de: 'assistente', texto: r.texto, itens: r.itens }]);
    setEntrada('');
  };

  return (
    <>
      <button
        onClick={() => setAberto((a) => !a)}
        aria-label="Assistente"
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-800 text-2xl text-white shadow-flutuante ring-2 ring-ouro-400/50 transition hover:scale-105 active:scale-95 lg:bottom-5 lg:right-5 print:hidden"
      >
        {aberto ? '✕' : '🤖'}
        {proativo && !aberto && (
          <span className="absolute right-1 top-1 h-3.5 w-3.5 rounded-full bg-ouro-400 ring-2 ring-white" aria-hidden />
        )}
      </button>

      {aberto && (
        <div className="fixed bottom-36 right-4 z-50 flex max-h-[70vh] w-[min(92vw,380px)] flex-col overflow-hidden rounded-3xl bg-white shadow-flutuante ring-1 ring-carvao-200 animate-subir lg:bottom-24 lg:right-5 dark:bg-carvao-850 dark:ring-carvao-700 print:hidden">
          <div className="flex items-center gap-2 bg-gradient-to-r from-brand-800 to-brand-600 px-4 py-3 text-white">
            <span className="text-xl">🤖</span>
            <div>
              <p className="font-display text-sm font-bold tracking-wide">Assistente Tatá House</p>
              <p className="text-[10px] uppercase tracking-wider text-brand-200">análise inteligente local</p>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {proativo && (
              <div className="rounded-2xl bg-ouro-300/15 p-3 ring-1 ring-ouro-400/30">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-ouro-600">Sugestão do dia</p>
                <p className="text-sm text-carvao-700 dark:text-areia-100">{proativo.texto}</p>
                {proativo.itens && (
                  <ul className="mt-1 space-y-0.5 text-[13px]">
                    {proativo.itens.map((it, j) => (
                      <li key={j} className="flex gap-1.5">
                        <span className="text-ouro-500">•</span>
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {falas.map((f, i) => (
              <div key={i} className={f.de === 'voce' ? 'text-right' : ''}>
                <div
                  className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    f.de === 'voce'
                      ? 'bg-brand-600 text-white'
                      : 'bg-areia-100 text-carvao-700 dark:bg-carvao-700 dark:text-areia-100'
                  }`}
                >
                  <p>{f.texto}</p>
                  {f.itens && (
                    <ul className="mt-1.5 space-y-1 text-left text-[13px]">
                      {f.itens.map((it, j) => (
                        <li key={j} className="flex gap-1.5">
                          <span className="text-brand-500">•</span>
                          <span>{it}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* sugestões rápidas */}
          <div className="flex gap-1.5 overflow-x-auto border-t border-carvao-100 px-3 py-2 dark:border-carvao-700">
            {PERGUNTAS_SUGERIDAS.slice(0, 4).map((p) => (
              <button
                key={p}
                onClick={() => perguntar(p)}
                className="shrink-0 whitespace-nowrap rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold text-brand-700 transition hover:bg-brand-100 dark:bg-carvao-700 dark:text-brand-300"
              >
                {p}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              perguntar(entrada);
            }}
            className="flex gap-2 border-t border-carvao-100 p-3 dark:border-carvao-700"
          >
            <input
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
              placeholder="Pergunte algo…"
              className="min-h-10 flex-1 rounded-2xl border border-carvao-200 bg-white px-3 py-2 text-sm dark:border-carvao-600 dark:bg-carvao-900"
            />
            <button
              type="submit"
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-700 text-white transition hover:bg-brand-800"
              aria-label="Enviar"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
