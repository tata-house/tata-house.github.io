-- =====================================================================
-- MIGRAÇÃO — Sincronização ao vivo entre dispositivos (Supabase Realtime)
-- =====================================================================
-- Aplique UMA vez no SQL Editor do Supabase se o projeto já foi criado
-- com uma versão anterior do schema.sql (que não publicava tata_estado
-- no Realtime).
--
-- Sintoma que isto corrige: o cardápio montado no celular NÃO aparecia
-- no computador ao vivo. O app espelhava as gravações para a nuvem, mas
-- a assinatura de tempo real dos outros aparelhos nunca recebia o evento
-- porque a tabela não estava na publicação `supabase_realtime`.
--
-- Idempotente: pode rodar mais de uma vez sem erro.
-- =====================================================================

-- Filtros por `espaco` nas assinaturas de UPDATE precisam da linha antiga
-- completa no WAL — por isso REPLICA IDENTITY FULL.
alter table public.tata_estado replica identity full;

-- Publica INSERT/UPDATE/DELETE de tata_estado no canal de tempo real.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'tata_estado'
  ) then
    execute 'alter publication supabase_realtime add table public.tata_estado';
  end if;
end $$;
