-- 0014_inquiries_clarification.sql
-- Третий тип обращения: «уточнение по мере поддержки» — пользователь сообщает,
-- что в мере что-то устарело или неточно. Попадает в тот же раздел админки, что
-- вопросы и предложения.
--
-- Регион для такого обращения обязателен, но мера может быть федеральной —
-- тогда в region пишется «Федеральная мера» (колонка region — обычный text,
-- списком регионов на уровне БД не ограничена).

alter table public.inquiries drop constraint if exists inquiries_type_check;

alter table public.inquiries
  add constraint inquiries_type_check
  check (type in ('question', 'proposal', 'clarification'));
