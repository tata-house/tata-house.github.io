/* =====================================================================
   Configuração do Supabase (camada opcional). Enquanto as variáveis de
   ambiente não estiverem definidas, o app continua 100% em localStorage —
   nada muda. Quando o Supabase for ligado, basta preencher:

     NEXT_PUBLIC_SUPABASE_URL
     NEXT_PUBLIC_SUPABASE_ANON_KEY
     NEXT_PUBLIC_TATA_ESPACO   (opcional — separa os dados por unidade)

   Esta camada é "desacoplada de propósito": o núcleo do app não importa
   o pacote @supabase/supabase-js diretamente, então a ausência dele não
   quebra o build da Vercel.
   ===================================================================== */

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

/** Lê a configuração do ambiente (vazia = Supabase desligado). */
export function supabaseConfig(): SupabaseConfig {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    anonKey:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      '',
  };
}

/** True quando há URL + chave anônima configuradas. */
export function supabaseHabilitado(): boolean {
  const { url, anonKey } = supabaseConfig();
  return Boolean(url && anonKey);
}

/** Espaço lógico dos dados (multi-unidade). Default: a casa toda. */
export const ESPACO_DADOS = process.env.NEXT_PUBLIC_TATA_ESPACO ?? 'tata-house';

/** Prefixo das chaves no localStorage — espelhado como `chave` no Supabase. */
export const PREFIXO_LOCAL = 'cardapio.v1.';
