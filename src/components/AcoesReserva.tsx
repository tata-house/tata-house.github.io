'use client';

import { useMemo, useState } from 'react';
import {
  cancelarReserva,
  confirmarPix,
  fecharConta,
  liberarMesa,
  marcarChegou,
  marcarNoShow,
  moverMesa,
  sentarCliente,
} from '@/lib/actions';
import { AREA_LABEL, STATUS_ATIVOS } from '@/lib/constants';
import { useDados } from '@/lib/data-context';
import { mesasLivres } from '@/lib/mesa-estado';
import type { Reserva } from '@/lib/types';
import { brl } from '@/lib/format';
import { BadgePix, BadgeStatus, Botao, Modal, estiloInput, estiloRotulo } from './ui';
import { FormularioReserva } from './FormularioReserva';

export function AcoesReserva({
  reserva,
  aberto,
  aoFechar,
}: {
  reserva: Reserva | null;
  aberto: boolean;
  aoFechar: () => void;
}) {
  const { mesas, reservas, recarregar } = useDados();
  const [executando, setExecutando] = useState(false);
  const [erro, setErro] = useState('');
  const [movendo, setMovendo] = useState(false);
  const [novaMesa, setNovaMesa] = useState('');
  const [editando, setEditando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [valorConta, setValorConta] = useState('');

  const livres = useMemo(
    () => (reserva ? mesasLivres(mesas, reservas, reserva.turno) : []),
    [mesas, reservas, reserva],
  );

  if (!reserva) return null;

  const ativa = STATUS_ATIVOS.includes(reserva.status);

  async function executar(acao: () => Promise<void>, confirmacao?: string) {
    if (confirmacao && !window.confirm(confirmacao)) return;
    setExecutando(true);
    setErro('');
    try {
      await acao();
      await recarregar();
      setMovendo(false);
      setFinalizando(false);
      aoFechar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao executar ação.');
    } finally {
      setExecutando(false);
    }
  }

  return (
    <>
      <Modal titulo={reserva.nome} aberto={aberto && !editando} aoFechar={aoFechar}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <BadgeStatus status={reserva.status} />
            <BadgePix status={reserva.pix_status} />
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold dark:bg-gray-700">
              Turno {reserva.turno}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold dark:bg-gray-700">
              {reserva.origem === 'passante' ? '🚶 Passante' : '📋 Reserva'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-900">
              <div className="text-gray-500 dark:text-gray-400">Mesa</div>
              <div className="text-lg font-bold">
                {reserva.mesa ? `${reserva.mesa.numero} · ${AREA_LABEL[reserva.mesa.area]}` : 'Sem mesa'}
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-900">
              <div className="text-gray-500 dark:text-gray-400">Telefone</div>
              <div className="text-lg font-bold">{reserva.telefone || '—'}</div>
            </div>
            <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-900">
              <div className="text-gray-500 dark:text-gray-400">Crédito Pix</div>
              <div className="text-lg font-bold">
                {reserva.credito_aplicado ? 'Já aplicado' : brl(reserva.credito_disponivel)}
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-900">
              <div className="text-gray-500 dark:text-gray-400">Pessoas</div>
              <div className="text-lg font-bold">{reserva.pessoas}</div>
            </div>
          </div>

          {reserva.observacao && (
            <p className="rounded-xl bg-yellow-50 px-4 py-3 text-sm font-medium text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-100">
              📝 {reserva.observacao}
            </p>
          )}

          {erro && (
            <p className="rounded-xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-700 dark:bg-red-900/50 dark:text-red-200">
              {erro}
            </p>
          )}

          {movendo ? (
            <div className="space-y-3">
              <label className={estiloRotulo}>Nova mesa</label>
              <select className={estiloInput} value={novaMesa} onChange={(e) => setNovaMesa(e.target.value)}>
                <option value="">Escolha a mesa livre...</option>
                {livres.map((m) => (
                  <option key={m.id} value={m.id}>
                    Mesa {m.numero} — {AREA_LABEL[m.area]}
                  </option>
                ))}
              </select>
              <div className="flex gap-3">
                <Botao variante="secundario" className="flex-1" onClick={() => setMovendo(false)}>
                  Voltar
                </Botao>
                <Botao
                  className="flex-1"
                  disabled={!novaMesa || executando}
                  onClick={() => executar(() => moverMesa(reserva.id, novaMesa))}
                >
                  Confirmar troca
                </Botao>
              </div>
            </div>
          ) : finalizando ? (
            <div className="space-y-3">
              <label className={estiloRotulo}>Valor da conta (R$)</label>
              <input
                className={estiloInput}
                value={valorConta}
                onChange={(e) => setValorConta(e.target.value)}
                inputMode="decimal"
                placeholder="0,00"
              />
              {reserva.credito_aplicado && (
                <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                  Crédito de {brl(reserva.credito_disponivel)} será descontado.
                </p>
              )}
              <div className="flex gap-3">
                <Botao variante="secundario" className="flex-1" onClick={() => setFinalizando(false)}>
                  Voltar
                </Botao>
                <Botao
                  className="flex-1"
                  disabled={executando || !valorConta}
                  onClick={() =>
                    executar(() => fecharConta(reserva.id, Number(valorConta.replace(',', '.')) || 0))
                  }
                >
                  Finalizar mesa
                </Botao>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {ativa && reserva.status !== 'chegou' && reserva.status !== 'sentado' && (
                <Botao variante="alerta" onClick={() => executar(() => marcarChegou(reserva.id))} disabled={executando}>
                  ✅ Chegou
                </Botao>
              )}
              {ativa && reserva.status !== 'sentado' && (
                <Botao variante="perigo" onClick={() => executar(() => sentarCliente(reserva.id))} disabled={executando || !reserva.table_id}>
                  🪑 Sentar
                </Botao>
              )}
              {ativa && (
                <Botao variante="secundario" onClick={() => setMovendo(true)} disabled={executando}>
                  🔄 Mover mesa
                </Botao>
              )}
              {reserva.pix_status === 'pendente' && reserva.origem === 'reserva' && (
                <Botao variante="sucesso" onClick={() => executar(() => confirmarPix(reserva.id), 'Confirmar recebimento do Pix de R$ 100?')} disabled={executando}>
                  💸 Confirmar Pix
                </Botao>
              )}
              {reserva.status === 'sentado' && (
                <Botao variante="secundario" onClick={() => setFinalizando(true)} disabled={executando}>
                  🧾 Finalizar mesa
                </Botao>
              )}
              {reserva.status === 'finalizada' && !reserva.mesa_liberada && (
                <Botao variante="sucesso" onClick={() => executar(() => liberarMesa(reserva.id))} disabled={executando}>
                  🧹 Liberar mesa
                </Botao>
              )}
              {ativa && (
                <Botao variante="secundario" onClick={() => setEditando(true)} disabled={executando}>
                  ✏️ Editar
                </Botao>
              )}
              {ativa && reserva.status !== 'sentado' && (
                <Botao
                  variante="secundario"
                  onClick={() => executar(() => marcarNoShow(reserva.id), 'Marcar como no-show? A mesa será liberada.')}
                  disabled={executando}
                >
                  👻 No-show
                </Botao>
              )}
              {ativa && (
                <Botao
                  variante="perigo"
                  className="col-span-2 bg-red-100 !text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:!text-red-200"
                  onClick={() => executar(() => cancelarReserva(reserva.id), 'Cancelar esta reserva? A mesa será liberada.')}
                  disabled={executando}
                >
                  ❌ Cancelar reserva
                </Botao>
              )}
            </div>
          )}
        </div>
      </Modal>

      {editando && (
        <FormularioReserva
          aberto={editando}
          aoFechar={() => {
            setEditando(false);
            aoFechar();
          }}
          reserva={reserva}
        />
      )}
    </>
  );
}
