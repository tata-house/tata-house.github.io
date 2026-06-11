-- ================================================================
-- TATÁ SUSHI — FIX ÚNICO DA OPERAÇÃO (Dia dos Namorados)
-- ================================================================
-- COMO USAR: cole este arquivo INTEIRO no SQL Editor do Supabase
-- e execute UMA única vez (botão Run). Pode rodar de novo depois
-- sem problema: o script é IDEMPOTENTE (não duplica nada).
--
-- O que ele garante:
--   1. Tipos, tabelas, índices, funções, triggers — cria se faltar
--   2. Turnos 19:00, 21:00 e 22:00 no tipo turno_tipo
--   3. RLS liberado para o login único da equipe (authenticated)
--   4. Realtime habilitado em reservations e tables
--   5. As 34 mesas com posições do mapa de chão
--   6. As 26 reservas oficiais da planilha (13×19h, 12×21h, 1×22h)
--   7. Fechar conta no caixa libera a mesa automaticamente
--
-- ATENÇÃO: o passo 6 SUBSTITUI todas as reservas existentes pela
-- lista oficial (reservas criadas manualmente no app são apagadas).
-- ================================================================

-- ---------------------------------------------------------------
-- 1. TIPOS (cria apenas se não existirem)
-- ---------------------------------------------------------------
do $$
begin
  if to_regtype('public.app_role') is null then
    create type public.app_role as enum ('gerente', 'recepcao', 'caixa');
  end if;
  if to_regtype('public.area_tipo') is null then
    create type public.area_tipo as enum ('salao', 'varanda');
  end if;
  if to_regtype('public.reserva_status') is null then
    create type public.reserva_status as enum
      ('pre_reserva', 'pix_pendente', 'confirmada', 'chegou', 'sentado',
       'finalizada', 'cancelada', 'no_show');
  end if;
  if to_regtype('public.pix_status_tipo') is null then
    create type public.pix_status_tipo as enum ('pendente', 'pago', 'isento', 'cancelado');
  end if;
  if to_regtype('public.origem_tipo') is null then
    create type public.origem_tipo as enum ('reserva', 'passante');
  end if;
end $$;

-- turno_tipo precisa dos 3 turnos. "ALTER TYPE ... ADD VALUE" não pode
-- ser usado na mesma execução em que o valor novo é usado, então se o
-- tipo existir SEM o 22:00 ele é recriado (a coluna passa por text).
do $$
begin
  if to_regtype('public.turno_tipo') is null then
    create type public.turno_tipo as enum ('19:00', '21:00', '22:00');
  elsif not exists (
    select 1 from pg_enum
    where enumtypid = 'public.turno_tipo'::regtype and enumlabel = '22:00'
  ) then
    if to_regclass('public.reservations') is not null then
      alter table public.reservations alter column turno type text using turno::text;
    end if;
    drop type public.turno_tipo;
    create type public.turno_tipo as enum ('19:00', '21:00', '22:00');
    if to_regclass('public.reservations') is not null then
      alter table public.reservations
        alter column turno type public.turno_tipo using turno::public.turno_tipo;
    end if;
  end if;
end $$;

-- ---------------------------------------------------------------
-- 2. TABELAS (cria se não existirem; são as MESMAS que o app lê:
--    o frontend consulta exatamente "tables" e "reservations")
-- ---------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default '',
  role public.app_role not null default 'recepcao',
  criado_em timestamptz not null default now()
);

