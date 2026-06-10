'use client';

import { getSupabase } from './supabase/client';
import type { Area, PixStatus, Reserva, ReservaStatus, Turno } from './types';

// Evita alterações offline: conflito de mesa só é validado no servidor.
function exigirConexao() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('Sem conexão com a internet. Alterações offline não são permitidas para evitar conflito de mesas.');
  }
}

async function registrarEvento(reservationId: string, tipo: string, detalhes: Record<string, unknown> = {}) {
  const supabase = getSupabase();
  const { data: auth } = await supabase.auth.getUser();
  await supabase.from('reservation_events').insert({
    reservation_id: reservationId,
    tipo,
    detalhes,
    user_id: auth.user?.id ?? null,
  });
}

function traduzirErro(message: string): string {
  if (message.includes('uniq_mesa_turno_ativo') || message.includes('duplicate key')) {
    return 'Conflito: esta mesa já está ocupada por outra reserva ativa neste turno.';
  }
  return message;
}

export interface NovaReserva {
  nome: string;
  telefone?: string | null;
  turno: Turno;
  area_preferida?: Area | null;
  table_id?: string | null;
  status?: ReservaStatus;
  observacao?: string | null;
  pix_status?: PixStatus;
  origem?: 'reserva' | 'passante';
  pessoas?: number;
}

export async function criarReserva(dados: NovaReserva): Promise<Reserva> {
  exigirConexao();
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('reservations')
    .insert({
      nome: dados.nome,
      telefone: dados.telefone ?? null,
      turno: dados.turno,
      area_preferida: dados.area_preferida ?? null,
      table_id: dados.table_id ?? null,
      status: dados.status ?? 'confirmada',
      observacao: dados.observacao ?? null,
      pix_status: dados.pix_status ?? (dados.origem === 'passante' ? 'isento' : 'pendente'),
      origem: dados.origem ?? 'reserva',
      pessoas: dados.pessoas ?? 2,
      valor_pix: dados.origem === 'passante' ? 0 : 100,
    })
    .select()
    .single();
  if (error) throw new Error(traduzirErro(error.message));
  await registrarEvento(data.id, dados.origem === 'passante' ? 'passante_criado' : 'criada', {
    turno: dados.turno,
  });
  return data as Reserva;
}

export async function editarReserva(id: string, dados: Partial<NovaReserva>): Promise<void> {
  exigirConexao();
  const supabase = getSupabase();
  const { error } = await supabase.from('reservations').update(dados).eq('id', id);
  if (error) throw new Error(traduzirErro(error.message));
  await registrarEvento(id, 'editada', dados as Record<string, unknown>);
}

export async function confirmarPix(id: string): Promise<void> {
  exigirConexao();
  const supabase = getSupabase();
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from('reservations').update({ pix_status: 'pago' }).eq('id', id);
  if (error) throw new Error(traduzirErro(error.message));
  await supabase.from('payments').insert({
    reservation_id: id,
    tipo: 'pix_sinal',
    valor: 100,
    metodo: 'pix',
    registrado_por: auth.user?.id ?? null,
  });
  await registrarEvento(id, 'pix_confirmado', { valor: 100 });
}

export async function marcarChegou(id: string): Promise<void> {
  exigirConexao();
  const supabase = getSupabase();
  const { error } = await supabase.from('reservations').update({ status: 'chegou' }).eq('id', id);
  if (error) throw new Error(traduzirErro(error.message));
  await registrarEvento(id, 'chegou');
}

export async function sentarCliente(id: string, tableId?: string): Promise<void> {
  exigirConexao();
  const supabase = getSupabase();
  const dados: Record<string, unknown> = { status: 'sentado' };
  if (tableId) dados.table_id = tableId;
  const { error } = await supabase.from('reservations').update(dados).eq('id', id);
  if (error) throw new Error(traduzirErro(error.message));
  await registrarEvento(id, 'sentada');
}

export async function moverMesa(id: string, novaTableId: string): Promise<void> {
  exigirConexao();
  const supabase = getSupabase();
  // O histórico da troca é registrado automaticamente por trigger no banco.
  const { error } = await supabase.from('reservations').update({ table_id: novaTableId }).eq('id', id);
  if (error) throw new Error(traduzirErro(error.message));
}

export async function cancelarReserva(id: string, motivo?: string): Promise<void> {
  exigirConexao();
  const supabase = getSupabase();
  const { error } = await supabase
    .from('reservations')
    .update({ status: 'cancelada', pix_status: 'cancelado' })
    .eq('id', id);
  if (error) throw new Error(traduzirErro(error.message));
  await registrarEvento(id, 'cancelada', motivo ? { motivo } : {});
}

export async function marcarNoShow(id: string): Promise<void> {
  exigirConexao();
  const supabase = getSupabase();
  const { error } = await supabase.from('reservations').update({ status: 'no_show' }).eq('id', id);
  if (error) throw new Error(traduzirErro(error.message));
  await registrarEvento(id, 'no_show');
}

export async function aplicarCredito(id: string): Promise<void> {
  exigirConexao();
  const supabase = getSupabase();
  const { error } = await supabase.rpc('aplicar_credito', { p_reservation_id: id });
  if (error) throw new Error(traduzirErro(error.message));
}

export async function fecharConta(id: string, valorConta: number, observacao?: string): Promise<void> {
  exigirConexao();
  const supabase = getSupabase();
  const { error } = await supabase.rpc('fechar_conta', {
    p_reservation_id: id,
    p_valor_conta: valorConta,
    p_observacao: observacao ?? null,
  });
  if (error) throw new Error(traduzirErro(error.message));
}

export async function liberarMesa(id: string): Promise<void> {
  exigirConexao();
  const supabase = getSupabase();
  const { error } = await supabase.from('reservations').update({ mesa_liberada: true }).eq('id', id);
  if (error) throw new Error(traduzirErro(error.message));
  await registrarEvento(id, 'mesa_liberada');
}
