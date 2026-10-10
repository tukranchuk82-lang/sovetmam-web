-- 0041_admin_page_views.sql
-- Журнал работы координатора в кабинете: какие разделы админки он открывает.
--
-- Нужен владельцу, техспецу и аналитику для отчёта по координатору («как он
-- работает»): заходит ли, чем пользуется. Пишем только раздел
-- (/admin/region-chat), без адресов с id и без содержимого страниц.
-- Только для роли «координатор»: у владельца и техспеца такой отчёт не нужен.

create table if not exists public.admin_page_views (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.app_users(id) on delete cascade,
  section    text not null,
  created_at timestamptz not null default now()
);

create index if not exists admin_page_views_user_created_idx
  on public.admin_page_views (user_id, created_at desc);

alter table public.admin_page_views enable row level security;
