import { getCurrentAdmin } from "@/lib/user-session";
import { listAppUsersForAdmin } from "@/lib/users-admin";

export const dynamic = "force-dynamic";

// Выгрузка базы пользователей в CSV (открывается в Excel). Layout админки на
// route handler не распространяется, поэтому доступ проверяем здесь сами.

function cell(value: unknown): string {
  const s =
    value == null
      ? ""
      : typeof value === "boolean"
        ? value
          ? "да"
          : "нет"
        : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

const HEADERS = [
  "Фамилия",
  "Имя",
  "Email",
  "Почта подтверждена",
  "Дата регистрации",
  "Роль",
  "Telegram id",
  "VK id",
  "MAX id",
  "Регион",
  "Детей",
  "Возраст детей",
  "Анкета заполнена",
  "Сохранено мер",
  "utm_source",
  "utm_campaign",
  "Согласие на обработку данных",
  "Согласие на рассылку",
];

/** «редакция 1.0 от 09.08.2026» либо пусто, если согласие не записывали. */
function consentCell(
  consents: { kind: string; docVersion: string; acceptedAt: string; revokedAt: string | null }[],
  kind: string,
): string {
  const c = consents.find((x) => x.kind === kind && !x.revokedAt);
  if (!c) return "";
  const date = new Date(c.acceptedAt).toLocaleDateString("ru-RU");
  return `редакция ${c.docVersion} от ${date}`;
}

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return new Response("Forbidden", { status: 403 });

  const users = await listAppUsersForAdmin();
  const rows = users.map((u) =>
    [
      u.lastName,
      u.firstName,
      u.email,
      Boolean(u.emailVerifiedAt),
      new Date(u.createdAt).toLocaleDateString("ru-RU"),
      u.role,
      u.telegramId,
      u.vkId,
      u.maxId,
      u.survey?.region ?? "",
      u.survey?.childrenCount ?? "",
      u.survey?.childrenAges?.join(" ") ?? "",
      Boolean(u.survey),
      u.savedCount,
      u.utmSource,
      u.utmCampaign,
      // Дата согласия и редакция документа — то, чем согласие подтверждается.
      // Пусто у зарегистрированных до введения галочек.
      consentCell(u.consents, "personal_data"),
      consentCell(u.consents, "mailing"),
    ]
      .map(cell)
      .join(";"),
  );

  // BOM — чтобы Excel открыл кириллицу в UTF-8 без «кракозябр»;
  // разделитель «;» — тоже ради русской локали Excel.
  const csv = "﻿" + [HEADERS.map(cell).join(";"), ...rows].join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="sovetmam-users.csv"',
      "Cache-Control": "no-store",
    },
  });
}
