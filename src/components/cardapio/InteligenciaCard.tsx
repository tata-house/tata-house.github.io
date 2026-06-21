'use client';

import { useEffect, useMemo, useState } from 'react';
import { montarDossieCompleto, useAcoesComprometidas } from '@/lib/cardapio/estado';
import {
  OBJETIVOS_ROTULO,
  resolverObjetivo,
  type TipoObjetivo,
  type PlanoObjetivo,
} from '@/lib/cardapio/objetivos';
import {
  extrairMetrica,
  medirResultadoAcao,
  acoesParaMedir,
  acoesAtivasSemana,
  rotuloResultado,
  metricaParaObjetivo,
} from '@/lib/cardapio/rastreamento';
import type { Aceitacao, AcaoComprometida, Estoque, EstadoSemana, HistoricoPrecos } from '@/lib/cardapio/tipos';

interface Props {
  estado: EstadoSemana;
  semanaId: string;
  precos: Record<string, number>;
  aceitacao: Aceitacao;
  estoque: Estoque;
  historico: HistoricoPrecos;
  fornecedores: Record<string, string>;
}

const OBJETIVOS: { tipo: TipoObjetivo; icone: string }[] = [
  { tipo: 'reduzir_custo', icone: '💰' },
  { tipo: 'reduzir_desperdicio', icone: '♻️' },
  { tipo: 'melhorar_aceitacao', icone: '⭐' },
  { tipo: 'equilibrar_proteinas', icone: '🥩' },
];

const fmtReais = (v: number) => `R$ ${v.toFixed(0)}`;

const COR_AVALIACAO: Record<string, string> = {
  melhorou: 'text-brand-600 dark:text-brand-400',
  igual: 'text-carvao-400',
  piorou: 'text-ouro-600 dark:text-ouro-400',
};

