-- Роль «аналитик»: видит всю админку, но ничего в ней не меняет (только
-- просмотр). Права проверяются на сервере по настоящей роли: действия,
-- меняющие данные, пускают только владельца и техспеца (и координатора в
-- рамках его региона), аналитика — нет.
alter table public.app_users drop constraint if exists app_users_role_check;
alter table public.app_users
  add constraint app_users_role_check
  check (role = any (array['user', 'owner', 'tech', 'coordinator', 'analyst']));
