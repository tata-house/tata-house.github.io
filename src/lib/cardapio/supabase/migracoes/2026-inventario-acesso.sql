-- =====================================================================
-- TATÁ HOUSE — migração: inventário mensal + acesso por perfil
-- =====================================================================
-- Rode DEPOIS do schema.sql (uma vez), no SQL Editor do Supabase.
--
-- Observação: hoje o app já guarda inventário, PINs e tudo o mais na nuvem
-- pela tabela KV `tata_estado` (sincronização automática). Estas tabelas
-- relacionais são a base para a evolução futura (relatórios e auditoria por
-- usuário). Criá-las agora não muda o funcionamento atual.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Inventário mensal (cabeçalho + itens contados)
-- ---------------------------------------------------------------------
create table if not exists public.inventarios (
  id            uuid primary key default gen_random_uuid(),
  espaco        text not null default 'tata-house',
  mes           text not null,                 -- 'YYYY-MM'
  status        text not null default 'rascunho'
                  check (status in ('rascunho', 'finalizado')),
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  finalizado_em timestamptz,
  papel         text,
  unique (espaco, mes)
);

create table if not exists public.inventario_itens (
  id            bigint generated always as identity primary key,
  inventario_id uuid not null references public.inventarios (id) on delete cascade,
  item          text not null,                 -- normalizado
  nome          text not null,
  unid          text not null,
  esperado      numeric not null default 0,    -- saldo do estoque na contagem
  contado       numeric,                       -- null = ainda não contado
  obs           text
);
create index if not exists inventario_itens_inv_idx
  on public.inventario_itens (inventario_id);

-- ---------------------------------------------------------------------
-- Acesso por perfil (preparação para login individual / Supabase Auth)
-- ---------------------------------------------------------------------
create table if not exists public.perfis_acesso (
  id        text primary key,                  -- 'gerencia' | 'compras' | 'cozinha'
  rotulo    text not null,
  papel     text not null,                     -- mapeia para a matriz de permissões
  abas      text[] not null default '{}'       -- abas visíveis
);

insert into public.perfis_acesso (id, rotulo, papel, abas) values
  ('gerencia', 'Gerência', 'administrador',
     array['painel','cotacao','cardapio','simulador','compras','feedback']),
  ('compras', 'Compras', 'compras', array['cotacao','compras']),
  ('cozinha', 'Cozinha / Conferência', 'cozinha', array['cardapio','compras','feedback'])
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- RLS permissiva no protótipo (restrinja por auth.uid()/espaço em produção)
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['inventarios','inventario_itens','perfis_acesso'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_rw on public.%I;', t, t);
    execute format(
      'create policy %I_rw on public.%I for all using (true) with check (true);',
      t, t);
  end loop;
end $$;
