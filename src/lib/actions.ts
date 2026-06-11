'use client';

import { STATUS_ATIVOS, TURNO_LABEL } from './constants';
import { getSupabase } from './supabase/client';
import type { Area, Mesa, PixStatus, Reserva, ReservaStatus, Turno } from './types';

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

/** Registro de uma movimentação de mesa, usado pelo botão "Desfazer". */
export interface MovimentoMesa {
  movida: { id: string; nome: string; tableIdAnterior: string | null };
  /** Casais que estavam na mesa destino e voltaram para "aguardando mesa". */
  retiradas: { id: string; nome: string; tableId: string; statusAnterior: ReservaStatus }[];
  paraTableId: string;
  paraMesaNumero: string;
}

/**
 * Move um casal para uma mesa, trocando se preciso: se a mesa destino já
 * tem outro casal ativo do MESMO turno, ele volta para "aguardando mesa"
 * (sem mesa) — nunca ficam dois casais na mesma mesa. Alguém de OUTRO
 * turno fisicamente na mesa (chegou/sentado) bloqueia o movimento.
 */
export async function moverMesaComTroca(reserva: Reserva, mesa: Mesa): Promise<MovimentoMesa> {
  exigirConexao();
  const supabase = getSupabase();

  // Relê os ocupantes direto do banco (o estado da tela pode estar defasado).
  const { data: ocupantes, error: erroLeitura } = await supabase
    .from('reservations')
    .select('id, nome, turno, status')
    .eq('table_id', mesa.id)
    .in('status', STATUS_ATIVOS)
    .neq('id', reserva.id);
  if (erroLeitura) throw new Error(traduzirErro(erroLeitura.message));

  const fisicamente = (ocupantes ?? []).find(
    (o) => o.turno !== reserva.turno && (o.status === 'sentado' || o.status === 'chegou'),
  );
  if (fisicamente) {
    throw new Error(
      `Mesa ${mesa.numero} está com ${fisicamente.nome} (${TURNO_LABEL[fisicamente.turno as Turno]}). Feche a conta ou mova esse casal antes.`,
    );
  }

  const retiradas: MovimentoMesa['retiradas'] = [];
  for (const o of (ocupantes ?? []).filter((o) => o.turno === reserva.turno)) {
    // Quem estava sentado volta como "chegou" (continua no restaurante, sem mesa).
    const novoStatus = o.status === 'sentado' ? 'chegou' : o.status;
    const { error } = await supabase
      .from('reservations')
      .update({ table_id: null, status: novoStatus })
      .eq('id', o.id)
      .eq('table_id', mesa.id);
    if (error) throw new Error(traduzirErro(error.message));
    retiradas.push({ id: o.id, nome: o.nome, tableId: mesa.id, statusAnterior: o.status as ReservaStatus });
    await registrarEvento(o.id, 'mesa_substituida', {
      mesa: mesa.numero,
      substituido_por: reserva.nome,
    });
  }

  const { error } = await supabase
    .from('reservations')
    .update({ table_id: mesa.id })
    .eq('id', reserva.id);
  if (error) {
    // Devolve quem foi retirado, para a mesa não ficar vazia por engano.
    for (const r of retiradas) {
      await supabase
        .from('reservations')
        .update({ table_id: r.tableId, status: r.statusAnterior })
        .eq('id', r.id);
    }
    throw new Error(traduzirErro(error.message));
  }

  return {
    movida: { id: reserva.id, nome: reserva.nome, tableIdAnterior: reserva.table_id ?? null },
    retiradas,
    paraTableId: mesa.id,
    paraMesaNumero: mesa.numero,
  };
}

/** Desfaz a última movimentação: devolve cada casal à mesa (ou fila) anterior. */
export async function desfazerMovimento(m: MovimentoMesa): Promise<void> {
  exigirConexao();
  const supabase = getSupabase();

  // 1) o casal movido sai da mesa destino e volta para onde estava
  const { error: erroMovida } = await supabase
    .from('reservations')
    .update({ table_id: m.movida.tableIdAnterior })
    .eq('id', m.movida.id);
  if (erroMovida) throw new Error(traduzirErro(erroMovida.message));

  // 2) quem tinha sido retirado da mesa destino volta para ela
  for (const r of m.retiradas) {
    const { error } = await supabase
      .from('reservations')
      .update({ table_id: r.tableId, status: r.statusAnterior })
      .eq('id', r.id);
    if (error) throw new Error(traduzirErro(error.message));
  }

  await registrarEvento(m.movida.id, 'movimento_desfeito', { mesa: m.paraMesaNumero });
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

/** Volta um passo no status (ex.: sentou por engano): sentado → chegou → reservado. */
export async function voltarStatus(reserva: Reserva): Promise<void> {
  exigirConexao();
  const supabase = getSupabase();
  const anterior: ReservaStatus | null =
    reserva.status === 'sentado' ? 'chegou' : reserva.status === 'chegou' ? 'confirmada' : null;
  if (!anterior) throw new Error('Este status não tem volta automática.');
  const { error } = await supabase
    .from('reservations')
    .update({ status: anterior })
    .eq('id', reserva.id);
  if (error) throw new Error(traduzirErro(error.message));
  await registrarEvento(reserva.id, 'status_voltado', { de: reserva.status, para: anterior });
}

/** Reativa uma reserva finalizada/cancelada/no-show: volta para a lista
 *  como "aguardando mesa" (sem mesa, para não conflitar com a ocupação atual). */
export async function reativarReserva(reserva: Reserva): Promise<void> {
  exigirConexao();
  const supabase = getSupabase();
  const dados: Record<string, unknown> = {
    status: 'confirmada',
    table_id: null,
    mesa_liberada: false,
  };
  if (reserva.pix_status === 'cancelado') dados.pix_status = 'pendente';
  const { error } = await supabase.from('reservations').update(dados).eq('id', reserva.id);
  if (error) throw new Error(traduzirErro(error.message));
  await registrarEvento(reserva.id, 'reativada', { status_anterior: reserva.status });
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
