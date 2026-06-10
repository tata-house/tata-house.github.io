import { STATUS_ATIVOS, type MesaEstado } from './constants';
import type { Mesa, Reserva, Turno } from './types';

export interface EstadoDaMesa {
  estado: MesaEstado;
  reserva: Reserva | null;
}

/** Estado visual de uma mesa em um turno (cores do mapa). */
export function estadoMesa(mesa: Mesa, reservas: Reserva[], turno: Turno): EstadoDaMesa {
  if (!mesa.ativa) return { estado: 'bloqueada', reserva: null };

  const doTurno = reservas.filter((r) => r.table_id === mesa.id && r.turno === turno);

  const ativa = doTurno.find((r) => STATUS_ATIVOS.includes(r.status));
  if (ativa) {
    if (ativa.status === 'sentado') return { estado: 'ocupada', reserva: ativa };
    if (ativa.status === 'chegou') return { estado: 'chegou', reserva: ativa };
    return { estado: 'reservada', reserva: ativa };
  }

  const finalizadaSemLimpeza = doTurno.find((r) => r.status === 'finalizada' && !r.mesa_liberada);
  if (finalizadaSemLimpeza) return { estado: 'limpeza', reserva: finalizadaSemLimpeza };

  return { estado: 'livre', reserva: null };
}

/** Mesas livres (sem reserva ativa) para um turno; opcionalmente inclui uma mesa específica. */
export function mesasLivres(mesas: Mesa[], reservas: Reserva[], turno: Turno, incluirMesaId?: string | null): Mesa[] {
  return mesas.filter((m) => {
    if (m.id === incluirMesaId) return true;
    if (!m.ativa) return false;
    const { estado } = estadoMesa(m, reservas, turno);
    return estado === 'livre' || estado === 'limpeza';
  });
}