export function InteligenciaCard(props: Props) {
  const [escolhido, setEscolhido] = useState<TipoObjetivo | null>(null);
  const { acoes, comprometer, registrarResultado } = useAcoesComprometidas();

  const dossie = useMemo(
    () =>
      montarDossieCompleto({
        semanaId: props.semanaId,
        estado: props.estado,
        precos: props.precos,
        aceitacao: props.aceitacao,
        estoque: props.estoque,
        historico: props.historico,
        fornecedores: props.fornecedores,
      }),
    [props.semanaId, props.estado, props.precos, props.aceitacao, props.estoque, props.historico, props.fornecedores],
  );

  const plano: PlanoObjetivo | null = useMemo(
    () => (escolhido ? resolverObjetivo({ tipo: escolhido }, dossie) : null),
    [escolhido, dossie],
  );

  // Auto-mede resultados de ações de semanas anteriores
  useEffect(() => {
    const paraMedir = acoesParaMedir(acoes, props.semanaId);
    for (const acao of paraMedir) {
      const resultado = medirResultadoAcao(acao, props.semanaId, dossie);
      if (resultado) registrarResultado(acao.id, resultado);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acoes.length, props.semanaId]);

  const dna = dossie.dna;
  const ativasSemana = useMemo(() => acoesAtivasSemana(acoes, props.semanaId), [acoes, props.semanaId]);
  const comResultado = useMemo(
    () => acoes.filter((a) => a.resultado).slice(0, 5),
    [acoes],
  );

  const idsDaDescricao = useMemo(
    () => new Set(ativasSemana.map((a) => a.descricao)),
    [ativasSemana],
  );

  const handleComprometer = (acao: PlanoObjetivo['acoes'][number]) => {
    if (!escolhido) return;
    const metrica = metricaParaObjetivo(escolhido);
    const valorAntes = extrairMetrica(metrica, dossie);
    if (valorAntes === null) return;
    comprometer({
      semanaId: props.semanaId,
      tipoObjetivo: escolhido,
      descricao: acao.acao,
      base: acao.base,
      metrica,
      valorAntes,
    });
  };

  return (
    <section className="rounded-3xl bg-white p-5 shadow-suave ring-1 ring-carvao-100 dark:bg-carvao-850 dark:ring-carvao-700">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xl">🧠</span>
        <h2 className="font-display text-base font-bold text-carvao-800 dark:text-areia-100">Inteligência da casa</h2>
      </div>

      {/* DNA alimentar */}
      {dna && dna.resumo && (
        <div className="mb-4 rounded-2xl bg-brand-50/60 p-3 ring-1 ring-brand-500/15 dark:bg-carvao-800">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-brand-600 dark:text-brand-300">DNA alimentar</p>
          <p className="text-sm text-carvao-700 dark:text-areia-100">{dna.resumo}</p>
          {dna.proteinasPreferidas.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {dna.proteinasPreferidas.map((p) => (
                <span
                  key={p.rotulo}
                  className="rounded-full bg-white px-2 py-0.5 text-caption font-semibold text-carvao-600 ring-1 ring-carvao-200 dark:bg-carvao-700 dark:text-areia-200 dark:ring-carvao-600"
                >
                  {p.rotulo} {p.pct}%{p.nota !== null ? ` · ${p.nota}★` : ''}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Resultados de ações anteriores */}
      {comResultado.length > 0 && (
        <div className="mb-4 rounded-2xl bg-areia-50 p-3 ring-1 ring-carvao-100 dark:bg-carvao-800 dark:ring-carvao-700">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-carvao-500 dark:text-areia-400">
            📊 Resultados das ações comprometidas
          </p>
          <div className="space-y-1.5">
            {comResultado.map((a) => (
              <div key={a.id} className="rounded-xl bg-white px-3 py-2 ring-1 ring-carvao-100 dark:bg-carvao-850 dark:ring-carvao-700">
                <p className="truncate text-rotulo font-medium text-carvao-700 dark:text-areia-200">{a.descricao}</p>
                <p className={`text-caption font-semibold ${COR_AVALIACAO[a.resultado!.avaliacao]}`}>
                  {rotuloResultado(a.resultado!, a.metrica)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* seletor de objetivo */}
      <p className="mb-2 text-xs font-semibold text-carvao-500 dark:text-areia-300">Qual o objetivo da semana?</p>
      <div className="grid grid-cols-2 gap-2">
        {OBJETIVOS.map((o) => (
          <button
            key={o.tipo}
            onClick={() => setEscolhido((e) => (e === o.tipo ? null : o.tipo))}
            className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition ${
              escolhido === o.tipo
                ? 'bg-brand-600 text-white ring-2 ring-brand-500/40'
                : 'bg-areia-100 text-carvao-700 hover:bg-areia-200 dark:bg-carvao-700 dark:text-areia-100 dark:hover:bg-carvao-600'
            }`}
          >
            <span className="text-base">{o.icone}</span>
            <span>{OBJETIVOS_ROTULO[o.tipo]}</span>
          </button>
        ))}
      </div>

      {/* plano resolvido */}
      {plano && (
        <div className="mt-4 animate-subir rounded-2xl bg-areia-50 p-4 ring-1 ring-carvao-100 dark:bg-carvao-800 dark:ring-carvao-700">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="font-display text-sm font-bold text-carvao-800 dark:text-areia-100">{plano.titulo}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                plano.viabilidade === 'alta'
                  ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                  : plano.viabilidade === 'media'
                    ? 'bg-ouro-200 text-ouro-700'
                    : 'bg-carvao-200 text-carvao-600 dark:bg-carvao-700 dark:text-areia-300'
              }`}
            >
              viabilidade {plano.viabilidade}
            </span>
          </div>
          <p className="mb-3 text-[13px] text-carvao-600 dark:text-areia-200">{plano.resumo}</p>
          <ol className="space-y-2">
            {plano.acoes.map((a, i) => {
              const jaComprometido = idsDaDescricao.has(a.acao);
              return (
                <li key={i} className="flex items-start gap-2.5 rounded-xl bg-white p-2.5 ring-1 ring-carvao-100 dark:bg-carvao-850 dark:ring-carvao-700">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-caption font-bold text-white mt-0.5">
                    {a.prioridade}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-carvao-800 dark:text-areia-100">{a.acao}</p>
                    <p className="mt-0.5 text-caption text-carvao-400 dark:text-areia-400">
                      {a.base}
                      {a.impactoReais ? ` · economia ~${fmtReais(a.impactoReais)}` : ''}
                    </p>
                  </div>
                  {jaComprometido ? (
                    <span className="mt-0.5 shrink-0 text-sm" title="Comprometido esta semana">📌</span>
                  ) : (
                    <button
                      onClick={() => handleComprometer(a)}
                      title="Vou fazer isso esta semana"
                      className="mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-caption font-bold text-brand-600 ring-1 ring-brand-400/40 hover:bg-brand-50 dark:text-brand-400 dark:ring-brand-500/30 dark:hover:bg-brand-900/20 transition"
                    >
                      📌 Vou fazer
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
          {plano.impactoTotalReais > 0 && (
            <p className="mt-3 text-right text-sm font-bold text-brand-700 dark:text-brand-300">
              Economia estimada: {fmtReais(plano.impactoTotalReais)}/semana
            </p>
          )}
        </div>
      )}

      {/* comprometimentos ativos desta semana */}
      {ativasSemana.length > 0 && (
        <div className="mt-4 rounded-2xl bg-brand-50 p-3 ring-1 ring-brand-500/20 dark:bg-brand-900/20 dark:ring-brand-600/30">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-brand-600 dark:text-brand-400">
            📌 Comprometidos esta semana
          </p>
          <ul className="space-y-1">
            {ativasSemana.map((a) => (
              <li key={a.id} className="text-rotulo text-carvao-700 dark:text-areia-200">
                · {a.descricao}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
