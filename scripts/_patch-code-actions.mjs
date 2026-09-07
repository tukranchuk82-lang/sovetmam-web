// Куда отправлять код: почта, MAX, «ВКонтакте», Telegram.
//
// Письмо уходит в спам чаще, чем хотелось бы, а сообщение в боте человек
// видит сразу. Поэтому тем, у кого бот уже подключён, даём выбор канала.
import { readFileSync, writeFileSync } from "node:fs";

const p = "src/app/(app)/login/onboarding-actions.ts";
let s = readFileSync(p, "utf8");
const nl = s.includes("\r\n") ? "\r\n" : "\n";
const L = (...x) => x.join(nl);

const pairs = [
  [
    L('import { buildSalebotProxyLink } from "@/lib/salebot";'),
    L(
      'import { buildSalebotProxyLink, sendCodeViaSalebot } from "@/lib/salebot";',
      "",
      "/**",
      " * Куда доставить код подтверждения.",
      " *",
      " * email — письмо; остальное — сообщение от нашего бота через Salebot.",
      " * Мессенджер доступен только тем, у кого бот уже подключён: без",
      " * salebot_client_id боту некуда писать.",
      " */",
      'export type CodeChannel = "email" | "telegram" | "vk" | "max";',
      "",
      "/** Какие каналы доступны этому человеку — для кнопок на экране входа. */",
      "export async function codeChannels(emailRaw: string): Promise<CodeChannel[]> {",
      "  const user = await getAppUserByEmail(emailRaw.trim().toLowerCase());",
      '  if (!user?.salebotClientId) return ["email"];',
      '  const list: CodeChannel[] = ["email"];',
      '  if (user.maxId != null) list.push("max");',
      '  if (user.vkId != null) list.push("vk");',
      '  if (user.telegramId != null) list.push("telegram");',
      "  return list;",
      "}",
      "",
      "/**",
      " * Отправляет код выбранным каналом. Если мессенджер не сработал —",
      " * молча уходим на почту: человек ждёт код, а не объяснений, почему бот",
      " * не ответил.",
      " */",
      "async function deliverCode(",
      "  email: string,",
      "  code: string,",
      "  channel: CodeChannel,",
      "): Promise<CodeChannel> {",
      '  if (channel !== "email") {',
      "    const user = await getAppUserByEmail(email);",
      "    if (user?.salebotClientId) {",
      "      const res = await sendCodeViaSalebot({",
      "        clientId: user.salebotClientId,",
      "        code,",
      "      });",
      "      if (res.ok) return channel;",
      "      console.log(`[код] бот не принял, шлём письмо: ${res.detail}`);",
      "    }",
      "  }",
      "  await sendOtpEmail(email, code);",
      '  return "email";',
      "}",
    ),
  ],
  [
    L(
      "/** Код для входа существующего пользователя (имя не запрашиваем). */",
      "export async function sendLoginCode(emailRaw: string): Promise<RequestCodeResult> {",
      "  const email = emailRaw.trim().toLowerCase();",
      '  if (!EMAIL_RE.test(email)) return { ok: false, error: "Проверьте адрес email." };',
      "  const user = await getAppUserByEmail(email);",
      "  if (!user)",
      '    return { ok: false, error: "Аккаунт с этой почтой не найден." };',
      "  const code = await issueOtp(email);",
      "  await sendOtpEmail(email, code);",
      '  const devCode = process.env.NODE_ENV !== "production" ? code : undefined;',
      "  return { ok: true, devCode };",
      "}",
    ),
    L(
      "/** Код для входа существующего пользователя (имя не запрашиваем). */",
      "export async function sendLoginCode(",
      "  emailRaw: string,",
      '  channel: CodeChannel = "email",',
      "): Promise<RequestCodeResult> {",
      "  const email = emailRaw.trim().toLowerCase();",
      '  if (!EMAIL_RE.test(email)) return { ok: false, error: "Проверьте адрес email." };',
      "  const user = await getAppUserByEmail(email);",
      "  if (!user)",
      '    return { ok: false, error: "Аккаунт с этой почтой не найден." };',
      "  const code = await issueOtp(email);",
      "  const sentTo = await deliverCode(email, code, channel);",
      '  const devCode = process.env.NODE_ENV !== "production" ? code : undefined;',
      "  return { ok: true, devCode, sentTo };",
      "}",
    ),
  ],
  [
    L(
      "  const code = await issueOtp(email);",
      "  await sendOtpEmail(email, code);",
      "",
      "  // В dev показываем код на экране, чтобы поток можно было протестировать без",
      "  // настроенной почты. В проде devCode не возвращаем.",
      '  const devCode = process.env.NODE_ENV !== "production" ? code : undefined;',
      "  return { ok: true, devCode };",
    ),
    L(
      "  const code = await issueOtp(email);",
      '  const sentTo = await deliverCode(email, code, input.channel ?? "email");',
      "",
      "  // В dev показываем код на экране, чтобы поток можно было протестировать без",
      "  // настроенной почты. В проде devCode не возвращаем.",
      '  const devCode = process.env.NODE_ENV !== "production" ? code : undefined;',
      "  return { ok: true, devCode, sentTo };",
    ),
  ],
  [
    L(
      "  /** Отметил ли человек добровольное согласие на рассылку. */",
      "  consentMailing?: boolean;",
      "}): Promise<RequestCodeResult> {",
    ),
    L(
      "  /** Отметил ли человек добровольное согласие на рассылку. */",
      "  consentMailing?: boolean;",
      "  /** Куда доставить код. По умолчанию — на почту. */",
      "  channel?: CodeChannel;",
      "}): Promise<RequestCodeResult> {",
    ),
  ],
];
for (const [from, to] of pairs) {
  if (!s.includes(from)) throw new Error("не нашла: " + from.split(nl)[0].slice(0, 60));
  s = s.replace(from, to);
}
writeFileSync(p, s, "utf8");
console.log("правлено:", p);
