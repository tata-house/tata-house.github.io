import type { Area, PixStatus, ReservaStatus, Role, Turno } from './types';

export const TURNOS: Turno[] = ['19:00', '21:00'];

export const AREA_LABEL: Record<Area, string> = {
  salao: 'Salão Principal',
  varanda: 'Varanda',
};

// Capacidade por turno, em RESERVAS de casal (2 pessoas cada)
export const CAPACIDADE_RESERVAS: Record<Area, number> = {
  salao: 24,
  varanda: 7,
};
export const CAPACIDADE_TOTAL_RESERVAS = 31; // 62 pessoas

export const STATUS_ATIVOS: ReservaStatus[] = [
  'pre_reserva',
  'pix_pendente',
  'confirmada',
  'chegou',
  'sentado',
];

export const STATUS_LABEL: Record<ReservaStatus, string> = {
  pre_reserva: 'Pré-reserva',
  pix_pendente: 'Pix pendente',
  confirmada: 'Confirmada',
  chegou: 'Chegou',
  sentado: 'Sentado',
  finalizada: 'Finalizada',
  cancelada: 'Cancelada',
  no_show: 'No-show',
};

export const STATUS_BADGE: Record<ReservaStatus, string> = {
  pre_reserva: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
  pix_pendente: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
  confirmada: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
  chegou: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200',
  sentado: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
  finalizada: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  cancelada: 'bg-gray-200 text-gray-500 line-through dark:bg-gray-800 dark:text-gray-400',
  no_show: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200',
};

export const PIX_LABEL: Record<PixStatus, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  isento: 'Isento',
  cancelado: 'Cancelado',
};

export const PIX_BADGE: Record<PixStatus, string> = {
  pendente: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
  pago: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
  isento: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  cancelado: 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

export const ROLE_LABEL: Record<Role, string> = {
  gerente: 'Gerente',
  recepcao: 'Recepção',
  caixa: 'Caixa',
};

// Cores das mesas no mapa
export type MesaEstado = 'livre' | 'reservada' | 'chegou' | 'ocupada' | 'limpeza' | 'bloqueada';

export const MESA_COR: Record<MesaEstado, string> = {
  livre: 'bg-green-500 hover:bg-green-600 text-white',
  reservada: 'bg-blue-500 hover:bg-blue-600 text-white',
  chegou: 'bg-orange-500 hover:bg-orange-600 text-white',
  ocupada: 'bg-red-600 hover:bg-red-700 text-white',
  limpeza: 'bg-gray-400 hover:bg-gray-500 text-white',
  bloqueada: 'bg-gray-900 text-gray-400 dark:bg-black',
};

export const MESA_ESTADO_LABEL: Record<MesaEstado, string> = {
  livre: 'Livre',
  reservada: 'Reservada',
  chegou: 'Chegou',
  ocupada: 'Ocupada',
  limpeza: 'Limpeza / finalizada',
  bloqueada: 'Bloqueada',
};
