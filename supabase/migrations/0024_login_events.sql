-- 0024_login_events.sql
-- Журнал входов: кто, когда и с какого устройства открыл приложение.
--
-- Зачем. Аналитика умела считать только устройства (анонимный номер из
-- cookie) и только у тех, кто пришёл по размеченной ссылке. Из-за этого
-- «пришло людей» и «людей в базе» показывали разное, и понять, сколько
-- человек реально пользуется приложением, было нельзя. Журнал входов даёт
-- считать людей по учётным записям, а не по браузерам, и видеть, кто заходит
-- с телефона и с компьютера.
--
-- Персональные данные. Здесь появляются сведения о входах: время, устройство,
-- примерная платформа. Это данные пользователя, поэтому строчка о них должна
-- быть в согласии на обработку (см. docs/ и страницу согласия).
--
-- Что НЕ храним: IP-адрес и точную геолокацию. Для наших вопросов они не
-- нужны, а хранение расширяет ответственность.

create table if not exists public.login_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.app_users(id) on delete cascade,
  -- Анонимный номер устройства из той же cookie, что и в share_events:
  -- по нему видно, что человек заходит с двух браузеров или телефонов.
  visitor    text,
  -- Как человек оказался внутри: ввёл код из письма или пришёл с живой
  -- cookie-сессией (открыл приложение снова).
  kind       text not null default 'login' check (kind in ('login', 'return')),
  -- Строка браузера: из неё раскладываем платформу в отчёте.
  user_agent text,
  -- Приложение открыто как установленное (с домашнего экрана) или во вкладке.
  standalone boolean,
  created_at timestamptz not null default now()
);

create index if not exists login_events_user_created_idx
  on public.login_events (user_id, created_at desc);

create index if not exists login_events_created_idx
  on public.login_events (created_at desc);

create index if not exists login_events_visitor_idx
  on public.login_events (visitor);

alter table public.login_events enable row level security;

comment on table public.login_events is
  'Журнал входов: кто и с какого устройства открывал приложение. Нужен, чтобы считать людей по учётным записям, а не по браузерам.';
