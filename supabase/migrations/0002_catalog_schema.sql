-- 0002_catalog_schema.sql
-- Каталог: сегменты (жизненные ситуации) и меры господдержки.
-- Публичное чтение разрешено всем (анон-ключ), запись — только service_role.

-- Сегменты (жизненные ситуации).
create table if not exists public.segments (
  id text primary key,
  title text not null,
  short text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Меры господдержки.
create table if not exists public.measures (
  slug text primary key,
  title text not null,
  short_description text not null,
  level text not null check (level in ('federal', 'regional')),
  region text,
  category text not null,
  amount text,
  segments text[] not null default '{}',
  criteria jsonb not null default '{}'::jsonb,
  how_to_apply text[] not null default '{}',
  documents text[] not null default '{}',
  source_url text not null,
  source_name text not null,
  updated_at_label text,
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists measures_level_idx on public.measures(level);
create index if not exists measures_region_idx on public.measures(region) where region is not null;
create index if not exists measures_category_idx on public.measures(category);
create index if not exists measures_segments_gin on public.measures using gin (segments);

-- updated_at триггеры (функция touch_updated_at() уже есть из 0001).
drop trigger if exists segments_touch_updated_at on public.segments;
create trigger segments_touch_updated_at
  before update on public.segments
  for each row execute function public.touch_updated_at();

drop trigger if exists measures_touch_updated_at on public.measures;
create trigger measures_touch_updated_at
  before update on public.measures
  for each row execute function public.touch_updated_at();

-- RLS: каталог публичный для чтения, запись только под service_role.
alter table public.segments enable row level security;
alter table public.measures enable row level security;

create policy "segments_public_read" on public.segments
  for select using (true);

create policy "measures_public_read" on public.measures
  for select using (is_published = true);
