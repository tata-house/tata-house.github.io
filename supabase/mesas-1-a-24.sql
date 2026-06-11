-- ================================================================
-- TATÁ SUSHI — LAYOUT OPERACIONAL: 24 MESAS SEQUENCIAIS (1 a 24)
-- ================================================================
-- COMO USAR: cole este arquivo INTEIRO no SQL Editor do Supabase e
-- execute (botão Run). É IDEMPOTENTE: pode rodar quantas vezes
-- quiser, não duplica mesas nem mexe nas reservas existentes.
--
-- O que ele faz:
--   1. Garante as mesas 1 a 24 — todas ativas, capacidade 2.
--   2. Desativa as numerações antigas (41-45, 51-55, 60, 62, 64,
--      65, 66, V1, V2) SEM apagar nada do banco.
--   3. Se algum casal ativo estiver numa mesa desativada, ele volta
--      para "aguardando mesa" (a hostess realoca pelo mapa).
--
-- As reservas oficiais usam mesas 1 a 17, então nenhuma é afetada.
-- ================================================================

-- 1. Mesas 1 a 24 — upsert (cria as que faltam, reativa/ajusta as
--    que existem). Posições em grade só por compatibilidade.
insert into public.tables (numero, area, capacidade, ativa, pos_x, pos_y)
select n::text, 'salao'::public.area_tipo, 2, true,
       ((n - 1) % 6) * 16 + 10,
       ((n - 1) / 6) * 22 + 12
from generate_series(1, 24) as n
on conflict (numero) do update set
  area = excluded.area,
  capacidade = 2,
  ativa = true,
  pos_x = excluded.pos_x,
  pos_y = excluded.pos_y;

-- 2. Numerações antigas saem do layout operacional (ficam inativas)
update public.tables
   set ativa = false,
       observacao = coalesce(observacao, '') || case
         when coalesce(observacao, '') like '%fora do layout%' then ''
         else ' [fora do layout operacional]'
       end
 where numero in ('41','42','43','44','45','51','52','53','54','55',
                  '60','62','64','65','66','V1','V2');

-- 3. Casais ativos que estavam em mesa desativada voltam para a fila
--    (quem estava sentado volta como "chegou", igual à troca no mapa)
update public.reservations r
   set table_id = null,
       status = case when r.status = 'sentado'
                     then 'chegou'::public.reserva_status
                     else r.status end
 where r.table_id in (
         select id from public.tables
         where numero in ('41','42','43','44','45','51','52','53','54','55',
                          '60','62','64','65','66','V1','V2')
       )
   and r.status in ('pre_reserva','pix_pendente','confirmada','chegou','sentado');

-- 4. Conferência — esperado: 24 ativas, 0 ativas fora de 1-24,
--    0 reservas ativas em mesa inativa.
select 'mesas ativas (deve ser 24)' as item, count(*)::text as valor
  from public.tables where ativa
union all
select 'mesas ativas fora de 1-24 (deve ser 0)', count(*)::text
  from public.tables
 where ativa and numero not in (select n::text from generate_series(1, 24) n)
union all
select 'reservas ativas em mesa inativa (deve ser 0)', count(*)::text
  from public.reservations r
  join public.tables t on t.id = r.table_id
 where not t.ativa
   and r.status in ('pre_reserva','pix_pendente','confirmada','chegou','sentado')
union all
select 'reservas ativas com mesa', count(*)::text
  from public.reservations
 where table_id is not null
   and status in ('pre_reserva','pix_pendente','confirmada','chegou','sentado');
