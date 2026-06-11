import { STATUS_ATIVOS, TURNOS, type MesaEstado } from './constants';
import type { Mesa, Reserva, Turno } from './types';

/** Turno do mapa: um horário específico ou a operação atual ("agora"). */
export type TurnoMapa = Turno | 'agora';

export interface EstadoDaMesa {
  estado: MesaEstado;
  reserva: Reserva | null;
}

/** Tempo que a mesa fica cinza ("liberada") após fechar a conta, antes de voltar a livre. */
export const LIBERADA_MS = 8000;

function finalizadaRecente(r: Reserva): boolean {
  return r.status === 'finalizada' && Date.now() - new Date(r.atualizado_em).getTime() < LIBERADA_MS;
}

/** Estado visual de uma mesa (cores do mapa) em um turno ou na operação atual. */
export function estadoMesa(mesa: Mesa, reservas: Reserva[], turno: TurnoMapa): EstadoDaMesa {
  if (!mesa.ativa) return { estado: 'bloqueada', reserva: null };

  const daMesa = reservas.filter(
    (r) => r.table_id === mesa.id && (turno === 'agora' || r.turno === turno),
  );

  // Sentado e chegou prevalecem (no modo "agora", de qualquer turno).
  const sentada = daMesa.find((r) => r.status === 'sentado');
  if (sentada) return { estado: 'ocupada', reserva: sentada };
  const chegada = daMesa.find((r) => r.status === 'chegou');
  if (chegada) return { estado: 'chegou', reserva: chegada };

  const ativas = daMesa.filter((r) => STATUS_ATIVOS.includes(r.status));
  if (ativas.length > 0) {
    const porTurno = [...ativas].sort((a, b) => TURNOS.indexOf(a.turno) - TURNOS.indexOf(b.turno));
    return { estado: 'reservada', reserva: porTurno[0] };
  }

  // Conta fechada: cinza por alguns segundos (ou até liberar manualmente), depois volta a livre.
  const liberada =
    daMesa.find(finalizadaRecente) ??
    daMesa.find((r) => r.status === 'finalizada' && !r.mesa_liberada);
  if (liberada) return { estado: 'limpeza', reserva: liberada };

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

/** Resultado de soltar um casal numa mesa:
 *  - 'livre': entra direto;
 *  - 'troca': a mesa tem outro casal ativo do MESMO turno — ele volta
 *    automaticamente para a lista como "aguardando mesa";
 *  - 'bloqueado': mesa inativa, é a mesa atual do casal, ou alguém de
 *    OUTRO turno já está fisicamente nela (chegou/sentado). */
export type Recebimento = 'livre' | 'troca' | 'bloqueado';

export function comoRecebe(mesa: Mesa, reservas: Reserva[], reserva: Reserva): Recebimento {
  if (!mesa.ativa || mesa.id === reserva.table_id) return 'bloqueado';
  const ocupantes = reservas.filter(
    (r) => r.table_id === mesa.id && r.id !== reserva.id && STATUS_ATIVOS.includes(r.status),
  );
  if (
    ocupantes.some(
      (r) => r.turno !== reserva.turno && (r.status === 'chegou' || r.status === 'sentado'),
    )
  ) {
    return 'bloqueado';
  }
  if (ocupantes.some((r) => r.turno === reserva.turno)) return 'troca';
  return 'livre';
}
