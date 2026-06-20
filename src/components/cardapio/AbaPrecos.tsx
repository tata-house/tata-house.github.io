'use client';

import { useMemo, useRef, useState } from 'react';
import { Botao, Cartao, Pilula, estiloInput } from '@/components/ui';
import { Icone } from '@/components/Icones';
import { DADOS, formatarReais, normalizar } from '@/lib/cardapio/motor';
import { resolverPreco, ROTULO_TIPO_PRECO } from '@/lib/cardapio/precos';
import { useHistoricoPrecos, registrarAuditoria } from '@/lib/cardapio/estado';
import { useEstimativas } from '@/lib/cardapio/estimativas';
import { DialogoContexto } from './ContextoDecisao';
import type { ContextoDecisao } from '@/lib/cardapio/tipos';

/**
 * Preços por item — com tipo (real / estimado / sem preço) e histórico em
 * accordion: preço atual, menor, maior, último, variação e fornecedor.
 * O preço real vem da cotação/nota; a estimativa é a média de mercado.
 */
export function AbaPrecos({
  precos,
  definirPreco,
  fornecedores = {},
  itensExtras = {},
}: {
  precos: Record<string, number>;
  definirPreco: (itemNorm: string, valor: number | null, nome?: string) => void;
  fornecedores?: Record<string, string>;
  itensExtras?: Record<string, { n: string; u: string }>;
}) {
  const [busca, setBusca] = useState('');
  const [aberto, setAberto] = useState<string | null>(null);
  const [contextoItem, setContextoItem] = useState<{ norm: string; nome: string } | null>(null);
  const precoBefore = useRef<Record<string, number | undefined>>({});
  const historico = useHistoricoPrecos();
  const { estimativas, definirEstimativa, gerarEstimativas } = useEstimativas();

  const salvarContexto = (contexto: ContextoDecisao) => {
    if (!contextoItem) return;
    registrarAuditoria({
      acao: 'justificou mudança de preço',
      alvo: contextoItem.nome,
      contexto,
    });
    setContextoItem(null);
  };

  const itens = useMemo(() => {
    const extras = Object.values(itensExtras).map((e) => ({ n: e.n, u: e.u, f: 0 }));
    const todos = [...extras, ...DADOS.itens];
    const n = normalizar(busca);
    const base = n ? todos.filter((i) => normalizar(i.n).includes(n)) : todos;
    return base.slice(0, 60);
  }, [busca, itensExtras]);

  const cadReais = Object.keys(precos).length;
  const cadEst = Object.keys(estimativas).length;

  return (
    <div className="space-y-4">
      <DialogoContexto
        aberto={!!contextoItem}
        titulo={contextoItem ? `Por que o preço de ${contextoItem.nome} mudou?` : undefined}
        fechar={() => setContextoItem(null)}
        onConfirmar={salvarContexto}
      />
      <Cartao className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Pilula tom="verde">{cadReais} reais</Pilula>
          <Pilula tom="ouro">{cadEst} estimados</Pilula>
          <Botao
            variante="secundario"
            className="ml-auto !min-h-9 !px-3 !py-1.5 text-[12px]"
            onClick={() => gerarEstimativas(itens.map((i) => normalizar(i.n)), precos)}
          >
            <Icone nome="raio" tam={15} /> Estimar sem preço
          </Botao>
        </div>
        <p className="text-sm text-carvao-500 dark:text-carvao-300">
          Preço <strong>real</strong> vem da cotação/nota. Sem preço real, o app pode usar uma{' '}
          <strong>estimativa</strong> de mercado (confirme depois). Toque no item para ver o histórico.
        </p>
        <input
          className={estiloInput}
          placeholder="Buscar item…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </Cartao>

      <Cartao className="!p-0">
        <ul className="divide-y divide-carvao-100 dark:divide-carvao-700/60">
          {itens.map((i) => {
            const k = normalizar(i.n);
            const pr = resolverPreco(k, precos, estimativas);
            const serie = historico[k] ?? [];
            const valores = serie.map((s) => s.valor);
            const atual = valores[valores.length - 1];
            const anterior = valores.length >= 2 ? valores[valores.length - 2] : undefined;
            const variacao = anterior && anterior > 0 ? (atual - anterior) / anterior : undefined;
            const estaAberto = aberto === k;

            return (
              <li key={i.n}>
                <div className="flex items-center justify-between gap-2 px-4 py-2.5">
                  <button
                    type="button"
                    onClick={() => setAberto(estaAberto ? null : k)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <Icone
                      nome="baixo"
                      tam={14}
                      className={`shrink-0 text-carvao-400 transition-transform ${estaAberto ? 'rotate-180' : ''}`}
                    />
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold">{i.n}</span>
                        <Pilula tom={pr.tipo === 'real' ? 'verde' : pr.tipo === 'estimado' ? 'ouro' : 'vermelho'}>
                          {ROTULO_TIPO_PRECO[pr.tipo]}
                        </Pilula>
                      </span>
                      <span className="block text-[11px] text-carvao-400">
                        {i.u}
                        {fornecedores[k] && <span className="font-semibold text-brand-600"> · ↓ {fornecedores[k]}</span>}
                      </span>
                    </span>
                  </button>
                  <div className="flex shrink-0 items-center gap-1.5 text-sm">
                    <span className="text-carvao-400">R$</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      inputMode="decimal"
                      value={precos[k] ?? ''}
                      placeholder="0,00"
                      onFocus={() => { precoBefore.current[k] = precos[k]; }}
                      onChange={(e) => definirPreco(k, e.target.value === '' ? null : Number(e.target.value), i.n)}
                      onBlur={() => {
                        const antes = precoBefore.current[k];
                        const depois = precos[k];
                        if (antes && depois && antes > 0 && Math.abs(depois - antes) / antes >= 0.10) {
                          setContextoItem({ norm: k, nome: i.n });
                        }
                      }}
                      className="w-20 rounded-xl border border-carvao-200 bg-white px-2 py-1.5 text-right font-bold tabular-nums dark:border-carvao-600 dark:bg-carvao-900"
                    />
                    <span className="w-6 text-[11px] text-carvao-400">/{i.u}</span>
                  </div>
                </div>

                {estaAberto && (
                  <div className="space-y-3 bg-areia-50/60 px-4 py-3 dark:bg-carvao-900/40">
                    {valores.length > 0 ? (
                      <div className="grid grid-cols-4 gap-2 text-center">
                        {[
                          { r: 'Atual', v: atual },
                          { r: 'Último', v: anterior },
                          { r: 'Menor', v: Math.min(...valores) },
                          { r: 'Maior', v: Math.max(...valores) },
                        ].map((c) => (
                          <div key={c.r} className="rounded-xl bg-white p-2 ring-1 ring-carvao-100 dark:bg-carvao-850 dark:ring-carvao-700/60">
                            <p className="text-[9px] font-bold uppercase tracking-wide text-carvao-400">{c.r}</p>
                            <p className="text-[13px] font-bold tabular-nums">{c.v ? formatarReais(c.v) : '—'}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-carvao-400">Sem histórico ainda — o histórico se forma ao aplicar cotações.</p>
                    )}

                    {variacao !== undefined && Math.abs(variacao) > 0.001 && (
                      <p className={`text-xs font-bold ${variacao > 0 ? 'text-[#b04c41]' : 'text-brand-600'}`}>
                        {variacao > 0 ? '▲' : '▼'} {variacao > 0 ? '+' : ''}
                        {Math.round(variacao * 100)}% desde o último preço
                      </p>
                    )}

                    {pr.tipo !== 'real' && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-ouro-600">Estimativa (R$):</span>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          inputMode="decimal"
                          value={estimativas[k] ?? ''}
                          placeholder="0,00"
                          onChange={(e) => definirEstimativa(k, e.target.value === '' ? null : Number(e.target.value))}
                          className="w-24 rounded-xl border border-ouro-400/40 bg-white px-2 py-1.5 text-right font-bold tabular-nums dark:bg-carvao-900"
                        />
                        <span className="text-[11px] text-carvao-400">
                          {pr.tipo === 'estimado'
                            ? 'estimativa em uso — confirme com o preço real da cotação.'
                            : 'sem preço — lance o real acima ou uma estimativa.'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Cartao>
    </div>
  );
}
