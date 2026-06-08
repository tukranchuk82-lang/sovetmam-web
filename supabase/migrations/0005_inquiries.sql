-- 0005_inquiries.sql
-- Обращения пользователей: вопросы про свою ситуацию и предложения мер.
-- В прототипе пользователь идентифицируется по cookie (демо-режим), поэтому
-- FK на auth.users не делаем — храним user_id строкой («tg_1000» и т.п.).

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),

  -- Кто оставил (снэпшот данных на момент создания).
  user_id text not null,
  user_name text not null,
  user_channel text not null check (user_channel in ('telegram', 'vk', 'max')),

  -- Тип: вопрос про свою ситуацию или предложение по мере.
  type text not null check (type in ('question', 'proposal')),
  subject text not null,
  body text not null,

  -- На какую меру (для proposal — название предлагаемой; для question — опционально).
  measure_slug text references public.measures(slug) on delete set null,

  -- Статус и ответ заказчика.
  status text not null default 'new' check (status in ('new', 'answered')),
  response text,
  responded_at timestamptz,
  responded_by_name text,

  created_at timestamptz not null default now()
);

create index if not exists inquiries_user_id_idx on public.inquiries(user_id);
create index if not exists inquiries_status_created_idx on public.inquiries(status, created_at desc);

-- RLS включён, публичных политик нет: всё чтение/запись только через service_role
-- (серверные API-роуты и Server Actions).
alter table public.inquiries enable row level security;
