"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, X, Loader2, Trash2, Upload } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { AVATAR_EMOJIS, AVATAR_BGS, type ResolvedAvatar } from "@/lib/avatar";
import {
  uploadAvatarAction,
  setEmojiAvatarAction,
  removeAvatarAction,
  type AvatarResult,
} from "@/app/(app)/login/onboarding-actions";

export function AvatarEditor({
  avatar,
  size = 64,
}: {
  avatar: ResolvedAvatar;
  size?: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [emoji, setEmoji] = useState(AVATAR_EMOJIS[0]);
  const [bg, setBg] = useState(AVATAR_BGS[1]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function done(res: AvatarResult) {
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const fd = new FormData();
    fd.set("file", f);
    setError(null);
    start(async () => done(await uploadAvatarAction(fd)));
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative shrink-0"
        aria-label="Изменить фото профиля"
      >
        <UserAvatar avatar={avatar} size={size} />
        <span className="absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full bg-[#1B3A6B] text-white ring-2 ring-white">
          <Camera className="size-3.5" />
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="w-full max-w-[360px] rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#1A1A1A]">
                Фото профиля
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Закрыть"
                className="rounded-full p-1 hover:bg-black/5"
              >
                <X className="size-5 text-[#6b7078]" />
              </button>
            </div>

            {/* Загрузить фото */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={onFile}
            />
            <button
              type="button"
              disabled={pending}
              onClick={() => fileRef.current?.click()}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B3A6B] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#16305a] disabled:opacity-60"
            >
              <Upload className="size-4" /> Загрузить фото
            </button>

            {/* Или смайлик */}
            <p className="mt-5 text-sm font-medium text-[#4D4D4D]">
              Или выберите смайлик
            </p>
            <div className="mt-2 flex items-center gap-3">
              <div
                className="flex shrink-0 items-center justify-center rounded-full leading-none"
                style={{ width: 56, height: 56, background: bg, fontSize: 28 }}
              >
                <span aria-hidden>{emoji}</span>
              </div>
              <div className="grid grid-cols-8 gap-1">
                {AVATAR_EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`flex size-7 items-center justify-center rounded-md text-lg ${
                      emoji === e ? "bg-black/10" : "hover:bg-black/5"
                    }`}
                  >
                    <span aria-hidden>{e}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-2.5 flex gap-2">
              {AVATAR_BGS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setBg(c)}
                  aria-label="Цвет фона"
                  className={`size-6 rounded-full ${
                    bg === c ? "ring-2 ring-[#1B3A6B] ring-offset-2" : ""
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setError(null);
                start(async () => done(await setEmojiAvatarAction(emoji, bg)));
              }}
              className="mt-3 w-full rounded-xl border border-[#1B3A6B] py-2.5 text-sm font-semibold text-[#1B3A6B] transition-colors hover:bg-[#1B3A6B]/[0.06] disabled:opacity-60"
            >
              Поставить смайлик
            </button>

            {error && <p className="mt-3 text-sm text-[#8E1D2C]">{error}</p>}

            {avatar.kind !== "default" && (
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setError(null);
                  start(async () => done(await removeAvatarAction()));
                }}
                className="mx-auto mt-4 flex items-center gap-1.5 text-sm text-[#8a8f97] hover:text-[#8E1D2C]"
              >
                <Trash2 className="size-4" /> Убрать фото
              </button>
            )}

            {pending && (
              <div className="mt-3 flex justify-center">
                <Loader2 className="size-5 animate-spin text-[#1B3A6B]" />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
