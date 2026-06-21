'use client';

/* =====================================================================
   Inventário mensal — tela (overlay) acessível pelo Estoque. Conta o físico,
   compara esperado × contado, mostra divergências e guarda histórico por mês.
   ===================================================================== */

import { useEffect, useMemo, useState } from 'react';
import { toast } from '@/components/Toast';
import { Botao, Cartao, EstadoVazio, Pilula, estiloInput } from '@/components/ui';
import { formatarQtd, normalizar } from '@/lib/cardapio/motor';
import {
  divergencia,
  divergenciaGrande,
  mesAtual,
  rotuloMes,
  useInventarios,
  type ItemInventario,
  type Inventario,
} from '@/lib/cardapio/inventario';
import type { Estoque } from '@/lib/cardapio/tipos';

export function AbaInventario({
  aberto,
  aoFechar,
  estoque,
  definirSaldo,
  podeEditar,
}: {
  aberto: boolean;
  aoFechar: () => void;
  estoque: Estoque;
  definirSaldo: (norm: string, item: string, unid: string, saldo: number) => void;
  podeEditar: boolean;
}) {
  const { inventarios, salvar } = useInventarios();
  const [mes, setMes] = useState(mesAtual());
  const [itens, setItens] = useState<Record<string, ItemInventario>>({});
  const [busca, setBusca] = useState('');
  const [novoNome, setNovoNome] = useState('');
  const [novaUnid, setNovaUnid] = useState('kg');
  const [novaQtd, setNovaQtd] = useState('');
  const [novaCat, setNovaCat] = useState('');

  // (re)carrega a contagem do mês ao abrir ou trocar o mês
  useEffect(() => {
    if (!aberto) return;
    const existente = inventarios[mes];
    if (existente) {
      setItens(existente.itens);
    } else {
      const base: Record<string, ItemInventario> = {};
      Object.entries(estoque).forEach(([norm, e]) => {
        base[norm] = { item: e.item, unid: e.unid, esperado: e.qtd, contado: null };
      });
      setItens(base);
    }
    setBusca('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, mes]);

  const finalizado = inventarios[mes]?.status === 'finalizado';

  const lista = useMemo(() => {
    const n = normalizar(busca);
    return Object.entries(itens)
      .filter(([, it]) => (n ? normalizar(it.item).includes(n) : true))
      .sort((a, b) => a[1].item.localeCompare(b[1].item, 'pt-BR'));
  }, [itens, busca]);

  const contados = Object.values(itens).filter((i) => i.contado !== null).length;
  const grandes = Object.values(itens).filter(divergenciaGrande).length;

  const mesesAnteriores = useMemo(
    () =>
      Object.values(inventarios)
        .filter((i) => i.mes !== mes)
        .sort((a, b) => b.mes.localeCompare(a.mes)),
    [inventarios, mes],
  );

  if (!aberto) return null;

  const setContado = (norm: string, v: string) =>
    setItens((a) => ({ ...a, [norm]: { ...a[norm], contado: v === '' ? null : Number(v) } }));
  const setObs = (norm: string, v: string) =>
    setItens((a) => ({ ...a, [norm]: { ...a[norm], obs: v } }));

  // Item 12: cadastrar um produto novo durante a contagem — entra no estoque
  // (definirSaldo) e já aparece na lista do inventário do mês.
  const cadastrarProduto = () => {
    const nome = novoNome.trim();
    if (!nome) {
      toast('Informe o nome do produto', 'erro');
      return;
    }
    const k = normalizar(nome);
    const unid = novaUnid.trim() || 'kg';
    const q = Number(novaQtd) > 0 ? Number(novaQtd) : 0;
    definirSaldo(k, nome, unid, q);
    setItens((a) => ({
      ...a,
      [k]: { item: nome, unid, esperado: q, contado: q > 0 ? q : null, obs: novaCat.trim() ? `Categoria: ${novaCat.trim()}` : a[k]?.obs },
    }));
    toast(`Produto “${nome}” cadastrado e adicionado ao estoque`);
    setNovoNome('');
    setNovaQtd('');
    setNovaCat('');
  };

  const montar = (status: Inventario['status']): Inventario => {
    const agora = new Date().toISOString();
    return {
      mes,
      itens,
      status,
      criadoEm: inventarios[mes]?.criadoEm ?? agora,
      atualizadoEm: agora,
      finalizadoEm: status === 'finalizado' ? agora : inventarios[mes]?.finalizadoEm,
    };
  };

  const salvarRascunho = () => {
    salvar(montar('rascunho'));
    toast('Rascunho do inventário salvo');
  };

  const finalizar = () => {
    const semContar = Object.values(itens).filter((i) => i.contado === null).length;
    if (semContar > 0 && !window.confirm(`${semContar} itens ainda sem contagem. Finalizar mesmo assim?`)) return;
    const ajustar = window.confirm(
      'Finalizar o inventário de ' +
        rotuloMes(mes) +
        '.\n\nDeseja ajustar o saldo do estoque para os valores contados? (recomendado)',
    );
    salvar(montar('finalizado'));
    if (ajustar) {
      Object.entries(itens).forEach(([norm, it]) => {
        if (it.contado !== null) definirSaldo(norm, it.item, it.unid, it.contado);
      });
    }
    toast('Inventário finalizado');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-areia-50 pb-24 dark:bg-carvao-950">
      {/* Cabeçalho */}
      <div className="sticky top-0 z-10 border-b border-carvao-200/70 bg-white/90 px-4 py-3 backdrop-blur-xl dark:border-carvao-700/70 dark:bg-carvao-900/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <button onClick={aoFechar} className="text-sm font-bold uppercase tracking-wide text-carvao-500 dark:text-areia-200">
            ← Voltar
          </button>
          <h2 className="font-display text-base font-bold">📋 Inventário mensal</h2>
          <input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value || mesAtual())}
            className="rounded-xl border border-carvao-200 bg-white px-2 py-1.5 text-sm font-semibold dark:border-carvao-600 dark:bg-carvao-900"
          />
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-4 px-4 py-4">
        {/* Resumo */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { r: 'Itens', v: Object.keys(itens).length, tom: 'neutro' as const },
            { r: 'Contados', v: `${contados}/${Object.keys(itens).length}`, tom: 'azul' as const },
            { r: 'Divergências', v: grandes, tom: grandes ? ('vermelho' as const) : ('verde' as const) },
          ].map((c) => (
            <Cartao key={c.r} className="!p-3 text-center">
              <div className="font-display text-xl font-bold">{c.v}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-carvao-400">{c.r}</div>
            </Cartao>
          ))}
        </div>

        {finalizado && (
          <Cartao className="!py-2.5 ring-1 ring-brand-500/30">
            <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">
              ✓ Inventário de {rotuloMes(mes)} finalizado
              {inventarios[mes]?.finalizadoEm
                ? ` em ${new Date(inventarios[mes]!.finalizadoEm!).toLocaleDateString('pt-BR')}`
                : ''}
              .
            </p>
          </Cartao>
        )}

        {podeEditar && (
          <Cartao className="space-y-2">
            <p className="text-caption font-bold uppercase tracking-wider text-carvao-400">➕ Cadastrar produto</p>
            <div className="flex flex-wrap gap-2">
              <input
                className={`${estiloInput} min-w-0 flex-1`}
                placeholder="Nome do produto"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
              />
              <input
                className={`${estiloInput} w-20`}
                placeholder="un."
                value={novaUnid}
                onChange={(e) => setNovaUnid(e.target.value)}
              />
              <input
                type="number"
                min={0}
                step="0.1"
                inputMode="decimal"
                className={`${estiloInput} w-24`}
                placeholder="qtd"
                value={novaQtd}
                onChange={(e) => setNovaQtd(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                className={`${estiloInput} min-w-0 flex-1`}
                placeholder="categoria (opcional)"
                value={novaCat}
                onChange={(e) => setNovaCat(e.target.value)}
              />
              <Botao onClick={cadastrarProduto} className="!min-h-10 !px-4 !py-2 text-sm">
                Cadastrar
              </Botao>
            </div>
            <p className="text-caption text-carvao-400">
              O produto entra no estoque e já aparece na contagem deste mês.
            </p>
          </Cartao>
        )}

        {Object.keys(itens).length === 0 ? (
          <EstadoVazio
            icone="📦"
            titulo="Sem itens para contar"
            texto="Cadastre um produto acima, ou registre entradas no estoque, para que apareçam aqui no inventário."
          />
        ) : (
          <>
            <input
              className={estiloInput}
              placeholder="Buscar item…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />

            <Cartao className="!p-0">
              <ul className="divide-y divide-carvao-100 dark:divide-carvao-700/60">
                {lista.map(([norm, it]) => {
                  const d = divergencia(it);
                  const grande = divergenciaGrande(it);
                  return (
                    <li key={norm} className="space-y-2 px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="min-w-0 flex-1 truncate text-sm font-semibold">{it.item}</p>
                        {d === null ? (
                          <Pilula tom="neutro">a contar</Pilula>
                        ) : d === 0 ? (
                          <Pilula tom="verde">ok</Pilula>
                        ) : (
                          <Pilula tom={grande ? 'vermelho' : 'ouro'}>
                            {d > 0 ? '+' : ''}
                            {formatarQtd(d)} {it.unid}
                          </Pilula>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-caption text-carvao-400">
                          esperado <strong>{formatarQtd(it.esperado)}</strong> {it.unid}
                        </span>
                        <label className="flex items-center gap-1">
                          <span className="text-[10px] uppercase text-carvao-400">contado</span>
                          <input
                            type="number"
                            min={0}
                            step="0.1"
                            inputMode="decimal"
                            disabled={!podeEditar}
                            value={it.contado ?? ''}
                            placeholder="—"
                            onChange={(e) => setContado(norm, e.target.value)}
                            className="w-20 rounded-xl border border-carvao-200 bg-white px-2 py-1.5 text-right font-bold disabled:opacity-50 dark:border-carvao-600 dark:bg-carvao-900"
                          />
                        </label>
                        <input
                          disabled={!podeEditar}
                          value={it.obs ?? ''}
                          placeholder="observação (opcional)"
                          onChange={(e) => setObs(norm, e.target.value)}
                          className="min-w-0 flex-1 rounded-xl border border-carvao-200 bg-white px-2 py-1.5 text-[13px] disabled:opacity-50 dark:border-carvao-600 dark:bg-carvao-900"
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Cartao>

            {podeEditar && (
              <div className="flex flex-wrap gap-2">
                <Botao variante="secundario" onClick={salvarRascunho} className="flex-1">
                  💾 Salvar rascunho
                </Botao>
                <Botao variante="sucesso" onClick={finalizar} className="flex-1">
                  ✅ Finalizar inventário
                </Botao>
              </div>
            )}
            <p className="text-caption text-carvao-400">
              <strong>Esperado</strong> é o saldo do estoque. <strong>Contado</strong> é o que você encontrou na
              prateleira. As <strong>divergências</strong> grandes (≥20%) ficam em vermelho. Ao finalizar, dá para
              ajustar o estoque para o valor contado.
            </p>
          </>
        )}

        {/* Histórico */}
        {mesesAnteriores.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-caption font-extrabold uppercase tracking-wider text-carvao-400">Inventários anteriores</h3>
            <Cartao className="!p-0">
              <ul className="divide-y divide-carvao-100 dark:divide-carvao-700/60">
                {mesesAnteriores.map((inv) => {
                  const div = Object.values(inv.itens).filter(divergenciaGrande).length;
                  return (
                    <li key={inv.mes}>
                      <button
                        onClick={() => setMes(inv.mes)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-areia-100 dark:hover:bg-carvao-800"
                      >
                        <span className="text-sm font-semibold capitalize">{rotuloMes(inv.mes)}</span>
                        <span className="flex items-center gap-2">
                          {div > 0 && <Pilula tom="vermelho">{div} diverg.</Pilula>}
                          <Pilula tom={inv.status === 'finalizado' ? 'verde' : 'neutro'}>
                            {inv.status === 'finalizado' ? 'finalizado' : 'rascunho'}
                          </Pilula>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Cartao>
          </div>
        )}
      </div>
    </div>
  );
}
