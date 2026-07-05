-- 0009_messenger_connected_at.sql
-- Дата/время фактического подключения мессенджера (пишется вебхуком Salebot,
-- когда человек зашёл в бота). До этого messenger_choice = только выбор канала.
alter table public.app_users
  add column if not exists messenger_connected_at timestamptz;
