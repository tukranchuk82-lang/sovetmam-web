"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, ArrowLeft, Loader2, ArrowRight } from "lucide-react";
import {
  checkEmail,
  sendLoginCode,
  requestCode,
  verifyCode,
} from "@/app/(app)/login/onboarding-actions";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

type Step = "email" | "register" | "code";
type Mode = "login" | "register";

export function EmailAuthFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/profile";

  const [step, setStep] = useState<Step>("email");
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [noAccount, setNoAccount] = useState(false); // «У меня уже есть аккаунт»
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
        const sent = await sendLoginCode(value);
        if (!sent.ok) return setError(sent.error);
        setMode("login");
        setDevCode(sent.devCode ?? null);
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
    if (!lastName.trim()) return setError("Укажите фамилию.");
    startTransition(async () => {
      const res = await requestCode({ firstName, lastName, email });
      if (!res.ok) return setError(res.error);
      setMode("register");
      setDevCode(res.devCode ?? null);
      setStep("code");
    });
  }

  // Шаг 3 — код из письма.
  function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await verifyCode({ email, code });
      if (!res.ok) return setError(res.error);
      // После регистрации — обязательный шаг подключения мессенджера.
      if (mode === "register") {
        router.push(`/connect?next=${encodeURIComponent(next)}`);
      } else {
        router.push(next);
      }
    });
  }

  function resend() {
    setError(null);
    setCode("");
    startTransition(async () => {
      const res =
        mode === "register"
          ? await requestCode({ firstName, lastName, email })
          : await sendLoginCode(email);
      if (res.ok) setDevCode(res.devCode ?? null);
      else setError(res.error);
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
          <div className="grid grid-cols-2 gap-3">
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
              placeholder="Фамилия"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              required
            />
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

      {/* ===== Шаг 3: код из письма ===== */}
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
            Код отправлен на <span className="font-semibold">{email}</span>.
            Введите его ниже.
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
        </form>
      )}
    </div>
  );
}
