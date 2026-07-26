// Проверка SMTP: пробуем подключиться на 465 (SSL) и 587 (STARTTLS),
// чтобы понять, какой порт реально работает у провайдера.
// Запуск: node scripts/_smtp-probe.mjs
import nodemailer from "nodemailer";
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

const host = env.SMTP_HOST;
const user = env.SMTP_USER;
const pass = env.SMTP_PASS;
console.log(`host: ${host}, user: ${user}\n`);

for (const port of [465, 587, 2525]) {
  const t = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });
  try {
    await t.verify();
    console.log(`  ${port}: OK — соединение и авторизация прошли`);
  } catch (e) {
    console.log(`  ${port}: ОШИБКА — ${e.code || ""} ${e.message}`);
  } finally {
    t.close();
  }
}
