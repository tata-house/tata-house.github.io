'use client';

import { Botao, Cartao } from '@/components/ui';
import { DIAS_SEMANA, formatarReais, linhasDoDia } from '@/lib/cardapio/motor';
import type { EstadoSemana, Etapa, Papel } from '@/lib/cardapio/tipos';

const ETAPAS: { id: Etapa; rotulo: string; quem: string }[] = [
  { id: 'rascunho', rotulo: 'Montagem do cardápio', quem: 'Gestor' },
  { id: 'cozinha', rotulo: 'Revisão da cozinha', quem: 'Cozinha' },
  { id: 'compras', rotulo: 'Compra dos itens', quem: 'Setor de compras' },
  { id: 'recebimento', rotulo: 'Recebimento', quem: 'Recebimento' },
  { id: 'concluido', rotulo: 'Semana concluída', quem: '—' },
];

const ACAO_POR_ETAPA: Partial<
  Record<Etapa, { rotulo: string; proxima: Etapa; papeis: Papel[] }>
> = {
  rascunho: { rotulo: '📨 Enviar para revisão da cozinha', proxima: 'cozinha', papeis: ['gestor'] },
  cozinha: { rotulo: '✅ Cozinha aprova a lista', proxima: 'compras', papeis: ['cozinha', 'gestor'] },
  compras: { rotulo: '🛒 Compras finalizadas', proxima: 'recebimento', papeis: ['compras', 'gestor'] },
  recebimento: { rotulo: '📦 Tudo recebido — concluir', proxima: 'concluido', papeis: ['recebimento', 'gestor'] },
};

