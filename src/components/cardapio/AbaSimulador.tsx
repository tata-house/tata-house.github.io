'use client';

import { useMemo, useState } from 'react';
import { toast } from '@/components/Toast';
import { Botao, Cartao, EstadoVazio, Kpi, Pilula, Secao } from '@/components/ui';
import {
  DIAS_SEMANA,
  formatarReais,
  listaDoDia,
  normalizar,
  proteinaDoPrato,
  ROTULO_PROTEINA,
  sugerirSemana,
  sugerirSemanaCriativa,
} from '@/lib/cardapio/motor';
import { custoTipado, estimarPreco } from '@/lib/cardapio/precos';
import { useEstimativas } from '@/lib/cardapio/estimativas';
import { useHistoricoPrecos } from '@/lib/cardapio/estado';
import type { DiaCardapio, EstadoSemana } from '@/lib/cardapio/tipos';

interface Cenario {
  rotulo: string;
  dias: DiaCardapio[];
  custo: number;
  pessoas: number;
  custoRef: number;
}

export function AbaSimulador({
  estado,
  atualizar,
  precos,
  fatores,
  podeEditar,
}: {
  estado: EstadoSemana;
  atualizar: (fn: (e: EstadoSemana) => EstadoSemana) => void;
  precos: Record<string, number>;
  fatores?: Record<string, number>;
  podeEditar: boolean;
}) {
  const [alternativa, setAlternativa] = useState<{ rotulo: string; dias: DiaCardapio[] } | null>(null);
  const { estimativas } = useEstimativas();
  const historico = useHistoricoPrecos();
  const [precoVar, setPrecoVar] = useState(0);
  const [pessoasDelta, setPessoasDelta] = useState(0);

  const pessoas = estado.dias.map((d) => d.pessoas);

  const itensDoDia = (dia: DiaCardapio) =>
    listaDoDia(dia, fatores).map((s) => ({ norm: normalizar(s.item), qtd: s.qtd, unid: s.unid }));

  // Item 11: preços de mercado automáticos. Hierarquia: preço real → estimativa
  // salva → média de mercado (histórico), calculada na hora. Só fica "sem preço"
  // quando não existe nenhuma referência.
  const estimativasEfetivas = useMemo(() => {
    const eff: Record<string, number> = { ...estimativas };
    estado.dias.forEach((d) => {
      if (!d.principal) return;
      itensDoDia(d).forEach(({ norm }) => {
        if (precos[norm] > 0 || eff[norm] > 0) return;
        const m = estimarPreco(norm, precos, historico);
        if (m && m > 0) eff[norm] = m;
      });
    });
    return eff;
  }, [estado.dias, precos, estimativas, historico, fatores]); // eslint-disable-line react-hooks/exhaustive-deps

  const temPrecos = Object.keys(precos).length > 0 || Object.keys(estimativasEfetivas).length > 0;

  const custoDias = (dias: DiaCardapio[]) =>
    dias.reduce((t, dia) => (dia.principal ? t + custoTipado(itensDoDia(dia), precos, estimativasEfetivas).total : t), 0);

  const cenarioDe = (rotulo: string, dias: DiaCardapio[]): Cenario => {
    const custo = custoDias(dias);
    const totalPessoas = dias.filter((d) => d.principal).reduce((a, d) => a + d.pessoas, 0);
    return { rotulo, dias, custo, pessoas: totalPessoas, custoRef: totalPessoas > 0 ? custo / totalPessoas : 0 };
  };

  const atual = useMemo(() => cenarioDe('Semana atual', estado.dias), [estado.dias, precos, estimativasEfetivas, fatores]); // eslint-disable-line react-hooks/exhaustive-deps
  const alt = alternativa ? cenarioDe(alternativa.rotulo, alternativa.dias) : null;

  // composição de preço da semana atual: real / estimado (mercado) / sem
  const tipado = useMemo(
    () =>
      custoTipado(
        estado.dias.flatMap((d) => (d.principal ? itensDoDia(d) : [])),
        precos,
        estimativasEfetivas,
      ),
    [estado.dias, precos, estimativasEfetivas, fatores], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // "E se…" — cenário hipotético: variação de preço de mercado e de pessoas/dia.
  const cenarioSeEu = useMemo(() => {
    const fator = 1 + precoVar / 100;
    let total = 0;
    let pessoasTot = 0;
    estado.dias.forEach((d) => {
      if (!d.principal) return;
      const p = Math.max(1, d.pessoas + pessoasDelta);
      pessoasTot += p;
      const itens = listaDoDia({ ...d, pessoas: p }, fatores).map((s) => ({ norm: normalizar(s.item), qtd: s.qtd }));
      total += custoTipado(itens, precos, estimativasEfetivas).total * fator;
    });
    return { total, ref: pessoasTot > 0 ? total / pessoasTot : 0, pessoas: pessoasTot };
  }, [estado.dias, precoVar, pessoasDelta, precos, estimativasEfetivas, fatores]); // eslint-disable-line react-hooks/exhaustive-deps

  const economia = alt ? (atual.custoRef - alt.custoRef) * Math.max(atual.pessoas, alt.pessoas) : 0;
  const economiaMes = economia * 4.3;

  const gerar = (tipo: 'economica' | 'criativa') => {
    const dias =
      tipo === 'economica' ? sugerirSemana(pessoas, precos) : sugerirSemanaCriativa(pessoas, precos);
    if (!dias) {
      toast('Não foi possível gerar uma alternativa agora', 'erro');
      return;
    }
    setAlternativa({ rotulo: tipo === 'economica' ? 'Alternativa econômica' : 'Alternativa criativa', dias });
    toast('Alternativa gerada — compare abaixo');
  };

  const aplicar = () => {
    if (!alt) return;
    atualizar((e) => ({
      ...e,
      dias: e.dias.map((d, i) => ({ ...d, ...alt.dias[i], pessoas: d.pessoas })),
      ajustes: {},
    }));
    toast('Cardápio substituído pela alternativa');
    setAlternativa(null);
  };

  const maisCaros = useMemo(() => {
    return estado.dias
      .map((d, i) => ({
        dia: i,
        prato: d.principal,
        custo: d.principal ? custoTipado(itensDoDia(d), precos, estimativasEfetivas).total : 0,
      }))
      .filter((x) => x.prato && x.custo > 0)
      .sort((a, b) => b.custo - a.custo)
      .slice(0, 4);
  }, [estado.dias, precos, estimativasEfetivas, fatores]); // eslint-disable-line react-hooks/exhaustive-deps

  if (estado.dias.every((d) => !d.principal)) {
    return <EstadoVazio icone="⚖️" titulo="Monte um cardápio para simular" texto="O simulador compara o custo da semana atual com alternativas mais econômicas ou criativas." />;
  }

  if (!temPrecos) {
    return (
      <EstadoVazio
        icone="💰"
        titulo="Lance os preços para simular custos"
        texto="O simulador financeiro precisa dos preços para comparar cenários. Lance os preços em Compras → Preços ou no catálogo em Ajustes."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi rotulo="Custo / refeição" valor={formatarReais(atual.custoRef)} detalhe="semana atual" tom="ouro" icone="🎯" />
        <Kpi rotulo="Custo total" valor={formatarReais(atual.custo)} detalhe="estimado" tom="neutro" icone="💰" />
        <Kpi
          rotulo="Economia / semana"
          valor={alt ? formatarReais(Math.abs(economia)) : '—'}
          detalhe={alt ? (economia >= 0 ? 'mais barato' : 'mais caro') : 'gere uma alternativa'}
          tom={economia >= 0 ? 'verde' : 'vermelho'}
          icone="📉"
        />
        <Kpi
          rotulo="Impacto no mês"
          valor={alt ? formatarReais(Math.abs(economiaMes)) : '—'}
          detalhe="× 4,3 semanas"
          tom={economia >= 0 ? 'verde' : 'vermelho'}
          icone="🗓️"
        />
      </div>

      {/* Selos de composição do preço (real → mercado → sem referência) */}
      {(tipado.itensEstimados > 0 || tipado.itensSemPreco > 0) && (
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {tipado.real > 0 && <Pilula tom="verde">real {formatarReais(tipado.real)}</Pilula>}
            {tipado.itensEstimados > 0 && (
              <Pilula tom="ouro">
                {tipado.itensEstimados} a preço de mercado · {formatarReais(tipado.estimado)}
              </Pilula>
            )}
            {tipado.itensSemPreco > 0 && <Pilula tom="vermelho">{tipado.itensSemPreco} sem referência</Pilula>}
          </div>
          <p className="text-[11px] text-carvao-400">
            Sem cotação, o app usa o <strong>preço médio de mercado</strong> (histórico) automaticamente — confirme com
            a cotação real quando possível.
          </p>
          {tipado.itensSemPreco > 0 && (
            <p className="rounded-xl bg-perigo/10 px-2.5 py-1.5 text-[11px] font-semibold text-perigo ring-1 ring-perigo/20">
              ⚠️ {tipado.itensSemPreco} itens sem nenhuma referência de preço — a simulação está incompleta. Lance um
              preço (Cotação) ou registre o item no histórico.
            </p>
          )}
        </div>
      )}

      {/* Simulador de cenários — "E se…" */}
      <Secao titulo="🔮 E se… (cenários)">
        <Cartao className="space-y-3">
          <div>
            <label className="flex items-center justify-between text-sm font-semibold">
              <span>Preço de mercado</span>
              <span className="tabular-nums text-brand-700 dark:text-brand-300">
                {precoVar > 0 ? '+' : ''}
                {precoVar}%
              </span>
            </label>
            <input
              type="range"
              min={-30}
              max={50}
              step={5}
              value={precoVar}
              onChange={(e) => setPrecoVar(Number(e.target.value))}
              className="mt-1 w-full accent-brand-600"
            />
          </div>
          <div>
            <label className="flex items-center justify-between text-sm font-semibold">
              <span>Pessoas por dia</span>
              <span className="tabular-nums text-brand-700 dark:text-brand-300">
                {pessoasDelta > 0 ? '+' : ''}
                {pessoasDelta}
              </span>
            </label>
            <input
              type="range"
              min={-30}
              max={60}
              step={5}
              value={pessoasDelta}
              onChange={(e) => setPessoasDelta(Number(e.target.value))}
              className="mt-1 w-full accent-brand-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-areia-50/70 p-3 ring-1 ring-carvao-100 dark:bg-carvao-900/40 dark:ring-carvao-700/60">
              <p className="text-[10px] font-bold uppercase tracking-wider text-carvao-400">Custo / refeição</p>
              <p className="font-display text-xl font-bold tabular-nums">{formatarReais(cenarioSeEu.ref)}</p>
              {atual.custoRef > 0 && (
                <p className={`text-[11px] font-bold ${cenarioSeEu.ref > atual.custoRef ? 'text-perigo' : 'text-brand-600'}`}>
                  {cenarioSeEu.ref >= atual.custoRef ? '▲ +' : '▼ '}
                  {formatarReais(Math.abs(cenarioSeEu.ref - atual.custoRef))} vs atual
                </p>
              )}
            </div>
            <div className="rounded-2xl bg-areia-50/70 p-3 ring-1 ring-carvao-100 dark:bg-carvao-900/40 dark:ring-carvao-700/60">
              <p className="text-[10px] font-bold uppercase tracking-wider text-carvao-400">Custo total semana</p>
              <p className="font-display text-xl font-bold tabular-nums">{formatarReais(cenarioSeEu.total)}</p>
              {atual.custo > 0 && (
                <p className={`text-[11px] font-bold ${cenarioSeEu.total > atual.custo ? 'text-perigo' : 'text-brand-600'}`}>
                  {cenarioSeEu.total >= atual.custo ? '▲ +' : '▼ '}
                  {formatarReais(Math.abs(cenarioSeEu.total - atual.custo))} vs atual
                </p>
              )}
            </div>
          </div>
          {(precoVar !== 0 || pessoasDelta !== 0) && (
            <button
              onClick={() => {
                setPrecoVar(0);
                setPessoasDelta(0);
              }}
              className="text-xs font-semibold text-carvao-400 hover:text-carvao-600"
            >
              ↺ Limpar cenário
            </button>
          )}
          <p className="text-[11px] text-carvao-400">
            Arraste para simular alta de preço ou mudança no movimento. Recalcula na hora — <strong>não altera</strong> o
            cardápio.
          </p>
        </Cartao>
      </Secao>

      <div className="flex flex-wrap gap-2">
        <Botao onClick={() => gerar('economica')} className="flex-1">
          ⚡ Alternativa econômica
        </Botao>
        <Botao variante="secundario" onClick={() => gerar('criativa')} className="flex-1">
          ✨ Alternativa criativa
        </Botao>
      </div>

      {/* Comparativo lado a lado */}
      {alt && (
        <Secao
          titulo="⚖️ Comparativo"
          acao={
            <Pilula tom={economia >= 0 ? 'verde' : 'vermelho'}>
              {economia >= 0 ? 'economiza ' : 'custa '}
              {formatarReais(Math.abs(economia))}/sem
            </Pilula>
          }
        >
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {[atual, alt].map((c, idx) => (
              <Cartao key={idx} className={idx === 1 && economia >= 0 ? 'ring-2 ring-brand-500/40' : ''}>
                <div className="mb-2 flex items-baseline justify-between">
                  <h3 className="font-display text-base font-semibold">{c.rotulo}</h3>
                  <span className="font-bold text-brand-700 dark:text-brand-300">{formatarReais(c.custoRef)}/ref</span>
                </div>
                <ul className="space-y-1 text-sm">
                  {c.dias.map((d, i) =>
                    d.principal ? (
                      <li key={i} className="flex items-center justify-between gap-2">
                        <span className="truncate">
                          <span className="text-[10px] font-bold uppercase text-carvao-400">{DIAS_SEMANA[i].slice(0, 3)}</span>{' '}
                          {d.principal}
                        </span>
                        <Pilula tom="neutro">{ROTULO_PROTEINA[proteinaDoPrato(d.principal)]}</Pilula>
                      </li>
                    ) : null,
                  )}
                </ul>
              </Cartao>
            ))}
          </div>
          {podeEditar && (
            <Botao variante="sucesso" onClick={aplicar} className="w-full">
              ✅ Aplicar alternativa nesta semana
            </Botao>
          )}
        </Secao>
      )}

      {/* Pratos mais caros */}
      <Secao titulo="💸 Pratos mais caros da semana">
        <Cartao className="!p-0">
          <ul className="divide-y divide-carvao-100 dark:divide-carvao-700/60">
            {maisCaros.map((m) => (
              <li key={m.dia} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{m.prato}</p>
                  <p className="text-[11px] text-carvao-400">{DIAS_SEMANA[m.dia]}</p>
                </div>
                <span className="shrink-0 font-bold">{formatarReais(m.custo)}</span>
              </li>
            ))}
          </ul>
        </Cartao>
        <p className="text-xs text-carvao-400">
          Gere uma alternativa econômica para ver como o app troca os pratos mais caros por opções de melhor custo-benefício.
        </p>
      </Secao>
    </div>
  );
}
