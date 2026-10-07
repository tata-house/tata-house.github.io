export function textoNumeroEstoque(valor: number): string {
  if (!Number.isFinite(valor)) return '';
  return String(valor).replace('.', ',');
}

/**
 * Saldo e mínimo aceitam zero, mas um campo temporariamente vazio durante
 * a digitação não pode virar uma gravação compartilhada.
 */
export function interpretarNumeroEstoque(texto: string): number | null {
  const normalizado = texto.trim().replace(',', '.');
  if (!normalizado) return null;
  const valor = Number(normalizado);
  return Number.isFinite(valor) && valor >= 0 ? valor : null;
}
