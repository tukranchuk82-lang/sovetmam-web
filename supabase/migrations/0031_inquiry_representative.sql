-- Обращение может уйти представителю региона, а не только владельцам.
--
-- Снимок имени и почты на момент маршрутизации, а не связь по id: так же, как
-- user_name уже хранится снимком в этой таблице. Если представителя потом
-- отключат или заменят — уже созданные обращения не должны «переехать» к
-- новому адресату посреди разговора.
alter table public.inquiries add column if not exists representative_name text;
alter table public.inquiries add column if not exists representative_email text;
