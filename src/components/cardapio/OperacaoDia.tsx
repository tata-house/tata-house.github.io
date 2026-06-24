'use client';

/* =====================================================================
   Modo Operação do Dia — tela única para a cozinha: o que produzir, o que
   receber/conferir e o que ainda comprar HOJE, como checklist vivo. Sem
   menus, sem distrações. Itens de compra/recebimento usam o estado real
   (sincroniza com a aba Compras); "produzir" é um checklist do dia.
   ===================================================================== */

import { useState } from 'react';
import { Cartao } from '@/components/ui';
import { DIAS_SEMANA, formatarQtd, linhasDoDia } from '@/lib/cardapio/motor';
import type { EstadoSemana } from '@/lib/cardapio/tipos';
import { ComoFazer } from './ComoFazer';

/** Índice do dia de hoje na semana (segunda = 0 … domingo = 6). */
function hojeIdx(): number {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

function hojeIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function OperacaoDia({
  aberto,
  aoFechar,
  estado,
  atualizar,
}: {
  aberto: boolean;
  aoFechar: () => void;
  estado: EstadoSemana;
  atualizar: (fn: (e: EstadoSemana) => EstadoSemana) => void;
}) {
  const di = hojeIdx();
  const [feitos, setFeitos] = useState<Set<string>>(new Set());

  if (!aberto) return null;

  const dia = estado.dias[di];
  const linhas = linhasDoDia(estado, di);

  const produzir = ([
    ['Principal', dia.principal],
    ['Guarnição fixa', dia.guarnicaoFixa],
    ['Guarnição', dia.guarnicao],
    ['Salada', dia.salada],
    ['Sobremesa', dia.sobremesa],
  ] as [string, string][]).filter(([, v]) => v);

  const receber = linhas.filter((l) => l.status.compradoEm && !l.status.recebidoOk);
  const comprar = linhas.filter((l) => !l.status.compradoEm);

  const marcarRecebido = (chave: string, qtd: number) =>
    atualizar((e) => {
      const s = e.status[di]?.[chave] ?? {};
      return {
        ...e,
        status: {
          ...e.status,
          [di]: { ...(e.status[di] ?? {}), [chave]: { ...s, recebidoOk: true, recebidoQtd: s.compradoQtd ?? qtd } },
        },
      };
    });

  const marcarComprado = (chave: string, qtd: number) =>
    atualizar((e) => ({
      ...e,
      status: {
        ...e.status,
        [di]: { ...(e.status[di] ?? {}), [chave]: { ...(e.status[di]?.[chave] ?? {}), compradoEm: hojeIso(), compradoQtd: qtd } },
      },
    }));

  const toggleFeito = (k: string) =>
    setFeitos((s) => {
      const novo = new Set(s);
      if (novo.has(k)) novo.delete(k);
      else novo.add(k);
      return novo;
    });

  const totalTarefas = produzir.length + receber.length + comprar.length;
  const feitasProd = produzir.filter(([rot]) => feitos.has(rot)).length;
  const tudoFeito = produzir.length > 0 && feitasProd === produzir.length && receber.length === 0 && comprar.length === 0;
  const pct = tudoFeito ? 100 : totalTarefas > 0 ? Math.round((feitasProd / totalTarefas) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-brand-900 via-carvao-900 to-carvao-950 pb-24 text-white">
      {/* Cabeçalho */}
      <div className="sticky top-0 z-10 bg-carvao-950/70 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <button onClick={aoFechar} className="text-sm font-bold uppercase tracking-wide text-brand-200 hover:text-white">
            ← Sair
          </button>
          <h2 className="font-display text-base font-black tracking-wide">Operação do Dia</h2>
          <span className="text-caption font-bold uppercase tracking-wide text-ouro-300">{DIAS_SEMANA[di]}</span>
        </div>
        {dia.principal && totalTarefas > 0 && (
          <div className="mx-auto mt-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-brand-400 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 text-right text-micro font-bold tabular-nums text-brand-300">{pct}%</span>
            </div>
          </div>
        )}
      </div>

      <div className="mx-auto max-w-2xl space-y-5 px-4 py-5">
        {!dia.principal ? (
          <Cartao className="!bg-white/10 !text-white !ring-white/15">
            <p className="text-sm">Cardápio de {DIAS_SEMANA[di]} ainda não definido. Monte o prato principal na aba Cardápio para liberar as tarefas do dia.</p>
          </Cartao>
        ) : (
          <>
            <p className="text-center text-sm font-semibold text-brand-100">
              {tudoFeito ? 'Tudo pronto por hoje!' : `Você tem ${totalTarefas} tarefa${totalTarefas === 1 ? '' : 's'} hoje`}
            </p>

            {/* Produzir */}
            {produzir.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-caption font-extrabold uppercase tracking-[0.2em] text-ouro-300">
                  Produzir ({feitasProd}/{produzir.length})
                </h3>
                {produzir.map(([rot, nome]) => {
                  const feito = feitos.has(rot);
                  return (
                    <div
                      key={rot}
                      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 ring-1 transition ${
                        feito ? 'bg-brand-500/20 ring-brand-400/40' : 'bg-white/10 ring-white/15'
                      }`}
                    >
                      <button onClick={() => toggleFeito(rot)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                            feito ? 'bg-brand-500 text-white' : 'bg-white/15 text-transparent'
                          }`}
                        >
                          ✓
                        </span>
                        <span className="min-w-0">
                          <span className="block text-micro font-bold uppercase tracking-wide text-brand-200">{rot}</span>
                          <span className={`block text-subtitulo font-semibold ${feito ? 'text-brand-100 line-through' : ''}`}>{nome}</span>
                        </span>
                      </button>
                      <ComoFazer
                        prato={nome}
                        className="shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-caption font-bold text-white ring-1 ring-white/20 transition hover:bg-white/25"
                      />
                    </div>
                  );
                })}
              </section>
            )}

            {/* Receber / conferir */}
            {receber.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-caption font-extrabold uppercase tracking-[0.2em] text-ouro-300">Receber e conferir</h3>
                {receber.map((l) => (
                  <button
                    key={l.chave}
                    onClick={() => marcarRecebido(l.chave, l.qtd)}
                    className="flex w-full items-center gap-3 rounded-2xl bg-white/10 px-4 py-3.5 text-left ring-1 ring-white/15 transition hover:bg-white/15"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/15 text-sm"></span>
                    <span className="min-w-0 flex-1 text-subtitulo font-semibold">{l.item}</span>
                    <span className="shrink-0 text-sm font-bold tabular-nums text-brand-100">
                      {formatarQtd(l.qtd)} {l.unid}
                    </span>
                  </button>
                ))}
              </section>
            )}

            {/* Ainda comprar */}
            {comprar.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-caption font-extrabold uppercase tracking-[0.2em] text-ouro-300">Ainda comprar</h3>
                {comprar.map((l) => (
                  <button
                    key={l.chave}
                    onClick={() => marcarComprado(l.chave, l.qtd)}
                    className="flex w-full items-center gap-3 rounded-2xl bg-white/10 px-4 py-3.5 text-left ring-1 ring-white/15 transition hover:bg-white/15"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/15 text-sm font-bold text-transparent">✓</span>
                    <span className="min-w-0 flex-1 text-subtitulo font-semibold">{l.item}</span>
                    <span className="shrink-0 text-sm font-bold tabular-nums text-brand-100">
                      {formatarQtd(l.qtd)} {l.unid}
                    </span>
                  </button>
                ))}
              </section>
            )}

            {tudoFeito && (
              <Cartao className="!bg-brand-500/20 !text-white !ring-brand-400/40 text-center">
                <p className="text-base font-bold">Dia concluído!</p>
                <p className="text-sm text-brand-100">Produção, recebimento e compras de hoje estão em dia.</p>
              </Cartao>
            )}

            <p className="text-center text-caption text-brand-100/50">
              Toque para concluir. Recebimento e compras já atualizam a aba Compras automaticamente.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
