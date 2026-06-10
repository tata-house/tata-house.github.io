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
    <div className="space-y-4">
      <h1 className="text-2xl font-black">Caixa 💰</h1>

      <input
        className={estiloInput}
        placeholder="🔍 Buscar por nome ou nº da mesa..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      {erro && (
        <p className="rounded-xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-700 dark:bg-red-900/50 dark:text-red-200">{erro}</p>
      )}

      {carregando ? (
        <p className="py-10 text-center text-gray-500">Carregando...</p>
      ) : (
        <div className="space-y-2">
          {lista.map((r) => (
            <Cartao key={r.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-gray-900 text-white dark:bg-black">
                    <span className="text-[9px] font-bold uppercase tracking-wide text-gray-400">Mesa</span>
                    <span className="text-2xl font-black leading-none">{r.mesa?.numero ?? '—'}</span>
                  </div>
                  <div>
                    <div className="text-lg font-bold leading-tight">{r.nome}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {TURNO_LABEL[r.turno]} · {r.origem === 'passante' ? '🚶 Passante' : '📋 Reserva'}
                      {r.status === 'chegou' ? ' · aguardando sentar' : ''}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {r.origem === 'reserva' && <BadgePix status={r.pix_status} />}
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-semibold ${
                          r.credito_aplicado
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                            : r.credito_disponivel > 0
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {r.credito_aplicado
                          ? `✓ Crédito aplicado ${hora(r.credito_aplicado_em)}`
                          : r.credito_disponivel > 0
                            ? `Crédito: ${brl(r.credito_disponivel)}`
                            : 'Sem crédito'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-56">
                  {r.origem === 'reserva' && !r.credito_aplicado && (
                    <Botao
                      variante="sucesso"
                      className="text-sm"
                      disabled={ocupada === r.id || r.pix_status !== 'pago'}
                      onClick={() => executarCredito(r)}
                    >
                      💵 Aplicar crédito R$ 100
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
                    ✓ Fechar conta e liberar mesa
                  </Botao>
                </div>
              </div>
            </Cartao>
          ))}
          {lista.length === 0 && (
            <p className="py-10 text-center text-gray-500">
              Nenhuma mesa ocupada agora. Quando a recepção sentar um casal, ele aparece aqui.
            </p>
          )}
        </div>
      )}

      <Modal titulo={`Fechar conta — ${fechando?.nome ?? ''}`} aberto={!!fechando} aoFechar={() => setFechando(null)}>
        {fechando && (
          <div className="space-y-4">
            <div className="rounded-xl bg-gray-50 p-3 text-sm font-semibold dark:bg-gray-900">
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
              <div className="space-y-1 rounded-xl bg-gray-50 p-4 text-base dark:bg-gray-900">
                <div className="flex justify-between">
                  <span>Valor da conta</span>
                  <span className="font-bold">{brl(valorNumerico)}</span>
                </div>
                <div className="flex justify-between text-green-700 dark:text-green-300">
                  <span>Crédito Pix aplicado</span>
                  <span className="font-bold">− {brl(creditoAplicavel)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-300 pt-1 text-lg dark:border-gray-600">
                  <span className="font-bold">Valor a pagar</span>
                  <span className="font-black">{brl(valorNumerico - creditoAplicavel)}</span>
                </div>
              </div>
            )}
            {!fechando.credito_aplicado && fechando.credito_disponivel > 0 && (
              <p className="rounded-xl bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                ⚠️ Este casal tem crédito de {brl(fechando.credito_disponivel)} ainda NÃO aplicado. Aplique antes de fechar, se for usar.
              </p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">
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
