// Разрешение аватара и палитры для смайлик-аватара (как в Telegram-группах).
// Чистый модуль (без server-only) — можно использовать и на сервере, и в клиенте.

export type ResolvedAvatar =
  | { kind: "image"; url: string }
  | { kind: "emoji"; emoji: string; bg: string }
  | { kind: "default" };

interface AvatarFields {
  avatarUrl?: string | null;
  avatarEmoji?: string | null;
  avatarBg?: string | null;
  messengerAvatarUrl?: string | null;
}

// Приоритет: загруженное фото → смайлик → фото из мессенджера → дефолт.
export function resolveUserAvatar(u: AvatarFields): ResolvedAvatar {
  if (u.avatarUrl) return { kind: "image", url: u.avatarUrl };
  if (u.avatarEmoji)
    return { kind: "emoji", emoji: u.avatarEmoji, bg: u.avatarBg ?? "#1B3A6B" };
  if (u.messengerAvatarUrl) return { kind: "image", url: u.messengerAvatarUrl };
  return { kind: "default" };
}

export const AVATAR_EMOJIS = [
  "😊", "🌸", "❤️", "⭐", "🌷", "🐣", "🌈", "🍼",
  "👶", "🐻", "🌻", "🎈", "🦋", "🍀", "☀️", "🎀",
];

export const AVATAR_BGS = [
  "#8E1D2C", "#1B3A6B", "#4a9590", "#B5623A",
  "#5B4B8A", "#2E7D5B", "#C77DA0", "#3A4D63",
];
