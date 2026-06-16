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
import { linhasDoDia, formatarQtd, formatarReais } from '@/lib/cardapio/motor';
import type { EstadoSemana } from '@/lib/cardapio/tipos';

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
    for (const k of vistos) {
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

  if (alertasPreco.length === 0 && alertasQtd.length === 0) return null;

  return (
    <div className="space-y-4 rounded-2xl bg-carvao-50 p-4 ring-1 ring-carvao-200 dark:bg-carvao-900/60 dark:ring-carvao-700/60">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-carvao-400">
        🔍 Conciliação automática
      </p>

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
          <h4 className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#b04c41]">
            📦 Comprado além do necessário
            <span className="rounded-full bg-[#b04c41]/15 px-2 py-0.5 text-[10px] font-black">{alertasQtd.length}</span>
          </h4>
          {alertasQtd.map((a, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl bg-[#b04c41]/5 px-3 py-2.5 ring-1 ring-[#b04c41]/20"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold leading-tight">{a.item}</p>
                <p className="text-[11px] text-carvao-400">
                  Necessário {formatarQtd(a.necessario)} {a.unid} · comprado {formatarQtd(a.comprado)} {a.unid}
                  {a.custoExcesso > 0 && <> · excesso ≈ {formatarReais(a.custoExcesso)}</>}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-[#b04c41]/10 px-2.5 py-1 text-[11px] font-black text-[#b04c41]">
                +{formatarQtd(a.excesso)} {a.unid}
              </span>
            </div>
          ))}
          {custoExcessoTotal > 0 && (
            <p className="text-right text-[11px] font-bold text-[#b04c41]">
              Custo total do excesso ≈ {formatarReais(custoExcessoTotal)}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
