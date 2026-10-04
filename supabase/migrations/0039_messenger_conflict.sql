-- 0039_messenger_conflict.sql
-- Подключение мессенджера не удалось, потому что этот мессенджер уже привязан к
-- другому аккаунту (telegram_id, vk_id и max_id уникальны). Бот при этом отвечает
-- «готово», а приложение раньше молча ждало — человек не понимал, что случилось.
-- Теперь вебхук записывает причину сюда, а экран подключения её показывает.

alter table public.app_users
  add column if not exists messenger_conflict_channel text,
  add column if not exists messenger_conflict_at timestamptz;
