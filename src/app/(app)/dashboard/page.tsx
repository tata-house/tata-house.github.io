'use client';

import { useMemo, useState } from 'react';
import { SeletorTurno } from '@/components/SeletorTurno';
import { Cartao } from '@/components/ui';
import {
  AREA_LABEL,
  CAPACIDADE_RESERVAS,
  CAPACIDADE_TOTAL_RESERVAS,
  STATUS_ATIVOS,
} from '@/lib/constants';
import { useDados } from '@/lib/data-context';
import type { Area, Turno } from '@/lib/types';

export default function DashboardPage() {
  const { reservas, carregando } = useDados();
  const [turno, setTurno] = useState<Turno>('19:00');

  const dados = useMemo(() => {
    const doTurno = reservas.filter((r) => r.turno === turno);
    const ativas = doTurno.filter((r) => STATUS_ATIVOS.includes(r.status));
    const confirmadas = doTurno.filter((r) => ['confirmada', 'chegou', 'sentado'].includes(r.status));
    const sentadas = doTurno.filter((r) => r.status === 'sentado');
    const pixPendente = doTurno.filter(
      (r) => r.origem === 'reserva' && r.pix_status === 'pendente' && STATUS_ATIVOS.includes(r.status),
    );
    const porArea = (area: Area) =>
      ativas.filter((r) => (r.mesa ? r.mesa.area === area : r.area_preferida === area)).length;

    const ocupSalao = porArea('salao');
    const ocupVaranda = porArea('varanda');
    const usadas = ativas.length;

    return {
      confirmadas: confirmadas.length,
      sentadas: sentadas.length,
      pixPendente: pixPendente.length,
      usadas,
      pessoas: usadas * 2,
      disponiveis: CAPACIDADE_TOTAL_RESERVAS - usadas,
      ocupSalao,
      ocupVaranda,
      lotadoSalao: ocupSalao >= CAPACIDADE_RESERVAS.salao,
      lotadoVaranda: ocupVaranda >= CAPACIDADE_RESERVAS.varanda,
      lotadoTotal: usadas >= CAPACIDADE_TOTAL_RESERVAS,
      noShow: doTurno.filter((r) => r.status === 'no_show').length,
    };
  }, [reservas, turno]);

  if (carregando) {
    return <p className="py-10 text-center text-gray-500">Carregando...</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black">Painel do evento ❤️</h1>
      <SeletorTurno valor={turno} aoMudar={(t) => setTurno(t as Turno)} />

      {(dados.lotadoTotal || dados.lotadoSalao || dados.lotadoVaranda) && (
        <div className="rounded-2xl bg-red-600 px-4 py-3 font-bold text-white">
          🚨 Alerta de lotação no turno {turno}:{' '}
          {dados.lotadoTotal
            ? 'capacidade total atingida!'
            : [
                dados.lotadoSalao ? `${AREA_LABEL.salao} lotado` : null,
                dados.lotadoVaranda ? `${AREA_LABEL.varanda} lotada` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Indicador titulo="Reservas confirmadas" valor={dados.confirmadas} icone="📋" />
        <Indicador titulo="Sentadas agora" valor={dados.sentadas} icone="🪑" />
        <Indicador
          titulo="Pix pendente"
          valor={dados.pixPendente}
          icone="💸"
          destaque={dados.pixPendente > 0 ? 'text-amber-600 dark:text-amber-400' : undefined}
        />
        <Indicador titulo="No-show" valor={dados.noShow} icone="👻" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Indicador
          titulo="Capacidade usada"
          valor={`${dados.usadas}/${CAPACIDADE_TOTAL_RESERVAS}`}
          legenda={`${dados.pessoas} pessoas`}
          icone="📊"
        />
        <Indicador
          titulo="Lugares disponíveis"
          valor={dados.disponiveis}
          legenda={`${dados.disponiveis * 2} pessoas`}
          icone="🟢"
          destaque={dados.disponiveis === 0 ? 'text-red-600' : 'text-green-600 dark:text-green-400'}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <BarraOcupacao
          titulo={AREA_LABEL.salao}
          usado={dados.ocupSalao}
          total={CAPACIDADE_RESERVAS.salao}
        />
        <BarraOcupacao
          titulo={AREA_LABEL.varanda}
          usado={dados.ocupVaranda}
          total={CAPACIDADE_RESERVAS.varanda}
        />
      </div>
    </div>
  );
}

function Indicador({
  titulo,
  valor,
  legenda,
  icone,
  destaque,
}: {
  titulo: string;
  valor: number | string;
  legenda?: string;
  icone: string;
  destaque?: string;
}) {
  return (
    <Cartao>
      <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">
        {icone} {titulo}
      </div>
      <div className={`mt-1 text-3xl font-black ${destaque ?? ''}`}>{valor}</div>
      {legenda && <div className="text-sm text-gray-400">{legenda}</div>}
    </Cartao>
  );
}

function BarraOcupacao({ titulo, usado, total }: { titulo: string; usado: number; total: number }) {
  const pct = Math.min(100, Math.round((usado / total) * 100));
  const cor = pct >= 100 ? 'bg-red-600' : pct >= 80 ? 'bg-orange-500' : 'bg-green-600';
  return (
    <Cartao>
      <div className="flex items-center justify-between">
        <span className="font-bold">{titulo}</span>
        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
          {usado}/{total} reservas · {usado * 2}/{total * 2} pessoas
        </span>
      </div>
      <div className="mt-2 h-4 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div className={`h-full rounded-full transition-all ${cor}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 text-right text-sm font-bold">{pct}%</div>
    </Cartao>
  );
}
