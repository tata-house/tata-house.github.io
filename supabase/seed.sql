-- ============================================================
-- TATA SUSHI — Seed: mesas + reservas do Dia dos Namorados
-- Execute DEPOIS do schema.sql
-- ============================================================

-- ---------- MESAS ----------
-- Posições (pos_x/pos_y em %) seguem o Mapa de Chão do restaurante.
-- Salão Principal: balcão 41-45 no topo, coluna esquerda 24/21/20,
-- centro 19/17/15/13/12, barra fria 51-55, parede direita 11..1.
insert into public.tables (numero, area, capacidade, ativa, pos_x, pos_y, observacao) values
  -- Salão Principal — mesas reserváveis
  ('1',  'salao', 2, true, 78, 88, 'Parede direita / entrada'),
  ('2',  'salao', 2, true, 78, 80, 'Parede direita / entrada'),
  ('3',  'salao', 2, true, 78, 72, 'Parede direita / entrada'),
  ('4',  'salao', 2, true, 78, 63, 'Parede direita / entrada'),
  ('6',  'salao', 2, true, 78, 54, 'Parede direita / entrada'),
  ('8',  'salao', 2, true, 78, 43, 'Parede direita / fundo'),
  ('9',  'salao', 2, true, 78, 34, 'Parede direita / fundo'),
  ('10', 'salao', 2, true, 78, 25, 'Parede direita / fundo'),
  ('11', 'salao', 2, true, 78, 16, 'Parede direita / fundo'),
  ('12', 'salao', 2, true, 48, 77, 'Área sushi / barra fria'),
  ('13', 'salao', 2, true, 48, 63, 'Área sushi / barra fria'),
  ('15', 'salao', 2, true, 48, 46, 'Centro / esquerda'),
  ('17', 'salao', 2, true, 48, 33, 'Centro / esquerda'),
  ('19', 'salao', 2, true, 48, 20, 'Centro / esquerda'),
  ('20', 'salao', 2, true, 20, 41, 'Centro / esquerda'),
  ('21', 'salao', 2, true, 20, 32, 'Centro / esquerda'),
  ('24', 'salao', 2, true, 20, 18, 'Centro / esquerda'),
  -- Salão Principal — apoio/balcão (inativas para reserva por padrão)
  ('41', 'salao', 2, false, 38, 5,  'Balcão — apoio'),
  ('42', 'salao', 2, false, 46, 5,  'Balcão — apoio'),
  ('43', 'salao', 2, false, 54, 5,  'Balcão — apoio'),
  ('44', 'salao', 2, false, 62, 5,  'Balcão — apoio'),
  ('45', 'salao', 2, false, 70, 5,  'Balcão — apoio'),
  ('51', 'salao', 2, false, 32, 58, 'Barra fria — apoio'),
  ('52', 'salao', 2, false, 32, 64, 'Barra fria — apoio'),
  ('53', 'salao', 2, false, 32, 70, 'Barra fria — apoio'),
  ('54', 'salao', 2, false, 32, 76, 'Barra fria — apoio'),
  ('55', 'salao', 2, false, 32, 82, 'Barra fria — apoio'),
  -- Varanda
  ('60', 'varanda', 2, true, 75, 18, 'Área externa'),
  ('62', 'varanda', 2, true, 75, 45, 'Área externa'),
  ('64', 'varanda', 2, true, 75, 75, 'Área externa'),
  ('65', 'varanda', 2, true, 30, 68, 'Área externa'),
  ('66', 'varanda', 2, true, 35, 28, 'Área externa'),
  ('V1', 'varanda', 2, true, 10, 25, 'Lugar extra varanda'),
  ('V2', 'varanda', 2, true, 10, 70, 'Lugar extra varanda');

-- ---------- RESERVAS REAIS (planilha do evento) ----------
-- Turno 19:00 — Salão Principal
insert into public.reservations (nome, turno, area_preferida, table_id, status, pix_status, origem)
select v.nome, '19:00'::public.turno_tipo, 'salao'::public.area_tipo, t.id,
       'confirmada'::public.reserva_status, 'pendente'::public.pix_status_tipo, 'reserva'::public.origem_tipo
from (values
  ('Belle Gantus', '1'),
  ('Bruno Rodrigues e Sofia Bortolim', '2'),
  ('Débora e Rubens', '3'),
  ('João Pedro e Amanda Amorim', '4'),
  ('Julio Miglioli e Greice', '6'),
  ('Luis Felipe e Clara Gonçalves', '8'),
  ('Murilo Reis Toccheton', '9'),
  ('Theo Roman e Julia Brasil', '10'),
  ('Yasser Abed e João Arthur Stabille', '11')
) as v(nome, mesa)
join public.tables t on t.numero = v.mesa;

-- Turno 21:00 — Salão Principal
insert into public.reservations (nome, turno, area_preferida, table_id, status, pix_status, origem)
select v.nome, '21:00'::public.turno_tipo, 'salao'::public.area_tipo, t.id,
       'confirmada'::public.reserva_status, 'pendente'::public.pix_status_tipo, 'reserva'::public.origem_tipo
from (values
  ('Amanda Coan e Ándre Macedo', '1'),
  ('Arthur Maciel e Lara Barreira', '2'),
  ('Guilherme Kenji e Erika Pires', '3'),
  ('Heloísa e Jessica', '4'),
  ('Joice Batista e Eyla Monise', '6'),
  ('Luis Felipe e Giovanna Oliveira', '8'),
  ('Luthero e Giulia', '9'),
  ('Matheus Tucanduva e Nicoli Zilio', '10'),
  ('Paulo Eduardo e Ana Paula', '11'),
  ('Vanessa e Marcos', '12'),
  ('Victor e Larissa', '13')
) as v(nome, mesa)
join public.tables t on t.numero = v.mesa;

-- ---------- DADOS DE EXEMPLO (pode apagar antes do evento) ----------
-- Reserva com Pix pago, para testar o fluxo de crédito no caixa
insert into public.reservations (nome, telefone, turno, area_preferida, table_id, status, pix_status, observacao, origem)
select 'Casal Exemplo (teste)', '(11) 99999-0001', '19:00', 'varanda', t.id, 'confirmada', 'pago',
       'EXEMPLO — apagar antes do evento', 'reserva'
from public.tables t where t.numero = '60';

-- Passante de exemplo (sem crédito)
insert into public.reservations (nome, telefone, turno, table_id, status, pix_status, observacao, origem, pessoas)
select 'Passante Exemplo (teste)', null, '19:00', t.id, 'sentado', 'isento',
       'EXEMPLO — apagar antes do evento', 'passante', 2
from public.tables t where t.numero = '65';
