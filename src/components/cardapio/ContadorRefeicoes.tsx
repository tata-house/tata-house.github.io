'use client';

import { useEffect, useState } from 'react';
import { Cartao } from '@/components/ui';
import {
  calcularStats,
  calcularTendenciaMensal,
  hojeISO,
  registrarDia,
} from '@/lib/cardapio/refeicoes';
import { MEDIA_POR_DIA } from '@/lib/cardapio/media-diaria';
import type { StatsRefeicoes, MesTendencia } from '@/lib/cardapio/refeicoes';

const DIAS_PT = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

function fmt(n: number): string {
  return n.toLocaleString('pt-BR');
}

function formatarReais(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/* ── Gráfico de barras mensal ─────────────────────────────── */

function GraficoMensal({ dados, meta }: { dados: MesTendencia[]; meta?: number }) {
  const max = Math.max(...dados.map((d) => d.total), meta ?? 0, 1);
  const hoje = new Date();
  const mesAtualIdx = dados.length - 1;

  return (
    <div className="space-y-1.5">
      <div className="flex items-end gap-1 h-16">
        {dados.map((d, i) => {
          const pct = (d.total / max) * 100;
          const isAtual = i === mesAtualIdx;
          const isZero = d.total === 0;
          return (
            <div key={i} className="group relative flex flex-1 flex-col items-center gap-0.5">
              {/* tooltip */}
              <div className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-carvao-900 px-2 py-1 text-micro font-semibold text-white group-hover:block dark:bg-carvao-700 z-10">
                {fmt(d.total)}
              </div>
              <div className="flex w-full flex-1 items-end">
                <div
                  className={`w-full rounded-t-sm transition-all ${
                    isZero
                      ? 'bg-carvao-100 dark:bg-carvao-800'
                      : isAtual
                      ? 'bg-brand-600'
                      : 'bg-brand-200 dark:bg-brand-800'
                  }`}
                  style={{ height: isZero ? '3px' : `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {/* linha de meta */}
      {meta && meta > 0 && (
        <div className="relative h-px bg-transparent">
          <div
            className="absolute inset-y-0 right-0 left-0 border-t border-dashed border-ouro-500/60"
            style={{ bottom: `${(meta / max) * 64}px`, top: 'auto', position: 'relative', height: 0 }}
          />
        </div>
      )}
      <div className="flex gap-1">
        {dados.map((d, i) => (
          <span
            key={i}
            className={`flex-1 text-center text-micro ${
              i === mesAtualIdx
                ? 'font-bold text-brand-600 dark:text-brand-400'
                : 'text-texto-suave'
            }`}
          >
            {d.mes}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Props ───────────────────────────────────────────────── */

interface Props {
  custoRefSemana?: number | null;
}

/* ── Componente principal ────────────────────────────────── */

export function ContadorRefeicoes({ custoRefSemana }: Props = {}) {
  const [stats, setStats] = useState<StatsRefeicoes | null>(null);
  const [tendencia, setTendencia] = useState<MesTendencia[]>([]);
  const [almoco, setAlmoco] = useState('');
  const [jantar, setJantar] = useState('');
  const [salvo, setSalvo] = useState(false);

  const recarregar = () => {
    setStats(calcularStats());
    setTendencia(calcularTendenciaMensal());
  };

  useEffect(() => { recarregar(); }, []);

  const registrar = () => {
    const a = parseInt(almoco) || 0;
    const j = parseInt(jantar) || 0;
    if (a + j === 0) return;
    registrarDia(hojeISO(), a, j);
    setAlmoco('');
    setJantar('');
    setSalvo(true);
    recarregar();
    setTimeout(() => setSalvo(false), 3000);
  };

  const hoje = stats?.hoje;
  const dow = new Date().getDay();
  const diaNome = DIAS_PT[dow];
  const dataFormatada = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const mediaDia = MEDIA_POR_DIA[dow];

  const varAno = stats && stats.anoPassado > 0
    ? Math.round(((stats.anoAtual - stats.anoPassado) / stats.anoPassado) * 100)
    : null;

  // Alerta de pico: hoje > média do dia * 1.2
  const limiarPico = Math.round(mediaDia.total * 1.2);
  const isPico = hoje && hoje.total >= limiarPico;

  // Custo por refeição hoje (estimado com base no custo/ref da semana)
  const custoHoje = custoRefSemana && hoje && hoje.total > 0
    ? custoRefSemana * hoje.total
    : null;

  return (
    <Cartao>
      <p className="mb-4 text-sm font-extrabold uppercase tracking-widest text-texto-suave">
        Refeições
      </p>

      {/* Hoje */}
      <div className={`mb-4 rounded-2xl px-4 py-3 ${isPico ? 'bg-ouro-300/15 ring-1 ring-ouro-400/40' : 'bg-brand-50 dark:bg-carvao-800/60'}`}>
        <div className="mb-2 flex items-center justify-between">
          <p className={`text-xs font-bold uppercase tracking-widest ${isPico ? 'text-ouro-600 dark:text-ouro-400' : 'text-brand-600 dark:text-brand-400'}`}>
            Hoje — {diaNome}, {dataFormatada}
          </p>
          {isPico && (
            <span className="rounded-full bg-ouro-400/20 px-2 py-0.5 text-micro font-bold text-ouro-700 dark:text-ouro-300">
              Pico ↑{Math.round(((hoje.total - mediaDia.total) / mediaDia.total) * 100)}%
            </span>
          )}
        </div>

        {hoje ? (
          <div className="flex items-end gap-6">
            <div>
              <p className="text-4xl font-black tabular-nums text-carvao-900 dark:text-white">
                {fmt(hoje.total)}
              </p>
              <p className="mt-0.5 text-xs text-texto-suave">
                Almoço {hoje.almoco} · Jantar {hoje.jantar}
                {custoHoje && (
                  <> · <span className="font-semibold text-brand-600 dark:text-brand-400">{formatarReais(custoHoje)}</span></>
                )}
              </p>
              {custoRefSemana && hoje.total > 0 && (
                <p className="mt-1 text-xs text-texto-suave">
                  ~{formatarReais(custoRefSemana)}<span className="text-carvao-300"> / refeição esta semana</span>
                </p>
              )}
            </div>
            <button
              onClick={() => { setAlmoco(String(hoje.almoco)); setJantar(String(hoje.jantar)); }}
              className="mb-1 text-xs font-semibold text-texto-suave hover:text-carvao-600"
            >
              Editar
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-texto-suave">Ainda não registrado hoje.</p>
            <p className="mt-0.5 text-xs text-carvao-300">Média {diaNome}: ~{mediaDia.total} refeições</p>
          </div>
        )}

        {/* Alerta de pico — dica operacional */}
        {isPico && (
          <div className="mt-3 rounded-xl bg-ouro-400/10 px-3 py-2 text-xs text-ouro-700 dark:text-ouro-300">
            Dia acima da média ({mediaDia.total}). Revise porções e estoque.
          </div>
        )}

        {/* Input */}
        <div className="mt-3 flex gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold text-carvao-500">Almoço</label>
            <input
              type="number"
              min="0"
              value={almoco}
              onChange={(e) => setAlmoco(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && registrar()}
              placeholder={String(mediaDia.almoco)}
              className="w-full rounded-xl border border-carvao-200 bg-white px-3 py-2 text-sm font-semibold tabular-nums text-carvao-800 focus:border-brand-400 focus:outline-none dark:border-carvao-700 dark:bg-carvao-900 dark:text-white"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold text-carvao-500">Jantar</label>
            <input
              type="number"
              min="0"
              value={jantar}
              onChange={(e) => setJantar(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && registrar()}
              placeholder={String(mediaDia.jantar)}
              className="w-full rounded-xl border border-carvao-200 bg-white px-3 py-2 text-sm font-semibold tabular-nums text-carvao-800 focus:border-brand-400 focus:outline-none dark:border-carvao-700 dark:bg-carvao-900 dark:text-white"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={registrar}
              disabled={salvo}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                salvo
                  ? 'bg-green-500 text-white'
                  : 'bg-brand-600 text-white hover:bg-brand-700'
              }`}
            >
              {salvo ? '✓' : 'OK'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-carvao-50 px-3 py-2.5 dark:bg-carvao-800/50">
            <p className="text-micro uppercase tracking-wider text-texto-suave">Esta semana</p>
            <p className="mt-0.5 text-xl font-black tabular-nums text-carvao-800 dark:text-white">
              {fmt(stats.semana)}
            </p>
          </div>

          <div className="rounded-xl bg-carvao-50 px-3 py-2.5 dark:bg-carvao-800/50">
            <p className="text-micro uppercase tracking-wider text-texto-suave">Este ano</p>
            <p className="mt-0.5 text-xl font-black tabular-nums text-carvao-800 dark:text-white">
              {fmt(stats.anoAtual)}
            </p>
            {varAno !== null && (
              <p className={`text-micro font-semibold ${varAno >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                {varAno >= 0 ? '+' : ''}{varAno}% vs {Number(new Date().getFullYear()) - 1}
              </p>
            )}
          </div>

          <div className="rounded-xl bg-carvao-50 px-3 py-2.5 dark:bg-carvao-800/50">
            <p className="text-micro uppercase tracking-wider text-texto-suave">Ano passado</p>
            <p className="mt-0.5 text-xl font-black tabular-nums text-carvao-800 dark:text-white">
              {fmt(stats.anoPassado)}
            </p>
          </div>

          <div className="rounded-xl bg-carvao-50 px-3 py-2.5 dark:bg-carvao-800/50">
            <p className="text-micro uppercase tracking-wider text-texto-suave">Total histórico</p>
            <p className="mt-0.5 text-xl font-black tabular-nums text-carvao-800 dark:text-white">
              {fmt(stats.totalHistorico)}
            </p>
            <p className="text-micro text-texto-suave">{fmt(stats.diasRegistrados)} dias</p>
          </div>
        </div>
      )}

      {/* Tendência mensal */}
      {tendencia.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-micro font-bold uppercase tracking-wider text-texto-suave">
            Últimos 12 meses
          </p>
          <GraficoMensal dados={tendencia} />
        </div>
      )}
    </Cartao>
  );
}
