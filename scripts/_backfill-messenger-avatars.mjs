// Разовый добор фото профиля для уже подключивших мессенджер пользователей.
//
// Пока не было кода, который спрашивал бы Salebot про аватарку (он появился
// в onboarding-db.ts::markMessengerConnected), поэтому у всех, кто подключил
// мессенджер раньше, messenger_avatar_url пуст. Этот скрипт добирает его
// задним числом через Salebot get_variables — тот же способ, что теперь
// используется на живом пути подключения.
//
// Запуск: node scripts/_backfill-messenger-avatars.mjs [--apply]
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

const APPLY = process.argv.includes("--apply");
const SALEBOT_KEY = env.SALEBOT_API_KEY;
if (!SALEBOT_KEY) {
  console.log("SALEBOT_API_KEY не задан в .env.local");
  process.exit(1);
}

async function fetchAvatar(clientId) {
  try {
    const res = await fetch(
      `https://chatter.salebot.pro/api/${SALEBOT_KEY}/get_variables?client_id=${encodeURIComponent(clientId)}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    const avatar = typeof data.avatar === "string" ? data.avatar.trim() : "";
    return /^https?:\/\//i.test(avatar) ? avatar : null;
  } catch {
    return null;
  }
}

const { data: users, error } = await sb
  .from("app_users")
  .select("id, email, salebot_client_id")
  .eq("messenger_connected", true)
  .is("messenger_avatar_url", null)
  .not("salebot_client_id", "is", null);
if (error) {
  console.log("Ошибка выборки:", error.message);
  process.exit(1);
}

console.log(`Кандидатов на добор фото: ${users.length}${APPLY ? "" : " (сухой прогон, добавьте --apply для записи)"}`);

let found = 0;
let empty = 0;
for (const [i, u] of users.entries()) {
  const avatar = await fetchAvatar(u.salebot_client_id);
  if (avatar) {
    found++;
    if (APPLY) {
      const { error: upErr } = await sb
        .from("app_users")
        .update({ messenger_avatar_url: avatar })
        .eq("id", u.id);
      if (upErr) console.log(`  ${u.email}: ошибка записи — ${upErr.message}`);
    }
  } else {
    empty++;
  }
  if ((i + 1) % 50 === 0) console.log(`  ...${i + 1}/${users.length}`);
  // Не долбим Salebot без пауз — это не гоночный путь, торопиться некуда.
  await new Promise((r) => setTimeout(r, 120));
}

console.log(`\nГотово: с фото — ${found}, без фото у Salebot — ${empty}.`);
if (!APPLY) console.log("Ничего не записано — сухой прогон. Повторите с --apply.");
