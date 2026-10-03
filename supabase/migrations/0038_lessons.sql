-- 0038_lessons.sql
-- Инструкции для координаторов: видео-уроки с названием и описанием.
--
-- Уроки добавляют владелец и техспец (мини-конструктор в админке), координаторы
-- их смотрят. Сами видео лежат в закрытом хранилище lesson-videos и отдаются
-- по временной подписанной ссылке: просто так по адресу файл не открыть.
-- Если видео уже выложено где-то ещё (VK Видео, YouTube), можно вместо файла
-- указать ссылку — video_url.
--
-- is_published = false — черновик: координаторы его не видят.
-- sort_order — порядок уроков; меньше — выше.

create table if not exists public.lessons (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null default '',
  video_path  text,
  video_url   text,
  video_size  bigint,
  sort_order  integer not null default 0,
  is_published boolean not null default false,
  created_by  uuid references public.app_users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists lessons_order_idx on public.lessons (sort_order, created_at);

-- Какие уроки координатор уже посмотрел.
create table if not exists public.lesson_progress (
  lesson_id  uuid not null references public.lessons(id) on delete cascade,
  user_id    uuid not null references public.app_users(id) on delete cascade,
  watched_at timestamptz not null default now(),
  primary key (lesson_id, user_id)
);

alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;

comment on table public.lessons is 'Видео-уроки для координаторов (инструкции).';
