/* =====================================================================
   Memória operacional permanente — a "experiência" acumulada da casa.
   Substitui a média móvel simples por mediana sobre janela de amostras
   (robusta a outliers) com guarda de confiança: poucas observações puxam
   o fator de volta para 1, evitando que um único ajuste atípico distorça
   as próximas sugestões.

   Funções puras — sem localStorage, sem React. A persistência fica no
   estado.tsx; o dossiê e o assistente leem o resumo daqui.
   ===================================================================== */

/** Registro de aprendizado por item ou por dia da semana. */
export interface RegistroAprendizado {
  /** Fator efetivo já calculado (mediana das amostras). Mantido p/ compat. */
  f: number;
  /** Total de observações acumuladas (cresce sem teto — é a confiança). */
  n: number;
  /** Janela móvel das últimas razões observadas (para recalcular a mediana). */
  amostras?: number[];
}

/** Janela de amostras consideradas no cálculo da mediana. */
export const JANELA_AMOSTRAS = 12;

/** Limites do fator aplicado às sugestões — nunca distorce além disso. */
export const LIMITE_FATOR = { min: 0.5, max: 1.5 } as const;

/** Razões fora desta faixa são consideradas ruído e são aparadas. */
export const RAZAO_VALIDA = { min: 0.3, max: 3 } as const;

/** Observações necessárias para confiar 100% no fator aprendido. */
export const CONFIANCA_PLENA = 4;

export function mediana(arr: number[]): number {
  if (!arr.length) return 1;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/**
 * Incorpora uma nova razão observada (qtd real / sugerida) ao registro.
 * Apara outliers, mantém só a janela recente e recalcula a mediana.
 */
export function registrarRazao(
  reg: RegistroAprendizado | undefined,
  razao: number,
): RegistroAprendizado {
  const base: RegistroAprendizado = reg ?? { f: 1, n: 0, amostras: [] };
  if (!(razao > 0)) return base;
  const r = Math.min(RAZAO_VALIDA.max, Math.max(RAZAO_VALIDA.min, razao));
  const amostras = [...(base.amostras ?? []), r].slice(-JANELA_AMOSTRAS);
  return { f: mediana(amostras), n: base.n + 1, amostras };
}

/**
 * Incorpora um valor absoluto (ex.: contagem de refeições do dia) usando
 * mediana sobre a janela — robusto a um dia atípico.
 */
export function registrarValor(
  reg: RegistroAprendizado | undefined,
  valor: number,
): RegistroAprendizado {
  const base: RegistroAprendizado = reg ?? { f: valor, n: 0, amostras: [] };
  if (!(valor > 0)) return base;
  const amostras = [...(base.amostras ?? []), valor].slice(-JANELA_AMOSTRAS);
  return { f: mediana(amostras), n: base.n + 1, amostras };
}

/**
 * Fator efetivo pronto para multiplicar a sugestão. Combina a mediana
 * aprendida com a confiança (n): com poucas observações, o fator fica
 * perto de 1; só converge para o aprendido quando há histórico suficiente.
 */
export function fatorEfetivo(reg: RegistroAprendizado | undefined): number {
  if (!reg) return 1;
  const aprendido = reg.amostras?.length ? mediana(reg.amostras) : reg.f;
  const conf = Math.min(1, reg.n / CONFIANCA_PLENA);
  const ajustado = 1 + (aprendido - 1) * conf;
  return Math.min(LIMITE_FATOR.max, Math.max(LIMITE_FATOR.min, ajustado));
}

/** Valor absoluto efetivo (mediana da janela), sem mistura com 1. */
export function valorEfetivo(reg: RegistroAprendizado | undefined): number | null {
  if (!reg || !reg.n) return null;
  return reg.amostras?.length ? mediana(reg.amostras) : reg.f;
}

/* ------------------------------------------------------------------ */
/* Resumo para o dossiê / assistente                                   */
/* ------------------------------------------------------------------ */

export interface AjusteAprendido {
  norm: string;
  fator: number; // <1 = a casa sempre compra menos que a sugestão; >1 = mais
  n: number;
}

/**
 * Itens em que a operação consistentemente diverge da sugestão do motor.
 * `limiar` filtra ruído (ex.: 0.1 = só desvios de pelo menos ±10%).
 */
export function ajustesRelevantes(
  registros: Record<string, RegistroAprendizado>,
  limiar = 0.1,
  min = 3,
): AjusteAprendido[] {
  return Object.entries(registros)
    .map(([norm, r]) => ({ norm, fator: Math.round(fatorEfetivo(r) * 100) / 100, n: r.n }))
    .filter((a) => a.n >= min && Math.abs(a.fator - 1) >= limiar)
    .sort((a, b) => Math.abs(b.fator - 1) - Math.abs(a.fator - 1));
}
