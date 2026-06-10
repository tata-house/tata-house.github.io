export type Role = 'gerente' | 'recepcao' | 'caixa';
export type Area = 'salao' | 'varanda';
export type Turno = '19:00' | '21:00';
export type ReservaStatus =
  | 'pre_reserva'
  | 'pix_pendente'
  | 'confirmada'
  | 'chegou'
  | 'sentado'
  | 'finalizada'
  | 'cancelada'
  | 'no_show';
export type PixStatus = 'pendente' | 'pago' | 'isento' | 'cancelado';
export type Origem = 'reserva' | 'passante';

export interface Profile {
  id: string;
  nome: string;
  role: Role;
}

export interface Mesa {
  id: string;
  numero: string;
  area: Area;
  capacidade: number;
  ativa: boolean;
  pos_x: number;
  pos_y: number;
  observacao: string | null;
}

export interface Reserva {
  id: string;
  nome: string;
  telefone: string | null;
  turno: Turno;
  area_preferida: Area | null;
  table_id: string | null;
  status: ReservaStatus;
  observacao: string | null;
  pix_status: PixStatus;
  valor_pix: number;
  credito_disponivel: number;
  credito_aplicado: boolean;
  credito_aplicado_por: string | null;
  credito_aplicado_em: string | null;
  origem: Origem;
  pessoas: number;
  mesa_liberada: boolean;
  data_criacao: string;
  atualizado_em: string;
  mesa?: Mesa | null;
}

export interface ReservaEvento {
  id: string;
  reservation_id: string;
  tipo: string;
  detalhes: Record<string, unknown>;
  user_id: string | null;
  criado_em: string;
}

export interface CashClosure {
  id: string;
  reservation_id: string;
  table_id: string | null;
  valor_conta: number;
  credito_aplicado_valor: number;
  valor_pago: number;
  fechado_por: string | null;
  fechado_em: string;
  observacao: string | null;
}
