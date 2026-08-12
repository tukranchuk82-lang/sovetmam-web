-- 0019_user_consents.sql
-- Отметки о согласиях: на обработку персональных данных и на рассылку.
--
-- Храним не «галочка стоит», а СОБЫТИЕ: кто, на что, когда и — главное — под
-- какой редакцией документа. Без версии подтвердить согласие нечем: документ
-- со временем меняется, и «он соглашался» превращается в «соглашался неизвестно
-- с чем». Поэтому строки не переписываются, а только добавляются; отказ —
-- отдельная запись с revoked_at.
--
-- Люди, зарегистрированные до появления галочек, записей здесь не имеют:
-- по решению заказчика их согласие считается данным при регистрации, и
-- переспрашивать их не будем.

create table if not exists public.user_consents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.app_users(id) on delete cascade,
  -- personal_data — обработка персональных данных (обязательное);
  -- mailing — рекламная и информационная рассылка (добровольное).
  kind        text not null check (kind in ('personal_data', 'mailing')),
  -- Редакция документа, которую человек видел: «1.0».
  doc_version text not null,
  accepted_at timestamptz not null default now(),
  -- Заполняется, когда согласие отозвано; сама строка остаётся.
  revoked_at  timestamptz,
  -- Обстоятельства — для подтверждения, что согласие давал именно человек.
  user_agent  text,
  ip          text
);

create index if not exists user_consents_user_idx
  on public.user_consents (user_id, kind, accepted_at desc);

alter table public.user_consents enable row level security;
