-- 0025_open_install_events.sql
-- Ещё два вида событий устройства: заход и установка приложения.
--
-- «open» — приложение открыли на устройстве. Раньше событие записывалось,
-- только если человек пришёл по размеченной ссылке, поэтому «сколько
-- устройств заходило» мы не знали вовсе: видели лишь тех, кто пришёл из
-- квиза, из бота или по кнопке «Поделиться».
--
-- «install» — приложение установили на устройство (браузер прислал
-- appinstalled или приложение впервые открылось с домашнего экрана).
-- Удаление приложения отследить нельзя: браузер о нём не сообщает никому,
-- и это осознанное решение разработчиков браузеров, а не наша недоработка.

alter table public.share_events
  drop constraint if exists share_events_kind_check;

alter table public.share_events
  add constraint share_events_kind_check
  check (kind in ('share', 'visit', 'exit', 'open', 'install'));

create index if not exists share_events_visitor_kind_idx
  on public.share_events (visitor, kind);
