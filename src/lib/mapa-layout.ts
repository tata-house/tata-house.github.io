// Layout OPERACIONAL do Dia dos Namorados: 24 mesas sequenciais (1 a 24),
// todas para 2 pessoas, exibidas em grade simples — sem numeração pulada
// e sem fidelidade à planta física. Foco: operação rápida no tablet.

export const MESAS_OPERACIONAIS: string[] = Array.from({ length: 24 }, (_, i) => String(i + 1));

// Numerações antigas (balcão, barra fria, varanda) que ficam FORA do layout
// operacional. Continuam no banco como inativas — nada é apagado.
export const MESAS_FORA_DO_LAYOUT = [
  '41', '42', '43', '44', '45',
  '51', '52', '53', '54', '55',
  '60', '62', '64', '65', '66',
  'V1', 'V2',
];
