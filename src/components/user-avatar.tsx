import { User } from "lucide-react";
import type { ResolvedAvatar } from "@/lib/avatar";

// Аватар пользователя: фото / смайлик на фоне / дефолт (человечек на белом).
export function UserAvatar({
  avatar,
  size,
}: {
  avatar: ResolvedAvatar;
  size: number;
}) {
  const box = { width: size, height: size } as const;

  if (avatar.kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatar.url}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover ring-1 ring-black/10"
        style={box}
      />
    );
  }

  if (avatar.kind === "emoji") {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-full leading-none"
        style={{ ...box, background: avatar.bg, fontSize: Math.round(size * 0.5) }}
      >
        <span aria-hidden>{avatar.emoji}</span>
      </div>
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-black/10"
      style={box}
    >
      <User
        style={{ width: Math.round(size * 0.55), height: Math.round(size * 0.55) }}
        className="text-[#9aa0a8]"
      />
    </div>
  );
}
