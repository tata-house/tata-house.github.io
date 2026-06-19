'use client';

import { useMemo } from 'react';
import { Icone } from '@/components/Icones';
import { resumoSemana } from '@/lib/cardapio/indicadores';
import { formatarReais } from '@/lib/cardapio/motor';
import type { EstadoSemana, Aceitacao, Etapa } from '@/lib/cardapio/tipos';
import type { Papel } from '@/lib/cardapio/tipos';

/* ── constantes ─────────────────────────────────────────── */

const ETAPAS = [
  { id: 'rascunho',    rotulo: 'Rascunho'     },
  { id: 'cozinha',     rotulo: 'Cozinha'       },
  { id: 'compras',     rotulo: 'Compras'       },
  { id: 'recebimento', rotulo: 'Recebimento'   },
  { id: 'concluido',   rotulo: 'Concluída'     },
] as const;

const DIAS_PT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

/* ── helpers ─────────────────────────────────────────────── */

function idxEtapa(e: Etapa) {
  return ETAPAS.findIndex((x) => x.id === e);
}

function mediaAceitacaoGlobal(aceitacao: Aceitacao): number | null {
  let soma = 0;
  let n = 0;
  Object.values(aceitacao).forEach((r) => {
    if (r.n > 0) {
      soma += r.somaNotas;
      n += r.n;
    }
  });
  return n > 0 ? soma / n : null;
}

/* ── sub-componente: barra de progresso de etapa ─────────── */

