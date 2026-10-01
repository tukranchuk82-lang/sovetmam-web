-- 0034_measure_views.sql
-- Просмотры мер: какие карточки в каталоге люди открывают.
--
-- Зачем. В админке нужно видеть не только, сколько людей приходит, но и что
-- именно их интересует. Сохранения в избранное (saved_measures) показывают
-- лишь тех, кто решил сохранить; просмотры — весь интерес.
--
-- Отдельная таблица, а не ещё один вид события в share_events: просмотров
-- на порядок больше, и складывать их вместе с редкими «поделились» значило бы
-- замедлить уже работающие отчёты.
--
-- Персональных данных нет. visitor — случайный номер из cookie (тот же, что у
-- share_events), user_id — только если человек вошёл. IP и точное
-- местоположение не храним.

create table if not exists public.measure_views (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null,
  visitor    text,
  user_id    uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists measure_views_slug_created_idx
  on public.measure_views (slug, created_at desc);

create index if not exists measure_views_created_idx
  on public.measure_views (created_at desc);

-- Один человек (устройство) — один просмотр меры за сутки: поиск повтора идёт
-- по этому индексу.
create index if not exists measure_views_visitor_slug_idx
  on public.measure_views (visitor, slug, created_at desc);

alter table public.measure_views enable row level security;

comment on table public.measure_views is
  'Просмотры карточек мер: анонимный visitor из cookie, без IP. Один просмотр в сутки на устройство и меру.';
