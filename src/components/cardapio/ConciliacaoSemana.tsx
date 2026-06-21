'use client';

/* =====================================================================
   Conciliação automática — cruza três fontes sem precisar de input:
   1. Preço cotado desta semana vs. média histórica do item (radar de preço)
   2. Quantidade total comprada vs. quantidade total necessária no cardápio
      (soma ao longo de todos os dias da semana, para não punir compras
      que cobrem vários dias de uma vez)
   Retorna null se não há divergências.
   ===================================================================== */

import { useMemo } from 'react';
import { useHistoricoPrecos } from '@/lib/cardapio/estado';
import { linhasDoDia, custoDaLista, formatarQtd, formatarReais } from '@/lib/cardapio/motor';
import type { EstadoSemana } from '@/lib/cardapio/tipos';

const CUSTO_MIN_POR_REFEICAO = 2;
const CUSTO_MAX_POR_REFEICAO = 50;

type AlertaPreco = {
  item: string;
  unid: string;
  atual: number;
  medio: number;
  variacao: number; // 0.12 = +12%
};

type AlertaQtd = {
  item: string;
  unid: string;
  necessario: number;
  comprado: number;
  excesso: number;
  custoExcesso: number;
};

export function ConciliacaoSemana({
  estado,
  precos,
}: {
  estado: EstadoSemana;
  precos: Record<string, number>;
}) {
  const historico = useHistoricoPrecos();

  const alertaCustoIrreal = useMemo(() => {
    let totalCusto = 0;
    let totalPessoas = 0;
    for (let di = 0; di < 7; di++) {
      const dia = estado.dias[di];
      if (!dia.principal) continue;
      const linhas = linhasDoDia(estado, di);
      const c = custoDaLista(linhas.map((l) => ({ item: l.item, unid: l.unid, qtd: l.qtd })), precos);
      // só conta dias onde pelo menos metade dos itens tem preço
      if (c.itensComPreco > 0 && c.itensComPreco >= linhas.length * 0.4) {
        totalCusto += c.total;
        totalPessoas += Math.max(dia.pessoas, 1);
      }
    }
    if (totalPessoas === 0) return null;
    const custoMedio = totalCusto / totalPessoas;
    if (custoMedio < CUSTO_MIN_POR_REFEICAO) return { tipo: 'baixo' as const, valor: custoMedio };
    if (custoMedio > CUSTO_MAX_POR_REFEICAO) return { tipo: 'alto' as const, valor: custoMedio };
    return null;
  }, [estado, precos]);

  const { alertasPreco, alertasQtd, custoExcessoTotal } = useMemo(() => {
    /* ---- acumula por chave (item normalizado) ---- */
    const necessario: Record<string, { item: string; unid: string; qtd: number }> = {};
    const comprado: Record<string, number> = {};
    const vistos = new Set<string>(); // para itens usados na semana (preço)

    for (let di = 0; di < 7; di++) {
      const linhas = linhasDoDia(estado, di);
      for (const l of linhas) {
        if (l.manual) continue;
        const k = l.chave;
        vistos.add(k);
        // acumula necessário
        if (!necessario[k]) necessario[k] = { item: l.item, unid: l.unid, qtd: 0 };
        necessario[k].qtd += l.qtd;
        // acumula comprado (só onde há registro de compra)
        if (l.status.compradoQtd !== undefined) {
          comprado[k] = (comprado[k] ?? 0) + l.status.compradoQtd;
        }
      }
    }

    /* ---- 1. Preço acima do histórico ---- */
    const alertasPreco: AlertaPreco[] = [];
    for (const k of Array.from(vistos)) {
      const precoAtual = precos[k];
      if (!precoAtual) continue;
      const hist = historico[k] ?? [];
      if (hist.length < 3) continue; // sem histórico suficiente
      const recentes = hist.slice(-4);
      const medio = recentes.reduce((a, p) => a + p.valor, 0) / recentes.length;
      const variacao = (precoAtual - medio) / medio;
      if (variacao > 0.1) {
        alertasPreco.push({
          item: necessario[k]?.item ?? k,
          unid: necessario[k]?.unid ?? '',
          atual: precoAtual,
          medio,
          variacao,
        });
      }
    }
    alertasPreco.sort((a, b) => b.variacao - a.variacao);

    /* ---- 2. Quantidade comprada acima do necessário ---- */
    const alertasQtd: AlertaQtd[] = [];
    let custoExcessoTotal = 0;
    for (const [k, comp] of Object.entries(comprado)) {
      const nec = necessario[k];
      if (!nec || nec.qtd === 0) continue;
      if (comp <= nec.qtd * 1.15) continue; // dentro da margem de 15%
      const excesso = comp - nec.qtd;
      const custo = excesso * (precos[k] ?? 0);
      custoExcessoTotal += custo;
      alertasQtd.push({
        item: nec.item,
        unid: nec.unid,
        necessario: nec.qtd,
        comprado: comp,
        excesso,
        custoExcesso: custo,
      });
    }
    alertasQtd.sort((a, b) => b.custoExcesso - a.custoExcesso);

    return { alertasPreco, alertasQtd, custoExcessoTotal };
  }, [estado, precos, historico]);

  if (alertasPreco.length === 0 && alertasQtd.length === 0 && !alertaCustoIrreal) return null;

  return (
    <div className="space-y-4 rounded-2xl bg-carvao-50 p-4 ring-1 ring-carvao-200 dark:bg-carvao-900/60 dark:ring-carvao-700/60">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-carvao-400">
        🔍 Conciliação automática
      </p>

      {/* Custo por refeição fora da faixa plausível */}
      {alertaCustoIrreal && (
        <section>
          <div className={`flex items-start gap-3 rounded-xl px-3 py-2.5 ring-1 ${
            alertaCustoIrreal.tipo === 'baixo'
              ? 'bg-blue-500/8 ring-blue-400/30'
              : 'bg-perigo/8 ring-perigo/25'
          }`}>
            <span className="mt-0.5 text-lg">{alertaCustoIrreal.tipo === 'baixo' ? '⚠️' : '🔴'}</span>
            <div className="min-w-0 flex-1">
              <p className={`text-[13px] font-semibold ${alertaCustoIrreal.tipo === 'baixo' ? 'text-blue-700 dark:text-blue-300' : 'text-perigo'}`}>
                Custo por refeição {alertaCustoIrreal.tipo === 'baixo' ? 'muito baixo' : 'muito alto'}
              </p>
              <p className="text-[11px] text-carvao-400">
                Média calculada: {formatarReais(alertaCustoIrreal.valor)}/refeição —{' '}
                {alertaCustoIrreal.tipo === 'baixo'
                  ? `abaixo de ${formatarReais(CUSTO_MIN_POR_REFEICAO)}. Verifique se os preços dos principais itens foram cadastrados.`
                  : `acima de ${formatarReais(CUSTO_MAX_POR_REFEICAO)}. Confirme os preços ou revise as quantidades.`}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Preço acima do histórico */}
      {alertasPreco.length > 0 && (
        <section className="space-y-2">
          <h4 className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.15em] text-ouro-600 dark:text-ouro-300">
            ⬆️ Preço acima do histórico
            <span className="rounded-full bg-ouro-400/20 px-2 py-0.5 text-[10px] font-black">{alertasPreco.length}</span>
          </h4>
          {alertasPreco.map((a, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl bg-ouro-300/10 px-3 py-2.5 ring-1 ring-ouro-400/25">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold leading-tight">{a.item}</p>
                <p className="text-[11px] text-carvao-400">
                  Cotado {formatarReais(a.atual)}/{a.unid} · média recente {formatarReais(a.medio)}/{a.unid}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-ouro-400/25 px-2.5 py-1 text-[11px] font-black text-ouro-700 dark:text-ouro-300">
                +{Math.round(a.variacao * 100)}%
              </span>
            </div>
          ))}
        </section>
      )}

      {/* Quantidade comprada acima do necessário */}
      {alertasQtd.length > 0 && (
        <section className="space-y-2">
          <h4 className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.15em] text-perigo">
            📦 Comprado além do necessário
            <span className="rounded-full bg-perigo/15 px-2 py-0.5 text-[10px] font-black">{alertasQtd.length}</span>
          </h4>
          {alertasQtd.map((a, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl bg-perigo/5 px-3 py-2.5 ring-1 ring-perigo/20"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold leading-tight">{a.item}</p>
                <p className="text-[11px] text-carvao-400">
                  Necessário {formatarQtd(a.necessario)} {a.unid} · comprado {formatarQtd(a.comprado)} {a.unid}
                  {a.custoExcesso > 0 && <> · excesso ≈ {formatarReais(a.custoExcesso)}</>}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-perigo/10 px-2.5 py-1 text-[11px] font-black text-perigo">
                +{formatarQtd(a.excesso)} {a.unid}
              </span>
            </div>
          ))}
          {custoExcessoTotal > 0 && (
            <p className="text-right text-[11px] font-bold text-perigo">
              Custo total do excesso ≈ {formatarReais(custoExcessoTotal)}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
