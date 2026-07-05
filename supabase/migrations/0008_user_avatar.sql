-- 0008_user_avatar.sql
-- Аватар пользователя: загруженное фото / выбранный смайлик на фоне /
-- фото из мессенджера (последнее наполняется вебхуком Salebot позже).

alter table public.app_users
  add column if not exists avatar_url text,            -- загруженное фото (Storage)
  add column if not exists avatar_emoji text,          -- выбранный смайлик
  add column if not exists avatar_bg text,             -- фон под смайлик
  add column if not exists messenger_avatar_url text;  -- фото из мессенджера

-- Публичный bucket для аватарок (чтение по публичной ссылке; запись — service_role).
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;
