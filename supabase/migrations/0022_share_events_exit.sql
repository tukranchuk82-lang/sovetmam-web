-- 0022_share_events_exit.sql
-- Третий вид события: exit — человек ушёл из приложения по нашей ссылке.
--
-- Первым таким переходом стала плашка курса на главной: она уводит в отдельное
-- приложение на kurs.sovetmam.ru, и нам важно видеть, сколько людей из
-- «Шпаргалки» им заинтересовалось.
--
-- Отдельную таблицу не заводим: вопросы к переходам те же самые («сколько
-- людей», «сколько за неделю»), а считать их вместе с остальными событиями
-- проще. Куда именно ушёл человек, пишем в channel — как и у кнопки
-- «Поделиться» там лежит «куда».

alter table public.share_events
  drop constraint if exists share_events_kind_check;

alter table public.share_events
  add constraint share_events_kind_check
  check (kind in ('share', 'visit', 'exit'));
