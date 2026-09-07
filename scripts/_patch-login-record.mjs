// Запись входа в журнал: там, где человек вводит код из письма.
import { readFileSync, writeFileSync } from "node:fs";
const p = "src/app/(app)/login/onboarding-actions.ts";
let s = readFileSync(p, "utf8");
const nl = s.includes("\r\n") ? "\r\n" : "\n";
const L = (...x) => x.join(nl);
const pairs = [
  [
    L('import { setUserSession, clearUserSession, getCurrentAppUser } from "@/lib/user-session";'),
    L(
      'import { setUserSession, clearUserSession, getCurrentAppUser } from "@/lib/user-session";',
      'import { recordLogin } from "@/lib/login-events";',
    ),
  ],
  [
    L(
      "  await setUserSession(user.id);",
      "  // Если человек пришёл из бота и только теперь вошёл — подключаем мессенджер",
      "  // молча, без похода в бота и без сообщения оттуда.",
    ),
    L(
      "  await setUserSession(user.id);",
      "  // Отмечаем вход: по журналу людей считают по учётным записям, а не по",
      "  // браузерам, и видно, что человек заходит с телефона и с компьютера.",
      "  await recordLogin(user.id, \"login\");",
      "  // Если человек пришёл из бота и только теперь вошёл — подключаем мессенджер",
      "  // молча, без похода в бота и без сообщения оттуда.",
    ),
  ],
];
for (const [from, to] of pairs) {
  if (!s.includes(from)) throw new Error("не нашла: " + from.slice(0, 60));
  s = s.replace(from, to);
}
writeFileSync(p, s, "utf8");
console.log("правлено:", p);
