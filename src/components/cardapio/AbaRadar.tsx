'use client';

import { useMemo } from 'react';
import { Cartao, EstadoVazio, Kpi, Pilula, Secao } from '@/components/cardapio/ui';
import { formatarReais } from '@/lib/cardapio/motor';
import { analisarRadar, fraseAlerta } from '@/lib/cardapio/radar';
import type { HistoricoPrecos } from '@/lib/cardapio/tipos';

function seta(t: 'subindo' | 'caindo' | 'estável') {
  return t === 'subindo' ? '▲' : t === 'caindo' ? '▼' : '▬';
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
        icone="📡"
        titulo="O radar precisa de histórico"
        texto="Cada vez que você lança ou altera um preço (na Cotação ou em Preços), o radar passa a comparar e avisar sobre altas e quedas anormais."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <Kpi rotulo="Itens monitorados" valor={radar.length} tom="azul" icone="📡" />
        <Kpi rotulo="Alertas ativos" valor={alertas.length} tom={alertas.length ? 'vermelho' : 'verde'} icone="🚨" />
        <Kpi rotulo="Fornecedores" valor={fornecedoresUsados.length} tom="neutro" icone="🏬" />
      </div>

      {/* Alertas com frase pronta */}
      {alertas.length > 0 && (
        <Secao titulo="🚨 Alertas de preço">
          <div className="space-y-2">
            {alertas.slice(0, 8).map((r) => (
              <Cartao key={r.norm} className="flex items-start gap-3 !py-3">
                <Pilula tom={r.alerta === 'alta' ? 'vermelho' : 'azul'}>{r.alerta === 'alta' ? 'Alta' : 'Queda'}</Pilula>
                <p className="text-sm text-carvao-600 dark:text-areia-200">{fraseAlerta(r)}</p>
              </Cartao>
            ))}
          </div>
        </Secao>
      )}

      {/* Tendência por item */}
      <Secao titulo="📈 Tendência de preços">
        <Cartao className="!p-0">
          <ul className="divide-y divide-carvao-100 dark:divide-carvao-700/60">
            {comHistorico.slice(0, 40).map((r) => (
              <li key={r.norm} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{r.item}</p>
                  <p className="text-[11px] text-carvao-400">
                    {formatarReais(r.atual)}/{r.unid}
                    {r.fornecedor && <span className="text-brand-600"> · ↓ {r.fornecedor}</span>}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {r.variacao !== null && (
                    <span
                      className={`text-sm font-bold ${
                        r.variacao > 0.001 ? 'text-[#b04c41]' : r.variacao < -0.001 ? 'text-brand-600' : 'text-carvao-400'
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
        </Cartao>
      </Secao>

      {/* Fornecedores mais usados */}
      {fornecedoresUsados.length > 0 && (
        <Secao titulo="🏬 Fornecedores mais usados">
          <Cartao className="flex flex-wrap gap-2">
            {fornecedoresUsados.map(([f, n]) => (
              <Pilula key={f} tom="verde">
                {f} · {n} {n === 1 ? 'item' : 'itens'}
              </Pilula>
            ))}
          </Cartao>
        </Secao>
      )}
    </div>
  );
}
