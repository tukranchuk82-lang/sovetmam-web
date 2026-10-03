-- Настройки уведомлений внутреннего чата «человек ↔ координатор».
--
-- Раньше человек выбирал ОДИН канал (coordinator_chat_notify_channel). Теперь
-- каналов может быть несколько сразу: бот в мессенджере, письмо и пуш на
-- устройстве. Пуш отдельной колонки не требует — он включён, пока у человека
-- есть подписка (push_subscriptions). Старая колонка остаётся нетронутой:
-- её читает запасной путь для тех, кто успел выбрать канал по-старому.
--
-- null в chat_notify_messenger / chat_notify_email — «человек ещё не решал»:
-- письмо и бот (если подключён) считаются включёнными, пока их не выключили.
alter table public.app_users
  add column if not exists chat_notify_messenger boolean,
  add column if not exists chat_notify_email boolean,
  add column if not exists chat_notify_asked_at timestamptz;
