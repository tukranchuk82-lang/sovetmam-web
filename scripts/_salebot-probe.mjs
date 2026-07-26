// Проверка Salebot: есть ли в базе salebot_client_id и отвечает ли API.
//
// Специально дёргаем несуществующего клиента — сообщение никому не уйдёт,
// но по коду ответа видно, верны ли адрес метода и ключ.
//
// Запуск: node scripts/_salebot-probe.mjs
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

// 1. Колонка и заполненность
const { data, error } = await sb
  .from("app_users")
  .select("email, messenger_connected, salebot_client_id, telegram_id, vk_id, max_id");
if (error) {
  console.log("Колонка salebot_client_id недоступна:", error.message);
} else {
  const withClient = data.filter((u) => u.salebot_client_id);
  const connected = data.filter((u) => u.messenger_connected);
  console.log(`Всего пользователей: ${data.length}`);
  console.log(`  с отметкой «мессенджер подключён»: ${connected.length}`);
  console.log(`  с заполненным salebot_client_id:   ${withClient.length}`);
  if (withClient.length === 0 && connected.length > 0) {
    console.log(
      "\n  ВНИМАНИЕ: мессенджер отмечен подключённым, но salebot_client_id пуст —",
    );
    console.log("  значит Salebot не передавал его в вебхук. Уведомления не уйдут.");
  }
}

// 2. Живой ответ API
const key = env.SALEBOT_API_KEY;
if (!key) {
  console.log("\nSALEBOT_API_KEY не задан — вызов пропущен.");
  process.exit(0);
}

const url = `https://chatter.salebot.pro/api/${key}/callback`;
console.log(`\nПробуем POST ${url.replace(key, "<ключ>")}`);
try {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: "0", message: "probe" }),
  });
  const text = await res.text();
  console.log(`  HTTP ${res.status}: ${text.slice(0, 400)}`);
} catch (e) {
  console.log("  Ошибка запроса:", e.message);
}
