'use client';

import { useState } from 'react';
import { Botao, Cartao, Pilula, Stepper } from '@/components/ui';
import { Icone } from '@/components/Icones';
import {
  DADOS,
  DIAS_SEMANA,
  PESSOAS_PADRAO,
  proteinaDoPrato,
  ROTULO_PROTEINA,
  sugerirSemana,
  sugerirSemanaCriativa,
  temHistoricoExato,
  validarSemana,
  listaDoDia,
  fonteIngredientes,
  formatarReais,
  normalizar,
} from '@/lib/cardapio/motor';
import { custoTipado, resolverPreco } from '@/lib/cardapio/precos';
import { RECEITAS_POR_CATEGORIA } from '@/lib/cardapio/receitas';
import { useEstimativas } from '@/lib/cardapio/estimativas';
import type { DiaCardapio, EstadoSemana, Proteina } from '@/lib/cardapio/tipos';
import { SeletorPrato } from './SeletorPrato';
import { OperacaoDia } from './OperacaoDia';
import { ChefIA } from './ChefIA';
import { PrevisaoPresenca } from './PrevisaoPresenca';
import { ComoFazer } from './ComoFazer';
import { AntiMonotonia } from './AntiMonotonia';
import { TermometroAlmoco } from './TermometroAlmoco';
import { IndicadorNutricional } from './IndicadorNutricional';

const OPC_PRINCIPAIS = RECEITAS_POR_CATEGORIA.principal;
const OPC_GUARNICOES = RECEITAS_POR_CATEGORIA.guarnicao;
const OPC_SALADAS = RECEITAS_POR_CATEGORIA.salada;
const OPC_SOBREMESAS = RECEITAS_POR_CATEGORIA.sobremesa;

const COR_PROTEINA: Record<string, string> = {
  bovina: 'bg-[#8a3b34]/10 text-[#8a3b34] ring-[#8a3b34]/25 dark:text-[#e0867c]',
  frango: 'bg-[#b07c1e]/10 text-[#9a6c17] ring-[#b07c1e]/25 dark:text-[#e3b45c]',
  suina: 'bg-[#b05a7e]/10 text-[#9c4a6c] ring-[#b05a7e]/25 dark:text-[#dd92b4]',
  peixe: 'bg-[#2d6f8e]/10 text-[#2d6f8e] ring-[#2d6f8e]/25 dark:text-[#7cb8d4]',
  ovo: 'bg-ouro-400/10 text-ouro-600 ring-ouro-400/25 dark:text-ouro-300',
  outros: 'bg-carvao-400/10 text-carvao-500 ring-carvao-400/25 dark:text-carvao-300',
};

/** Cor sólida do acento lateral por proteína. */
const ACENTO_PROTEINA: Record<Proteina, string> = {
  bovina: '#8a3b34',
  frango: '#b07c1e',
  suina: '#b05a7e',
  peixe: '#2d6f8e',
  ovo: '#c8a96b',
  outros: '#aab0b9',
};

