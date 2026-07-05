"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn } from "lucide-react";
import { OrgName } from "@/components/org-name";
import { BottomNav } from "@/components/bottom-nav";
import { InstallIconButton } from "@/components/install-app-button";

// Единый каркас приложения с посекционным «характером».
//
// Шапка всегда плавает над контентом (absolute), поэтому в разделах с героем
// (Каталог) она делается прозрачной — сквозь неё видно фоновую иллюстрацию.
// В остальных разделах шапка — плотная бордовая плашка, а под ней ставится
// распорка на её высоту, чтобы контент не уезжал под неё.
//
// Аватар считается на сервере (нужны cookie-сессии) и передаётся сюда как
// готовый ReactNode — клиенту остаётся только разместить его.

type Section = "catalog" | "default";

function sectionOf(pathname: string): Section {
  return pathname.startsWith("/catalog") ? "catalog" : "default";
}

// Тёмно-синяя тема шапки/меню — единая для всех разделов.
const NAVY = "linear-gradient(135deg, #274A7E 0%, #1B3A6B 55%, #101D38 100%)";

export function AppShell({
  avatarSlot,
  authed,
  children,
}: {
  avatarSlot: React.ReactNode;
  authed: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const section = sectionOf(pathname);
  const transparent = section === "catalog";

  const headerRef = useRef<HTMLElement>(null);
  const [headerH, setHeaderH] = useState(76);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => setHeaderH(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="relative mx-auto flex h-dvh max-w-[480px] flex-col overflow-hidden bg-white shadow-2xl">
      {/* Сцена: шапка плавает над прокручиваемым контентом */}
      <div className="relative min-h-0 flex-1">
        <header
          ref={headerRef}
          className="pointer-events-none absolute inset-x-0 top-0 z-30 transition-[background,box-shadow] duration-300"
          style={
            transparent
              ? {
                  // Прозрачная шапка: лёгкая синяя вуаль сверху, чтобы текст
                  // читался поверх иллюстрации героя.
                  background:
                    "linear-gradient(180deg, rgba(23,42,75,0.34) 0%, rgba(23,42,75,0.14) 55%, rgba(23,42,75,0) 100%)",
                }
              : {
                  background: NAVY,
                  boxShadow: "0 10px 24px -6px rgba(23,42,75,0.45)",
                }
          }
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <Link
              href="/"
              className="pointer-events-auto flex min-w-0 items-center gap-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.svg"
                alt="Совет матерей"
                width={52}
                height={52}
                className="size-[52px] shrink-0 object-contain"
              />
              <span className="flex min-w-0 flex-col leading-tight">
                <span
                  className="whitespace-nowrap font-semibold leading-none text-white"
                  style={{
                    fontFamily: "var(--font-playfair), serif",
                    fontSize: "clamp(13px, 4vw, 20px)",
                    textShadow:
                      "0 1px 2px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.25)",
                  }}
                >
                  Шпаргалка для родителей
                </span>
                <span
                  className="mt-1.5 whitespace-nowrap text-[11px] leading-tight text-white/70"
                  style={{ fontFamily: "var(--font-inter), sans-serif" }}
                >
                  проект <OrgName genitive />
                </span>
              </span>
            </Link>

            <div className="flex shrink-0 items-center gap-2.5">
              <InstallIconButton className="pointer-events-auto" />
              {authed ? (
                <Link
                  href="/profile"
                  aria-label="Личный кабинет"
                  className="pointer-events-auto shrink-0"
                >
                  {avatarSlot}
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="pointer-events-auto inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-white/50 bg-white/30 px-5 text-sm font-semibold text-white backdrop-blur-sm"
                >
                  <LogIn className="size-4" />
                  Войти
                </Link>
              )}
            </div>
          </div>
        </header>

        <main
          className="absolute inset-0 overflow-y-auto overscroll-contain bg-background text-foreground"
          style={{ "--hdr-h": `${headerH}px` } as React.CSSProperties}
        >
          {/* В разделах без героя контент нельзя прятать под плотную шапку —
              ставим распорку на её высоту. В «Каталоге» герой сам отступает
              на var(--hdr-h). */}
          {!transparent && <div style={{ height: headerH }} aria-hidden />}
          {children}
        </main>
      </div>

      <BottomNav background={NAVY} />
    </div>
  );
}
