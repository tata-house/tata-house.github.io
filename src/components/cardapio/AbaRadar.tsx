'use client';

import { useMemo } from 'react';
import { EstadoVazio, Pilula, Secao } from '@/components/ui';
import { formatarReais } from '@/lib/cardapio/motor';
import { analisarRadar, type RadarItem } from '@/lib/cardapio/radar';
import type { HistoricoPrecos } from '@/lib/cardapio/tipos';

function seta(t: 'subindo' | 'caindo' | 'estável') {
  return t === 'subindo' ? '▲' : t === 'caindo' ? '▼' : '▬';
}

/* ── Parecer do comprador ────────────────────────────────────────────
   Lê o radar e fala como um comprador sênior: abre com a conclusão
   (economia possível, quantas frentes) e justifica com as recomendações
   priorizadas. Não despeja dados — entrega decisão pronta. */

interface Recomendacao {
  tom: 'troca' | 'reforco' | 'atencao';
  texto: string;
}

function montarParecer(radar: RadarItem[]): { recomendacoes: Recomendacao[]; economia: number; unidEconomia: string } {
  const recs: Recomendacao[] = [];
  let economia = 0;
  let unidEconomia = 'kg';

  const altasSubst = radar.filter((r) => r.alerta === 'alta' && r.substituir);
  altasSubst.forEach((r) => {
    const pct = Math.round(Math.abs(r.variacao ?? 0) * 100);
    economia += r.substituir!.economia;
    unidEconomia = r.unid || unidEconomia;
    recs.push({
      tom: 'troca',
      texto: `${r.item} subiu ${pct}%${r.fornecedor ? ` na ${r.fornecedor}` : ''} — trocar por ${r.substituir!.item} economiza ${formatarReais(r.substituir!.economia)}/${r.unid}.`,
    });
  });

  // altas sem substituto — atenção pura
  radar
    .filter((r) => r.alerta === 'alta' && !r.substituir)
    .slice(0, 2)
    .forEach((r) => {
      const pct = Math.round(Math.abs(r.variacao ?? 0) * 100);
      recs.push({
        tom: 'atencao',
        texto: `${r.item} subiu ${pct}%${r.fornecedor ? ` na ${r.fornecedor}` : ''} e não tem substituto óbvio — renegocie ou cote outro fornecedor.`,
      });
    });

  // quedas — oportunidade de reforçar
  radar
    .filter((r) => r.alerta === 'queda')
    .slice(0, 2)
    .forEach((r) => {
      const pct = Math.round(Math.abs(r.variacao ?? 0) * 100);
      recs.push({
        tom: 'reforco',
        texto: `${r.item} caiu ${pct}%${r.fornecedor ? ` na ${r.fornecedor}` : ''} — bom momento para reforçar o estoque.`,
      });
    });

  return { recomendacoes: recs, economia, unidEconomia };
}

const TOM_REC: Record<Recomendacao['tom'], { ponto: string; rotulo: string }> = {
  troca:   { ponto: 'bg-emerald-500', rotulo: 'Trocar' },
  reforco: { ponto: 'bg-[#60a5fa]',   rotulo: 'Reforçar' },
  atencao: { ponto: 'bg-ouro-400',    rotulo: 'Atenção' },
};

