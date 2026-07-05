-- 0007_app_users.sql
-- Боевая авторизация обычных пользователей через email + код подтверждения.
-- Самодостаточно (не зависит от auth.users): у каждого пользователя свой uuid id,
-- который передаётся в Salebot-бота. Доступ ко всем таблицам — только через
-- service_role из серверного кода (RLS включён, политик нет → клиентам закрыто).
-- Админы получают доступ по отдельному алгоритму (здесь не затрагивается).

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  first_name text not null,
  last_name text not null,
  email_verified_at timestamptz,

  -- Привязка к мессенджерам (заполняется вебхуком Salebot после подключения).
  telegram_id bigint unique,
  vk_id bigint unique,
  max_id text unique,
  salebot_client_id text,
  messenger_connected boolean not null default false,
  -- какой канал выбрал (telegram/vk/max) — до подтверждения из Salebot.
  messenger_choice text check (messenger_choice in ('telegram', 'vk', 'max')),

  -- UTM-метки, с которыми пользователь впервые попал в приложение.
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,

  -- Ответы анкеты /podbor (последние; при перезаполнении — перезапись).
  survey jsonb,
  survey_updated_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Коды подтверждения email (одноразовые, с истечением).
create table if not exists public.email_otps (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists email_otps_email_idx on public.email_otps(email);

-- RLS: закрываем таблицы для anon/authenticated. Доступ — только service_role
-- (он обходит RLS), т.е. из наших серверных экшенов.
alter table public.app_users enable row level security;
alter table public.email_otps enable row level security;

-- Триггер updated_at для app_users (функция touch_updated_at уже есть из 0001).
drop trigger if exists app_users_touch_updated_at on public.app_users;
create trigger app_users_touch_updated_at
  before update on public.app_users
  for each row execute function public.touch_updated_at();
