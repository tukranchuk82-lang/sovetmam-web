-- 0001_profiles.sql
-- Профили пользователей: расширение auth.users полями для ролей и привязки
-- к Telegram/VK/MAX через Salebot. Создаётся автоматически триггером при
-- регистрации в auth.users.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),

  -- Идентификаторы в мессенджерах (заполняются после привязки бота).
  telegram_id bigint unique,
  vk_id bigint unique,
  max_id text unique,

  -- ID подписчика в Salebot (для синхронизации воронок).
  salebot_client_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Индексы для быстрого поиска по мессенджерам в вебхуках Salebot.
create index if not exists profiles_telegram_id_idx on public.profiles(telegram_id) where telegram_id is not null;
create index if not exists profiles_vk_id_idx on public.profiles(vk_id) where vk_id is not null;
create index if not exists profiles_max_id_idx on public.profiles(max_id) where max_id is not null;

-- RLS включён: каждый видит и правит только свой профиль.
-- Админ-операции делаются через service_role в серверном коде.
alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Триггер: при появлении записи в auth.users создаём пустой profiles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Триггер updated_at.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();
