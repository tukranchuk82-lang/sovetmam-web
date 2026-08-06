-- 0018_share_events.sql
-- Кнопка «Поделиться»: сколько раз делились и сколько людей по этим ссылкам
-- пришло.
--
-- Одна таблица на оба события, а не две: вопросы к ним одинаковые («сколько за
-- неделю», «какими страницами делятся чаще»), и считать их вместе проще, чем
-- складывать две таблицы в каждом запросе.
--
-- Персональных данных здесь нет. visitor — случайный номер из cookie, он
-- нужен ровно для того, чтобы отличить «десять раз зашёл один человек» от
-- «зашли десять человек».

create table if not exists public.share_events (
  id         uuid primary key default gen_random_uuid(),
  -- share — нажали «Поделиться»; visit — пришли по такой ссылке.
  kind       text not null check (kind in ('share', 'visit')),
  -- Страница, которой поделились или на которую пришли: / или /catalog/<мера>.
  path       text not null,
  -- Метка ссылки. У кнопки «Поделиться» — share; параметр общий, поэтому те же
  -- отчёты сработают и для ссылок из рассылки или из поста во «ВКонтакте».
  ref        text,
  -- Как поделились: through — родное окно телефона, copy — скопировали ссылку.
  channel    text,
  -- Кто поделился, если человек вошёл в приложение.
  user_id    uuid references public.app_users(id) on delete set null,
  -- Анонимный номер устройства из cookie — для подсчёта людей, а не заходов.
  visitor    text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists share_events_kind_created_idx
  on public.share_events (kind, created_at desc);

create index if not exists share_events_path_idx
  on public.share_events (path);

create index if not exists share_events_ref_idx
  on public.share_events (ref);

alter table public.share_events enable row level security;