create table if not exists public.tables (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,          -- "1", "24", "V1"...
  area public.area_tipo not null,
  capacidade int not null default 2,
  ativa boolean not null default true,  -- false = bloqueada (apoio/balcão)
  pos_x numeric not null default 50,    -- posição % no mapa (0-100)
  pos_y numeric not null default 50,
  observacao text
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  nome text not null default 'Passante',
  telefone text,
  turno public.turno_tipo not null,
  area_preferida public.area_tipo,
  table_id uuid references public.tables (id),
  status public.reserva_status not null default 'confirmada',
  observacao text,
  pix_status public.pix_status_tipo not null default 'pendente',
  valor_pix numeric not null default 100,
  credito_disponivel numeric not null default 0,
  credito_aplicado boolean not null default false,
  credito_aplicado_por uuid references public.profiles (id),
  credito_aplicado_em timestamptz,
  origem public.origem_tipo not null default 'reserva',
  pessoas int not null default 2,
  mesa_liberada boolean not null default false,
  data_criacao timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.reservation_events (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations (id) on delete cascade,
  tipo text not null,
  detalhes jsonb not null default '{}'::jsonb,
  user_id uuid references public.profiles (id),
  criado_em timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations (id) on delete cascade,
  tipo text not null,
  valor numeric not null,
  metodo text,
  registrado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now()
);

create table if not exists public.cash_closures (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations (id),
  table_id uuid references public.tables (id),
  valor_conta numeric not null,
  credito_aplicado_valor numeric not null default 0,
  valor_pago numeric not null,
  fechado_por uuid references public.profiles (id),
  fechado_em timestamptz not null default now(),
  observacao text
);

-- Colunas que o app exige (caso a tabela exista de uma versão antiga)
alter table public.tables add column if not exists pos_x numeric not null default 50;
alter table public.tables add column if not exists pos_y numeric not null default 50;
alter table public.tables add column if not exists ativa boolean not null default true;
alter table public.tables add column if not exists observacao text;
alter table public.reservations add column if not exists mesa_liberada boolean not null default false;
alter table public.reservations add column if not exists credito_disponivel numeric not null default 0;
alter table public.reservations add column if not exists credito_aplicado boolean not null default false;
alter table public.reservations add column if not exists pessoas int not null default 2;
alter table public.reservations add column if not exists origem public.origem_tipo not null default 'reserva';
alter table public.reservations add column if not exists atualizado_em timestamptz not null default now();

-- ---------------------------------------------------------------
-- 3. ÍNDICES E REGRA CENTRAL
--    (uma mesa NÃO pode ter dois casais ativos no mesmo turno)
-- ---------------------------------------------------------------
create unique index if not exists uniq_mesa_turno_ativo
  on public.reservations (table_id, turno)
  where table_id is not null
    and status in ('pre_reserva', 'pix_pendente', 'confirmada', 'chegou', 'sentado');

create index if not exists idx_reservations_turno on public.reservations (turno, status);
create index if not exists idx_events_reservation on public.reservation_events (reservation_id, criado_em);

-- ---------------------------------------------------------------
-- 4. FUNÇÕES E TRIGGERS
-- ---------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nome, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'role')::public.app_role, 'recepcao')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Garante profile para usuários criados antes do trigger existir
insert into public.profiles (id, nome)
select u.id, split_part(u.email, '@', 1)
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

create or replace function public.touch_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists trg_reservations_touch on public.reservations;
create trigger trg_reservations_touch
  before update on public.reservations
  for each row execute function public.touch_atualizado_em();

-- Pix pago => crédito de R$100 disponível (somente reservas, nunca passantes)
create or replace function public.sync_credito_pix()
returns trigger language plpgsql as $$
begin
  if new.origem = 'passante' then
    new.credito_disponivel = 0;
    new.valor_pix = 0;
  elsif new.pix_status = 'pago' and not new.credito_aplicado then
    new.credito_disponivel = new.valor_pix;
  elsif new.pix_status <> 'pago' and not new.credito_aplicado then
    new.credito_disponivel = 0;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_reservations_credito on public.reservations;
create trigger trg_reservations_credito
  before insert or update on public.reservations
  for each row execute function public.sync_credito_pix();

