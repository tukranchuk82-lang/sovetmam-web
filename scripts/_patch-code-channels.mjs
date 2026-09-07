// Выбор канала для кода подтверждения: почта, MAX, «ВКонтакте», Telegram.
//
// В AppUser добавляем salebotClientId — без него код в бота не отправить.
import { readFileSync, writeFileSync } from "node:fs";

const edit = (path, pairs) => {
  let s = readFileSync(path, "utf8");
  const nl = s.includes("\r\n") ? "\r\n" : "\n";
  for (const [from, to] of pairs) {
    const f = Array.isArray(from) ? from.join(nl) : from;
    const t = Array.isArray(to) ? to.join(nl) : to;
    if (!s.includes(f)) throw new Error(`${path}: не нашла «${f.slice(0, 70)}»`);
    s = s.replace(f, t);
  }
  writeFileSync(path, s, "utf8");
  console.log("правлено:", path);
};

edit("src/lib/onboarding-db.ts", [
  [
    ["  max_id: string | null;", "  survey: Record<string, unknown> | null;"],
    ["  max_id: string | null;", "  salebot_client_id: string | null;", "  survey: Record<string, unknown> | null;"],
  ],
  [
    ["    maxId: r.max_id,", "    survey: r.survey,"],
    ["    maxId: r.max_id,", "    salebotClientId: r.salebot_client_id,", "    survey: r.survey,"],
  ],
  [
    '  "id, email, first_name, last_name, role, email_verified_at, messenger_connected, messenger_choice, telegram_id, vk_id, max_id, survey, avatar_url, avatar_emoji, avatar_bg, messenger_avatar_url";',
    '  "id, email, first_name, last_name, role, email_verified_at, messenger_connected, messenger_choice, telegram_id, vk_id, max_id, salebot_client_id, survey, avatar_url, avatar_emoji, avatar_bg, messenger_avatar_url";',
  ],
]);
