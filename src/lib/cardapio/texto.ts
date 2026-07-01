/* =====================================================================
   Utilidades de texto puras e sem dependências — separadas do motor para
   que páginas leves (ex.: /avaliar via QR) possam normalizar nomes de prato
   sem arrastar todo o grafo de dados do app. O motor re-exporta daqui, então
   `normalizar`/`DIAS_SEMANA` continuam disponíveis de '@/lib/cardapio/motor'.
   ===================================================================== */

export const DIAS_SEMANA = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
] as const;

/** Normaliza um nome para chave estável (sem acento, minúsculo, espaços únicos).
   É a MESMA função usada pelo app inteiro — manter aqui evita divergência de
   chave entre o voto do cliente (/avaliar) e a leitura do gestor. */
export function normalizar(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/-/g, ' ')      // hífen = espaço: "couve-flor" == "couve flor"; remove "cenoura-"
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}
