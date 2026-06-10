'use client';

import { useMemo, useState } from 'react';
import { AcoesReserva } from '@/components/AcoesReserva';
import { FormularioReserva } from '@/components/FormularioReserva';
import { SeletorTurno } from '@/components/SeletorTurno';
import { BadgePix, BadgeStatus, Botao, Cartao, estiloInput } from '@/components/ui';
import { AREA_LABEL, STATUS_LABEL } from '@/lib/constants';
import { useDados } from '@/lib/data-context';
import type { Area, Reserva, ReservaStatus, Turno } from '@/lib/types';

export default function ReservasPage() {
  const { reservas, carregando } = useDados();
  const [turno, setTurno] = useState<Turno | 'todos'>('todos');
  const [area, setArea] = useState<Area | 'todas'>('todas');
  const [status, setStatus] = useState<ReservaStatus | 'todos'>('todos');
  const [pix, setPix] = useState<'todos' | 'pago' | 'pendente'>('todos');
  const [busca, setBusca] = useState('');
  const [novaAberta, setNovaAberta] = useState(false);
  const [selecionada, setSelecionada] = useState<Reserva | null>(null);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return reservas.filter((r) => {
      if (turno !== 'todos' && r.turno !== turno) return false;
      if (area !== 'todas') {
        const areaReserva = r.mesa?.area ?? r.area_preferida;
        if (areaReserva !== area) return false;
      }
      if (status !== 'todos' && r.status !== status) return false;
      if (pix === 'pago' && r.pix_status !== 'pago') return false;
      if (pix === 'pendente' && r.pix_status !== 'pendente') return false;
      if (termo && !r.nome.toLowerCase().includes(termo) && !(r.telefone ?? '').includes(termo))
        return false;
      return true;
    });
  }, [reservas, turno, area, status, pix, busca]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Reservas</h1>
        <Botao onClick={() => setNovaAberta(true)}>+ Nova reserva</Botao>
      </div>

      <SeletorTurno valor={turno} aoMudar={setTurno} permitirTodos />

      <input
        className={estiloInput}
        placeholder="🔍 Buscar por nome ou telefone..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      <div className="grid grid-cols-3 gap-2">
        <select className={estiloInput} value={area} onChange={(e) => setArea(e.target.value as Area | 'todas')}>
          <option value="todas">Todas as áreas</option>
          <option value="salao">{AREA_LABEL.salao}</option>
          <option value="varanda">{AREA_LABEL.varanda}</option>
        </select>
        <select
          className={estiloInput}
          value={status}
          onChange={(e) => setStatus(e.target.value as ReservaStatus | 'todos')}
        >
          <option value="todos">Todos os status</option>
          {(Object.keys(STATUS_LABEL) as ReservaStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select className={estiloInput} value={pix} onChange={(e) => setPix(e.target.value as typeof pix)}>
          <option value="todos">Pix: todos</option>
          <option value="pago">Pix pago</option>
          <option value="pendente">Pix pendente</option>
        </select>
      </div>

      {carregando ? (
        <p className="py-10 text-center text-gray-500">Carregando...</p>
      ) : filtradas.length === 0 ? (
        <p className="py-10 text-center text-gray-500">Nenhuma reserva encontrada.</p>
      ) : (
        <div className="space-y-2">
          {filtradas.map((r) => (
            <Cartao key={r.id} className="cursor-pointer transition hover:border-brand-500">
              <button className="w-full text-left" onClick={() => setSelecionada(r)}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-lg font-bold">
                      {r.origem === 'passante' && '🚶 '}
                      {r.nome}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Turno {r.turno} · Mesa {r.mesa?.numero ?? '—'}
                      {r.mesa ? ` (${AREA_LABEL[r.mesa.area]})` : ''}
                      {r.telefone ? ` · ${r.telefone}` : ''}
                    </div>
                    {r.observacao && (
                      <div className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">📝 {r.observacao}</div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <BadgeStatus status={r.status} />
                    {r.origem === 'reserva' && <BadgePix status={r.pix_status} />}
                  </div>
                </div>
              </button>
            </Cartao>
          ))}
        </div>
      )}

      <p className="text-center text-sm text-gray-400">{filtradas.length} reserva(s) na lista</p>

      {novaAberta && <FormularioReserva aberto={novaAberta} aoFechar={() => setNovaAberta(false)} />}
      <AcoesReserva reserva={selecionada} aberto={!!selecionada} aoFechar={() => setSelecionada(null)} />
    </div>
  );
}
