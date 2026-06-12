'use client';

import { useState } from 'react';
import { Botao, Cartao, Modal, estiloInput } from '@/components/ui';
import {
  DADOS,
  DIAS_SEMANA,
  custoDaLista,
  formatarQtd,
  formatarReais,
  linhasDoDia,
} from '@/lib/cardapio/motor';
import type { EstadoSemana, Papel, StatusItem } from '@/lib/cardapio/tipos';

function hojeIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AbaCompras({
  estado,
  atualizar,
  papel,
  precos,
  fornecedores = {},
  fatores,
}: {
  estado: EstadoSemana;
  atualizar: (fn: (e: EstadoSemana) => EstadoSemana) => void;
  papel: Papel;
  precos: Record<string, number>;
  fornecedores?: Record<string, string>;
  fatores?: Record<string, number>;
}) {
  const [novoItemDia, setNovoItemDia] = useState<number | null>(null);

  const podeAjustarQtd = papel === 'gestor' || papel === 'cozinha';
  const podeComprar = papel === 'compras' || papel === 'gestor';
  const podeReceber = papel === 'recebimento' || papel === 'gestor';

  const setAjuste = (dia: number, chave: string, qtd: number | null, removido?: boolean) =>
    atualizar((e) => ({
      ...e,
      ajustes: {
        ...e.ajustes,
        [dia]: {
          ...(e.ajustes[dia] ?? {}),
          [chave]: { ...(e.ajustes[dia]?.[chave] ?? {}), ...(qtd !== null ? { qtd } : {}), removido },
        },
      },
    }));

  const setStatus = (dia: number, chave: string, patch: Partial<StatusItem>) =>
    atualizar((e) => ({
      ...e,
      status: {
        ...e.status,
        [dia]: { ...(e.status[dia] ?? {}), [chave]: { ...(e.status[dia]?.[chave] ?? {}), ...patch } },
      },
    }));

  const addManual = (dia: number, item: string, unid: string, qtd: number) =>
    atualizar((e) => ({
      ...e,
      manuais: { ...e.manuais, [dia]: [...(e.manuais[dia] ?? []), { item, unid, qtd }] },
    }));

  const rmManual = (dia: number, idx: number) =>
    atualizar((e) => ({
      ...e,
      manuais: { ...e.manuais, [dia]: (e.manuais[dia] ?? []).filter((_, i) => i !== idx) },
    }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 print:hidden">
        <p className="text-sm text-carvao-500 dark:text-carvao-300">
          Quantidades já escaladas pelo nº de pessoas de cada dia.
        </p>
        <Botao variante="secundario" onClick={() => window.print()} className="!min-h-10 !px-4 !py-2 text-sm">
          🖨️ Imprimir
        </Botao>
      </div>

      {estado.dias.map((dia, di) => {
        const linhas = linhasDoDia(estado, di, fatores);
        if (!dia.principal && linhas.length === 0) return null;
        const custo = custoDaLista(
          linhas.map((l) => ({ item: l.item, unid: l.unid, qtd: l.qtd })),
          precos,
        );
        const compradas = linhas.filter((l) => l.status.compradoEm).length;
        const recebidas = linhas.filter((l) => l.status.recebidoOk).length;

        return (
          <Cartao key={di} className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-lg font-semibold">
                {DIAS_SEMANA[di]}{' '}
                <span className="text-sm font-normal text-carvao-400">
                  · {dia.principal || 'sem cardápio'} · {dia.pessoas} pessoas
                </span>
              </h3>
              <p className="text-xs font-semibold text-carvao-400">
                {compradas}/{linhas.length} comprados · {recebidas}/{linhas.length} recebidos
                {custo.itensComPreco > 0 && <> · ≈ {formatarReais(custo.total)}</>}
              </p>
            </div>

            {linhas.length === 0 ? (
              <p className="text-sm text-carvao-400">Escolha o cardápio na aba anterior para gerar a lista.</p>
            ) : (
              <div className="-mx-2 overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-carvao-400">
                      <th className="px-2 py-1.5">Item</th>
                      <th className="px-2 py-1.5">Qtd</th>
                      <th className="px-2 py-1.5">Comprado</th>
                      <th className="px-2 py-1.5">Previsão</th>
                      <th className="px-2 py-1.5">Recebido</th>
                      <th className="px-2 py-1.5 print:hidden" />
                    </tr>
                  </thead>
                  <tbody>
                    {linhas.map((l) => (
                      <tr
                        key={l.chave}
                        className="border-t border-carvao-100 dark:border-carvao-700/60"
                      >
                        <td className="px-2 py-2">
                          <span className="font-semibold">{l.item}</span>
                          {l.manual && (
                            <span className="ml-1.5 rounded-full bg-ouro-300/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-ouro-600">
                              extra
                            </span>
                          )}
                          {l.sugerida !== null && l.qtd !== l.sugerida && (
                            <span className="ml-1.5 text-[10px] text-carvao-400">
                              (sugerido {formatarQtd(l.sugerida)})
                            </span>
                          )}
                          {fornecedores[l.chave] && (
                            <span className="block text-[10px] font-semibold text-brand-600">
                              ↓ mais barato: {fornecedores[l.chave]}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2">
                          {podeAjustarQtd && !l.manual ? (
                            <input
                              type="number"
                              min={0}
                              step="0.1"
                              value={l.qtd}
                              onChange={(e) => setAjuste(di, l.chave, Number(e.target.value))}
                              className="w-16 rounded-lg border border-carvao-200 bg-white px-1.5 py-1 text-center font-bold dark:border-carvao-600 dark:bg-carvao-900"
                            />
                          ) : (
                            <strong>{formatarQtd(l.qtd)}</strong>
                          )}{' '}
                          <span className="text-carvao-400">{l.unid}</span>
                        </td>
                        <td className="whitespace-nowrap px-2 py-2">
                          {l.status.compradoEm ? (
                            <span className="font-semibold text-brand-600">
                              ✓ {l.status.compradoEm.slice(8, 10)}/{l.status.compradoEm.slice(5, 7)}
                            </span>
                          ) : podeComprar ? (
                            <button
                              onClick={() =>
                                setStatus(di, l.chave, { compradoEm: hojeIso(), compradoQtd: l.qtd })
                              }
                              className="rounded-full bg-carvao-900 px-2.5 py-1 text-[11px] font-bold text-white dark:bg-areia-100 dark:text-carvao-900 print:hidden"
                            >
                              Marcar
                            </button>
                          ) : (
                            <span className="text-carvao-300">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2">
                          {podeComprar ? (
                            <input
                              type="date"
                              value={l.status.previsao ?? ''}
                              onChange={(e) => setStatus(di, l.chave, { previsao: e.target.value })}
                              className="rounded-lg border border-carvao-200 bg-white px-1.5 py-1 text-xs dark:border-carvao-600 dark:bg-carvao-900"
                            />
                          ) : l.status.previsao ? (
                            `${l.status.previsao.slice(8, 10)}/${l.status.previsao.slice(5, 7)}`
                          ) : (
                            <span className="text-carvao-300">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2">
                          {l.status.recebidoOk ? (
                            <span className="font-semibold text-brand-600">✓ OK</span>
                          ) : podeReceber && l.status.compradoEm ? (
                            <button
                              onClick={() =>
                                setStatus(di, l.chave, {
                                  recebidoOk: true,
                                  recebidoQtd: l.status.compradoQtd ?? l.qtd,
                                })
                              }
                              className="rounded-full bg-brand-600 px-2.5 py-1 text-[11px] font-bold text-white print:hidden"
                            >
                              Dar OK
                            </button>
                          ) : (
                            <span className="text-carvao-300">—</span>
                          )}
                        </td>
                        <td className="px-2 py-2 print:hidden">
                          {podeAjustarQtd && (
                            <button
                              onClick={() =>
                                l.manual
                                  ? rmManual(di, Number(l.chave.split(':')[1]))
                                  : setAjuste(di, l.chave, null, true)
                              }
                              aria-label={`Remover ${l.item}`}
                              className="text-carvao-300 hover:text-[#b04c41]"
                            >
                              ✕
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {podeAjustarQtd && (
              <button
                onClick={() => setNovoItemDia(di)}
                className="text-sm font-semibold text-brand-600 hover:text-brand-700 print:hidden"
              >
                + Adicionar item extra
              </button>
            )}
          </Cartao>
        );
      })}

      <FormNovoItem
        diaIdx={novoItemDia}
        aoFechar={() => setNovoItemDia(null)}
        aoSalvar={(dia, item, unid, qtd) => {
          addManual(dia, item, unid, qtd);
          setNovoItemDia(null);
        }}
      />
    </div>
  );
}

function FormNovoItem({
  diaIdx,
  aoFechar,
  aoSalvar,
}: {
  diaIdx: number | null;
  aoFechar: () => void;
  aoSalvar: (dia: number, item: string, unid: string, qtd: number) => void;
}) {
  const [item, setItem] = useState('');
  const [unid, setUnid] = useState('un');
  const [qtd, setQtd] = useState('1');

  if (diaIdx === null) return null;
  return (
    <Modal titulo={`Item extra — ${DIAS_SEMANA[diaIdx]}`} aberto aoFechar={aoFechar}>
      <div className="space-y-3">
        <input
          autoFocus
          className={estiloInput}
          placeholder="Nome do item"
          value={item}
          onChange={(e) => setItem(e.target.value)}
          list="itens-conhecidos"
        />
        <datalist id="itens-conhecidos">
          {DADOS.itens.slice(0, 150).map((i) => (
            <option key={i.n} value={i.n} />
          ))}
        </datalist>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            step="0.1"
            className={estiloInput + ' !w-28'}
            value={qtd}
            onChange={(e) => setQtd(e.target.value)}
          />
          <select className={estiloInput} value={unid} onChange={(e) => setUnid(e.target.value)}>
            {DADOS.unidades.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </div>
        <Botao
          variante="sucesso"
          className="w-full"
          disabled={!item.trim() || !(Number(qtd) > 0)}
          onClick={() => aoSalvar(diaIdx, item.trim(), unid, Number(qtd))}
        >
          Adicionar
        </Botao>
      </div>
    </Modal>
  );
}
