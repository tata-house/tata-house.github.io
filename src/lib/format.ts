export function brl(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function hora(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function dataHora(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Minutos inteiros decorridos desde um instante ISO (nunca negativo). */
export function minutosDesde(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
}

/** Formata minutos para leitura rápida: "47 min" ou "1h05". */
export function formataMin(min: number): string {
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}`;
}

/** Link wa.me a partir de um telefone BR em qualquer formato. */
export function linkWhatsApp(telefone: string): string {
  const d = telefone.replace(/\D/g, '');
  return `https://wa.me/${d.startsWith('55') ? d : `55${d}`}`;
}
