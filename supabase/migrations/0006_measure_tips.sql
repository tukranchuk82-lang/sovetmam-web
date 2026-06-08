-- 0006_measure_tips.sql
-- «Полезно знать»: список коротких заметок/советов, привязанных к мере
-- (факты, которые не являются отдельной выплатой, но полезны рядом с мерой).

alter table public.measures
  add column if not exists tips text[] not null default '{}';
