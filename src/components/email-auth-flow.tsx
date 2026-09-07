"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, ArrowLeft, Loader2, ArrowRight, Send, MessageCircle } from "lucide-react";
import {
  checkEmail,
  sendLoginCode,
  requestCode,
  verifyCode,
  codeChannels,
  type CodeChannel,
} from "@/app/(app)/login/onboarding-actions";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Где лежат правовые документы — общий сайт для всех наших сервисов. */
const DOCS_URL = "https://doc.sovetmam.ru";

/**
 * Строка с галочкой согласия.
 *
 * Галочка не отмечена заранее и никогда не отмечается за человека:
 * предустановленная отметка согласием не считается.
 */
function Consent({
  checked,
  onChange,
  required,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-[#8E1D2C]"
      />
      <span className="text-xs leading-snug text-[#4D4D4D]">
        {children}
        {required && <span className="text-[#8E1D2C]"> *</span>}
      </span>
    </label>
  );
}

// Топ популярных почтовых доменов — для подсказки об опечатке.
const POPULAR_DOMAINS = [
  "mail.ru",
  "yandex.ru",
  "gmail.com",
  "bk.ru",
  "inbox.ru",
  "list.ru",
  "rambler.ru",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "yahoo.com",
  "vk.com",
];

// Расстояние Левенштейна (число правок).
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(
        dp[j] + 1,
        dp[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      prev = tmp;
    }
  }
  return dp[n];
}

// Если домен похож на популярный (1–2 опечатки), но не совпадает — вернём
// исправленный email; иначе null.
function suggestEmail(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 1) return null;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1).toLowerCase().trim();
  if (!domain.includes(".") || domain.includes(" ")) return null;
  if (POPULAR_DOMAINS.includes(domain)) return null;
  let best: string | null = null;
  let bestD = Infinity;
  for (const d of POPULAR_DOMAINS) {
    const dist = levenshtein(domain, d);
    if (dist < bestD) {
      bestD = dist;
      best = d;
    }
  }
  if (best && bestD >= 1 && bestD <= 2) return `${local}@${best}`;
  return null;
}

const inputCls =
  "w-full rounded-xl border border-black/[0.1] bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] shadow-sm placeholder:text-[#9aa0a8] focus:border-[#8E1D2C]/40 focus:outline-none";

const btnCls =
  "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#8E1D2C] text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(142,29,44,0.6)] transition-colors hover:bg-[#7c1826] disabled:opacity-60";

type Step = "email" | "register" | "channel" | "code";

/** Названия каналов — как их видит человек. */
const CHANNEL_LABEL: Record<CodeChannel, string> = {
  email: "На почту",
  max: "В MAX",
  vk: "Во «ВКонтакте»",
  telegram: "В Telegram",
};

const CHANNEL_HINT: Record<CodeChannel, string> = {
  email: "письмо приходит за минуту, иногда попадает в спам",
  max: "сообщение от нашего бота — приходит сразу",
  vk: "сообщение от нашего бота — приходит сразу",
  telegram: "сообщение от нашего бота — приходит сразу",
};

// Свой цвет на каждый канал — чтобы список читался с одного взгляда, а не
// одинаковыми белыми карточками. Email и MAX берут цвета из фирменного стиля
// сайта; Telegram и «ВКонтакте» — их узнаваемые брендовые синие.
const CHANNEL_STYLE: Record<CodeChannel, { bg: string; fg: string }> = {
  email: { bg: "#8E1D2C", fg: "#ffffff" },
  telegram: { bg: "#26A5E4", fg: "#ffffff" },
  vk: { bg: "#0077FF", fg: "#ffffff" },
  max: { bg: "#172A4B", fg: "#ffffff" },
};

function ChannelIcon({ channel }: { channel: CodeChannel }) {
  if (channel === "email") return <Mail className="size-5" />;
  if (channel === "telegram") return <Send className="size-5" />;
  if (channel === "max") return <MessageCircle className="size-5" />;
  // «ВКонтакте» — своей иконки в наборе нет, берём узнаваемые буквы.
  return <span className="text-[13px] font-extrabold tracking-tight">VK</span>;
}

type Mode = "login" | "register";

