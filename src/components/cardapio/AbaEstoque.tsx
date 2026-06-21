'use client';

import { useMemo, useState } from 'react';
import { toast } from '@/components/Toast';
import { Botao, Cartao, EstadoVazio, Kpi, Pilula, Secao, estiloInput } from '@/components/ui';
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
  const [novoItem, setNovoItem] = useState('');
  const [novaQtd, setNovaQtd] = useState('');
  const [invAberto, setInvAberto] = useState(false);

  const consumo = useMemo(() => consumoDaSemana(estado, fatores), [estado, fatores]);
  const necessidade = useMemo(() => necessidadeDeCompra(consumo, estoque), [consumo, estoque]);
  const aComprar = necessidade.filter((n) => n.comprar > 0);
  const cobertos = necessidade.filter((n) => n.comprar <= 0 && n.emEstoque > 0);

  const itensEstoque = useMemo(() => {
    const n = normalizar(busca);
    return Object.entries(estoque)
      .filter(([, e]) => (n ? normalizar(e.item).includes(n) : true))
      .sort((a, b) => a[1].item.localeCompare(b[1].item, 'pt-BR'));
  }, [estoque, busca]);

  const baixos = itensEstoque.filter(([, e]) => e.minimo > 0 && e.qtd <= e.minimo);

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

      <div className="grid grid-cols-3 gap-3">
        <Kpi rotulo="Itens em estoque" valor={Object.keys(estoque).length} tom="neutro" />
        <Kpi rotulo="A comprar" valor={aComprar.length} detalhe="após descontar estoque" tom="ouro" />
        <Kpi rotulo="No mínimo" valor={baixos.length} detalhe="estoque baixo" tom={baixos.length ? 'vermelho' : 'verde'} />
      </div>

      {/* Inventário mensal — contagem física do estoque */}
      <button
        onClick={() => setInvAberto(true)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-brand-600/30 bg-brand-50 px-4 py-3 text-left transition hover:bg-brand-100 dark:bg-carvao-800 dark:hover:bg-carvao-700"
      >
        <span>
          <span className="block text-sm font-extrabold text-brand-700 dark:text-brand-300">Inventário mensal</span>
          <span className="block text-caption text-carvao-500 dark:text-areia-200">
            Conte o estoque do mês e veja as divergências (esperado × contado).
          </span>
        </span>
        <span className="shrink-0 text-brand-600 dark:text-brand-300">→</span>
      </button>

      {/* Necessidade real de compra */}
      <Secao
        titulo="Necessidade real de compra"
        acao={<Pilula tom="azul">cardápio − estoque</Pilula>}
      >
        {consumo.length === 0 ? (
          <EstadoVazio titulo="Monte o cardápio da semana" texto="A necessidade de compra aparece quando há pratos definidos." />
        ) : (
          <Cartao className="!p-0">
            <ul className="divide-y divide-carvao-100 dark:divide-carvao-700/60">
              {necessidade.map((n) => (
                <li key={n.norm} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{n.item}</p>
                    <p className="text-caption text-carvao-400">
                      precisa {formatarQtd(n.qtd)} {n.unid} · em estoque {formatarQtd(n.emEstoque)} {n.unid}
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
          </Cartao>
        )}
        {cobertos.length > 0 && (
          <p className="text-xs font-semibold text-brand-600 dark:text-brand-300">
            ✓ {cobertos.length} itens já cobertos pelo estoque — economia na compra desta semana.
          </p>
        )}
      </Secao>

      {podeEditar && (
        <>
          {/* Entrada de produtos */}
          <Secao titulo="Entrada de produtos">
            <Cartao className="space-y-3">
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
            </Cartao>
          </Secao>
        </>
      )}

      {/* Saldo atual */}
      <Secao titulo="Estoque atual">
        <input
          className={`${estiloInput} mb-1`}
          placeholder="Buscar item no estoque…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        {itensEstoque.length === 0 ? (
          <EstadoVazio titulo="Estoque vazio" texto="Lance entradas de produtos para começar a controlar o estoque." />
        ) : (
          <Cartao className="!p-0">
            <ul className="divide-y divide-carvao-100 dark:divide-carvao-700/60">
              {itensEstoque.map(([norm, e]) => {
                const baixo = e.minimo > 0 && e.qtd <= e.minimo;
                return (
                  <li key={norm} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate text-sm font-semibold">
                        {e.item}
                        {baixo && <Pilula tom="vermelho">baixo</Pilula>}
                      </p>
                      <p className="text-caption text-carvao-400">unidade: {e.unid}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <label className="flex items-center gap-1">
                        <span className="text-micro uppercase text-carvao-400">saldo</span>
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
                        <span className="text-micro uppercase text-carvao-400">mín.</span>
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
          </Cartao>
        )}
      </Secao>
    </div>
  );
}
