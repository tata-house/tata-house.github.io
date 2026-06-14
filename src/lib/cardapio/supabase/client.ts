'use client';

/* =====================================================================
   Cliente Supabase carregado sob demanda (lazy). O pacote
   @supabase/supabase-js é importado em RUNTIME por um especificador que o
   empacotador não consegue resolver em build — assim o `next build` /
   `npm ci` da Vercel não exigem a dependência enquanto o Supabase estiver
   desligado. Para ativar:

     npm install @supabase/supabase-js

   e defina as variáveis em config.ts. Sem isso, getSupabase() retorna null
   e o app segue em localStorage.
   ===================================================================== */

import { supabaseConfig, supabaseHabilitado } from './config';

/**
 * Tipo mínimo do que usamos — evita depender dos tipos do pacote em build.
 * O builder é encadeável e "awaitável" (PromiseLike), como o do supabase-js.
 */
export interface ConsultaSupabase extends PromiseLike<{ data: unknown; error: unknown }> {
  select(cols?: string): ConsultaSupabase;
  upsert(linhas: unknown, opc?: unknown): ConsultaSupabase;
  delete(): ConsultaSupabase;
  eq(col: string, val: unknown): ConsultaSupabase;
}

export interface ClienteSupabase {
  from(tabela: string): ConsultaSupabase;
  auth: unknown;
}

let cache: ClienteSupabase | null | undefined;

/**
 * Importa um módulo apenas em runtime, escondido do empacotador. Usamos a
 * forma indireta para que o webpack/Next não tente resolver o pacote em
 * tempo de build (ele não está instalado até o Supabase ser ligado).
 */
const importarRuntime: (nome: string) => Promise<Record<string, unknown>> =
  // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
  new Function('nome', 'return import(nome);') as (nome: string) => Promise<Record<string, unknown>>;

/** Devolve um cliente Supabase memoizado, ou null se desligado/indisponível. */
export async function getSupabase(): Promise<ClienteSupabase | null> {
  if (cache !== undefined) return cache;
  if (!supabaseHabilitado()) {
    cache = null;
    return null;
  }
  try {
    const mod = await importarRuntime('@supabase/supabase-js');
    const criar = mod.createClient as (
      url: string,
      key: string,
      opts?: unknown,
    ) => ClienteSupabase;
    const { url, anonKey } = supabaseConfig();
    cache = criar(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
    return cache;
  } catch (e) {
    console.warn('[supabase] pacote indisponível — seguindo em localStorage.', e);
    cache = null;
    return null;
  }
}

/** Limpa o cache do cliente (útil em testes / troca de credencial). */
export function resetSupabase() {
  cache = undefined;
}