function ParecerComprador({ radar }: { radar: RadarItem[] }) {
  const { recomendacoes, economia, unidEconomia } = useMemo(() => montarParecer(radar), [radar]);

  if (recomendacoes.length === 0) {
    return (
      <div className="rounded-3xl bg-gradient-to-br from-carvao-900 via-carvao-850 to-brand-900 px-5 py-5 text-white">
        <p className="text-micro font-bold uppercase tracking-[0.18em] text-brand-200/80">Parecer do comprador</p>
        <p className="mt-2 text-sm text-areia-100/80">
          Nenhum movimento anormal de preço nesta cotação. Os fornecedores atuais estão dentro do histórico — pode comprar com segurança.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-carvao-900 via-carvao-850 to-brand-900 text-white">
      <div className="px-5 pt-5">
        <p className="text-micro font-bold uppercase tracking-[0.18em] text-brand-200/80">Parecer do comprador</p>
        <p className="mt-2 font-display text-xl font-bold leading-snug">
          {economia >= 0.01
            ? `Identifiquei ${formatarReais(economia)}/${unidEconomia} de economia possível nesta cotação.`
            : `${recomendacoes.length} ${recomendacoes.length === 1 ? 'ponto pede' : 'pontos pedem'} sua atenção nesta cotação.`}
        </p>
      </div>
      <ul className="mt-3.5 space-y-px bg-white/5 px-2 pb-2">
        {recomendacoes.map((r, i) => (
          <li key={i} className="flex items-start gap-3 rounded-xl px-3 py-2.5">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${TOM_REC[r.tom].ponto}`} />
            <div className="min-w-0">
              <span className="text-micro font-bold uppercase tracking-wider text-white/50">{TOM_REC[r.tom].rotulo}</span>
              <p className="text-sm leading-snug text-areia-50">{r.texto}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AbaRadar({
  precos,
  historico,
  fornecedores,
}: {
  precos: Record<string, number>;
  historico: HistoricoPrecos;
  fornecedores: Record<string, string>;
}) {
  const radar = useMemo(() => analisarRadar(precos, historico, fornecedores), [precos, historico, fornecedores]);
  const alertas = radar.filter((r) => r.alerta);
  const comHistorico = radar.filter((r) => r.pontos >= 2);

  const fornecedoresUsados = useMemo(() => {
    const c = new Map<string, number>();
    Object.values(fornecedores).forEach((f) => c.set(f, (c.get(f) ?? 0) + 1));
    return Array.from(c.entries()).sort((a, b) => b[1] - a[1]);
  }, [fornecedores]);

  if (radar.length === 0) {
    return (
      <EstadoVazio
        titulo="O radar precisa de histórico"
        texto="Cada vez que você lança ou altera um preço (na Cotação ou em Preços), o radar passa a comparar e avisar sobre altas e quedas anormais."
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Parecer do comprador — abre com a conclusão, não com dados */}
      <ParecerComprador radar={radar} />

      {/* Stats inline — sem caixas */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 px-1">
        <span>
          <span className="font-display text-titulo font-bold tabular-nums text-info">{radar.length}</span>
          <span className="ml-1.5 text-rotulo text-carvao-400">itens</span>
        </span>
        <span>
          <span className={`font-display text-titulo font-bold tabular-nums ${alertas.length ? 'text-perigo' : 'text-brand-600'}`}>
            {alertas.length}
          </span>
          <span className="ml-1.5 text-rotulo text-carvao-400">alertas</span>
        </span>
        <span>
          <span className="font-display text-titulo font-bold tabular-nums text-carvao-900 dark:text-areia-50">{fornecedoresUsados.length}</span>
          <span className="ml-1.5 text-rotulo text-carvao-400">fornecedores</span>
        </span>
      </div>

      {/* Tendência por item */}
      <Secao titulo="Tendência de preços">
        <ul className="overflow-hidden rounded-2xl bg-white divide-y divide-carvao-50 dark:divide-carvao-800/50 dark:bg-carvao-850 dark:ring-1 dark:ring-carvao-700/60">
          {comHistorico.slice(0, 40).map((r) => (
            <li key={r.norm} className="flex items-center justify-between gap-3 px-4 py-2.5 transition hover:bg-areia-50/70 dark:hover:bg-carvao-800/60">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{r.item}</p>
                <p className="text-caption text-carvao-400">
                  {formatarReais(r.atual)}/{r.unid}
                  {r.fornecedor && <span className="text-brand-600"> · {r.fornecedor}</span>}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {r.variacao !== null && (
                  <span
                    className={`text-sm font-bold ${
                      r.variacao > 0.001 ? 'text-perigo' : r.variacao < -0.001 ? 'text-brand-600' : 'text-carvao-400'
                    }`}
                  >
                    {seta(r.tendencia)} {r.variacao > 0 ? '+' : ''}
                    {Math.round(r.variacao * 100)}%
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Secao>

      {/* Fornecedores mais usados */}
      {fornecedoresUsados.length > 0 && (
        <Secao titulo="Fornecedores">
          <div className="flex flex-wrap gap-2">
            {fornecedoresUsados.map(([f, n]) => (
              <Pilula key={f} tom="verde">
                {f} · {n} {n === 1 ? 'item' : 'itens'}
              </Pilula>
            ))}
          </div>
        </Secao>
      )}
    </div>
  );
}
