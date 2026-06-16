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
import { ListaCompras } from './ListaCompras';
import { ConciliacaoSemana } from './ConciliacaoSemana';

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
  const [modo, setModo] = useState<'lista' | 'detalhado'>('lista');

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

  const marcarComprado = (dia: number, chave: string, qtd: number) =>
    atualizar((e) => ({
      ...e,
      status: {
        ...e.status,
        [dia]: {
          ...(e.status[dia] ?? {}),
          [chave]: { ...(e.status[dia]?.[chave] ?? {}), compradoEm: hojeIso(), compradoQtd: qtd },
        },
      },
    }));

  const marcarRecebido = (dia: number, chave: string, qtd: number) =>
    atualizar((e) => {
      const s: StatusItem = e.status[dia]?.[chave] ?? {};
      return {
        ...e,
        status: {
          ...e.status,
          [dia]: {
            ...(e.status[dia] ?? {}),
            [chave]: { ...s, recebidoOk: true, recebidoQtd: s.compradoQtd ?? qtd },
          },
        },
      };
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

      {/* Alterna entre lista compacta (conferência) e visão detalhada */}
      <div className="flex gap-1 rounded-2xl bg-carvao-100/70 p-1 print:hidden dark:bg-carvao-800/70">
        {(
          [
            ['lista', '📋 Lista'],
            ['detalhado', '🧭 Detalhado'],
          ] as const
        ).map(([id, rot]) => (
          <button
            key={id}
            onClick={() => setModo(id)}
            className={`min-h-9 flex-1 rounded-xl px-3 text-[13px] font-semibold transition ${
              modo === id
                ? 'bg-white text-brand-700 shadow-suave dark:bg-carvao-700 dark:text-brand-300'
                : 'text-carvao-500 dark:text-areia-200'
            }`}
          >
            {rot}
          </button>
        ))}
      </div>

      {modo === 'lista' && (
        <ListaCompras estado={estado} fatores={fatores} atualizar={atualizar} podeComprar={podeComprar} />
      )}

      {/* Conciliação automática — preço vs histórico e quantidade vs cardápio */}
      <ConciliacaoSemana estado={estado} precos={precos} />

      {/* Notas fiscais da semana — uma compra pode cobrir vários dias */}
      {(podeComprar || podeReceber || (estado.notasFiscais ?? []).length > 0) && (
        <Cartao className="space-y-3 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-lg font-semibold">📑 Notas fiscais</h3>
            {(podeComprar || podeReceber) && (
              <label className="cursor-pointer">
                <span className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-carvao-100 px-3 text-[13px] font-semibold text-carvao-600 transition hover:bg-carvao-200 dark:bg-carvao-800 dark:text-areia-100">
                  📸 Adicionar foto
                </span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const url = await comprimirImagem(f);
                    setFotoPendente(url);
                    setDiasDaNota(new Set());
                    e.target.value = '';
                  }}
                />
              </label>
            )}
          </div>

          {(estado.notasFiscais ?? []).length === 0 ? (
            <p className="text-sm text-carvao-400">
              Nenhuma nota fiscal anexada esta semana. Tire uma foto da nota com o botão acima.
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {(estado.notasFiscais ?? []).map((n, ni) => (
                <div key={ni} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={n.foto} alt="Nota fiscal" className="h-28 w-auto rounded-xl object-cover ring-1 ring-carvao-200 dark:ring-carvao-700" />
                  <div className="absolute bottom-1 left-1 flex flex-wrap gap-0.5">
                    {n.dias.map((d) => (
                      <Pilula key={d} tom="neutro">{DIAS_SEMANA[d]?.slice(0, 3)}</Pilula>
                    ))}
                  </div>
                  <button
                    onClick={() =>
                      atualizar((e) => ({ ...e, notasFiscais: (e.notasFiscais ?? []).filter((_, i) => i !== ni) }))
                    }
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-carvao-900/70 text-[11px] text-white transition hover:bg-[#b04c41]"
                    aria-label="Remover nota"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </Cartao>
      )}

      {/* Seletor de dias + confirmação quando há foto pendente */}
      {fotoPendente && (
        <Cartao className="space-y-3">
          <p className="text-sm font-semibold">Selecione os dias que esta nota cobre:</p>
          <div className="flex flex-wrap gap-2">
            {DIAS_SEMANA.slice(0, 5).map((d, i) => (
              <button
                key={i}
                onClick={() =>
                  setDiasDaNota((prev) => {
                    const novo = new Set(prev);
                    if (novo.has(i)) novo.delete(i);
                    else novo.add(i);
                    return novo;
                  })
                }
                className={`rounded-full px-3 py-1 text-[13px] font-semibold ring-1 transition ${
                  diasDaNota.has(i)
                    ? 'bg-brand-600 text-white ring-brand-600'
                    : 'bg-white text-carvao-600 ring-carvao-200 dark:bg-carvao-800 dark:text-areia-100 dark:ring-carvao-600'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fotoPendente} alt="Prévia" className="max-h-48 w-auto rounded-xl object-cover ring-1 ring-carvao-200" />
          <div className="flex gap-2">
            <Botao
              variante="sucesso"
              className="flex-1"
              disabled={diasDaNota.size === 0}
              onClick={() => {
                atualizar((e) => ({
                  ...e,
                  notasFiscais: [...(e.notasFiscais ?? []), { foto: fotoPendente, dias: Array.from(diasDaNota), em: new Date().toISOString() }],
                }));
                setFotoPendente(null);
                setDiasDaNota(new Set());
              }}
            >
              Salvar nota
            </Botao>
            <Botao variante="secundario" onClick={() => { setFotoPendente(null); setDiasDaNota(new Set()); }}>
              Cancelar
            </Botao>
          </div>
        </Cartao>
      )}

      {/* Visão detalhada por dia */}
      {modo === 'detalhado' &&
        estado.dias.map((dia, di) => {
          const linhas = linhasDoDia(estado, di, fatores);
          const notasDoDia = (estado.notasFiscais ?? []).filter((n) => n.dias.includes(di)).length;

          if (!dia.principal && linhas.length === 0) return null;

          const custo = custoDaLista(
            linhas.map((l) => ({ norm: l.chave, qtd: l.qtd })),
            precos,
          );

          return (
            <Cartao key={di} className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display text-lg font-semibold">
                  {DIAS_SEMANA[di]}
                  {notasDoDia > 0 && (
                    <span className="ml-2 text-[11px] font-bold text-brand-600">📑 {notasDoDia} nota{notasDoDia > 1 ? 's' : ''}</span>
                  )}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  {custo > 0 && <Pilula tom="neutro">≈ {formatarReais(custo)}</Pilula>}
                  {podeAjustarQtd && dia.principal && (
                    <button
                      onClick={() => setNovoItemDia(di)}
                      className="text-[11px] font-semibold text-brand-600 hover:underline dark:text-brand-300"
                    >
                      + item
                    </button>
                  )}
                </div>
              </div>

              {!dia.principal ? (
                <p className="text-sm text-carvao-400">Sem cardápio definido.</p>
              ) : (
                <div className="space-y-2">
                  {linhas.length === 0 ? (
                    <p className="text-sm text-carvao-400">Sem itens de compra.</p>
                  ) : (
                    linhas.map((l) => {
                      const fornecedor = !l.manual ? fornecedores[l.chave] : undefined;
                      return (
                        <div
                          key={l.chave}
                          className={`rounded-2xl px-4 py-3 ring-1 ${
                            l.status.recebidoOk
                              ? 'bg-brand-500/5 ring-brand-400/20'
                              : l.status.compradoEm
                              ? 'bg-ouro-300/10 ring-ouro-400/25'
                              : 'bg-white ring-carvao-100 dark:bg-carvao-900 dark:ring-carvao-700/60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold">{l.item}</p>
                              <p className="text-[11px] text-carvao-400">
                                {formatarQtd(l.qtd)} {l.unid}
                                {l.sugerida !== null && l.qtd !== l.sugerida && (
                                  <span className="ml-1 text-ouro-500">(sugerido {formatarQtd(l.sugerida)})</span>
                                )}
                                {fornecedor && <span className="ml-1 text-carvao-300">· {fornecedor}</span>}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5">
                              {l.status.recebidoOk ? (
                                <Pilula tom="verde">✓ Recebido</Pilula>
                              ) : l.status.compradoEm ? (
                                <Pilula tom="ouro">Comprado {ddmm(l.status.compradoEm)}</Pilula>
                              ) : null}
                              {podeAjustarQtd && !l.manual && (
                                <button
                                  onClick={() => setAjuste(di, l.chave, null, true)}
                                  className="text-[11px] font-semibold text-carvao-400 hover:text-[#b04c41]"
                                  title="Remover item"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                            {/* Ajuste de quantidade */}
                            {podeAjustarQtd && !l.manual && (
                              <div className="rounded-xl bg-white p-2 ring-1 ring-carvao-100 dark:bg-carvao-850 dark:ring-carvao-700/60">
                                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-carvao-400">Ajustar qtd</p>
                                <div className="space-y-1">
                                  {[-20, -10, +10, +20].map((pct) => (
                                    <div key={pct} className="flex items-center gap-1 text-[11px]">
                                      <button
                                        onClick={() => setAjuste(di, l.chave, Math.max(0.1, l.qtd * (1 + pct / 100)), undefined)}
                                        className="w-12 rounded-lg bg-carvao-100 px-1 py-0.5 font-semibold hover:bg-brand-100 dark:bg-carvao-700"
                                      >
                                        {pct > 0 ? '+' : ''}{pct}%
                                      </button>
                                      <span className="text-carvao-400">→ {formatarQtd(l.qtd * (1 + pct / 100))} {l.unid}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Compra */}
                            {podeComprar && !l.status.compradoEm && (
                              <div className="rounded-xl bg-white p-2 ring-1 ring-carvao-100 dark:bg-carvao-850 dark:ring-carvao-700/60">
                                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-carvao-400">Marcar comprado</p>
                                <div className="space-y-0.5">
                                  {[100, 110, 120].map((pct) => (
                                    <button
                                      key={pct}
                                      onClick={() => marcarComprado(di, l.chave, Math.round(l.qtd * pct / 100 * 10) / 10)}
                                      className="block w-full rounded-lg bg-ouro-400/15 px-2 py-1 text-left text-[11px] font-semibold text-ouro-700 hover:bg-ouro-400/30 dark:text-ouro-300"
                                    >
                                      {pct === 100 ? 'Exato' : `+${pct - 100}%`} — {formatarQtd(l.qtd * pct / 100)} {l.unid}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Recebimento */}
                            {podeReceber && l.status.compradoEm && !l.status.recebidoOk && (
                              <div className="rounded-xl bg-white p-2 ring-1 ring-carvao-100 dark:bg-carvao-850 dark:ring-carvao-700/60">
                                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-carvao-400">Confirmar recebimento</p>
                                <button
                                  onClick={() => marcarRecebido(di, l.chave, l.status.compradoQtd ?? l.qtd)}
                                  className="block w-full rounded-lg bg-brand-500/15 px-2 py-1 text-[11px] font-semibold text-brand-600 hover:bg-brand-500/30 dark:text-brand-300"
                                >
                                  ✓ Recebi {formatarQtd(l.status.compradoQtd ?? l.qtd)} {l.unid}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </Cartao>
          );
        })}

      {/* Modal de novo item manual */}
      <NovoItemModal
        diaIdx={novoItemDia}
        aoFechar={() => setNovoItemDia(null)}
        aoSalvar={(dia, item, unid, qtd) => {
          atualizar((e) => ({
            ...e,
            manuais: { ...e.manuais, [dia]: [...(e.manuais[dia] ?? []), { item, unid, qtd }] },
          }));
          setNovoItemDia(null);
        }}
      />
    </div>
  );
}

function NovoItemModal({
  diaIdx,
  aoFechar,
  aoSalvar,
}: {
  diaIdx: number | null;
  aoFechar: () => void;
  aoSalvar: (dia: number, item: string, unid: string, qtd: number) => void;
}) {
  const [item, setItem] = useState('');
  const [unid, setUnid] = useState('kg');
  const [qtd, setQtd] = useState('');
  return (
    <Modal titulo="Novo item de compra" aberto={diaIdx !== null} aoFechar={aoFechar}>
      <div className="space-y-3">
        <input
          className={estiloInput}
          placeholder="Nome do item"
          value={item}
          onChange={(e) => setItem(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={0}
            step="0.1"
            className={estiloInput}
            placeholder="Quantidade"
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
          onClick={() => aoSalvar(diaIdx!, item.trim(), unid, Number(qtd))}
        >
          Adicionar
        </Botao>
      </div>
    </Modal>
  );
}
