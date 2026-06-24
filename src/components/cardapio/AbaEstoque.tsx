'use client';

import { useMemo, useState } from 'react';
import { toast } from '@/components/Toast';
import { Botao, Cartao, EstadoVazio, Pilula, Secao, estiloInput } from '@/components/ui';
import { DADOS, formatarQtd, normalizar } from '@/lib/cardapio/motor';
import { consumoDaSemana, necessidadeDeCompra } from '@/lib/cardapio/indicadores';
import { AbaInventario } from './AbaInventario';
import type { Estoque, EstadoSemana, MovEstoque } from '@/lib/cardapio/tipos';

export function AbaEstoque({
  estado,
  fatores,
  estoque,
  movimentar,
  definirMinimo,
  definirSaldo,
  podeEditar,
}: {
  estado: EstadoSemana;
  fatores?: Record<string, number>;
  estoque: Estoque;
  movimentar: (mov: Omit<MovEstoque, 'em' | 'papel'>) => void;
  definirMinimo: (norm: string, item: string, unid: string, minimo: number) => void;
  definirSaldo: (norm: string, item: string, unid: string, saldo: number) => void;
  podeEditar: boolean;
}) {
  const [busca, setBusca] = useState('');
  const [apenasCriticos, setApenasCriticos] = useState(false);
  const [novoItem, setNovoItem] = useState('');
  const [novaQtd, setNovaQtd] = useState('');
  const [invAberto, setInvAberto] = useState(false);

  const consumo = useMemo(() => consumoDaSemana(estado, fatores), [estado, fatores]);
  const necessidade = useMemo(() => necessidadeDeCompra(consumo, estoque), [consumo, estoque]);
  const aComprar = necessidade.filter((n) => n.comprar > 0);
  const cobertos = necessidade.filter((n) => n.comprar <= 0 && n.emEstoque > 0);

  const totalCriticos = useMemo(
    () => Object.values(estoque).filter((e) => e.minimo > 0 && e.qtd <= e.minimo).length,
    [estoque],
  );

  const itensEstoque = useMemo(() => {
    const n = normalizar(busca);
    return Object.entries(estoque)
      .filter(([, e]) => {
        if (n && !normalizar(e.item).includes(n)) return false;
        if (apenasCriticos && !(e.minimo > 0 && e.qtd <= e.minimo)) return false;
        return true;
      })
      .sort((a, b) => a[1].item.localeCompare(b[1].item, 'pt-BR'));
  }, [estoque, busca, apenasCriticos]);

  const catalogo = useMemo(() => {
    const set = new Map<string, string>();
    DADOS.itens.forEach((i) => set.set(i.n, i.u));
    return Array.from(set.entries());
  }, []);

  const registrarEntrada = () => {
    const nome = novoItem.trim();
    const qtd = Number(novaQtd);
    if (!nome || !(qtd > 0)) return;
    const norm = normalizar(nome);
    const unid = catalogo.find(([n]) => normalizar(n) === norm)?.[1] ?? estoque[norm]?.unid ?? 'un';
    movimentar({ norm, item: nome, unid, delta: qtd, motivo: 'entrada' });
    toast(`Entrada: ${formatarQtd(qtd)} ${unid} de ${nome}`);
    setNovoItem('');
    setNovaQtd('');
  };

  const baixaPeloCardapio = () => {
    let n = 0;
    consumo.forEach((c) => {
      const saldo = estoque[c.norm]?.qtd ?? 0;
      const baixa = Math.min(saldo, c.qtd);
      if (baixa > 0) {
        movimentar({ norm: c.norm, item: c.item, unid: c.unid, delta: -baixa, motivo: 'baixa', ref: 'cardápio da semana' });
        n++;
      }
    });
    toast(n > 0 ? `Baixa aplicada em ${n} itens pelo cardápio` : 'Nada em estoque para dar baixa', n > 0 ? 'ok' : 'info');
  };

  return (
    <div className="space-y-5">
      <AbaInventario
        aberto={invAberto}
        aoFechar={() => setInvAberto(false)}
        estoque={estoque}
        definirSaldo={definirSaldo}
        podeEditar={podeEditar}
      />

      {/* Hero: número de críticos + stats secundários + link inventário */}
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-baseline gap-6">
          <div>
            <span className={`font-display text-[2.5rem] font-black leading-none tabular-nums ${totalCriticos > 0 ? 'text-perigo' : 'text-brand-600 dark:text-brand-400'}`}>
              {totalCriticos}
            </span>
            <span className="ml-1.5 text-sm font-semibold text-texto-suave">crítico{totalCriticos !== 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-0.5 text-right">
            <p className="text-sm tabular-nums">
              <span className="font-bold text-carvao-700 dark:text-areia-100">{Object.keys(estoque).length}</span>
              <span className="ml-1 text-texto-suave">itens</span>
            </p>
            <p className="text-sm tabular-nums">
              <span className={`font-bold ${aComprar.length > 0 ? 'text-ouro-600 dark:text-ouro-400' : 'text-texto-suave'}`}>{aComprar.length}</span>
              <span className="ml-1 text-texto-suave">a comprar</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => setInvAberto(true)}
          className="text-sm font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400"
        >
          → Inventário mensal
        </button>
      </div>

      {/* Necessidade real de compra */}
      <Secao titulo="Necessidade de compra" acao={<Pilula tom="azul">cardápio − estoque</Pilula>}>
        {consumo.length === 0 ? (
          <EstadoVazio titulo="Monte o cardápio da semana" texto="A lista de necessidade aparece quando há pratos definidos." />
        ) : (
          <ul className="overflow-hidden rounded-2xl bg-white divide-y divide-carvao-100 dark:divide-carvao-700/50 dark:bg-carvao-850 dark:ring-1 dark:ring-carvao-700/60">
            {necessidade.map((n) => (
              <li key={n.norm} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{n.item}</p>
                  <p className="text-caption text-texto-suave">
                    {formatarQtd(n.qtd)} {n.unid} · estoque {formatarQtd(n.emEstoque)}
                  </p>
                </div>
                {n.comprar > 0 ? (
                  <Pilula tom="ouro">
                    comprar {formatarQtd(n.comprar)} {n.unid}
                  </Pilula>
                ) : (
                  <Pilula tom="verde">coberto</Pilula>
                )}
              </li>
            ))}
          </ul>
        )}
        {cobertos.length > 0 && (
          <p className="text-xs font-semibold text-brand-600 dark:text-brand-300">
            ✓ {cobertos.length} itens cobertos pelo estoque.
          </p>
        )}
      </Secao>

      {podeEditar && (
        <Secao titulo="Entrada de produtos">
          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                list="catalogo-estoque"
                className={estiloInput}
                placeholder="Produto (ex.: Cenoura)"
                value={novoItem}
                onChange={(e) => setNovoItem(e.target.value)}
              />
              <datalist id="catalogo-estoque">
                {catalogo.slice(0, 400).map(([n]) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
              <input
                type="number"
                min={0}
                step="0.1"
                inputMode="decimal"
                className={`${estiloInput} sm:w-32`}
                placeholder="Qtd"
                value={novaQtd}
                onChange={(e) => setNovaQtd(e.target.value)}
              />
              <Botao onClick={registrarEntrada} className="sm:w-auto">
                Lançar
              </Botao>
            </div>
            <button
              onClick={baixaPeloCardapio}
              className="w-full rounded-2xl border border-brand-600/40 bg-brand-50 px-4 py-2.5 text-sm font-extrabold uppercase tracking-wide text-brand-700 transition hover:bg-brand-100 dark:bg-carvao-800 dark:text-brand-300"
            >
              ↧ Dar baixa do consumo do cardápio
            </button>
          </div>
        </Secao>
      )}

      {/* Saldo atual */}
      <Secao titulo="Estoque atual">
        <div className="mb-2 flex gap-2">
          <input
            className={`${estiloInput} flex-1`}
            placeholder="Buscar…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          {totalCriticos > 0 && (
            <button
              onClick={() => setApenasCriticos((v) => !v)}
              className={`shrink-0 rounded-xl border px-3 py-2 text-caption font-bold transition ${
                apenasCriticos
                  ? 'border-perigo/40 bg-perigo/10 text-perigo'
                  : 'border-carvao-200 bg-white text-carvao-500 hover:border-perigo/40 hover:text-perigo dark:border-carvao-600 dark:bg-carvao-800'
              }`}
            >
              {apenasCriticos ? '✕ ' : ''}Críticos ({totalCriticos})
            </button>
          )}
        </div>
        {itensEstoque.length === 0 ? (
          <EstadoVazio titulo="Estoque vazio" texto="Use o formulário acima para registrar a primeira entrada. O saldo é atualizado automaticamente ao aplicar o cardápio." />
        ) : (
          <ul className="overflow-hidden rounded-2xl bg-white divide-y divide-carvao-100 dark:divide-carvao-700/50 dark:bg-carvao-850 dark:ring-1 dark:ring-carvao-700/60">
            {itensEstoque.map(([norm, e]) => {
              const baixo = e.minimo > 0 && e.qtd <= e.minimo;
              return (
                <li key={norm} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate text-sm font-semibold">
                      {baixo && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-perigo" />}
                      {e.item}
                    </p>
                    <p className="text-caption text-texto-suave">{e.unid}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <label className="flex items-center gap-1">
                      <span className="text-micro uppercase text-texto-suave">saldo</span>
                      <input
                        type="number"
                        min={0}
                        step="0.1"
                        disabled={!podeEditar}
                        value={e.qtd}
                        onChange={(ev) => definirSaldo(norm, e.item, e.unid, Number(ev.target.value))}
                        className="w-20 rounded-xl border border-carvao-200 bg-white px-2 py-1.5 text-right font-bold disabled:opacity-50 dark:border-carvao-600 dark:bg-carvao-900"
                      />
                    </label>
                    <label className="flex items-center gap-1">
                      <span className="text-micro uppercase text-texto-suave">mín.</span>
                      <input
                        type="number"
                        min={0}
                        step="0.1"
                        disabled={!podeEditar}
                        value={e.minimo || ''}
                        placeholder="0"
                        onChange={(ev) => definirMinimo(norm, e.item, e.unid, Number(ev.target.value))}
                        className="w-16 rounded-xl border border-carvao-200 bg-white px-2 py-1.5 text-right font-bold disabled:opacity-50 dark:border-carvao-600 dark:bg-carvao-900"
                      />
                    </label>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Secao>
    </div>
  );
}