-- Toda mudança de mesa fica registrada em histórico
create or replace function public.log_mesa_alterada()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.table_id is distinct from old.table_id then
    insert into public.reservation_events (reservation_id, tipo, detalhes, user_id)
    values (
      new.id,
      'mesa_alterada',
      jsonb_build_object(
        'mesa_anterior', (select numero from public.tables where id = old.table_id),
        'mesa_nova', (select numero from public.tables where id = new.table_id)
      ),
      auth.uid()
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_reservations_mesa on public.reservations;
create trigger trg_reservations_mesa
  after update on public.reservations
  for each row execute function public.log_mesa_alterada();

-- Aplicar crédito de R$100: atômico, só uma vez, só reserva com Pix pago
create or replace function public.aplicar_credito(p_reservation_id uuid)
returns public.reservations
language plpgsql security definer set search_path = public
as $$
declare
  r public.reservations;
begin
  select * into r from public.reservations where id = p_reservation_id for update;

  if not found then
    raise exception 'Reserva não encontrada.';
  end if;
  if r.origem = 'passante' then
    raise exception 'Passante não recebe crédito.';
  end if;
  if r.pix_status <> 'pago' then
    raise exception 'Só é possível aplicar crédito com Pix pago.';
  end if;
  if r.credito_aplicado then
    raise exception 'Crédito já foi aplicado para esta reserva.';
  end if;

  update public.reservations
     set credito_aplicado = true,
         credito_aplicado_por = auth.uid(),
         credito_aplicado_em = now()
   where id = p_reservation_id
   returning * into r;

  insert into public.payments (reservation_id, tipo, valor, metodo, registrado_por)
  values (p_reservation_id, 'credito_consumacao', r.credito_disponivel, 'credito', auth.uid());

  insert into public.reservation_events (reservation_id, tipo, detalhes, user_id)
  values (p_reservation_id, 'credito_aplicado', jsonb_build_object('valor', r.credito_disponivel), auth.uid());

  return r;
end;
$$;

-- Fechar conta no caixa: registra, finaliza E libera a mesa num passo só
create or replace function public.fechar_conta(
  p_reservation_id uuid,
  p_valor_conta numeric,
  p_observacao text default null
)
returns public.cash_closures
language plpgsql security definer set search_path = public
as $$
declare
  r public.reservations;
  c public.cash_closures;
  v_credito numeric := 0;
begin
  select * into r from public.reservations where id = p_reservation_id for update;

  if not found then
    raise exception 'Reserva não encontrada.';
  end if;
  if r.status in ('finalizada', 'cancelada', 'no_show') then
    raise exception 'Esta conta já foi encerrada.';
  end if;
  if p_valor_conta < 0 then
    raise exception 'Valor da conta inválido.';
  end if;

  if r.credito_aplicado then
    v_credito := least(r.credito_disponivel, p_valor_conta);
  end if;

  insert into public.cash_closures
    (reservation_id, table_id, valor_conta, credito_aplicado_valor, valor_pago, fechado_por, observacao)
  values
    (p_reservation_id, r.table_id, p_valor_conta, v_credito, p_valor_conta - v_credito, auth.uid(), p_observacao)
  returning * into c;

  insert into public.payments (reservation_id, tipo, valor, metodo, registrado_por)
  values (p_reservation_id, 'conta', p_valor_conta - v_credito, null, auth.uid());

  update public.reservations
     set status = 'finalizada',
         mesa_liberada = true
   where id = p_reservation_id;

  insert into public.reservation_events (reservation_id, tipo, detalhes, user_id)
  values (
    p_reservation_id, 'finalizada',
    jsonb_build_object('valor_conta', p_valor_conta, 'credito', v_credito, 'valor_pago', p_valor_conta - v_credito),
    auth.uid()
  );

  return c;
end;
$$;

-- ---------------------------------------------------------------
-- 5. RLS — login único da equipe: qualquer usuário autenticado
--    pode ler e escrever tudo (mesas, reservas, caixa, histórico)
-- ---------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.tables enable row level security;
alter table public.reservations enable row level security;
alter table public.reservation_events enable row level security;
alter table public.payments enable row level security;
alter table public.cash_closures enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select to authenticated using (true);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid());

drop policy if exists "tables_all" on public.tables;
create policy "tables_all" on public.tables for all to authenticated using (true) with check (true);
drop policy if exists "reservations_all" on public.reservations;
create policy "reservations_all" on public.reservations for all to authenticated using (true) with check (true);
drop policy if exists "events_select" on public.reservation_events;
create policy "events_select" on public.reservation_events for select to authenticated using (true);
drop policy if exists "events_insert" on public.reservation_events;
create policy "events_insert" on public.reservation_events for insert to authenticated with check (true);
drop policy if exists "payments_all" on public.payments;
create policy "payments_all" on public.payments for all to authenticated using (true) with check (true);
drop policy if exists "closures_all" on public.cash_closures;
create policy "closures_all" on public.cash_closures for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------
-- 6. REALTIME (mapa e caixa se atualizam sozinhos entre aparelhos)
-- ---------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reservations'
  ) then
    alter publication supabase_realtime add table public.reservations;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tables'
  ) then
    alter publication supabase_realtime add table public.tables;
  end if;
end $$;

