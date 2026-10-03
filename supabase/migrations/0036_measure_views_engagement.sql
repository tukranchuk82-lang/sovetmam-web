-- 0036_measure_views_engagement.sql
-- Глубина интереса к мере: откуда пришли, сколько читали, как далеко
-- прокрутили, до каких разделов дошли и что нажали.
--
-- Дополняет measure_views (0034): строка по-прежнему одна на устройство, меру и
-- сутки, но теперь в неё же дописывается «поведение» на странице. Отдельная
-- таблица событий не нужна: считаем итог по просмотру, а не каждое движение.
--
-- Регион — тот, что человек указал (анкета или выбор в приложении) на момент
-- просмотра: по нему координатор видит только интерес людей своего региона.
-- Анонимные посетители без выбранного региона остаются без региона.

alter table public.measure_views
  add column if not exists source text,
  add column if not exists region text,
  add column if not exists dwell_seconds integer not null default 0,
  add column if not exists max_scroll smallint not null default 0,
  add column if not exists sections text[] not null default '{}',
  add column if not exists actions text[] not null default '{}';

create index if not exists measure_views_region_created_idx
  on public.measure_views (region, created_at desc);

comment on column public.measure_views.source is
  'Откуда открыли: podbor, catalog, search, saved, topics, home, profile, external, direct.';
comment on column public.measure_views.dwell_seconds is
  'Сколько секунд страница была на экране (до 10 минут).';
comment on column public.measure_views.max_scroll is
  'Как далеко прокрутили карточку, % (0–100).';
comment on column public.measure_views.sections is
  'До каких разделов дошли: eligibility, howto, documents, tips.';
comment on column public.measure_views.actions is
  'Что сделали: link (внешняя ссылка), ask (задали вопрос по мере).';
