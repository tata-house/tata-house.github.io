-- ============================================================
-- TATA SUSHI — Migração operação (PASSO 2 de 2)
-- Execute DEPOIS do migracao-passo-1.sql.
-- 1) Reposiciona as mesas no mapa de chão único (salão + varanda)
-- 2) Fechar conta passa a liberar a mesa automaticamente
-- 3) Substitui as reservas pela planilha oficial do evento
-- ============================================================

-- ---------- 1. MESAS (posições % no mapa de chão único) ----------
-- Salão ocupa o topo (~0-65%), varanda a parte de baixo (~65-100%).
insert into public.tables (numero, area, capacidade, ativa, pos_x, pos_y, observacao) values
  -- Balcão do bar (topo) — apoio, bloqueadas para reserva
  ('41', 'salao', 2, false, 36, 5,  'Balcão do bar — apoio'),
  ('42', 'salao', 2, false, 44, 5,  'Balcão do bar — apoio'),
  ('43', 'salao', 2, false, 52, 5,  'Balcão do bar — apoio'),
  ('44', 'salao', 2, false, 60, 5,  'Balcão do bar — apoio'),
  ('45', 'salao', 2, false, 68, 5,  'Balcão do bar — apoio'),
  -- Coluna esquerda (sofá)
  ('24', 'salao', 2, true, 18, 14, 'Sofá esquerda'),
  ('21', 'salao', 2, true, 18, 21, 'Sofá esquerda'),
  ('20', 'salao', 2, true, 18, 27, 'Sofá esquerda'),
  -- Centro
  ('19', 'salao', 2, true, 45, 14, 'Centro'),
  ('17', 'salao', 2, true, 45, 21, 'Centro'),
  ('15', 'salao', 2, true, 45, 28, 'Centro'),
  ('13', 'salao', 2, true, 47, 40, 'Centro / barra fria'),
  ('12', 'salao', 2, true, 47, 50, 'Centro / barra fria'),
  -- Barra fria (sushi) — apoio, bloqueadas para reserva
  ('51', 'salao', 2, false, 31, 38, 'Barra fria — apoio'),
  ('52', 'salao', 2, false, 31, 43, 'Barra fria — apoio'),
  ('53', 'salao', 2, false, 31, 48, 'Barra fria — apoio'),
  ('54', 'salao', 2, false, 31, 53, 'Barra fria — apoio'),
  ('55', 'salao', 2, false, 31, 58, 'Barra fria — apoio'),
  -- Parede direita (sofá), do fundo para a entrada
  ('11', 'salao', 2, true, 76, 12, 'Sofá direita / fundo'),
  ('10', 'salao', 2, true, 76, 18, 'Sofá direita / fundo'),
  ('9',  'salao', 2, true, 76, 24, 'Sofá direita / fundo'),
  ('8',  'salao', 2, true, 76, 30, 'Sofá direita / fundo'),
  ('6',  'salao', 2, true, 76, 37, 'Sofá direita / entrada'),
  ('4',  'salao', 2, true, 76, 43, 'Sofá direita / entrada'),
  ('3',  'salao', 2, true, 76, 49, 'Sofá direita / entrada'),
  ('2',  'salao', 2, true, 76, 55, 'Sofá direita / entrada'),
  ('1',  'salao', 2, true, 76, 61, 'Sofá direita / entrada'),
  -- Varanda (área externa)
  ('60', 'varanda', 2, true, 64, 72, 'Área externa — sofá'),
  ('62', 'varanda', 2, true, 64, 81, 'Área externa — sofá'),
  ('64', 'varanda', 2, true, 64, 90, 'Área externa — sofá'),
  ('66', 'varanda', 2, true, 35, 75, 'Área externa'),
  ('65', 'varanda', 2, true, 32, 86, 'Área externa'),
  ('V1', 'varanda', 2, true, 12, 73, 'Lugar extra varanda'),
  ('V2', 'varanda', 2, true, 12, 88, 'Lugar extra varanda')
on conflict (numero) do update set
  area = excluded.area,
  capacidade = excluded.capacidade,
  ativa = excluded.ativa,
  pos_x = excluded.pos_x,
  pos_y = excluded.pos_y,
  observacao = excluded.observacao;

-- ---------- 2. FECHAR CONTA LIBERA A MESA ----------
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

-- Mesas de contas já finalizadas ficam liberadas
update public.reservations set mesa_liberada = true where status = 'finalizada';

-- ---------- 3. RESERVAS OFICIAIS DA PLANILHA ----------
-- Limpa as reservas atuais (e dependências) e insere a lista oficial.
delete from public.cash_closures;
delete from public.payments;
delete from public.reservation_events;
delete from public.reservations;

-- Turno 19h — todas Pix pago
insert into public.reservations (nome, turno, area_preferida, table_id, status, pix_status, observacao, origem)
select v.nome, '19:00'::public.turno_tipo, 'salao'::public.area_tipo, t.id,
       'confirmada'::public.reserva_status, v.pix::public.pix_status_tipo, v.obs, 'reserva'::public.origem_tipo
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

-- Turno 21h
insert into public.reservations (nome, turno, area_preferida, table_id, status, pix_status, observacao, origem)
select v.nome, '21:00'::public.turno_tipo, 'salao'::public.area_tipo, t.id,
       'confirmada'::public.reserva_status, v.pix::public.pix_status_tipo, v.obs, 'reserva'::public.origem_tipo
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

-- Turno 22h
insert into public.reservations (nome, turno, area_preferida, table_id, status, pix_status, observacao, origem)
select v.nome, '22:00'::public.turno_tipo, 'salao'::public.area_tipo, t.id,
       'confirmada'::public.reserva_status, v.pix::public.pix_status_tipo, v.obs, 'reserva'::public.origem_tipo
from (values
  ('Pedro Guerra e Amanda Guerra', '1', 'pago', null)
) as v(nome, mesa, pix, obs)
join public.tables t on t.numero = v.mesa;

-- Confere: deve retornar 13 / 12 / 1
select turno, count(*) from public.reservations group by turno order by turno;
