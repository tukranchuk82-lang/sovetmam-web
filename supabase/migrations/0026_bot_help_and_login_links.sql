-- 0026_bot_help_and_login_links.sql
-- Кабинет по заявке из бота: заявки и одноразовые ссылки для входа.
--
-- Зачем. Часть людей не может получить код на почту: письмо не приходит или
-- теряется. Для них в приложении есть строчка «код не пришёл — напишите нам»
-- со ссылками в Telegram, MAX и «ВКонтакте». Человек пишет боту, заявка
-- прилетает сюда, Таня создаёт кабинет руками, и человеку в тот же чат
-- уходит одноразовая ссылка для входа.

-- Заявки из бота: кто написал и из какого мессенджера.
create table if not exists public.bot_help_requests (
  id                uuid primary key default gen_random_uuid(),
  -- Кто написал: идентификатор клиента в Salebot — по нему же отвечаем.
  salebot_client_id text not null,
  channel           text not null check (channel in ('telegram', 'vk', 'max')),
  -- Что о человеке известно из мессенджера: имя и ник. Может не быть ничего.
  name              text,
  username          text,
  -- Что человек написал вместе с заявкой (если воронка передала текст).
  note              text,
  status            text not null default 'new'
                    check (status in ('new', 'done', 'declined')),
  -- Кабинет, который завели по заявке.
  user_id           uuid references public.app_users(id) on delete set null,
  handled_at        timestamptz,
  created_at        timestamptz not null default now()
);

create index if not exists bot_help_requests_status_idx
  on public.bot_help_requests (status, created_at desc);

create unique index if not exists bot_help_requests_open_client_idx
  on public.bot_help_requests (salebot_client_id)
  where status = 'new';

alter table public.bot_help_requests enable row level security;

-- Одноразовые ссылки для входа.
--
-- Храним не сам токен, а его хэш: утечка таблицы не должна давать вход в
-- чужие кабинеты. Ссылка живёт 24 часа и гаснет при первом использовании;
-- просроченная ведёт просто в приложение с меткой bot, а не в ошибку.
create table if not exists public.login_links (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.app_users(id) on delete cascade,
  token_hash text not null unique,
  -- Откуда пришла ссылка: bot — выдана вручную по заявке из мессенджера.
  source     text not null default 'bot',
  expires_at timestamptz not null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists login_links_user_idx
  on public.login_links (user_id, created_at desc);

alter table public.login_links enable row level security;

comment on table public.bot_help_requests is
  'Заявки на создание кабинета из ботов: человек не получил код на почту и написал нам.';
comment on table public.login_links is
  'Одноразовые ссылки для входа. Хранится только хэш токена; ссылка живёт 24 часа и гаснет при использовании.';
