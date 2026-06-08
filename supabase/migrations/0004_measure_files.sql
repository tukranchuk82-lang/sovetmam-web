-- 0004_measure_files.sql
-- Файлы-материалы, прикреплённые к мерам поддержки. Файлы хранятся в S3
-- (Beget Cloud Storage), здесь — только метаданные и s3_key для построения URL.

create table if not exists public.measure_files (
  id uuid primary key default gen_random_uuid(),
  measure_slug text not null references public.measures(slug) on delete cascade,

  -- Тип материала: какой формат (определяет, как отрисовывать на странице).
  kind text not null check (kind in ('document', 'image', 'video', 'audio')),

  -- Отображаемое имя + опциональное описание.
  title text not null,
  description text,

  -- S3-метаданные.
  s3_bucket text not null,
  s3_key text not null,
  mime text not null,
  size_bytes bigint not null check (size_bytes >= 0),

  -- Порядок отображения на странице меры.
  sort_order int not null default 0,

  uploaded_at timestamptz not null default now(),
  uploaded_by uuid references auth.users(id) on delete set null
);

create index if not exists measure_files_measure_slug_idx on public.measure_files(measure_slug);

-- RLS: чтение публичное, запись — service_role (через серверные API-роуты).
alter table public.measure_files enable row level security;

create policy "measure_files_public_read" on public.measure_files
  for select using (true);
