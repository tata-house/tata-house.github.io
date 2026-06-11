'use client';

import { useMemo, useState } from 'react';
import { BadgePix, Botao, Cartao, Modal, estiloInput, estiloRotulo } from '@/components/ui';
import { aplicarCredito, fecharConta, liberarMesa } from '@/lib/actions';
import { TURNO_LABEL } from '@/lib/constants';
import { useDados } from '@/lib/data-context';
import { brl, hora } from '@/lib/format';
import type { Reserva } from '@/lib/types';

export default function CaixaPage() {
  const { reservas, carregando, recarregar } = useDados();
  const [busca, setBusca] = useState('');
  const [fechando, setFechando] = useState<Reserva | null>(null);
  const [valorConta, setValorConta] = useState('');
  const [erro, setErro] = useState('');
  const [ocupada, setOcupada] = useState<string | null>(null);

  // Mesas com gente agora: sentados e chegados, ordenados por número de mesa.
  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return reservas
      .filter((r) => r.status === 'sentado' || r.status === 'chegou')
      .filter((r) => !termo || r.nome.toLowerCase().includes(termo) || (r.mesa?.numero ?? '').toLowerCase() === termo)
      .sort(
        (a, b) =>
          (a.status === 'sentado' ? 0 : 1) - (b.status === 'sentado' ? 0 : 1) ||
          (a.mesa?.numero ?? '').localeCompare(b.mesa?.numero ?? '', 'pt-BR', { numeric: true }),
      );
  }, [reservas, busca]);

  async function executarCredito(r: Reserva) {
    if (!window.confirm(`Aplicar crédito de ${brl(r.credito_disponivel)} para ${r.nome}? Só pode ser feito uma vez.`)) return;
    setOcupada(r.id);
    setErro('');
    try {
      await aplicarCredito(r.id);
      await recarregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao aplicar crédito.');
    } finally {
      setOcupada(null);
    }
  }

  async function executarFechamento() {
    if (!fechando) return;
    setOcupada(fechando.id);
    setErro('');
    try {
      await fecharConta(fechando.id, Number(valorConta.replace(',', '.')) || 0);
      await liberarMesa(fechando.id); // mesa volta a livre no mapa da hostess
      await recarregar();
      setFechando(null);
      setValorConta('');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao fechar conta.');
    } finally {
      setOcupada(null);
    }
  }

  const valorNumerico = Number(valorConta.replace(',', '.')) || 0;
  const creditoAplicavel = fechando?.credito_aplicado ? Math.min(fechando.credito_disponivel, valorNumerico) : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Caixa</h1>
        <p className="mt-0.5 text-sm text-carvao-400 dark:text-carvao-300">
          Mesas em uso agora. Feche a conta para liberar a mesa no mapa da recepção.
        </p>
      </div>

      <input
        className={estiloInput}
        placeholder="Buscar por nome ou nº da mesa..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      {erro && (
        <p className="rounded-2xl bg-[#f5e2df] px-4 py-3 text-sm font-semibold text-[#8e3a31] shadow-suave dark:bg-[#3e2421] dark:text-[#e3a49c]">
          {erro}
        </p>
      )}

      {carregando ? (
        <p className="py-10 text-center text-carvao-400">Carregando...</p>
      ) : (
        <div className="space-y-3">
          {lista.map((r) => (
            <Cartao key={r.id}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="relative flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-carvao-900 text-areia-50 ring-1 ring-ouro-500/30">
                    <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-ouro-300/80">
                      Mesa
                    </span>
                    <span className="font-display text-2xl font-semibold leading-none">
                      {r.mesa?.numero ?? '—'}
                    </span>
                    <span
                      className={`absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full ring-2 ring-white dark:ring-carvao-850 ${
                        r.status === 'sentado' ? 'bg-[#b04c41]' : 'bg-[#d18a3a]'
                      }`}
                      title={r.status === 'sentado' ? 'Sentado' : 'Chegou'}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-lg font-bold leading-tight">{r.nome}</div>
                    <div className="text-sm text-carvao-400 dark:text-carvao-300">
                      {TURNO_LABEL[r.turno]} · {r.origem === 'passante' ? 'Passante' : 'Reserva'}
                      {r.status === 'chegou' ? ' · aguardando sentar' : ''}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {r.origem === 'reserva' && <BadgePix status={r.pix_status} />}
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                          r.credito_aplicado
                            ? 'bg-[#e0efe6] text-[#1e6b44] dark:bg-[#1c3528] dark:text-[#8fd4ae]'
                            : r.credito_disponivel > 0
                              ? 'bg-[#e3ebf3] text-[#3c5d80] dark:bg-[#22303d] dark:text-[#a6c2dc]'
                              : 'bg-carvao-100 text-carvao-500 dark:bg-carvao-700 dark:text-carvao-200'
                        }`}
                      >
                        <i className="h-1.5 w-1.5 rounded-full bg-current opacity-60" aria-hidden />
                        {r.credito_aplicado
                          ? `Crédito aplicado ${hora(r.credito_aplicado_em)}`
                          : r.credito_disponivel > 0
                            ? `Crédito ${brl(r.credito_disponivel)}`
                            : 'Sem crédito'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-60">
                  {r.origem === 'reserva' && !r.credito_aplicado && (
                    <Botao
                      variante="sucesso"
                      className="text-sm"
                      disabled={ocupada === r.id || r.pix_status !== 'pago'}
                      onClick={() => executarCredito(r)}
                    >
                      Aplicar crédito R$ 100
                    </Botao>
                  )}
                  <Botao
                    className="text-sm"
                    disabled={ocupada === r.id}
                    onClick={() => {
                      setFechando(r);
                      setValorConta('');
                    }}
                  >
                    Fechar conta e liberar mesa
                  </Botao>
                </div>
              </div>
            </Cartao>
          ))}
          {lista.length === 0 && (
            <div className="rounded-3xl border border-dashed border-carvao-200 py-14 text-center dark:border-carvao-700">
              <p className="font-display text-lg text-carvao-400 dark:text-carvao-300">
                Nenhuma mesa em uso agora
              </p>
              <p className="mt-1 text-sm text-carvao-300 dark:text-carvao-500">
                Quando a recepção sentar um casal, ele aparece aqui.
              </p>
            </div>
          )}
        </div>
      )}

      <Modal titulo={`Fechar conta — ${fechando?.nome ?? ''}`} aberto={!!fechando} aoFechar={() => setFechando(null)}>
        {fechando && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-areia-100 p-3 text-sm font-semibold text-carvao-600 dark:bg-carvao-800 dark:text-areia-200">
              Mesa {fechando.mesa?.numero ?? '—'} · {TURNO_LABEL[fechando.turno]} ·{' '}
              {fechando.origem === 'passante' ? 'Passante' : 'Reserva'}
            </div>
            <div>
              <label className={estiloRotulo}>Valor da conta (R$) — opcional</label>
              <input
                className={`${estiloInput} text-2xl font-bold`}
                value={valorConta}
                onChange={(e) => setValorConta(e.target.value)}
                inputMode="decimal"
                placeholder="0,00"
                autoFocus
              />
            </div>
            {valorNumerico > 0 && (
              <div className="space-y-1 rounded-2xl bg-areia-100 p-4 text-base dark:bg-carvao-800">
                <div className="flex justify-between">
                  <span>Valor da conta</span>
                  <span className="font-bold">{brl(valorNumerico)}</span>
                </div>
                <div className="flex justify-between font-semibold text-[#1e6b44] dark:text-[#8fd4ae]">
                  <span>Crédito Pix aplicado</span>
                  <span className="font-bold">− {brl(creditoAplicavel)}</span>
                </div>
                <div className="flex justify-between border-t border-carvao-200 pt-1.5 text-lg dark:border-carvao-600">
                  <span className="font-bold">Valor a pagar</span>
                  <span className="font-black">{brl(valorNumerico - creditoAplicavel)}</span>
                </div>
              </div>
            )}
            {!fechando.credito_aplicado && fechando.credito_disponivel > 0 && (
              <p className="rounded-2xl bg-[#f6ecd8] px-4 py-3 text-sm font-semibold text-[#8a6420] dark:bg-[#3d321a] dark:text-[#e3c987]">
                ⚠️ Este casal tem crédito de {brl(fechando.credito_disponivel)} ainda NÃO aplicado. Aplique antes de fechar, se for usar.
              </p>
            )}
            <p className="text-sm text-carvao-400 dark:text-carvao-300">
              Ao confirmar, a mesa volta a ficar <strong>livre</strong> no mapa da recepção.
            </p>
            <Botao className="w-full" onClick={executarFechamento} disabled={ocupada === fechando.id}>
              ✓ Confirmar — fechar conta e liberar mesa
            </Botao>
          </div>
        )}
      </Modal>
    </div>
  );
}
