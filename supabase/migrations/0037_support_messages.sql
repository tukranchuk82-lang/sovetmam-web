-- 0037_support_messages.sql
-- Чат «координатор ↔ техническая поддержка».
--
-- Координатору нужно куда-то написать, если в приложении что-то сломалось или
-- непонятно. Один непрерывный тред на координатора (как чат с подписчиками, но
-- без региона): пишет координатор, отвечает техспец. Владелец тоже видит и может
-- ответить.
--
-- author — кто написал сообщение; author_id — какой именно сотрудник ответил
-- (у техподдержки их может быть несколько).

create table if not exists public.support_messages (
  id             uuid primary key default gen_random_uuid(),
  coordinator_id uuid not null references public.app_users(id) on delete cascade,
  author         text not null check (author in ('coordinator', 'tech')),
  author_id      uuid references public.app_users(id) on delete set null,
  body           text not null,
  read_at        timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists support_messages_coordinator_idx
  on public.support_messages (coordinator_id, created_at);

create index if not exists support_messages_unread_idx
  on public.support_messages (author, created_at)
  where read_at is null;

alter table public.support_messages enable row level security;

comment on table public.support_messages is
  'Переписка координатора с техподдержкой: один тред на координатора.';
