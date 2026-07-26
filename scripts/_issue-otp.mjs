// Ручная выдача кода входа — когда почта не уходит (например, провайдер режет
// исходящий SMTP), а зайти в приложение нужно.
//
// Код нигде не хранится в открытом виде: в базе лежит только sha256 от
// «email:код:service_role_key». Поэтому уже отправленный код восстановить
// нельзя — можно только выписать новый с известным нам значением.
//
// Запуск: node scripts/_issue-otp.mjs <email> [минут]
import { createClient } from "@supabase/supabase-js";
import { createHash, randomInt } from "node:crypto";
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

const email = (process.argv[2] || "").toLowerCase();
const minutes = Number(process.argv[3]) || 30;
if (!email) {
  console.log("Укажите почту: node scripts/_issue-otp.mjs you@example.com [минут]");
  process.exit(1);
}

// Хеширование — точно как в src/lib/onboarding-db.ts, иначе код не подойдёт.
const hashCode = (mail, code) =>
  createHash("sha256").update(`${mail}:${code}:${env.SUPABASE_SERVICE_ROLE_KEY}`).digest("hex");

const { data: user } = await sb
  .from("app_users")
  .select("email, role")
  .eq("email", email)
  .maybeSingle();
if (!user) {
  console.log(`В базе нет пользователя с почтой ${email} — код выписывать некому.`);
  process.exit(1);
}

const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
const expiresAt = new Date(Date.now() + minutes * 60_000).toISOString();

// Гасим прежние невыпользованные коды — как это делает issueOtp.
await sb
  .from("email_otps")
  .update({ consumed_at: new Date().toISOString() })
  .eq("email", email)
  .is("consumed_at", null);

const { error } = await sb.from("email_otps").insert({
  email,
  code_hash: hashCode(email, code),
  expires_at: expiresAt,
});
if (error) {
  console.log("Не удалось записать код:", error.message);
  process.exit(1);
}

console.log(`\n  Почта: ${email}  (роль: ${user.role})`);
console.log(`  КОД ВХОДА: ${code}`);
console.log(`  Действует ${minutes} мин., до ${new Date(expiresAt).toLocaleTimeString("ru-RU")}\n`);
