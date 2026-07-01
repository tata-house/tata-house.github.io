-- =====================================================================
-- MIGRAÇÃO — Endurecimento de segurança (RLS / Row Level Security)
-- =====================================================================
-- Aplique UMA vez no SQL Editor do Supabase. É idempotente (pode rodar
-- de novo sem erro).
--
-- Contexto: o site é público e a "chave anônima" do Supabase fica embutida
-- nele — ou seja, qualquer pessoa que abra o site consegue extrair a chave.
-- No schema inicial, TODAS as tabelas ficavam liberadas para essa chave
-- (`using (true)`), inclusive a tabela `usuarios` (com e-mails). Como o app
-- só usa a tabela `tata_estado`, dá para trancar o resto sem quebrar nada.
--
-- O que muda:
--   1) tata_estado  → continua acessível (a sincronização passa por aqui),
--                     porém restrita ao espaço 'tata-house'.
--   2) As 12 tabelas relacionais de referência → só quem estiver AUTENTICADO
--      acessa. A chave anônima pública deixa de alcançá-las. O app não usa
--      essas tabelas, então nada quebra e a superfície de ataque cai muito.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) tata_estado — mantém a sincronização, mas escopada ao espaço
-- ---------------------------------------------------------------------
alter table public.tata_estado enable row level security;
drop policy if exists tata_estado_rw on public.tata_estado;
create policy tata_estado_rw on public.tata_estado
  for all
  using (espaco = 'tata-house')
  with check (espaco = 'tata-house');

-- ---------------------------------------------------------------------
-- 2) Tabelas de referência (não usadas pelo app) — trancar p/ anônimo
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'empresas','unidades','usuarios','semanas','precos','estimativas',
    'historico_precos','estoque','aceitacao','eventos','desperdicio','auditoria'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    -- remove a política permissiva antiga (liberava a chave anônima)
    execute format('drop policy if exists %I_rw on public.%I;', t, t);
    execute format('drop policy if exists %I_auth on public.%I;', t, t);
    -- nova política: apenas o papel "authenticated" enxerga/grava
    execute format(
      'create policy %I_auth on public.%I for all to authenticated using (true) with check (true);',
      t, t);
  end loop;
end $$;

-- =====================================================================
-- OPCIONAL (proteção máxima) — exigir login TAMBÉM no tata_estado.
-- ⚠️ SÓ habilite se você adicionar autenticação Supabase no app. Sem isso,
-- a chave anônima deixa de gravar e a SINCRONIZAÇÃO PARA. Deixe comentado
-- até ter o login pronto.
-- ---------------------------------------------------------------------
-- drop policy if exists tata_estado_rw on public.tata_estado;
-- create policy tata_estado_rw on public.tata_estado
--   for all to authenticated
--   using (espaco = 'tata-house') with check (espaco = 'tata-house');
-- =====================================================================
