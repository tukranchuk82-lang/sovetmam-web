-- Внутренний чат «пользователь ↔ координатор региона» — сама таблица
-- coordinator_messages уже есть (миграция 0032), заводим только настройку
-- уведомлений: какой ОДИН канал выбрал пользователь (или ни одного —
-- значение null).
alter table public.app_users
  add column if not exists coordinator_chat_notify_channel text
  check (coordinator_chat_notify_channel in ('email', 'telegram', 'vk', 'max'));

create index if not exists coordinator_messages_region_user_idx
  on public.coordinator_messages(region, user_id, created_at);