-- ---------------------------------------------------------------
-- 7. MESAS (upsert — não duplica; corrige posição/área/status)
--    Salão reservável: 1,2,3,4,6,8,9,10,11,12,13,15,17,19,20,21,24
--    Apoio (bloqueadas): bar 41-45 e barra fria 51-55
--    Varanda: 60,62,64,65,66 + V1/V2 (extras internas — NÃO constam
--    no mapa de chão oficial, servem para completar a capacidade)
-- ---------------------------------------------------------------
insert into public.tables (numero, area, capacidade, ativa, pos_x, pos_y, observacao) values
  ('41', 'salao', 2, false, 36, 5,  'Balcão do bar — apoio'),
  ('42', 'salao', 2, false, 44, 5,  'Balcão do bar — apoio'),
  ('43', 'salao', 2, false, 52, 5,  'Balcão do bar — apoio'),
  ('44', 'salao', 2, false, 60, 5,  'Balcão do bar — apoio'),
  ('45', 'salao', 2, false, 68, 5,  'Balcão do bar — apoio'),
  ('24', 'salao', 2, true, 18, 14, 'Sofá esquerda'),
  ('21', 'salao', 2, true, 18, 21, 'Sofá esquerda'),
  ('20', 'salao', 2, true, 18, 27, 'Sofá esquerda'),
  ('19', 'salao', 2, true, 45, 14, 'Centro'),
  ('17', 'salao', 2, true, 45, 21, 'Centro'),
  ('15', 'salao', 2, true, 45, 28, 'Centro'),
  ('13', 'salao', 2, true, 47, 40, 'Centro / barra fria'),
  ('12', 'salao', 2, true, 47, 50, 'Centro / barra fria'),
  ('51', 'salao', 2, false, 31, 38, 'Barra fria — apoio'),
  ('52', 'salao', 2, false, 31, 43, 'Barra fria — apoio'),
  ('53', 'salao', 2, false, 31, 48, 'Barra fria — apoio'),
  ('54', 'salao', 2, false, 31, 53, 'Barra fria — apoio'),
  ('55', 'salao', 2, false, 31, 58, 'Barra fria — apoio'),
  ('11', 'salao', 2, true, 76, 12, 'Sofá direita / fundo'),
  ('10', 'salao', 2, true, 76, 18, 'Sofá direita / fundo'),
  ('9',  'salao', 2, true, 76, 24, 'Sofá direita / fundo'),
  ('8',  'salao', 2, true, 76, 30, 'Sofá direita / fundo'),
  ('6',  'salao', 2, true, 76, 37, 'Sofá direita / entrada'),
  ('4',  'salao', 2, true, 76, 43, 'Sofá direita / entrada'),
  ('3',  'salao', 2, true, 76, 49, 'Sofá direita / entrada'),
  ('2',  'salao', 2, true, 76, 55, 'Sofá direita / entrada'),
  ('1',  'salao', 2, true, 76, 61, 'Sofá direita / entrada'),
  ('60', 'varanda', 2, true, 64, 72, 'Área externa — sofá'),
  ('62', 'varanda', 2, true, 64, 81, 'Área externa — sofá'),
  ('64', 'varanda', 2, true, 64, 90, 'Área externa — sofá'),
  ('66', 'varanda', 2, true, 35, 75, 'Área externa'),
  ('65', 'varanda', 2, true, 32, 86, 'Área externa'),
  ('V1', 'varanda', 2, true, 12, 73, 'Extra interna — não consta no mapa de chão oficial'),
  ('V2', 'varanda', 2, true, 12, 88, 'Extra interna — não consta no mapa de chão oficial')
on conflict (numero) do update set
  area = excluded.area,
  capacidade = excluded.capacidade,
  ativa = excluded.ativa,
  pos_x = excluded.pos_x,
  pos_y = excluded.pos_y,
  observacao = excluded.observacao;

-- ---------------------------------------------------------------
-- 8. RESERVAS OFICIAIS DA PLANILHA (substitui tudo — sem duplicar)
--    Cada reserva = casal de 2 pessoas, já na mesa certa.
-- ---------------------------------------------------------------
delete from public.cash_closures;
delete from public.payments;
delete from public.reservation_events;
delete from public.reservations;

-- Turno 19h — 13 casais, todos Pix pago
insert into public.reservations (nome, turno, area_preferida, table_id, status, pix_status, observacao, origem, pessoas)
select v.nome, '19:00'::public.turno_tipo, 'salao'::public.area_tipo, t.id,
       'confirmada'::public.reserva_status, v.pix::public.pix_status_tipo, v.obs, 'reserva'::public.origem_tipo, 2
