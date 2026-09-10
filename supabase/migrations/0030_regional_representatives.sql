-- Представители «Совета матерей» в регионах: аккредитованные организации,
-- к которым можно обратиться по мерам своего региона. region должен
-- дословно совпадать со значением measures.region, чтобы карточки мер
-- находили своего представителя простым сравнением строк.

create table if not exists public.regional_representatives (
  id uuid primary key default gen_random_uuid(),
  region text not null,
  name text not null,
  description text,
  address text,
  phone text,
  email text,
  website text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists regional_representatives_region_idx
  on public.regional_representatives (region);