function EtapaProgress({ etapa }: { etapa: Etapa }) {
  const ativo = idxEtapa(etapa);
  return (
    <div className="space-y-2">
      <div className="flex items-center">
        {ETAPAS.map((e, i) => (
          <div key={e.id} className="flex flex-1 items-center">
            <div
              className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all ${
                i < ativo
                  ? 'bg-brand-600 text-white'
                  : i === ativo
                  ? 'bg-brand-700 text-white shadow-md ring-4 ring-brand-200/60 dark:ring-brand-900/60'
                  : 'bg-carvao-100 text-carvao-400 dark:bg-carvao-700 dark:text-carvao-500'
              }`}
            >
              {i < ativo ? <Icone nome="check" tam={12} /> : <span>{i + 1}</span>}
            </div>
            {i < ETAPAS.length - 1 && (
              <div
                className={`h-0.5 flex-1 transition-all ${
                  i < ativo ? 'bg-brand-500' : 'bg-carvao-200 dark:bg-carvao-600'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex">
        {ETAPAS.map((e, i) => (
          <div key={e.id} className="flex-1">
            <span
              className={`block text-[9px] font-semibold leading-tight ${
                i === 0 ? 'text-left' : i === ETAPAS.length - 1 ? 'text-right' : 'text-center'
              } ${
                i === ativo
                  ? 'text-brand-700 dark:text-brand-300'
                  : 'text-carvao-400 dark:text-carvao-500'
              }`}
            >
              {e.rotulo}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── sub-componente: número de destaque ─────────────────── */

function NumeroDestaque({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <div className="rounded-2xl bg-carvao-50 p-4 text-center dark:bg-carvao-800">
      <p className="font-display text-xl font-bold text-carvao-800 dark:text-areia-100">{valor}</p>
      <p className="mt-0.5 text-[11px] text-carvao-400">{rotulo}</p>
    </div>
  );
}

/* ── sub-componente: barra de progresso linear ───────────── */

function BarraProgresso({ valor, total, rotulo }: { valor: number; total: number; rotulo: string }) {
  const pct = total > 0 ? Math.round((valor / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-carvao-500 dark:text-carvao-400">{rotulo}</span>
        <span className="font-semibold text-brand-700 dark:text-brand-300">{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-carvao-100 dark:bg-carvao-700">
        <div
          className="h-full rounded-full bg-brand-600 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-carvao-400">
        {valor} de {total} {valor === 1 ? 'item' : 'itens'}
      </p>
    </div>
  );
}

/* ── props ──────────────────────────────────────────────── */

interface Props {
  estado: EstadoSemana;
  precos: Record<string, number>;
  aceitacao: Aceitacao;
  fatores: Record<string, number>;
  papel: Papel;
  irPara: (aba: string) => void;
}

/* ── componente principal ────────────────────────────────── */

export function AbaAgora({ estado, precos, aceitacao, fatores, papel, irPara }: Props) {
  const resumo = useMemo(() => resumoSemana(estado, precos, fatores), [estado, precos, fatores]);
  const etapa = estado.etapa;
  const media = useMemo(() => mediaAceitacaoGlobal(aceitacao), [aceitacao]);

  const podeEditar = papel === 'gestor' || papel === 'administrador' || papel === 'cozinha';

  return (
    <div className="space-y-4">
      {/* Progresso */}
      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-carvao-100 dark:bg-carvao-850 dark:ring-carvao-700">
        <EtapaProgress etapa={etapa} />
      </div>

      {/* ── RASCUNHO ─────────────────────────────────────── */}
      {etapa === 'rascunho' && (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-carvao-100 dark:bg-carvao-850 dark:ring-carvao-700">
          <h2 className="font-display text-2xl font-bold text-carvao-800 dark:text-areia-100">
            Monte o cardápio
          </h2>
          <p className="mt-1.5 text-sm text-carvao-500 dark:text-carvao-400">
            Defina os pratos da semana para a cozinha revisar e a lista de compras ser gerada automaticamente.
          </p>
          {podeEditar && (
            <button
              onClick={() => irPara('semana')}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-700 py-3.5 text-sm font-bold text-white transition hover:bg-brand-800 active:scale-[0.98] dark:bg-brand-600 dark:hover:bg-brand-700"
            >
              Montar cardápio
              <Icone nome="proximo" tam={16} />
            </button>
          )}
        </div>
      )}

      {/* ── COZINHA ──────────────────────────────────────── */}
      {etapa === 'cozinha' && (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-carvao-100 dark:bg-carvao-850 dark:ring-carvao-700">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-ouro-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-ouro-600 dark:text-ouro-400">
              Com a cozinha
            </span>
          </div>
          <div className="space-y-2.5">
            {estado.dias.slice(0, 5).map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-8 shrink-0 text-xs font-bold text-carvao-400">{DIAS_PT[i]}</span>
                <span
                  className={`text-sm ${
                    d.principal
                      ? 'text-carvao-700 dark:text-areia-100'
                      : 'text-carvao-300 dark:text-carvao-600'
                  }`}
                >
                  {d.principal || '—'}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => irPara('semana')}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-700 py-3.5 text-sm font-bold text-white transition hover:bg-brand-800 active:scale-[0.98] dark:bg-brand-600 dark:hover:bg-brand-700"
          >
            {papel === 'cozinha' ? 'Revisar cardápio' : 'Ver cardápio'}
            <Icone nome="proximo" tam={16} />
          </button>
        </div>
      )}

      {/* ── COMPRAS ──────────────────────────────────────── */}
      {etapa === 'compras' && (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-carvao-100 dark:bg-carvao-850 dark:ring-carvao-700">
          <h2 className="font-display text-2xl font-bold text-carvao-800 dark:text-areia-100">
            Lista de compras
          </h2>
          <div className="mt-4">
            <BarraProgresso
              valor={resumo.itensComprados}
              total={resumo.itensTotal}
              rotulo="itens comprados"
            />
          </div>
          <button
            onClick={() => irPara('compras')}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-700 py-3.5 text-sm font-bold text-white transition hover:bg-brand-800 active:scale-[0.98] dark:bg-brand-600 dark:hover:bg-brand-700"
          >
            Ver lista completa
            <Icone nome="proximo" tam={16} />
          </button>
        </div>
      )}

      {/* ── RECEBIMENTO ──────────────────────────────────── */}
      {etapa === 'recebimento' && (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-carvao-100 dark:bg-carvao-850 dark:ring-carvao-700">
          <h2 className="font-display text-2xl font-bold text-carvao-800 dark:text-areia-100">
            Conferir recebimento
          </h2>
          <div className="mt-4">
            <BarraProgresso
              valor={resumo.itensRecebidos}
              total={resumo.itensTotal}
              rotulo="itens recebidos"
            />
          </div>
          <button
            onClick={() => irPara('compras')}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-700 py-3.5 text-sm font-bold text-white transition hover:bg-brand-800 active:scale-[0.98] dark:bg-brand-600 dark:hover:bg-brand-700"
          >
            Conferir na lista
            <Icone nome="proximo" tam={16} />
          </button>
        </div>
      )}

      {/* ── CONCLUÍDO ────────────────────────────────────── */}
      {etapa === 'concluido' && (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-carvao-100 dark:bg-carvao-850 dark:ring-carvao-700">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/40">
              <Icone nome="check" tam={16} className="text-brand-700 dark:text-brand-300" />
            </div>
            <h2 className="font-display text-2xl font-bold text-brand-700 dark:text-brand-300">
              Semana concluída
            </h2>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <NumeroDestaque
              valor={String(resumo.refeicoesReais || resumo.refeicoesPrevistas || '—')}
              rotulo="refeições"
            />
            <NumeroDestaque
              valor={
                resumo.custoRefReal
                  ? formatarReais(resumo.custoRefReal)
                  : resumo.custoRefEstimado
                  ? formatarReais(resumo.custoRefEstimado)
                  : '—'
              }
              rotulo="por refeição"
            />
            <NumeroDestaque
              valor={media !== null ? `${media.toFixed(1)}★` : '—'}
              rotulo="aceitação"
            />
          </div>
        </div>
      )}

      {/* Números-chave (etapas intermediárias) */}
      {(etapa === 'cozinha' || etapa === 'compras' || etapa === 'recebimento') &&
        (resumo.refeicoesPrevistas > 0 || resumo.custoRefEstimado) && (
          <div className="grid grid-cols-2 gap-3">
            {resumo.refeicoesPrevistas > 0 && (
              <NumeroDestaque
                valor={String(resumo.refeicoesPrevistas)}
                rotulo="refeições previstas"
              />
            )}
            {resumo.custoRefEstimado ? (
              <NumeroDestaque
                valor={formatarReais(resumo.custoRefEstimado)}
                rotulo="estimado / refeição"
              />
            ) : (
              <div className="rounded-2xl bg-carvao-50 p-4 text-center dark:bg-carvao-800">
                <p className="text-sm text-carvao-400">Lance preços para ver o custo estimado</p>
              </div>
            )}
          </div>
        )}
    </div>
  );
}
