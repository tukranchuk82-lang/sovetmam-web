-- Роль «координатор»: логин-аккаунт человека, который ведёт свой регион —
-- обращения, меры и список подписчиков в нём. Отдельно от regional_representatives
-- (публичная карточка контактов + email-маршрутизация обращений, без входа) —
-- координатор может быть тем же человеком, но это осознанно два разных
-- механизма, их можно будет связать позже.
alter table public.app_users drop constraint if exists app_users_role_check;
alter table public.app_users
  add constraint app_users_role_check
  check (role = any (array['user', 'owner', 'tech', 'coordinator']));

alter table public.app_users add column if not exists region text;

-- Задел на будущий внутренний чат координатор ↔ подписчик: куда координатору
-- слать уведомление о новом сообщении ботом. Пока никем не читается.
alter table public.app_users add column if not exists coordinator_telegram_chat_id text;

-- Заявка на передачу роли владельца. Владелец назначает мгновенно сам себе
-- в помощь; техспец только предлагает кандидата — нужно подтверждение
-- действующего владельца.
create table if not exists public.owner_role_requests (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references public.app_users(id),
  target_user_id uuid not null references public.app_users(id),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  decided_by uuid references public.app_users(id),
  decided_at timestamptz
);
create index if not exists owner_role_requests_status_idx on public.owner_role_requests(status);

-- Внутренний чат координатор ↔ подписчик. Схема заложена заранее (по просьбе
-- Тани — «предусмотреть техническую возможность»), сама механика (кто может
-- писать первым, как считается непрочитанное) появится отдельным заходом,
-- когда она её распишет. Таблица пока ничем не читается и не пишется.
create table if not exists public.coordinator_messages (
  id uuid primary key default gen_random_uuid(),
  region text not null,
  user_id uuid not null references public.app_users(id),
  author text not null check (author in ('coordinator', 'user')),
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists coordinator_messages_user_id_idx on public.coordinator_messages(user_id);
create index if not exists coordinator_messages_region_idx on public.coordinator_messages(region);
