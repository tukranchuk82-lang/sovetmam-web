-- 0012_app_users_role.sql
-- Роль аккаунта для доступа к админ-панели. По умолчанию обычный пользователь;
-- владелец (owner) и техспец (tech) видят /admin и обращения.
alter table public.app_users
  add column if not exists role text not null default 'user'
  check (role in ('user', 'owner', 'tech'));
