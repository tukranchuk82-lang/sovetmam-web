-- 0017_push_subscriptions.sql
-- Подписки на пуш-уведомления.
--
-- Одному человеку принадлежит столько подписок, сколько у него устройств:
-- телефон, рабочий компьютер, планшет. Отправлять надо на все, а мёртвые
-- (браузер отозвал разрешение, приложение удалили) — убирать по ответу
-- push-сервиса.

create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.app_users(id) on delete cascade,
  -- endpoint выдаёт браузер; он же и есть уникальный ключ устройства.
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
