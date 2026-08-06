-- 0016_inquiry_messages.sql
-- Переписка в обращении.
--
-- Раньше обращение было устроено как «один вопрос — один ответ»: текст лежал в
-- inquiries.body, ответ — в inquiries.response. Продолжить разговор было
-- нельзя, а людям это нужно: уточнить, поблагодарить, задать встречный вопрос.
--
-- Теперь у обращения есть лента сообщений. Старые колонки не трогаем: они
-- остаются как есть, а лента наполняется из них при переносе (см.
-- scripts/_backfill-inquiry-messages.mjs) и живёт дальше сама.

create table if not exists public.inquiry_messages (
  id          uuid primary key default gen_random_uuid(),
  inquiry_id  uuid not null references public.inquiries(id) on delete cascade,
  -- Кто написал: 'user' — автор обращения, 'staff' — Татьяна или организатор.
  author      text not null check (author in ('user', 'staff')),
  author_name text,
  body        text not null,
  -- Когда получатель увидел сообщение. Нужно для счётчика непрочитанного.
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists inquiry_messages_thread_idx
  on public.inquiry_messages (inquiry_id, created_at);

-- Непрочитанные ответы пользователю ищем по этому индексу.
create index if not exists inquiry_messages_unread_idx
  on public.inquiry_messages (inquiry_id)
  where author = 'staff' and read_at is null;

alter table public.inquiry_messages enable row level security;
