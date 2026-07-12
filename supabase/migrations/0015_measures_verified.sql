-- 0015_measures_verified.sql
-- Отметка о сверке меры с официальным источником.
--
-- Вся база (2159 мер) вычитывается глазами по графику: 1-го числа — федеральные,
-- 2–27-го — по 3–4 региона в день. Чтобы понимать, что уже проверено и когда,
-- храним дату последней сверки и кто её сделал.

alter table public.measures
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by text;

-- Отбор «что давно не проверялось» — по этой колонке (nulls first).
create index if not exists measures_verified_at_idx on public.measures(verified_at);