from (values
  ('Luthero e Giulia',                          '1',  'pago', null),
  ('Theo e Julia',                              '2',  'pago', null),
  ('Luiz Filipe Silva e Clara Gonçalves',       '3',  'pago', null),
  ('Belle Gantus',                              '4',  'pago', 'Sem número de telefone'),
  ('Yasser Abed e Joao Arthur Stabille',        '6',  'pago', null),
  ('Arthur Maciel e Lara Barreira',             '8',  'pago', null),
  ('Bruno Rodrigues e Sofia Bortolim',          '9',  'pago', null),
  ('Murilo Toccheton e Tatiana Mires',          '10', 'pago', null),
  ('Julio e Gleice',                            '11', 'pago', null),
  ('Débora e Rubens',                           '12', 'pago', null),
  ('Fabricio Ribeiro e Monique Lacerda',        '13', 'pago', null),
  ('Guilherme Ocampos e Suzi Tejada',           '15', 'pago', null),
  ('João Henrique e Gabriela',                  '17', 'pago', null)
) as v(nome, mesa, pix, obs)
join public.tables t on t.numero = v.mesa;

-- Turno 21h — 12 casais (Adriano Silva isento, reservado pelo Luizinho)
insert into public.reservations (nome, turno, area_preferida, table_id, status, pix_status, observacao, origem, pessoas)
select v.nome, '21:00'::public.turno_tipo, 'salao'::public.area_tipo, t.id,
       'confirmada'::public.reserva_status, v.pix::public.pix_status_tipo, v.obs, 'reserva'::public.origem_tipo, 2
from (values
  ('Adriano Silva',                                  '1',  'isento', 'Reservado pelo Luizinho'),
  ('Amanda Coan e André Macedo',                     '2',  'pago', null),
  ('Heloísa e Jessica',                              '3',  'pago', null),
  ('Victor e Larissa',                               '4',  'pago', null),
  ('Paulo Eduardo e Ana Paula',                      '6',  'pago', null),
  ('Guilherme Kenji e Erika Pires',                  '8',  'pago', null),
  ('João Pedro Oliveira e Amanda Amorim',            '9',  'pago', null),
  ('Luis Felipe Prado e Giovanna de Oliveira Pires', '10', 'pago', null),
  ('Vanessa e Marcos',                               '11', 'pago', null),
  ('Matheus Tucunduva e Nicoli Zilio',               '12', 'pago', null),
  ('Julia Rezende e Rodrigo Humberg',                '13', 'pago', null),
  ('Joice Batista de Oliveira e Eyla Monise',        '15', 'pago', null)
) as v(nome, mesa, pix, obs)
join public.tables t on t.numero = v.mesa;

-- Turno 22h — 1 casal
insert into public.reservations (nome, turno, area_preferida, table_id, status, pix_status, observacao, origem, pessoas)
select v.nome, '22:00'::public.turno_tipo, 'salao'::public.area_tipo, t.id,
       'confirmada'::public.reserva_status, v.pix::public.pix_status_tipo, v.obs, 'reserva'::public.origem_tipo, 2
from (values
  ('Pedro Guerra e Amanda Guerra', '1', 'pago', null)
) as v(nome, mesa, pix, obs)
join public.tables t on t.numero = v.mesa;

-- ---------------------------------------------------------------
-- 9. CONFERÊNCIA — o resultado desta query aparece na tela.
--    Esperado: 34 mesas (24 reserváveis) e 13 / 12 / 1 reservas.
-- ---------------------------------------------------------------
select 'mesas cadastradas'              as item, count(*)::text as valor from public.tables
union all
select 'mesas reserváveis (ativas)',           count(*)::text from public.tables where ativa
union all
select 'reservas 19h',                         count(*)::text from public.reservations where turno = '19:00'
union all
select 'reservas 21h',                         count(*)::text from public.reservations where turno = '21:00'
union all
select 'reservas 22h',                         count(*)::text from public.reservations where turno = '22:00'
union all
select 'reservas com mesa atribuída',          count(*)::text from public.reservations where table_id is not null
union all
select 'turnos no tipo turno_tipo',            string_agg(enumlabel, ', ' order by enumsortorder)
  from pg_enum where enumtypid = 'public.turno_tipo'::regtype;
