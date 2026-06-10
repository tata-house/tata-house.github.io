'use client';

import { useMemo, useState } from 'react';
import { AcoesReserva } from '@/components/AcoesReserva';
import { SeletorTurno } from '@/components/SeletorTurno';
import { Cartao, Modal, Botao } from '@/components/ui';
import { AREA_LABEL, MESA_COR, MESA_ESTADO_LABEL, type MesaEstado } from '@/lib/constants';
import { useDados } from '@/lib/data-context';
import { estadoMesa } from '@/lib/mesa-estado';
import type { Area, Mesa, Reserva, Turno } from '@/lib/types';
import { liberarMesa } from '@/lib/actions';

const LEGENDA: MesaEstado[] = ['livre', 'reservada', 'chegou', 'ocupada', 'limpeza', 'bloqueada'];

export default function MapaPage() {
  const { mesas, reservas, carregando, recarregar } = useDados();
  const [turno, setTurno] = useState<Turno>('19:00');
  const [mesaSelecionada, setMesaSelecionada] = useState<Mesa | null>(null);
  const [reservaSelecionada, setReservaSelecionada] = useState<Reserva | null>(null);
  const [erro, setErro] = useState('');

  const estadoDe = useMemo(() => {
    const mapa = new Map<string, ReturnType<typeof estadoMesa>>();
    mesas.forEach((m) => mapa.set(m.id, estadoMesa(m, reservas, turno)));
    return mapa;
  }, [mesas, reservas, turno]);

  if (carregando) return <p className="py-10 text-center text-gray-500">Carregando...</p>;

  const infoSelecionada = mesaSelecionada ? estadoDe.get(mesaSelecionada.id) : null;

  async function aoLiberar(reserva: Reserva) {
    setErro('');
    try {
      await liberarMesa(reserva.id);
      await recarregar();
      setMesaSelecionada(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao liberar mesa.');
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black">Mapa de mesas</h1>
      <SeletorTurno valor={turno} aoMudar={(t) => setTurno(t as Turno)} />

      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        {LEGENDA.map((e) => (
          <span key={e} className="flex items-center gap-1">
            <span className={`inline-block h-4 w-4 rounded ${MESA_COR[e].split(' ')[0]}`} />
            {MESA_ESTADO_LABEL[e]}
          </span>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {(['salao', 'varanda'] as Area[]).map((area) => (
          <Cartao key={area}>
            <h2 className="mb-2 font-bold">{AREA_LABEL[area]}</h2>
            <div
              className={`relative w-full rounded-xl bg-gray-100 dark:bg-gray-900 ${
                area === 'salao' ? 'aspect-[3/4]' : 'aspect-[4/3]'
              }`}
            >
              {mesas
                .filter((m) => m.area === area)
                .map((m) => {
                  const info = estadoDe.get(m.id)!;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMesaSelecionada(m)}
                      className={`absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-xl text-sm font-black shadow transition active:scale-90 sm:h-14 sm:w-14 ${MESA_COR[info.estado]}`}
                      style={{ left: `${m.pos_x}%`, top: `${m.pos_y}%` }}
                      title={`Mesa ${m.numero} — ${MESA_ESTADO_LABEL[info.estado]}`}
                    >
                      {m.numero}
                      {info.reserva && (
                        <span className="max-w-full truncate px-1 text-[8px] font-semibold leading-tight">
                          {info.reserva.nome.split(' ')[0]}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </Cartao>
        ))}
      </div>

      {/* Detalhe da mesa */}
      <Modal
        titulo={mesaSelecionada ? `Mesa ${mesaSelecionada.numero} — ${AREA_LABEL[mesaSelecionada.area]}` : ''}
        aberto={!!mesaSelecionada && !reservaSelecionada}
        aoFechar={() => setMesaSelecionada(null)}
      >
        {mesaSelecionada && infoSelecionada && (
          <div className="space-y-4">
            <p className="font-semibold">
              Estado no turno {turno}:{' '}
              <span className="font-black">{MESA_ESTADO_LABEL[infoSelecionada.estado]}</span>
            </p>
            {mesaSelecionada.observacao && (
              <p className="text-sm text-gray-500 dark:text-gray-400">📍 {mesaSelecionada.observacao}</p>
            )}
            {erro && (
              <p className="rounded-xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-700 dark:bg-red-900/50 dark:text-red-200">{erro}</p>
            )}
            {infoSelecionada.reserva ? (
              <div className="space-y-3">
                <Cartao>
                  <div className="text-lg font-bold">{infoSelecionada.reserva.nome}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {infoSelecionada.reserva.telefone || 'Sem telefone'} ·{' '}
                    {infoSelecionada.reserva.origem === 'passante' ? 'Passante' : 'Reserva'}
                  </div>
                  {infoSelecionada.reserva.observacao && (
                    <div className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                      📝 {infoSelecionada.reserva.observacao}
                    </div>
                  )}
                </Cartao>
                {infoSelecionada.estado === 'limpeza' ? (
                  <Botao variante="sucesso" className="w-full" onClick={() => aoLiberar(infoSelecionada.reserva!)}>
                    🧹 Liberar mesa (limpeza concluída)
                  </Botao>
                ) : (
                  <Botao className="w-full" onClick={() => setReservaSelecionada(infoSelecionada.reserva)}>
                    Abrir ações (sentar, mover, finalizar...)
                  </Botao>
                )}
              </div>
            ) : infoSelecionada.estado === 'bloqueada' ? (
              <p className="text-gray-500 dark:text-gray-400">
                Mesa de apoio/balcão — bloqueada para reservas. Ative-a na tabela de mesas do Supabase se precisar usá-la.
              </p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                Mesa livre neste turno. Atribua uma reserva pela tela de Reservas ou Check-in.
              </p>
            )}
          </div>
        )}
      </Modal>

      <AcoesReserva
        reserva={reservaSelecionada}
        aberto={!!reservaSelecionada}
        aoFechar={() => {
          setReservaSelecionada(null);
          setMesaSelecionada(null);
        }}
      />
    </div>
  );
}
