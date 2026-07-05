-- 0010_salebot_webhook_log.sql
-- Диагностический лог входящих вызовов вебхука Salebot (что реально приходит).
-- Временный/служебный; можно чистить. Доступ — только service_role (RLS вкл).
create table if not exists public.salebot_webhook_log (
  id uuid primary key default gen_random_uuid(),
  received_at timestamptz not null default now(),
  method text,
  content_type text,
  query text,
  body text
);
alter table public.salebot_webhook_log enable row level security;
