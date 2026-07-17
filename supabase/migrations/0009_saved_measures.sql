-- 0009_saved_measures.sql
-- Избранное: меры, которые пользователь сохранил себе «в закладки».
-- Только для авторизованных (email-OTP пользователи из app_users). Как и в
-- inquiries, user_id храним строкой — совместимо и с uuid app_users, и с
-- демо-id («tg_1000»). Доступ — только через service_role (RLS включён, политик
-- нет → клиентам напрямую закрыто; читаем/пишем из серверных экшенов).

create table if not exists public.saved_measures (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  measure_slug text not null references public.measures(slug) on delete cascade,
  created_at timestamptz not null default now(),

  -- Одну меру нельзя сохранить дважды одному пользователю.
  unique (user_id, measure_slug)
);

create index if not exists saved_measures_user_idx
  on public.saved_measures(user_id, created_at desc);

alter table public.saved_measures enable row level security;