function BadgeProteina({ prato }: { prato: string }) {
  if (!prato) return null;
  const p = proteinaDoPrato(prato);
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${COR_PROTEINA[p]}`}
    >
      {ROTULO_PROTEINA[p]}
    </span>
  );
}

export function AbaCardapio({
  estado,
  atualizar,
  podeEditar,
  precos,
  definirPreco,
}: {
  estado: EstadoSemana;
  atualizar: (fn: (e: EstadoSemana) => EstadoSemana) => void;
  podeEditar: boolean;
  precos: Record<string, number>;
  definirPreco?: (itemNorm: string, valor: number | null) => void;
}) {
  const { estimativas, gerarEstimativas } = useEstimativas();
  const [opDia, setOpDia] = useState(false);
  const avisos = validarSemana(estado.dias);
  const temPrecos = Object.keys(precos).length > 0;

  const setDia = (i: number, patch: Partial<DiaCardapio>) =>
    atualizar((e) => ({
      ...e,
      dias: e.dias.map((d, j) => (j === i ? { ...d, ...patch } : d)),
    }));

  const gerar = (criativo: boolean) => {
    const fn = criativo ? sugerirSemanaCriativa : sugerirSemana;
    const sugestao = fn(
      estado.dias.map((d) => d.pessoas),
      precos,
    );
    if (sugestao) atualizar((e) => ({ ...e, dias: sugestao }));
  };

  const custoSemana = estado.dias.reduce(
    (acc, d) => {
      if (!d.principal) return acc;
      const itens = listaDoDia(d).map((s) => ({ norm: normalizar(s.item), qtd: s.qtd }));
      const c = custoTipado(itens, precos, estimativas);
      return {
        total: acc.total + c.total,
        real: acc.real + c.real,
        estimado: acc.estimado + c.estimado,
        itens: acc.itens + itens.length,
      };
    },
    { total: 0, real: 0, estimado: 0, itens: 0 },
  );

  // medidor de regras (rotação de proteínas)
  const prots = estado.dias.map((d) => (d.principal ? proteinaDoPrato(d.principal) : null));
  const frango = prots.filter((p) => p === 'frango').length;
  const suina = prots.filter((p) => p === 'suina').length;
  const diasMontados = prots.filter(Boolean).length;
  const erros = avisos.filter((a) => a.nivel === 'erro').length;
  const alertas = avisos.filter((a) => a.nivel === 'alerta').length;

  const totalPessoas = estado.dias.filter((d) => d.principal).reduce((a, d) => a + d.pessoas, 0);
  const custoRef = totalPessoas > 0 && custoSemana.total > 0 ? custoSemana.total / totalPessoas : null;
  const dentroOrcamento = estado.orcamento ? custoSemana.total <= estado.orcamento : null;

  // classifica os itens da semana por tipo de preço: real / estimado / sem
  const { semPreco, qtdEstimados, normsSemana } = (() => {
    const sem = new Map<string, { item: string; unid: string }>();
    const est = new Set<string>();
    const todos = new Set<string>();
    estado.dias.forEach((d) => {
      if (!d.principal) return;
      listaDoDia(d).forEach((s) => {
        const norm = normalizar(s.item);
        todos.add(norm);
        const tipo = resolverPreco(norm, precos, estimativas).tipo;
        if (tipo === 'sem') sem.set(norm, { item: s.item, unid: s.unid });
        else if (tipo === 'estimado') est.add(norm);
      });
    });
    return { semPreco: Array.from(sem.entries()), qtdEstimados: est.size, normsSemana: Array.from(todos) };
  })();

  return (
    <div className="space-y-4">
      <OperacaoDia aberto={opDia} aoFechar={() => setOpDia(false)} estado={estado} atualizar={atualizar} />

      {/* Atalho: Modo Operação do Dia (foco da cozinha) */}
      <button
        onClick={() => setOpDia(true)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-brand-800 to-brand-600 px-4 py-3 text-left text-white shadow-suave ring-1 ring-ouro-400/40 transition hover:from-brand-900 hover:to-brand-700"
      >
        <span>
          <span className="block text-sm font-extrabold tracking-wide">⚡ Operação do Dia</span>
          <span className="block text-[11px] text-brand-100">O que produzir, receber e comprar hoje — em um toque.</span>
        </span>
        <span className="shrink-0 text-lg">→</span>
      </button>

      {/* Resumo vivo — acompanha a rolagem dos dias */}
      <div className="sticky top-[60px] z-30 -mx-4 bg-areia-50/85 px-4 py-2 backdrop-blur-md dark:bg-carvao-950/85">
        <Cartao className="!p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-baseline gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-carvao-400">Custo / refeição</p>
                <p className="font-display text-2xl font-bold leading-none tabular-nums text-carvao-900 dark:text-areia-50">
                  {custoRef ? formatarReais(custoRef) : '—'}
                </p>
              </div>
              {custoSemana.total > 0 && (
                <p className="text-xs font-semibold text-carvao-400">
                  semana {formatarReais(custoSemana.total)}
                  {dentroOrcamento !== null && (
                    <span className={dentroOrcamento ? 'text-brand-600' : 'font-bold text-[#b04c41]'}>
                      {' '}
                      · {dentroOrcamento ? 'no orçamento' : 'acima'}
                    </span>
                  )}
                </p>
              )}
            </div>
            {podeEditar && (
              <div className="flex shrink-0 gap-2">
                <Botao variante="sucesso" className="!min-h-10 !px-3 !py-2 text-[13px]" onClick={() => gerar(false)}>
                  <Icone nome="raio" tam={16} /> Sugerir
                </Botao>
                <Botao variante="secundario" className="!min-h-10 !px-3 !py-2 text-[13px]" onClick={() => gerar(true)}>
                  Nova
                </Botao>
              </div>
            )}
          </div>
          {/* medidor de regras */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <Pilula tom={frango >= 3 && frango <= 4 ? 'verde' : 'ouro'}>Frango {frango}/4</Pilula>
            <Pilula tom={suina <= 2 ? 'verde' : 'vermelho'}>Suína {suina}/2</Pilula>
            {diasMontados > 0 &&
              (semPreco.length > 0 ? (
                <Pilula tom="vermelho">{semPreco.length} sem preço</Pilula>
              ) : qtdEstimados > 0 ? (
                <Pilula tom="ouro">{qtdEstimados} estimado(s)</Pilula>
              ) : custoSemana.total > 0 ? (
                <Pilula tom="verde">✓ Preços ok</Pilula>
              ) : null)}
            {erros > 0 ? (
              <Pilula tom="vermelho">
                {erros} {erros === 1 ? 'erro' : 'erros'}
              </Pilula>
            ) : alertas > 0 ? (
              <Pilula tom="ouro">
                {alertas} {alertas === 1 ? 'alerta' : 'alertas'}
              </Pilula>
            ) : diasMontados === 7 ? (
              <Pilula tom="verde">✓ Regras ok</Pilula>
            ) : (
              <Pilula tom="neutro">{diasMontados}/7 dias</Pilula>
            )}
          </div>
        </Cartao>
      </div>

      {/* Detalhe das regras quebradas */}
      {avisos.some((a) => a.nivel !== 'ok') && (
        <Cartao className="space-y-1.5 !py-3">
          {avisos
            .filter((a) => a.nivel !== 'ok')
            .map((a, i) => (
              <p
                key={i}
                className={`flex items-start gap-2 text-sm font-medium ${
                  a.nivel === 'erro' ? 'text-[#b04c41]' : 'text-[#9a6c17] dark:text-[#e3b45c]'
                }`}
              >
                <span aria-hidden>{a.nivel === 'erro' ? '⛔' : '⚠️'}</span>
                {a.msg}
              </p>
            ))}
        </Cartao>
      )}

      {/* Termômetro em tempo real — satisfação do almoço de hoje */}
      <TermometroAlmoco estado={estado} />

      {/* Monotonia percebida — repetição de textura ou acompanhamentos */}
      <AntiMonotonia estado={estado} />

      {/* Chef IA — análise inteligente do cardápio (resumo; aba dedicada tem visão completa) */}
      <ChefIA estado={estado} precos={precos} />

      {/* Índice nutricional estimado da semana */}
      <IndicadorNutricional dias={estado.dias} />

      {/* Previsão de presença — gêmeo digital da demanda */}
      <PrevisaoPresenca estado={estado} atualizar={atualizar} podeEditar={podeEditar} />

      {/* Dias */}
      <div className="grid gap-3 lg:grid-cols-2">
        {estado.dias.map((dia, i) => {
          const lista = dia.principal ? listaDoDia(dia) : [];
          const custo = custoTipado(
            lista.map((s) => ({ norm: normalizar(s.item), qtd: s.qtd })),
            precos,
            estimativas,
          );
          const prot = dia.principal ? proteinaDoPrato(dia.principal) : 'outros';
          const fonte = fonteIngredientes(dia);
          return (
            <Cartao key={i} className="space-y-2.5 overflow-hidden">
              <div
                className="-mx-5 -mt-5 h-1.5"
                style={{ background: dia.principal ? ACENTO_PROTEINA[prot] : 'transparent' }}
                aria-hidden
              />
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-lg font-semibold">{DIAS_SEMANA[i]}</h3>
                <div className="flex items-center gap-1.5">
                  <Icone nome="usuario" tam={15} className="text-carvao-400" />
                  <Stepper
                    valor={dia.pessoas}
                    min={1}
                    passo={5}
                    aoMudar={(v) => podeEditar && setDia(i, { pessoas: v || PESSOAS_PADRAO[i] })}
                  />
                </div>
              </div>

              <SeletorPrato
                rotulo="Principal"
                valor={dia.principal}
                opcoes={OPC_PRINCIPAIS}
                aoEscolher={(v) => setDia(i, { principal: v })}
                desabilitado={!podeEditar}
                destaque={<BadgeProteina prato={dia.principal} />}
              />
              <div className="grid grid-cols-2 gap-2">
                <SeletorPrato
                  rotulo="Guarnição fixa"
                  valor={dia.guarnicaoFixa}
                  opcoes={DADOS.listas.guarnicoesFixas}
                  aoEscolher={(v) => setDia(i, { guarnicaoFixa: v })}
                  desabilitado={!podeEditar}
                />
                <SeletorPrato
                  rotulo="Guarnição"
                  valor={dia.guarnicao}
                  opcoes={OPC_GUARNICOES}
                  aoEscolher={(v) => setDia(i, { guarnicao: v })}
                  desabilitado={!podeEditar}
                />
                <SeletorPrato
                  rotulo="Salada"
                  valor={dia.salada}
                  opcoes={OPC_SALADAS}
                  aoEscolher={(v) => setDia(i, { salada: v })}
                  desabilitado={!podeEditar}
                />
                <SeletorPrato
                  rotulo="Sobremesa"
                  valor={dia.sobremesa}
                  opcoes={OPC_SOBREMESAS}
                  aoEscolher={(v) => setDia(i, { sobremesa: v })}
                  desabilitado={!podeEditar}
                />
              </div>

              {dia.principal && (
                <>
                  <p className="text-xs text-carvao-400">
                    {fonte === 'receita' ? (
                      <span className="font-semibold text-brand-600">● Receita cadastrada</span>
                    ) : fonte === 'estimado' ? (
                      <span className="font-semibold text-[#b04c41]">▲ Ingredientes estimados</span>
                    ) : temHistoricoExato(dia) ? (
                      <span className="font-semibold text-brand-600">● Combinação já usada antes</span>
                    ) : (
                      <span>○ Combinação nova — lista por componente</span>
                    )}
                    {' · '}
                    {lista.length} itens de compra
                    {custo.total > 0 && <> · ≈ {formatarReais(custo.total)}</>}
                    {custo.itensEstimados > 0 && (
                      <span className="font-semibold text-[#9a6c17] dark:text-[#e3b45c]"> · {custo.itensEstimados} estimado(s)</span>
                    )}
                    {custo.itensSemPreco > 0 && (
                      <span className="font-semibold text-[#b04c41]"> · {custo.itensSemPreco} sem preço</span>
                    )}
                  </p>
                  {fonte === 'estimado' && (
                    <p className="rounded-xl bg-[#b04c41]/10 px-2.5 py-1.5 text-[11px] font-semibold text-[#b04c41] ring-1 ring-[#b04c41]/20">
                      ⚠️ Este prato não tem receita cadastrada — os ingredientes são um chute. Escolha um prato com
                      receita ou complete os itens na lista de compras.
                    </p>
                  )}
                  <div>
                    <ComoFazer prato={dia.principal} />
                  </div>
                </>
              )}
            </Cartao>
          );
        })}
      </div>

      {/* Orçamento + itens sem preço */}
      <Cartao className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-carvao-400">
            Orçamento da semana (R$)
          </span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            disabled={!podeEditar}
            value={estado.orcamento ?? ''}
            placeholder="Informado pelo setor de compras"
            onChange={(e) => atualizar((s) => ({ ...s, orcamento: e.target.value ? Number(e.target.value) : null }))}
            className="w-full min-h-12 rounded-2xl border border-carvao-200 bg-white px-4 py-3 text-base tabular-nums dark:border-carvao-600 dark:bg-carvao-900"
          />
        </label>
        {!temPrecos && (
          <p className="text-xs text-carvao-400">
            Cole a cotação da semana na aba <strong>Cotação</strong> para ver o custo estimado e otimizar a sugestão.
          </p>
        )}
        {temPrecos && semPreco.length > 0 && (
          <div className="rounded-2xl bg-ouro-300/15 p-3 ring-1 ring-ouro-400/30">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-ouro-600">
                ⚠️ {semPreco.length} itens da semana ainda sem preço — complete para o custo cobrir tudo:
              </p>
              {podeEditar && (
                <Botao
                  variante="secundario"
                  className="!min-h-8 !px-3 !py-1 text-[11px]"
                  onClick={() => gerarEstimativas(normsSemana, precos)}
                >
                  <Icone nome="raio" tam={13} /> Estimar por mercado
                </Botao>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {semPreco.slice(0, 16).map(([norm, s]) => (
                <span
                  key={norm}
                  className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold ring-1 ring-carvao-200 dark:bg-carvao-800 dark:ring-carvao-600"
                >
                  {s.item}
                  <span className="text-carvao-400">R$</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0,00"
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (v > 0) definirPreco?.(norm, v);
                    }}
                    className="w-14 rounded-md border border-carvao-200 bg-white px-1 py-0.5 text-right text-[11px] font-bold tabular-nums dark:border-carvao-600 dark:bg-carvao-900"
                  />
                  <span className="text-carvao-400">/{s.unid}</span>
                </span>
              ))}
              {semPreco.length > 16 && (
                <span className="self-center text-[11px] text-carvao-400">+{semPreco.length - 16} na aba Preços</span>
              )}
            </div>
          </div>
        )}
        <p className="text-xs text-carvao-400">
          <strong>Sugerir</strong>: combinações que a equipe já aprovou no histórico. <strong>Nova</strong>: inventa
          combinações inéditas com a distribuição da casa e, com a cotação aplicada, puxa para as proteínas mais baratas.
        </p>
      </Cartao>
    </div>
  );
}
