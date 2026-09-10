-- Спорные меры: очередь в админке вместо файла docs/spornye-mery.md.
-- Каждая запись — одна мера (или тема), по которой источники расходятся,
-- не открылись или просто не дают однозначного ответа. sources хранит
-- ссылки вместе с пометкой, что с ними не так (противоречат друг другу или
-- не открылись), чтобы админ мог сразу перейти по ним, не читая пересказ.
-- Notes — отдельная таблица: несколько админов могут по очереди прислать
-- уточнения (текст, ссылку на нормативный акт), прежде чем кто-то применит
-- правку и отметит спор решённым.

create table if not exists public.measure_disputes (
  id uuid primary key default gen_random_uuid(),
  measure_slug text references public.measures(slug) on delete set null,
  title text not null,
  reason text not null,
  sources jsonb not null default '[]'::jsonb,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by text
);

create index if not exists measure_disputes_status_idx
  on public.measure_disputes (status, created_at desc);
create index if not exists measure_disputes_measure_slug_idx
  on public.measure_disputes (measure_slug);

create table if not exists public.measure_dispute_notes (
  id uuid primary key default gen_random_uuid(),
  dispute_id uuid not null references public.measure_disputes(id) on delete cascade,
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists measure_dispute_notes_dispute_id_idx
  on public.measure_dispute_notes (dispute_id, created_at);
