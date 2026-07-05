"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Gift,
  BadgePercent,
  RussianRuble,
  X,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

// Экран «Классификация мер поддержки» — по референсу заказчика.
// Готовые иллюстрации берём из public: family.png (семья сверху) и way.png
// (целиком блок «По частоте получения» — путь с пинами и подписями).
// Дорисованная часть — заголовок и блок «По типу помощи» (3 карточки).
// Карточки кликабельны → попап с предложением подобрать меры по анкете.

const RED = "#D9415D"; // коралловый акцент (иконки)
const CIRCLE = "#FBE8EC"; // светлый розовый кружок под иконкой
const T1 = "#15234A"; // тёмно-синий текст
const T2 = "#5E6785"; // вторичный текст

interface TypeItem {
  icon: LucideIcon;
  label: string;
  note: string;
}

const TYPE_ITEMS: TypeItem[] = [
  {
    icon: Gift,
    label: "Бесплатно",
    note: "услуги и вещи, которые предоставляют безвозмездно",
  },
  {
    icon: BadgePercent,
    label: "Со скидкой",
    note: "льготы на оплату услуг, проезда и ЖКУ",
  },
  {
    icon: RussianRuble,
    label: "Выплаты",
    note: "пособия, выплаты и капиталы",
  },
];

export function Classification() {
  const [active, setActive] = useState<TypeItem | null>(null);

  return (
    <section
      className="px-5 pb-10 pt-6"
      style={{ fontFamily: "var(--font-inter), sans-serif", color: T1 }}
    >
      {/* Заголовок */}
      <h2
        className="text-center text-[28px] font-normal leading-[1.12]"
        style={{ fontFamily: "var(--font-playfair), serif", color: T1 }}
      >
        Классификация мер поддержки
      </h2>

      {/* Иллюстрация семьи */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/family.png"
        alt="Семья с ребёнком"
        className="mx-auto mt-4 w-full max-w-[420px] mix-blend-multiply"
      />

      {/* ---------- По типу помощи ---------- */}
      <h3
        className="mt-6 text-[20px] font-semibold"
        style={{ fontFamily: "var(--font-playfair), serif", color: T1 }}
      >
        По типу помощи
      </h3>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {TYPE_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => setActive(item)}
              className="flex flex-col items-center rounded-2xl border border-black/[0.06] px-2 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_10px_24px_-12px_rgba(30,41,59,0.28)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_16px_30px_-12px_rgba(30,41,59,0.34)] active:scale-95"
              style={{
                background:
                  "linear-gradient(160deg, #EDEFF2 0%, #D7DCE2 54%, #C3C9D1 100%)",
              }}
            >
              <span
                className="flex size-14 items-center justify-center rounded-full ring-1 ring-white/40 shadow-[0_6px_14px_-6px_rgba(116,17,31,0.55)]"
                style={{
                  background:
                    "linear-gradient(150deg, #A32334 0%, #8E1D2C 58%, #74111F 100%)",
                }}
              >
                <Icon size={26} strokeWidth={1.7} color="#FFFFFF" aria-hidden />
              </span>
              <span
                className="mt-2.5 text-center text-[13px] font-semibold leading-tight"
                style={{ color: T1 }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ---------- По частоте получения ---------- */}
      <h3
        className="mt-8 text-[20px] font-semibold"
        style={{ fontFamily: "var(--font-playfair), serif", color: T1 }}
      >
        По частоте получения
      </h3>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/way.png"
        alt="Путь: классификация мер по частоте получения — 1 раз в жизни, 1 раз в год, 1 раз в месяц, по ситуации"
        className="mx-auto mt-3 w-full max-w-[420px] mix-blend-multiply"
      />

      {/* ---------- Попап: подбор мер по анкете ---------- */}
      {active && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center"
          onClick={() => setActive(null)}
        >
          <div
            className="w-full max-w-[360px] rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-full"
                style={{ background: CIRCLE }}
              >
                <active.icon size={20} strokeWidth={1.6} color={RED} aria-hidden />
              </span>
              <h4
                className="flex-1 pt-1 text-[17px] font-semibold leading-tight"
                style={{ color: T1 }}
              >
                Подберём меры под вашу ситуацию
              </h4>
              <button
                type="button"
                onClick={() => setActive(null)}
                aria-label="Закрыть"
                className="shrink-0 rounded-full p-1 transition-colors hover:bg-black/5"
              >
                <X size={18} color={T2} />
              </button>
            </div>

            <p className="mt-3 text-[14px] leading-relaxed" style={{ color: T2 }}>
              «{active.label}» — это {active.note}. Чтобы узнать, что положено
              именно вашей семье, пройдите короткую анкету — мы подберём меры
              индивидуально под вашу ситуацию.
            </p>

            <Link
              href="/podbor"
              onClick={() => setActive(null)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[15px] font-semibold text-white"
              style={{
                background: "linear-gradient(to bottom, #B51234, #8E1D2C)",
                boxShadow: "0 12px 24px -14px rgba(142,29,44,0.6)",
              }}
            >
              <Sparkles size={18} aria-hidden />
              Подберём меры
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
