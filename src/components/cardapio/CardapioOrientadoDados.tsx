'use client';

import { useMemo } from 'react';
import { Cartao, EstadoVazio, Kpi, Secao } from '@/components/ui';
import { calcularCustosSemana } from '@/lib/cardapio/custo-prato';
import { calcularProjecoes } from '@/lib/cardapio/projecao-precos';
import { normalizar } from '@/lib/cardapio/motor';
import type { Aceitacao, DiaCardapio, HistoricoPrecos } from '@/lib/cardapio/tipos';
import { DADOS } from '@/lib/cardapio/motor';

const nomeDe = new Map<string, string>();
DADOS.itens.forEach((i) => nomeDe.set(normalizar(i.n), i.n));

function fmt(v: number) {
  return `R$ ${v.toFixed(2).replace('.', ',')}`;
}

interface SugestaoSubstituicao {
  pratoAtual: string;
  categoria: string;
  custoPorcaoAtual: number;
  aceitacaoAtual: number | null;
  scoreAtual: number;
  pratoAlternativo: string;
  custoPorcaoAlt: number;
  aceitacaoAlt: number | null;
  scoreAlt: number;
  economiaEstimadaDia: number;
  motivo: string;
}

export function CardapioOrientadoDados({
  dias,
  precos,
  aceitacao,
  historico,
}: {
  dias: DiaCardapio[];
  precos: Record<string, number>;
  aceitacao: Aceitacao;
  historico: HistoricoPrecos;
}) {
  // Custo por prato da semana
  const custos = useMemo(() => calcularCustosSemana(dias, precos), [dias, precos]);

  // Projeções de inflação
  const projecoes = useMemo(
    () => calcularProjecoes(precos, historico, nomeDe),
    [precos, historico],
  );
  const alertasAntecipados = projecoes.filter((p) => p.alertaAntecipado).slice(0, 6);

  // Score de valor = aceitacao_media / custo_porcao (normalizado)
  const scores = useMemo(() => {
    return custos.map((c) => {
      const reg = aceitacao[c.norm];
      const mediaAc = reg && reg.n > 0 ? reg.somaNotas / reg.n : null;
      const score = c.custoPorcao > 0 && mediaAc !== null ? mediaAc / c.custoPorcao : null;
      return { ...c, mediaAceitacao: mediaAc, score };
    });
  }, [custos, aceitacao]);

  // Ranking: melhor custo-benefício
  const comScore = scores.filter((s) => s.score !== null).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const top5 = comScore.slice(0, 5);
  const bottom5 = comScore.slice(-5).reverse();

  // Sugestões de substituição: prato com baixo score → substituto de melhor score na mesma categoria
  const sugestoes = useMemo((): SugestaoSubstituicao[] => {
    const res: SugestaoSubstituicao[] = [];
    const porCategoria = new Map<string, typeof scores>();
    scores.forEach((s) => {
      if (!porCategoria.has(s.categoria)) porCategoria.set(s.categoria, []);
      porCategoria.get(s.categoria)!.push(s);
    });

    // busca substitutos no histórico de combos/mapas (pratos que a casa já fez)
    const pratosHistorico = new Map<string, string>();
    DADOS.mapas.forEach((m) => pratosHistorico.set(normalizar(m.op), m.op));
    DADOS.combos.forEach((c) => {
      if (c.p) pratosHistorico.set(normalizar(c.p), c.p);
      if (c.g) pratosHistorico.set(normalizar(c.g), c.g);
      if (c.s) pratosHistorico.set(normalizar(c.s), c.s);
      if (c.sb) pratosHistorico.set(normalizar(c.sb), c.sb);
    });

    // Para cada prato ruim (score baixo com custo alto), sugere alternativa
    bottom5.forEach((pior) => {
      if (!pior.score) return;
      const alternativas = porCategoria.get(pior.categoria) ?? [];
      const melhor = alternativas
        .filter((a) => a.norm !== pior.norm && (a.score ?? 0) > (pior.score ?? 0))
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];

      if (melhor && melhor.custoPorcao < pior.custoPorcao * 0.9) {
        const economia = (pior.custoPorcao - melhor.custoPorcao) * pior.pessoas;
        let motivo = 'Custo mais alto para aceitação semelhante';
        if (pior.mediaAceitacao !== null && melhor.mediaAceitacao !== null) {
          if (melhor.mediaAceitacao > pior.mediaAceitacao) {
            motivo = `Maior aceitação (${melhor.mediaAceitacao.toFixed(1)} vs ${pior.mediaAceitacao.toFixed(1)}) com menor custo`;
          }
        } else {
          motivo = `${Math.round(((pior.custoPorcao - melhor.custoPorcao) / pior.custoPorcao) * 100)}% mais barato por porção`;
        }
        res.push({
          pratoAtual: pior.prato,
          categoria: pior.categoria,
          custoPorcaoAtual: pior.custoPorcao,
          aceitacaoAtual: pior.mediaAceitacao,
          scoreAtual: pior.score ?? 0,
          pratoAlternativo: melhor.prato,
          custoPorcaoAlt: melhor.custoPorcao,
          aceitacaoAlt: melhor.mediaAceitacao,
          scoreAlt: melhor.score ?? 0,
          economiaEstimadaDia: economia,
          motivo,
        });
      }
    });
    return res;
  }, [scores, bottom5]);

  const totalEconomia = sugestoes.reduce((s, x) => s + x.economiaEstimadaDia, 0);

  if (custos.length === 0 && alertasAntecipados.length === 0) {
    return (
      <EstadoVazio
        icone="🎯"
        titulo="Dados insuficientes para orientação"
        texto="Cadastre o cardápio, preços e pelo menos algumas avaliações para gerar recomendações orientadas por dados."
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Alertas antecipados de inflação */}
      {alertasAntecipados.length > 0 && (
        <Secao titulo="📈 Inflação projetada — próximas 4 semanas">
          <div className="space-y-2">
            {alertasAntecipados.map((p) => (
              <Cartao key={p.norm} className="!py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-carvao-800 dark:text-areia-100">{p.item}</p>
                    <p className="text-xs text-carvao-400">
                      Hoje: {fmt(p.atual)} · Projetado: {fmt(p.projecao4s)} em 4 semanas
                    </p>
                    <p className="text-[11px] text-carvao-400">
                      Confiança: {Math.round(p.confianca * 100)}% · {p.pontos} pontos de histórico
                    </p>
                  </div>
                  <span className="shrink-0 rounded-xl bg-red-50 px-2.5 py-1 text-sm font-bold text-red-600 dark:bg-red-950/40 dark:text-red-400">
                    +{Math.round(p.projecao4sPct * 100)}%
                  </span>
                </div>
              </Cartao>
            ))}
          </div>
        </Secao>
      )}

      {/* Sugestões de substituição */}
      {sugestoes.length > 0 && (
        <Secao titulo="🔄 Substituições sugeridas por dados">
          {totalEconomia > 0 && (
            <div className="mb-3 rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-700 dark:bg-brand-900/20 dark:text-brand-300">
              💡 Economia estimada aplicando todas as sugestões: <strong>{fmt(totalEconomia)}/dia</strong>
            </div>
          )}
          <div className="space-y-3">
            {sugestoes.map((s, i) => (
              <Cartao key={i} className="!py-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-carvao-400">{s.categoria}</p>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-[#b04c41] dark:text-[#e89a90] line-through opacity-70">{s.pratoAtual}</p>
                      <span className="text-xs text-carvao-400">{fmt(s.custoPorcaoAtual)}/pax</span>
                    </div>
                    <div className="my-1 flex items-center gap-1 text-xs text-carvao-400">
                      <span>↓</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-brand-700 dark:text-brand-300">{s.pratoAlternativo}</p>
                      <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">{fmt(s.custoPorcaoAlt)}/pax</span>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-xs text-carvao-500">{s.motivo}</p>
                {s.economiaEstimadaDia > 0 && (
                  <p className="mt-1 text-[11px] font-semibold text-brand-600 dark:text-brand-400">
                    Economia estimada: {fmt(s.economiaEstimadaDia)}/dia
                  </p>
                )}
              </Cartao>
            ))}
          </div>
        </Secao>
      )}

      {/* Ranking custo-benefício */}
      {comScore.length > 0 && (
        <>
          <Secao titulo="🏆 Melhor custo-benefício da semana">
            <Cartao className="!p-0">
              <ul className="divide-y divide-carvao-100 dark:divide-carvao-700/60">
                {top5.map((s, i) => (
                  <li key={s.norm} className="flex items-center gap-3 px-4 py-3">
                    <span className="w-5 shrink-0 text-center text-sm font-bold text-carvao-400">#{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-carvao-800 dark:text-areia-100">{s.prato}</p>
                      <p className="text-xs text-carvao-400">
                        {fmt(s.custoPorcao)}/pax
                        {s.mediaAceitacao !== null && ` · ${s.mediaAceitacao.toFixed(1)}/5 aceitação`}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-xl bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-900/20 dark:text-brand-300">
                      {s.categoria}
                    </span>
                  </li>
                ))}
              </ul>
            </Cartao>
          </Secao>

          {bottom5.length > 0 && (
            <Secao titulo="⚠️ Menor custo-benefício — candidatos a revisão">
              <Cartao className="!p-0">
                <ul className="divide-y divide-carvao-100 dark:divide-carvao-700/60">
                  {bottom5.map((s) => (
                    <li key={s.norm} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-carvao-800 dark:text-areia-100">{s.prato}</p>
                        <p className="text-xs text-carvao-400">
                          {fmt(s.custoPorcao)}/pax
                          {s.mediaAceitacao !== null ? ` · ${s.mediaAceitacao.toFixed(1)}/5 aceitação` : ' · sem avaliações'}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-xl bg-carvao-50 px-2 py-0.5 text-xs font-semibold text-carvao-500 dark:bg-carvao-700 dark:text-carvao-300">
                        {s.categoria}
                      </span>
                    </li>
                  ))}
                </ul>
              </Cartao>
            </Secao>
          )}
        </>
      )}

      {comScore.length === 0 && custos.length > 0 && (
        <div className="rounded-2xl bg-carvao-50 py-8 text-center dark:bg-carvao-800/50">
          <p className="text-sm font-semibold text-carvao-500">Sem avaliações ainda</p>
          <p className="mt-1 text-xs text-carvao-400">
            Registre avaliações dos pratos para gerar o ranking de custo-benefício.
          </p>
        </div>
      )}
    </div>
  );
}
