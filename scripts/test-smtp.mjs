// Проверка отправки почты через SMTP из .env.local.
// Запуск (в обычном терминале, не в песочнице):
//   node scripts/test-smtp.mjs                 → письмо на сам ящик SMTP_USER
//   node scripts/test-smtp.mjs you@example.com → письмо на указанный адрес
import fs from "node:fs";
import nodemailer from "nodemailer";

const env = {};
for (const line of fs
  .readFileSync(new URL("../.env.local", import.meta.url), "utf8")
  .split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}

const to = process.argv[2] || env.SMTP_USER;
const port = Number(env.SMTP_PORT ?? 465);

const t = nodemailer.createTransport({
  host: env.SMTP_HOST ?? "smtp.beget.com",
  port,
  secure: port === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

try {
  await t.verify();
  console.log("[OK] SMTP verify — логин принят");
  const info = await t.sendMail({
    from: env.SMTP_FROM ?? env.SMTP_USER,
    to,
    subject: "Тест отправки — Шпаргалка для родителей",
    text: "Проверка SMTP. Пример кода: 123456",
    html: '<div style="font-family:Arial"><b>Проверка SMTP прошла</b><br>Пример кода: <b style="color:#1B3A6B">123456</b></div>',
  });
  console.log("[OK] Отправлено на", to, "—", info.response);
} catch (e) {
  console.error("[FAIL]", e.code || "", e.message);
  process.exit(1);
}
