-- =====================================================================
-- TATÁ HOUSE — schema Supabase
-- =====================================================================
-- Rode este arquivo no SQL Editor do Supabase (uma vez). Ele cria:
--   1) tata_estado     — tabela chave/valor que espelha o localStorage
--                        (caminho de migração imediato, de menor risco).
--   2) tabelas relacionais de referência (semanas, precos, ...) para a
--      evolução futura, quando o app passar a ler/gravar normalizado.
--
-- Segurança: as políticas abaixo liberam acesso amplo para facilitar o
-- protótipo. ANTES de produção, troque por políticas baseadas em
-- auth.uid()/espaço e remova o acesso anônimo de escrita.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) KV — espelho fiel do estado do app
-- ---------------------------------------------------------------------
create table if not exists public.tata_estado (
  espaco        text        not null default 'tata-house',
  chave         text        not null,
  valor         jsonb       not null,
  atualizado_em timestamptz not null default now(),
  primary key (espaco, chave)
);

create index if not exists tata_estado_espaco_idx on public.tata_estado (espaco);

alter table public.tata_estado enable row level security;

-- Protótipo: acesso por chave anônima. Restrinja por espaço/usuário depois.
drop policy if exists tata_estado_rw on public.tata_estado;
create policy tata_estado_rw on public.tata_estado
  for all using (true) with check (true);

-- Realtime: SEM isto, o app espelha para a nuvem mas os OUTROS aparelhos
-- nunca recebem a mudança ao vivo (a assinatura postgres_changes fica muda).
-- É o que faz o cardápio feito no celular aparecer na hora no computador.
--   • replica identity full → os filtros por `espaco` funcionam em UPDATE.
--   • add table …           → publica INSERT/UPDATE/DELETE de tata_estado.
alter table public.tata_estado replica identity full;
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

-- ---------------------------------------------------------------------
-- 2) Modelo relacional de referência (evolução futura)
--    Mantido alinhado aos tipos de src/lib/cardapio/tipos.ts
-- ---------------------------------------------------------------------

-- Organização / multi-unidade
create table if not exists public.empresas (
  id        uuid primary key default gen_random_uuid(),
  nome      text not null,
  criada_em timestamptz not null default now()
);

create table if not exists public.unidades (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.empresas (id) on delete cascade,
  nome       text not null
);

create table if not exists public.usuarios (
  id         uuid primary key default gen_random_uuid(),
  unidade_id uuid references public.unidades (id) on delete set null,
  nome       text not null,
  email      text unique not null,
  papel      text not null check (papel in
              ('gestor','cozinha','compras','recebimento','administrador'))
);

-- Semana de cardápio (estado completo guardado como jsonb por simplicidade)
create table if not exists public.semanas (
  id            text not null,                -- ex.: '2026-S24'
  espaco        text not null default 'tata-house',
  estado        jsonb not null,               -- EstadoSemana
  etapa         text,
  atualizado_em timestamptz not null default now(),
  primary key (espaco, id)
);

-- Preços reais (cotação/nota) por item normalizado
create table if not exists public.precos (
  espaco        text not null default 'tata-house',
  item          text not null,                -- normalizado
  valor         numeric not null check (valor >= 0),
  fornecedor    text,
  atualizado_em timestamptz not null default now(),
  primary key (espaco, item)
);

-- Estimativas de mercado (separadas do preço real)
create table if not exists public.estimativas (
  espaco text not null default 'tata-house',
  item   text not null,
  valor  numeric not null check (valor >= 0),
  primary key (espaco, item)
);

-- Histórico de preços (série temporal por item)
create table if not exists public.historico_precos (
  id     bigint generated always as identity primary key,
  espaco text not null default 'tata-house',
  item   text not null,
  valor  numeric not null check (valor >= 0),
  em     timestamptz not null default now()
);
create index if not exists historico_precos_item_idx
  on public.historico_precos (espaco, item, em);

-- Estoque
create table if not exists public.estoque (
  espaco        text not null default 'tata-house',
  item          text not null,                -- normalizado
  nome          text not null,
  unid          text not null,
  qtd           numeric not null default 0,
  minimo        numeric not null default 0,
  atualizado_em timestamptz not null default now(),
  primary key (espaco, item)
);

-- Aceitação dos pratos
create table if not exists public.aceitacao (
  espaco        text not null default 'tata-house',
  prato         text not null,                -- normalizado
  nome          text not null,
  bom           int not null default 0,
  ok            int not null default 0,
  ruim          int not null default 0,
  soma_notas    numeric not null default 0,
  n             int not null default 0,
  atualizado_em timestamptz not null default now(),
  primary key (espaco, prato)
);

-- Eventos de demanda
create table if not exists public.eventos (
  id     uuid primary key default gen_random_uuid(),
  espaco text not null default 'tata-house',
  data   date not null,
  rotulo text not null,
  fator  numeric not null default 1
);

-- Desperdício
create table if not exists public.desperdicio (
  id        uuid primary key default gen_random_uuid(),
  espaco    text not null default 'tata-house',
  semana_id text not null,
  dia       int not null,
  prato     text not null,
  produzido numeric not null default 0,
  consumido numeric not null default 0,
  unid      text not null default 'porções',
  motivo    text,
  em        timestamptz not null default now()
);

-- Auditoria
create table if not exists public.auditoria (
  id     bigint generated always as identity primary key,
  espaco text not null default 'tata-house',
  em     timestamptz not null default now(),
  papel  text not null,
  acao   text not null,
  alvo   text not null,
  de     text,
  para   text,
  semana text
);

-- RLS permissiva no protótipo para todas as tabelas relacionais.
do $$
declare t text;
begin
  foreach t in array array[
    'empresas','unidades','usuarios','semanas','precos','estimativas',
    'historico_precos','estoque','aceitacao','eventos','desperdicio','auditoria'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_rw on public.%I;', t, t);
    execute format(
      'create policy %I_rw on public.%I for all using (true) with check (true);',
      t, t);
  end loop;
end $$;
