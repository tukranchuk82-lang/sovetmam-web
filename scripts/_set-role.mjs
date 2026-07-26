// Смена роли пользователя приложения.
//
// Роли: user — обычный пользователь, tech — техспец, owner — владелец.
// Владелец и техспец получают доступ к /admin (см. isAppAdmin в onboarding-db).
//
// Запуск: node scripts/_set-role.mjs <email> <user|tech|owner> [--apply]
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const ROLES = ["user", "tech", "owner"];
const email = (process.argv[2] || "").toLowerCase();
const role = process.argv[3];
const APPLY = process.argv.includes("--apply");

if (!email || !ROLES.includes(role)) {
  console.log("Запуск: node scripts/_set-role.mjs <email> <user|tech|owner> [--apply]");
  process.exit(1);
}

const { data: user } = await sb
  .from("app_users")
  .select("id, email, first_name, last_name, role")
  .eq("email", email)
  .maybeSingle();

if (!user) {
  console.log(`Пользователь ${email} не найден.`);
  process.exit(1);
}

console.log(`${user.last_name} ${user.first_name} <${user.email}>`);
console.log(`  роль: ${user.role} → ${role}`);

if (!APPLY) {
  console.log(`\nСухой прогон. Для записи добавьте --apply`);
  process.exit(0);
}

const { error } = await sb.from("app_users").update({ role }).eq("id", user.id);
if (error) {
  console.log("Ошибка:", error.message);
  process.exit(1);
}
console.log("\nГотово — роль изменена.");
