-- 0013_inquiries_region.sql
-- Обращения теперь оставляют авторизованные email-пользователи. При обращении
-- обязательно указывается регион. Мессенджер-канал больше не обязателен
-- (у email-пользователя его может не быть) — снимаем NOT NULL.
alter table public.inquiries add column if not exists region text;

alter table public.inquiries alter column user_channel drop not null;

alter table public.inquiries drop constraint if exists inquiries_user_channel_check;
alter table public.inquiries
  add constraint inquiries_user_channel_check
  check (user_channel is null or user_channel in ('telegram', 'vk', 'max'));
