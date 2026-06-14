'use client';

import { useState } from 'react';
import { Botao, Cartao, Modal, Pilula, estiloInput } from '@/components/ui';
import { Icone } from '@/components/Icones';
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

function ddmm(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

/** Comprime a foto da nota para caber no armazenamento do navegador. */
function comprimirImagem(file: File): Promise<string> {
  return new Promise((resolver, rejeitar) => {
    const img = new Image();
    img.onload = () => {
      const max = 1100;
      const esc = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * esc);
      c.height = Math.round(img.height * esc);
      c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolver(c.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = rejeitar;
    img.src = URL.createObjectURL(file);
  });
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
  const [fotoPendente, setFotoPendente] = useState<string | null>(null);
  const [diasDaNota, setDiasDaNota] = useState<Set<number>>(new Set());

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

  // ações em lote — sobre todos os itens do dia
  const comprarTudo = (dia: number) =>
    atualizar((e) => {
      const st = { ...(e.status[dia] ?? {}) };
      linhasDoDia(e, dia, fatores).forEach((l) => {
        if (!st[l.chave]?.compradoEm) st[l.chave] = { ...(st[l.chave] ?? {}), compradoEm: hojeIso(), compradoQtd: l.qtd };
      });
      return { ...e, status: { ...e.status, [dia]: st } };
    });

  const receberTudo = (dia: number) =>
    atualizar((e) => {
      const st = { ...(e.status[dia] ?? {}) };
      linhasDoDia(e, dia, fatores).forEach((l) => {
        const s = st[l.chave];
        if (s?.compradoEm && !s.recebidoOk)
          st[l.chave] = { ...s, recebidoOk: true, recebidoQtd: s.compradoQtd ?? l.qtd };
      });
      return { ...e, status: { ...e.status, [dia]: st } };
    });

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

      {/* Notas fiscais da semana — uma compra pode cobrir vários dias */}
      {(podeComprar || podeReceber || (estado.notasFiscais ?? []).length > 0) && (
        <Cartao className="space-y-3 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-lg font-semibold">📑 Notas fiscais</h3>
            {(podeComprar || podeReceber) && (
              <label className="cursor-pointer rounded-full bg-ouro-300/20 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wide text-ouro-600 ring-1 ring-ouro-400/40 hover:bg-ouro-300/30">
                📸 Foto da nota fiscal
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={async (ev) => {
                    const f = ev.target.files?.[0];
                    ev.target.value = '';
                    if (!f) return;
                    setFotoPendente(await comprimirImagem(f));
                    setDiasDaNota(new Set());
                  }}
                />
              </label>
            )}
          </div>
          {(estado.notasFiscais ?? []).length === 0 ? (
            <p className="text-xs text-carvao-400">
              Tire a foto da nota na hora do recebimento — o app pergunta a quais dias de compra ela se refere e
              deixa tudo conferível.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-3">
              {(estado.notasFiscais ?? []).map((n, ni) => (
                <li
                  key={ni}
                  className="flex items-center gap-2.5 rounded-2xl bg-areia-100 p-2 pr-3 ring-1 ring-carvao-200 dark:bg-carvao-800 dark:ring-carvao-600"
                >
                  <a href={n.foto} target="_blank" rel="noreferrer" title="Abrir nota fiscal">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={n.foto} alt="Nota fiscal" className="h-14 w-14 rounded-xl object-cover ring-2 ring-brand-500/50" />
                  </a>
                  <span>
                    <span className="block text-[11px] font-bold uppercase text-brand-600">
                      {n.dias.map((d) => DIAS_SEMANA[d].slice(0, 3)).join(' · ')}
                    </span>
                    <span className="block text-[10px] text-carvao-400">
                      anexada em {n.em.slice(8, 10)}/{n.em.slice(5, 7)}
                    </span>
                  </span>
                  {(podeComprar || podeReceber) && (
                    <button
                      onClick={() =>
                        atualizar((e) => ({ ...e, notasFiscais: (e.notasFiscais ?? []).filter((_, i) => i !== ni) }))
                      }
                      aria-label="Remover nota fiscal"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-carvao-300 hover:bg-[#b04c41]/10 hover:text-[#b04c41]"
                    >
                      <Icone nome="fechar" tam={16} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      )}

      {/* Pergunta da nota: a quais dias se refere? */}
      <Modal titulo="Essa nota é de quais dias?" aberto={fotoPendente !== null} aoFechar={() => setFotoPendente(null)}>
        {fotoPendente && (
          <div className="space-y-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fotoPendente} alt="Nota fiscal" className="mx-auto max-h-44 rounded-2xl object-contain ring-1 ring-carvao-200" />
            <p className="text-sm text-carvao-500 dark:text-carvao-300">
              Uma compra pode cobrir mais de um dia — marque todos os dias de cardápio que esta nota atende:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DIAS_SEMANA.map((nome, i) => (
                <label
                  key={i}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold ring-1 transition ${
                    diasDaNota.has(i)
                      ? 'bg-brand-600/10 text-brand-700 ring-brand-500/50 dark:text-brand-300'
                      : 'bg-white text-carvao-600 ring-carvao-200 dark:bg-carvao-800 dark:text-areia-200 dark:ring-carvao-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={diasDaNota.has(i)}
                    onChange={() =>
                      setDiasDaNota((s) => {
                        const novo = new Set(s);
                        if (novo.has(i)) novo.delete(i);
                        else novo.add(i);
                        return novo;
                      })
                    }
                    className="h-4 w-4 accent-brand-600"
                  />
                  {nome}
                </label>
              ))}
            </div>
            <Botao
              variante="sucesso"
              className="w-full"
              disabled={diasDaNota.size === 0}
              onClick={() => {
                const dias = Array.from(diasDaNota).sort((a, b) => a - b);
                atualizar((e) => ({
                  ...e,
                  notasFiscais: [...(e.notasFiscais ?? []), { foto: fotoPendente, dias, em: new Date().toISOString() }],
                }));
                setFotoPendente(null);
              }}
            >
              Anexar a {diasDaNota.size} dia{diasDaNota.size > 1 ? 's' : ''}
            </Botao>
          </div>
        )}
      </Modal>

      {estado.dias.map((dia, di) => {
        const linhas = linhasDoDia(estado, di, fatores);
        if (!dia.principal && linhas.length === 0) return null;
        const custo = custoDaLista(
          linhas.map((l) => ({ item: l.item, unid: l.unid, qtd: l.qtd })),
          precos,
        );
        const compradas = linhas.filter((l) => l.status.compradoEm).length;
        const recebidas = linhas.filter((l) => l.status.recebidoOk).length;
        const divergencias = linhas.filter(
          (l) =>
            (l.status.precoPago !== undefined && precos[l.chave] > 0 && l.status.precoPago > precos[l.chave] * 1.02) ||
            (l.status.recebidoOk &&
              l.status.recebidoQtd !== undefined &&
              l.status.compradoQtd !== undefined &&
              l.status.recebidoQtd < l.status.compradoQtd),
        ).length;
        const notasDoDia = (estado.notasFiscais ?? []).filter((n) => n.dias.includes(di)).length;

        return (
          <Cartao key={di} className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-lg font-semibold">
                {DIAS_SEMANA[di]}{' '}
                <span className="text-sm font-normal text-carvao-400">
                  · {dia.principal || 'sem cardápio'} · {dia.pessoas} pessoas
                </span>
              </h3>
              <p className="text-xs font-semibold tabular-nums text-carvao-400">
                {compradas}/{linhas.length} comprados · {recebidas}/{linhas.length} recebidos
                {custo.itensComPreco > 0 && <> · ≈ {formatarReais(custo.total)}</>}
                {divergencias > 0 && <span className="font-extrabold text-[#b04c41]"> · ⚠ {divergencias} divergências</span>}
                {notasDoDia > 0 && (
                  <span className="font-bold text-brand-600">
                    {' '}
                    · 📎 {notasDoDia} nota{notasDoDia > 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>

            {/* ações em lote */}
            {linhas.length > 0 && (podeComprar || podeReceber) && (
              <div className="flex flex-wrap gap-2 print:hidden">
                {podeComprar && compradas < linhas.length && (
                  <button
                    onClick={() => comprarTudo(di)}
                    className="flex items-center gap-1.5 rounded-full bg-carvao-900 px-3 py-1.5 text-[12px] font-bold text-white dark:bg-areia-100 dark:text-carvao-900"
                  >
                    <Icone nome="check" tam={15} /> Comprar tudo
                  </button>
                )}
                {podeReceber && compradas > 0 && recebidas < compradas && (
                  <button
                    onClick={() => receberTudo(di)}
                    className="flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1.5 text-[12px] font-bold text-white hover:bg-brand-700"
                  >
                    <Icone nome="compras" tam={15} /> Receber tudo
                  </button>
                )}
              </div>
            )}

            {linhas.length === 0 ? (
              <p className="text-sm text-carvao-400">Escolha o cardápio na aba anterior para gerar a lista.</p>
            ) : (
              <div className="space-y-2">
                {linhas.map((l) => {
                  const acima =
                    l.status.precoPago !== undefined &&
                    precos[l.chave] > 0 &&
                    l.status.precoPago > precos[l.chave] * 1.02;
                  const veioMenos =
                    l.status.recebidoOk &&
                    l.status.recebidoQtd !== undefined &&
                    l.status.compradoQtd !== undefined &&
                    l.status.recebidoQtd < l.status.compradoQtd;
                  return (
                    <div
                      key={l.chave}
                      className="rounded-2xl bg-areia-50/70 p-3 ring-1 ring-carvao-100 dark:bg-carvao-900/40 dark:ring-carvao-700/60"
                    >
                      {/* item + quantidade + remover */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
                            {l.item}
                            {l.manual && <Pilula tom="ouro">extra</Pilula>}
                            {l.sugerida !== null && l.qtd !== l.sugerida && (
                              <span className="text-[10px] font-normal text-carvao-400">(sugerido {formatarQtd(l.sugerida)})</span>
                            )}
                          </p>
                          {fornecedores[l.chave] && (
                            <span className="block text-[10px] font-semibold text-brand-600">↓ mais barato: {fornecedores[l.chave]}</span>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {podeAjustarQtd && !l.manual ? (
                            <input
                              type="number"
                              min={0}
                              step="0.1"
                              value={l.qtd}
                              onChange={(e) => setAjuste(di, l.chave, Number(e.target.value))}
                              className="h-9 w-16 rounded-lg border border-carvao-200 bg-white px-1.5 text-center font-bold tabular-nums dark:border-carvao-600 dark:bg-carvao-900"
                            />
                          ) : (
                            <strong className="tabular-nums">{formatarQtd(l.qtd)}</strong>
                          )}
                          <span className="text-xs text-carvao-400">{l.unid}</span>
                          {podeAjustarQtd && (
                            <button
                              onClick={() =>
                                l.manual ? rmManual(di, Number(l.chave.split(':')[1])) : setAjuste(di, l.chave, null, true)
                              }
                              aria-label={`Remover ${l.item}`}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-carvao-300 hover:bg-[#b04c41]/10 hover:text-[#b04c41] print:hidden"
                            >
                              <Icone nome="fechar" tam={15} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* fluxo: comprado · previsão · recebido */}
                      <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {/* Comprado */}
                        <div className="rounded-xl bg-white p-2 ring-1 ring-carvao-100 dark:bg-carvao-850 dark:ring-carvao-700/60">
                          <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-carvao-400">Comprado</p>
                          {l.status.compradoEm ? (
                            <div className="space-y-1">
                              <span className="text-xs font-bold text-brand-600">✓ {ddmm(l.status.compradoEm)}</span>
                              {podeComprar ? (
                                <div className="flex items-center gap-1 text-[11px]">
                                  <input
                                    type="number"
                                    min={0}
                                    step="0.1"
                                    value={l.status.compradoQtd ?? ''}
                                    placeholder="qtd"
                                    title="Quantidade pedida"
                                    onChange={(e) => setStatus(di, l.chave, { compradoQtd: Number(e.target.value) })}
                                    className="h-8 w-12 rounded-md border border-carvao-200 bg-white px-1 text-center font-bold tabular-nums dark:border-carvao-600 dark:bg-carvao-900"
                                  />
                                  <span className="text-carvao-400">R$</span>
                                  <input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={l.status.precoPago ?? ''}
                                    placeholder="pago"
                                    title="Preço pago por unidade"
                                    onChange={(e) =>
                                      setStatus(di, l.chave, { precoPago: e.target.value ? Number(e.target.value) : undefined })
                                    }
                                    className="h-8 w-14 rounded-md border border-carvao-200 bg-white px-1 text-right font-bold tabular-nums dark:border-carvao-600 dark:bg-carvao-900"
                                  />
                                </div>
                              ) : (
                                l.status.precoPago !== undefined && (
                                  <span className="block text-[10px] text-carvao-400">
                                    {formatarQtd(l.status.compradoQtd ?? l.qtd)} {l.unid} · {formatarReais(l.status.precoPago)}/{l.unid}
                                  </span>
                                )
                              )}
                              {acima && (
                                <span className="block text-[10px] font-extrabold text-[#b04c41]">
                                  ▲ acima do cotado ({formatarReais(precos[l.chave])})
                                </span>
                              )}
                            </div>
                          ) : podeComprar ? (
                            <button
                              onClick={() => setStatus(di, l.chave, { compradoEm: hojeIso(), compradoQtd: l.qtd })}
                              className="w-full rounded-lg bg-carvao-900 px-2 py-1.5 text-[11px] font-bold text-white dark:bg-areia-100 dark:text-carvao-900 print:hidden"
                            >
                              Marcar
                            </button>
                          ) : (
                            <span className="text-carvao-300">—</span>
                          )}
                        </div>

                        {/* Previsão */}
                        <div className="rounded-xl bg-white p-2 ring-1 ring-carvao-100 dark:bg-carvao-850 dark:ring-carvao-700/60">
                          <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-carvao-400">Previsão</p>
                          {podeComprar ? (
                            <input
                              type="date"
                              value={l.status.previsao ?? ''}
                              onChange={(e) => setStatus(di, l.chave, { previsao: e.target.value })}
                              className="h-8 w-full rounded-md border border-carvao-200 bg-white px-1.5 text-xs dark:border-carvao-600 dark:bg-carvao-900"
                            />
                          ) : l.status.previsao ? (
                            <span className="text-xs font-semibold">{ddmm(l.status.previsao)}</span>
                          ) : (
                            <span className="text-carvao-300">—</span>
                          )}
                        </div>

                        {/* Recebido */}
                        <div className="rounded-xl bg-white p-2 ring-1 ring-carvao-100 dark:bg-carvao-850 dark:ring-carvao-700/60">
                          <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-carvao-400">Recebido</p>
                          {l.status.recebidoOk ? (
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-brand-600">✓ OK</span>
                              {podeReceber && (
                                <input
                                  type="number"
                                  min={0}
                                  step="0.1"
                                  value={l.status.recebidoQtd ?? ''}
                                  title="Quantidade conferida no recebimento"
                                  onChange={(e) => setStatus(di, l.chave, { recebidoQtd: Number(e.target.value) })}
                                  className="block h-8 w-12 rounded-md border border-carvao-200 bg-white px-1 text-center text-[11px] font-bold tabular-nums dark:border-carvao-600 dark:bg-carvao-900"
                                />
                              )}
                              {veioMenos && (
                                <span className="block text-[10px] font-extrabold text-[#d18a3a]">
                                  ⚠ veio {formatarQtd(l.status.recebidoQtd!)} de {formatarQtd(l.status.compradoQtd!)}
                                </span>
                              )}
                            </div>
                          ) : podeReceber && l.status.compradoEm ? (
                            <button
                              onClick={() => setStatus(di, l.chave, { recebidoOk: true, recebidoQtd: l.status.compradoQtd ?? l.qtd })}
                              className="w-full rounded-lg bg-brand-600 px-2 py-1.5 text-[11px] font-bold text-white print:hidden"
                            >
                              Dar OK
                            </button>
                          ) : (
                            <span className="text-carvao-300">—</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {podeAjustarQtd && (
              <button
                onClick={() => setNovoItemDia(di)}
                className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 print:hidden"
              >
                <Icone nome="somar" tam={16} /> Adicionar item extra
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