export function EmailAuthFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [step, setStep] = useState<Step>("email");
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [noAccount, setNoAccount] = useState(false); // «У меня уже есть аккаунт»
  // Куда можно прислать код. Мессенджер доступен, только если бот уже
  // подключён к аккаунту — иначе боту некуда писать.
  const [channels, setChannels] = useState<CodeChannel[]>(["email"]);
  const [sentTo, setSentTo] = useState<CodeChannel>("email");
  // Согласия при регистрации. Обязательное — на обработку данных, без него
  // аккаунт не создаём; рассылка добровольна и ни на что не влияет.
  const [consentData, setConsentData] = useState(false);
  const [consentMailing, setConsentMailing] = useState(false);
  const [pending, startTransition] = useTransition();

  const suggestion = suggestEmail(email);

  function goToEmail() {
    setStep("email");
    setError(null);
    setNoAccount(false);
    setCode("");
  }

  // Шаг 1 — проверяем email в базе и разветвляемся.
  function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const value = email.trim();
    if (!EMAIL_RE.test(value))
      return setError("Некорректный адрес email. Проверьте написание.");
    startTransition(async () => {
      const res = await checkEmail(value);
      if (!res.ok) return setError(res.error);
      if (res.exists) {
        setMode("login");
        // Если бот подключён — сначала спрашиваем, куда прислать код.
        const list = await codeChannels(value);
        setChannels(list);
        if (list.length > 1) return setStep("channel");
        const sent = await sendLoginCode(value);
        if (!sent.ok) return setError(sent.error);
        setDevCode(sent.devCode ?? null);
        setSentTo(sent.sentTo ?? "email");
        setStep("code");
      } else {
        setNoAccount(false);
        setStep("register");
      }
    });
  }

  // Шаг 2 (нет в базе) — регистрация: имя + фамилия.
  function submitRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!firstName.trim()) return setError("Укажите имя.");
    if (!consentData)
      return setError(
        "Без согласия на обработку персональных данных мы не сможем создать аккаунт.",
      );
    startTransition(async () => {
      const res = await requestCode({
        firstName,
        lastName,
        email,
        consentMailing,
      });
      if (!res.ok) return setError(res.error);
      setMode("register");
      setDevCode(res.devCode ?? null);
      setStep("code");
    });
  }

  // Шаг 2а — выбранный канал доставки кода.
  function chooseChannel(channel: CodeChannel) {
    setError(null);
    startTransition(async () => {
      const sent = await sendLoginCode(email, channel);
      if (!sent.ok) return setError(sent.error);
      setDevCode(sent.devCode ?? null);
      setSentTo(sent.sentTo ?? "email");
      setStep("code");
    });
  }

  // Шаг 3 — код из письма или из бота.
  function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await verifyCode({ email, code });
      if (!res.ok) return setError(res.error);
      // Мессенджер больше не обязателен сразу после регистрации — предлагаем
      // подключить его ненавязчиво, кружком на аватарке (см. AppShell).
      router.push(next);
    });
  }

  function resend() {
    setError(null);
    setCode("");
    startTransition(async () => {
      const res =
        mode === "register"
          ? await requestCode({ firstName, lastName, email })
          : await sendLoginCode(email, sentTo);
      if (res.ok) {
        setDevCode(res.devCode ?? null);
        setSentTo(res.sentTo ?? "email");
      } else setError(res.error);
    });
  }

  return (
    <div className="w-full max-w-[340px]">
      {/* Заголовок — только на шаге ввода email */}
      {step === "email" && (
        <div className="mb-6 text-center">
          <h1
            className="text-[26px] font-normal leading-tight text-[#1A1A1A]"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Вход и регистрация
          </h1>
          <p className="mt-1.5 text-sm text-[#6b7078]">
            Введите email. Если вы у нас впервые — быстро зарегистрируем, если
            уже были — пришлём код для входа.
          </p>
        </div>
      )}

      {/* ===== Шаг 1: email ===== */}
      {step === "email" && (
        <form onSubmit={submitEmail} className="space-y-3" noValidate>
          <input
            className={inputCls}
            type="email"
            inputMode="email"
            placeholder="Ваш email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
            required
          />
          {suggestion && (
            <p className="text-xs text-[#6b7078]">
              Возможно, вы имели в виду{" "}
              <button
                type="button"
                onClick={() => setEmail(suggestion)}
                className="font-semibold text-[#8E1D2C] hover:underline"
              >
                {suggestion}
              </button>
              ?
            </p>
          )}
          {error && <p className="text-sm text-[#8E1D2C]">{error}</p>}
          <button type="submit" disabled={pending} className={btnCls}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowRight className="size-4" />
            )}
            Продолжить
          </button>
          <p className="text-center text-xs text-[#8a8f97]">
            Войдите или зарегистрируйтесь — определим по вашей почте.
          </p>
        </form>
      )}

      {/* ===== Шаг 2: регистрация (email не найден) ===== */}
      {step === "register" && (
        <form onSubmit={submitRegister} className="space-y-3" noValidate>
          <button
            type="button"
            onClick={goToEmail}
            className="inline-flex items-center gap-1.5 text-sm text-[#6b7078] hover:text-[#1A1A1A]"
          >
            <ArrowLeft className="size-4" /> Изменить email
          </button>
          <p className="text-sm text-[#4D4D4D]">
            Регистрация для{" "}
            <span className="font-semibold">{email}</span>. Как вас зовут?
          </p>
          <div className="space-y-3">
            <input
              className={inputCls}
              placeholder="Имя"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              autoFocus
              required
            />
            <input
              className={inputCls}
              placeholder="Фамилия (необязательно)"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
            />
          </div>
          {/* Согласия. Показываем только при регистрации: у тех, кто уже
              зарегистрирован, согласие считается данным — переспрашивать их
              заказчик не стал. Обе галочки человек ставит сам, заранее
              отмеченных нет: предустановленная галочка согласием не считается. */}
          <div className="space-y-2.5 rounded-xl border border-black/[0.08] bg-[#f9fafb] p-3">
            <Consent
              checked={consentData}
              onChange={setConsentData}
              required
            >
              Я согласен на{" "}
              <a
                href={`${DOCS_URL}/consent`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#8E1D2C] underline"
              >
                обработку персональных данных
              </a>{" "}
              и ознакомился с{" "}
              <a
                href={`${DOCS_URL}/privacy`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#8E1D2C] underline"
              >
                политикой конфиденциальности
              </a>
            </Consent>

            <Consent checked={consentMailing} onChange={setConsentMailing}>
              Хочу получать{" "}
              <a
                href={`${DOCS_URL}/mailing`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#8E1D2C] underline"
              >
                новости и анонсы
              </a>{" "}
              — необязательно. Ответы на обращения и служебные письма приходят в
              любом случае
            </Consent>
          </div>

          {error && <p className="text-sm text-[#8E1D2C]">{error}</p>}
          <button type="submit" disabled={pending} className={btnCls}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Mail className="size-4" />
            )}
            Зарегистрироваться и войти
          </button>

          {/* «У меня уже есть аккаунт» */}
          {!noAccount ? (
            <button
              type="button"
              onClick={() => setNoAccount(true)}
              className="w-full text-center text-sm text-[#6b7078] hover:text-[#1A1A1A] hover:underline"
            >
              У меня уже есть аккаунт
            </button>
          ) : (
            <div className="rounded-xl border border-black/[0.08] bg-[#f6f7f9] p-3 text-xs leading-relaxed text-[#4D4D4D]">
              В базе нет зарегистрированного аккаунта с почтой{" "}
              <span className="font-semibold">{email}</span>. Проверьте написание
              на опечатки, введите другой email или пройдите регистрацию выше.
              {suggestion && (
                <div className="mt-1.5">
                  Возможно, вы имели в виду{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(suggestion);
                      goToEmail();
                    }}
                    className="font-semibold text-[#8E1D2C] hover:underline"
                  >
                    {suggestion}
                  </button>
                  ?
                </div>
              )}
              <button
                type="button"
                onClick={goToEmail}
                className="mt-2 inline-flex items-center gap-1.5 font-semibold text-[#8E1D2C] hover:underline"
              >
                <ArrowLeft className="size-3.5" /> Ввести другой email
              </button>
            </div>
          )}
        </form>
      )}

      {/* ===== Шаг 3: выбор канала для кода ===== */}
      {step === "channel" && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={goToEmail}
            className="inline-flex items-center gap-1.5 text-sm text-[#6b7078] hover:text-[#1A1A1A]"
          >
            <ArrowLeft className="size-4" /> Изменить email
          </button>

          <div className="text-center">
            <h1
              className="text-[24px] font-normal leading-tight text-[#1A1A1A]"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              Куда прислать код?
            </h1>
            <p className="mt-1.5 text-sm text-[#6b7078]">Выберите, где удобнее его получить</p>
          </div>

          <div className="space-y-2.5">
            {channels.map((c) => {
              const style = CHANNEL_STYLE[c];
              return (
                <button
                  key={c}
                  type="button"
                  disabled={pending}
                  onClick={() => chooseChannel(c)}
                  className="flex w-full items-center gap-3.5 rounded-2xl border border-black/[0.06] bg-white px-4 py-3.5 text-left shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:opacity-60"
                >
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-full"
                    style={{ background: style.bg, color: style.fg }}
                  >
                    <ChannelIcon channel={c} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-[#1A1A1A]">
                      {CHANNEL_LABEL[c]}
                    </span>
                    <span className="mt-0.5 block text-xs text-[#6b7078]">
                      {CHANNEL_HINT[c]}
                    </span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-[#c3c7cd]" />
                </button>
              );
            })}
          </div>

          {error && <p className="text-sm text-[#8E1D2C]">{error}</p>}
        </div>
      )}

      {step === "code" && (
        <form onSubmit={submitCode} className="space-y-3">
          <button
            type="button"
            onClick={goToEmail}
            className="inline-flex items-center gap-1.5 text-sm text-[#6b7078] hover:text-[#1A1A1A]"
          >
            <ArrowLeft className="size-4" /> Изменить email
          </button>
          <p className="text-sm text-[#4D4D4D]">
            {sentTo === "email" ? (
              <>
                Код отправлен на{" "}
                <span className="font-semibold">{email}</span>. Введите его ниже.
              </>
            ) : (
              <>
                Код отправлен сообщением{" "}
                <span className="font-semibold">
                  {sentTo === "max" ? "в MAX" : sentTo === "vk" ? "во «ВКонтакте»" : "в Telegram"}
                </span>{" "}
                — откройте чат с нашим ботом.
              </>
            )}
          </p>
          <input
            className={`${inputCls} text-center text-lg tracking-[0.4em]`}
            inputMode="numeric"
            maxLength={6}
            placeholder="______"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            autoFocus
          />
          {devCode && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-800">
              Демо-режим (почта не подключена): код <b>{devCode}</b>
            </p>
          )}
          {error && <p className="text-sm text-[#8E1D2C]">{error}</p>}
          <button type="submit" disabled={pending} className={btnCls}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {mode === "register" ? "Подтвердить" : "Войти"}
          </button>
          <button
            type="button"
            onClick={resend}
            disabled={pending}
            className="w-full text-center text-sm text-[#8E1D2C] hover:underline disabled:opacity-60"
          >
            Отправить код ещё раз
          </button>
          {/* Для тех, кому код всё равно не приходит: боты подхватывают
              заявку по кодовому слову helpcode и заводят её в админке. */}
          <p className="pt-1 text-center text-xs leading-relaxed text-[#8f949a]">
            Код не пришёл? Напишите нам в{" "}
            <a
              href="https://telegram.me/SovetMaterei_bot?start=helpcode"
              target="_blank"
              rel="noreferrer"
              className="text-[#8E1D2C] hover:underline"
            >
              Telegram
            </a>
            ,{" "}
            <a
              href="https://max.ru/id9718148666_bot?start=helpcode"
              target="_blank"
              rel="noreferrer"
              className="text-[#8E1D2C] hover:underline"
            >
              MAX
            </a>{" "}
            или{" "}
            <a
              href="https://vk.cc/d1nLwo"
              target="_blank"
              rel="noreferrer"
              className="text-[#8E1D2C] hover:underline"
            >
              ВКонтакте
            </a>{" "}
            — поможем войти.
          </p>
        </form>
      )}
    </div>
  );
}
