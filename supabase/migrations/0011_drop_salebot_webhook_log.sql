-- 0011_drop_salebot_webhook_log.sql
-- Диагностический лог вебхука Salebot больше не нужен (интеграция проверена).
-- Удаляем таблицу — заодно уходит хранившийся в теле запросов секрет.
drop table if exists public.salebot_webhook_log;
