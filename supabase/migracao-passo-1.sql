-- ============================================================
-- TATA SUSHI — Migração operação (PASSO 1 de 2)
-- Execute este passo SOZINHO no SQL Editor e aguarde "Success".
-- Depois execute o migracao-passo-2.sql.
-- (O novo valor de enum precisa ser confirmado antes de ser usado,
--  por isso os dois passos não podem rodar juntos.)
-- ============================================================

alter type public.turno_tipo add value if not exists '22:00';
