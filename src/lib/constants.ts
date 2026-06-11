import type { Area, PixStatus, ReservaStatus, Role, Turno } from './types';

export const TURNOS: Turno[] = ['19:00', '21:00', '22:00'];

export const TURNO_LABEL: Record<Turno, string> = {
  '19:00': '19h',
  '21:00': '21h',
  '22:00': '22h',
};

export const AREA_LABEL: Record<Area, string> = {
  salao: 'Salão Principal',
  varanda: 'Varanda',
};

// Capacidade por turno, em RESERVAS de casal (2 pessoas cada)
export const CAPACIDADE_RESERVAS: Record<Area, number> = {
  salao: 24,
  varanda: 5, // mesas 60, 62, 64, 65, 66
};
export const CAPACIDADE_TOTAL_RESERVAS = 29; // 58 pessoas

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
  confirmada: 'Reservado',
  chegou: 'Chegou',
  sentado: 'Sentado',
  finalizada: 'Finalizado',
  cancelada: 'Cancelado',
  no_show: 'No-show',
};

export const STATUS_BADGE: Record<ReservaStatus, string> = {
  pre_reserva: 'bg-[#f6ecd8] text-[#8a6420] dark:bg-[#3d321a] dark:text-[#e3c987]',
  pix_pendente: 'bg-[#f6ecd8] text-[#8a6420] dark:bg-[#3d321a] dark:text-[#e3c987]',
  confirmada: 'bg-[#e3ebf3] text-[#3c5d80] dark:bg-[#22303d] dark:text-[#a6c2dc]',
  chegou: 'bg-[#f7e8d6] text-[#9a5f1d] dark:bg-[#3f2f1b] dark:text-[#e8bd84]',
  sentado: 'bg-[#f5e2df] text-[#8e3a31] dark:bg-[#3e2421] dark:text-[#e3a49c]',
  finalizada: 'bg-carvao-100 text-carvao-500 dark:bg-carvao-700 dark:text-carvao-200',
  cancelada: 'bg-carvao-100 text-carvao-400 line-through dark:bg-carvao-800 dark:text-carvao-400',
  no_show: 'bg-[#ece5f1] text-[#6d5388] dark:bg-[#322a3c] dark:text-[#c5b3d8]',
};

export const PIX_LABEL: Record<PixStatus, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  isento: 'Isento',
  cancelado: 'Cancelado',
};

export const PIX_BADGE: Record<PixStatus, string> = {
  pendente: 'bg-[#f6ecd8] text-[#8a6420] dark:bg-[#3d321a] dark:text-[#e3c987]',
  pago: 'bg-[#e0efe6] text-[#1e6b44] dark:bg-[#1c3528] dark:text-[#8fd4ae]',
  isento: 'bg-carvao-100 text-carvao-500 dark:bg-carvao-700 dark:text-carvao-200',
  cancelado: 'bg-carvao-100 text-carvao-400 dark:bg-carvao-800 dark:text-carvao-400',
};

export const ROLE_LABEL: Record<Role, string> = {
  gerente: 'Gerente',
  recepcao: 'Recepção',
  caixa: 'Caixa',
};

// Cores das mesas no mapa
export type MesaEstado = 'livre' | 'reservada' | 'chegou' | 'ocupada' | 'limpeza' | 'bloqueada';

// Paleta de mesa dessaturada e elegante — comunica o estado com classe.
// A primeira classe é sempre o bg (a legenda usa split(' ')[0]).
export const MESA_COR: Record<MesaEstado, string> = {
  livre: 'bg-[#34906a] hover:bg-[#2b7c5b] text-white',
  reservada: 'bg-[#48729e] hover:bg-[#3d628a] text-white',
  chegou: 'bg-[#d18a3a] hover:bg-[#bd7a2f] text-white',
  ocupada: 'bg-[#b04c41] hover:bg-[#9b4038] text-white',
  limpeza: 'bg-[#98948b] hover:bg-[#868275] text-white',
  bloqueada: 'bg-[#1b1d21] text-white/35',
};

// Cor de acento dos casais (barrinha do card da lista lateral)
export const CASAL_ACENTO = {
  aguardando: 'bg-[#d3a445]',
  definida: 'bg-[#48729e]',
  chegou: 'bg-[#d18a3a]',
  sentado: 'bg-[#b04c41]',
  finalizada: 'bg-carvao-300 dark:bg-carvao-500',
  encerrada: 'bg-carvao-200 dark:bg-carvao-600',
} as const;

export const MESA_ESTADO_LABEL: Record<MesaEstado, string> = {
  livre: 'Livre',
  reservada: 'Reservada',
  chegou: 'Chegou',
  ocupada: 'Sentado',
  limpeza: 'Liberada',
  bloqueada: 'Bloqueada',
};
