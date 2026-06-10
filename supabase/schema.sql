-- ============================================================
-- TATA SUSHI — Reservas Dia dos Namorados
-- Schema do banco (Supabase Postgres)
-- Execute este arquivo no SQL Editor do Supabase ANTES do seed.sql
-- ============================================================

-- ---------- TIPOS ----------
create type public.app_role as enum ('gerente', 'recepcao', 'caixa');
create type public.area_tipo as enum ('salao', 'varanda');
create type public.turno_tipo as enum ('19:00', '21:00', '22:00');
create type public.reserva_status as enum (
  'pre_reserva',   -- ativo
  'pix_pendente',  -- ativo
  'confirmada',    -- ativo
  'chegou',        -- ativo
  'sentado',       -- ativo
  'finalizada',
  'cancelada',
  'no_show'
);
create type public.pix_status_tipo as enum ('pendente', 'pago', 'isento', 'cancelado');
create type public.origem_tipo as enum ('reserva', 'passante');

-- ---------- PROFILES (usuários) ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default '',
  role public.app_role not null default 'recepcao',
  criado_em timestamptz not null default now()
);

-- Cria profile automaticamente quando um usuário é criado no Supabase Auth.
-- O role pode vir no metadata do convite: {"role": "gerente", "nome": "Fulano"}
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
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- MESAS ----------
create table public.tables (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,          -- "1", "24", "V1"...
  area public.area_tipo not null,
  capacidade int not null default 2,
  ativa boolean not null default true,  -- false = bloqueada para reserva (apoio/balcão)
  pos_x numeric not null default 50,    -- posição % no mapa da área (0-100)
  pos_y numeric not null default 50,
  observacao text
);

-- ---------- RESERVAS ----------
create table public.reservations (
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
  credito_disponivel numeric not null default 0, -- vira 100 quando Pix pago
  credito_aplicado boolean not null default false,
  credito_aplicado_por uuid references public.profiles (id),
  credito_aplicado_em timestamptz,
  origem public.origem_tipo not null default 'reserva',
  pessoas int not null default 2,
  mesa_liberada boolean not null default false, -- mesa liberada após finalizar (limpeza concluída)
  data_criacao timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- REGRA CENTRAL: uma mesa não pode ter duas reservas ATIVAS no mesmo turno.
-- Status ativos: pre_reserva, pix_pendente, confirmada, chegou, sentado.
create unique index uniq_mesa_turno_ativo
  on public.reservations (table_id, turno)
  where table_id is not null
    and status in ('pre_reserva', 'pix_pendente', 'confirmada', 'chegou', 'sentado');

create index idx_reservations_turno on public.reservations (turno, status);

-- ---------- HISTÓRICO DE EVENTOS ----------
create table public.reservation_events (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations (id) on delete cascade,
  tipo text not null,            -- criada, editada, pix_confirmado, chegou, sentada, mesa_alterada, cancelada, no_show, credito_aplicado, finalizada, mesa_liberada...
  detalhes jsonb not null default '{}'::jsonb,
  user_id uuid references public.profiles (id),
  criado_em timestamptz not null default now()
);

create index idx_events_reservation on public.reservation_events (reservation_id, criado_em);

-- ---------- PAGAMENTOS ----------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations (id) on delete cascade,
  tipo text not null,            -- 'pix_sinal' | 'credito_consumacao' | 'conta'
  valor numeric not null,
  metodo text,                   -- 'pix', 'cartao', 'dinheiro'...
  registrado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now()
);

-- ---------- FECHAMENTOS DE CAIXA ----------
create table public.cash_closures (
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

-- ---------- TRIGGERS ----------

-- atualizado_em automático
create or replace function public.touch_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

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

create trigger trg_reservations_credito
  before insert or update on public.reservations
  for each row execute function public.sync_credito_pix();

-- Toda mudança de mesa fica registrada em histórico (garantido no banco)
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

create trigger trg_reservations_mesa
  after update on public.reservations
  for each row execute function public.log_mesa_alterada();

-- ---------- FUNÇÕES DE NEGÓCIO (RPC) ----------

-- Aplicar crédito de R$100: atômico, só uma vez, só reserva com Pix pago.
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

-- Fechar conta no caixa: registra fechamento e finaliza a reserva.
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

  -- Finaliza E libera a mesa num passo só (mesa volta a livre para a hostess)
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

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.tables enable row level security;
alter table public.reservations enable row level security;
alter table public.reservation_events enable row level security;
alter table public.payments enable row level security;
alter table public.cash_closures enable row level security;

-- App interno de operação: qualquer usuário autenticado da equipe pode ler e escrever.
create policy "profiles_select" on public.profiles for select to authenticated using (true);
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid());

create policy "tables_all" on public.tables for all to authenticated using (true) with check (true);
create policy "reservations_all" on public.reservations for all to authenticated using (true) with check (true);
create policy "events_select" on public.reservation_events for select to authenticated using (true);
create policy "events_insert" on public.reservation_events for insert to authenticated with check (true);
create policy "payments_all" on public.payments for all to authenticated using (true) with check (true);
create policy "closures_all" on public.cash_closures for all to authenticated using (true) with check (true);

-- ---------- REALTIME ----------
alter publication supabase_realtime add table public.reservations;
alter publication supabase_realtime add table public.tables;
