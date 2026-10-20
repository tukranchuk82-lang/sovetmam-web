-- 0042_measure_status.sql
-- Ответы людей «что с этой мерой»: пользуюсь / не подавал(а) / отказали.
--
-- Зачем. Аналитике нужно понимать не только что мы подобрали и что человек
-- посмотрел, но и дошло ли дело до оформления: сколько людей реально получает
-- меру, сколько так и не подали, а где отказывают (там и надо уточнять условия
-- в каталоге). Ответ даёт сам человек рядом с мерой в своей подборке.
--
-- Один человек — один ответ по мере (можно поменять или снять).
-- measure_slug без внешнего ключа: ответ остаётся, даже если меру позже снимут.
-- region — регион из анкеты на момент ответа, чтобы считать по регионам.

create table if not exists public.measure_status (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.app_users(id) on delete cascade,
  measure_slug text not null,
  status       text not null check (status in ('using', 'not_applied', 'refused')),
  region       text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, measure_slug)
);

create index if not exists measure_status_slug_idx on public.measure_status (measure_slug, status);
create index if not exists measure_status_updated_idx on public.measure_status (updated_at desc);

alter table public.measure_status enable row level security;