export function AbaFluxo({
  estado,
  atualizar,
  papel,
  precos = {},
  fatores,
  aprenderDeSemana,
}: {
  estado: EstadoSemana;
  atualizar: (fn: (e: EstadoSemana) => EstadoSemana) => void;
  papel: Papel;
  precos?: Record<string, number>;
  fatores?: Record<string, number>;
  aprenderDeSemana?: (estado: EstadoSemana) => void;
}) {
  const idxAtual = ETAPAS.findIndex((e) => e.id === estado.etapa);
  const acao = ACAO_POR_ETAPA[estado.etapa];
  const podeAgir = acao ? acao.papeis.includes(papel) : false;

  const totais = estado.dias.reduce(
    (acc, _, di) => {
      const linhas = linhasDoDia(estado, di, fatores);
      acc.itens += linhas.length;
      acc.comprados += linhas.filter((l) => l.status.compradoEm).length;
      acc.recebidos += linhas.filter((l) => l.status.recebidoOk).length;
      return acc;
    },
    { itens: 0, comprados: 0, recebidos: 0 },
  );
  const diasMontados = estado.dias.filter((d) => d.principal).length;

  // custo real da semana: usa o preço pago quando existir, senão o cotado
  const custoSemana = estado.dias.reduce(
    (t, _, di) =>
      t +
      linhasDoDia(estado, di, fatores).reduce((s, l) => {
        const p = l.status.precoPago ?? precos[l.chave];
        return p > 0 ? s + p * (l.status.compradoQtd ?? l.qtd) : s;
      }, 0),
    0,
  );
  const refeicoes = estado.refeicoes ?? {};
  const totalRefeicoes = Object.values(refeicoes).reduce((a, b) => a + (b || 0), 0);
  const custoPorRefeicao = totalRefeicoes > 0 && custoSemana > 0 ? custoSemana / totalRefeicoes : null;
  const podeContar = papel === 'cozinha' || papel === 'gestor';

  const avancar = () => {
    if (!acao) return;
    // semana concluída: o app aprende com os ajustes de quantidade feitos
    if (acao.proxima === 'concluido') aprenderDeSemana?.(estado);
    atualizar((e) => ({
      ...e,
      etapa: acao.proxima,
      historico: [...e.historico, { etapa: acao.proxima, em: new Date().toISOString(), papel }],
    }));
  };

  const voltar = () => {
    if (idxAtual <= 0) return;
    const anterior = ETAPAS[idxAtual - 1].id;
    atualizar((e) => ({
      ...e,
      etapa: anterior,
      historico: [...e.historico, { etapa: anterior, em: new Date().toISOString(), papel }],
    }));
  };

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { rotulo: 'Dias montados', valor: `${diasMontados}/7` },
          { rotulo: 'Itens comprados', valor: `${totais.comprados}/${totais.itens}` },
          { rotulo: 'Itens recebidos', valor: `${totais.recebidos}/${totais.itens}` },
        ].map((c) => (
          <Cartao key={c.rotulo} className="!p-4 text-center">
            <div className="font-display text-2xl font-bold">{c.valor}</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-carvao-400">{c.rotulo}</div>
          </Cartao>
        ))}
      </div>

      {/* Contagem de refeições — feita pela cozinha no fim de cada dia */}
      <Cartao className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-lg font-semibold">🍽️ Contagem de refeições</h3>
          {custoPorRefeicao !== null && (
            <span className="rounded-full bg-brand-500/10 px-3 py-1 text-sm font-extrabold text-brand-700 ring-1 ring-brand-500/30 dark:text-brand-300">
              {formatarReais(custoPorRefeicao)} / refeição
            </span>
          )}
        </div>
        <p className="text-xs text-carvao-400">
          Anote no fim de cada dia quantas refeições saíram. Isso vira o <strong>custo real por
          refeição</strong> e ensina o app a prever o movimento das próximas semanas.
        </p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {estado.dias.map((_, i) => (
            <label key={i} className="text-center">
              <span className="block text-[10px] font-extrabold uppercase tracking-wide text-carvao-400">
                {DIAS_SEMANA[i].slice(0, 3)}
              </span>
              <input
                type="number"
                min={0}
                disabled={!podeContar}
                value={refeicoes[i] ?? ''}
                placeholder="—"
                onChange={(e) =>
                  atualizar((s) => ({
                    ...s,
                    refeicoes: {
                      ...(s.refeicoes ?? {}),
                      [i]: e.target.value ? Number(e.target.value) : 0,
                    },
                  }))
                }
                className="mt-0.5 w-full rounded-xl border border-carvao-200 bg-white px-1 py-2 text-center text-sm font-bold disabled:opacity-50 dark:border-carvao-600 dark:bg-carvao-900"
              />
            </label>
          ))}
        </div>
        {totalRefeicoes > 0 && (
          <p className="text-xs font-semibold text-carvao-400">
            {totalRefeicoes} refeições na semana
            {custoSemana > 0 && <> · custo da semana ≈ {formatarReais(custoSemana)}</>}
          </p>
        )}
      </Cartao>

      {/* Linha do tempo */}
      <Cartao className="space-y-0">
        {ETAPAS.map((e, i) => {
          const feita = i < idxAtual || estado.etapa === 'concluido';
          const atual = i === idxAtual && estado.etapa !== 'concluido';
          const registro = [...estado.historico].reverse().find((h) => h.etapa === e.id);
          return (
            <div key={e.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    feita
                      ? 'bg-brand-600 text-white'
                      : atual
                        ? 'bg-carvao-900 text-white ring-4 ring-carvao-900/15 dark:bg-areia-100 dark:text-carvao-900'
                        : 'bg-carvao-100 text-carvao-400 dark:bg-carvao-700'
                  }`}
                >
                  {feita ? '✓' : i + 1}
                </span>
                {i < ETAPAS.length - 1 && (
                  <span
                    className={`w-0.5 grow ${feita ? 'bg-brand-600' : 'bg-carvao-100 dark:bg-carvao-700'}`}
                  />
                )}
              </div>
              <div className="pb-5">
                <p className={`font-semibold ${atual ? '' : feita ? 'text-carvao-500' : 'text-carvao-400'}`}>
                  {e.rotulo}
                </p>
                <p className="text-xs text-carvao-400">
                  {e.quem}
                  {registro && (
                    <>
                      {' '}
                      · {new Date(registro.em).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </Cartao>

      {/* Ações */}
      {acao && (
        <div className="space-y-2">
          <Botao variante="sucesso" className="w-full" disabled={!podeAgir} onClick={avancar}>
            {acao.rotulo}
          </Botao>
          {!podeAgir && (
            <p className="text-center text-xs text-carvao-400">
              Esta ação é de: <strong>{ETAPAS[idxAtual]?.quem}</strong>. Troque o papel no topo da tela para
              simular.
            </p>
          )}
        </div>
      )}
      {idxAtual > 0 && (
        <button onClick={voltar} className="w-full text-center text-sm font-semibold text-carvao-400 hover:text-carvao-600">
          ← Voltar etapa
        </button>
      )}

      {/* Observações da cozinha */}
      <Cartao>
        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-carvao-400">
          Observações da cozinha
        </label>
        <textarea
          rows={3}
          value={estado.obsCozinha}
          onChange={(e) => atualizar((s) => ({ ...s, obsCozinha: e.target.value }))}
          placeholder="Ex.: trocar fornecedor da costela, abacaxi chegou verde semana passada…"
          className="w-full rounded-2xl border border-carvao-200 bg-white px-4 py-3 text-sm dark:border-carvao-600 dark:bg-carvao-900"
        />
      </Cartao>
    </div>
  );
}
