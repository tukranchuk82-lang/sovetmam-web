"use client";

import { useState, useTransition } from "react";
import { Loader2, Check, X, Link2, ExternalLink } from "lucide-react";
import {
  createAccountForRequest,
  declineRequest,
  resendLoginLink,
} from "@/app/admin/requests/actions";
import type { BotHelpRequest } from "@/lib/bot-help";

/**
 * Заявки на кабинет из ботов.
 *
 * Человек не получил код на почту, написал боту — и ждёт. Поэтому список
 * устроен так, чтобы завести кабинет в три поля и одно нажатие: имя, фамилия,
 * почта. Ссылка уходит ему в тот же чат сама.
 */

const CHANNEL: Record<string, string> = {
  telegram: "Telegram",
  vk: "ВКонтакте",
  max: "MAX",
};

// Ссылка на переписку конкретного клиента в кабинете Salebot — узнать, кто
// это, если почта не распозналась, или просто написать человеку напрямую.
const SALEBOT_PROJECT_ID = "779751";
function salebotClientUrl(clientId: string): string {
  return `https://salebot.pro/projects/${SALEBOT_PROJECT_ID}/clients/${clientId}`;
}

function when(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "только что";
  if (min < 60) return `${min} мин назад`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} ч назад`;
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

export function RequestsList({ items }: { items: BotHelpRequest[] }) {
  const open = items.filter((r) => r.status === "new");
  const closed = items.filter((r) => r.status !== "new");

  return (
    <div className="mt-4 space-y-3">
      {open.length === 0 && (
        <p className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
          Новых заявок нет. Они появятся здесь, когда человек напишет боту из
          формы входа — там есть строчка «код не пришёл».
        </p>
      )}

      {open.map((r) => (
        <RequestCard key={r.id} req={r} />
      ))}

      {closed.length > 0 && (
        <details className="rounded-2xl border bg-card p-4">
          <summary className="cursor-pointer text-sm font-medium">
            Разобранные заявки · {closed.length}
          </summary>
          <ul className="mt-3 space-y-2">
            {closed.map((r) => (
              <li
                key={r.id}
                className="flex items-baseline justify-between gap-3 border-b pb-2 text-sm last:border-0"
              >
                <span className="truncate">
                  {r.name || "Без имени"}{" "}
                  <span className="text-muted-foreground">· {CHANNEL[r.channel]}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {r.status === "done" ? "кабинет создан" : "отклонена"} ·{" "}
                  {when(r.handledAt ?? r.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function RequestCard({ req }: { req: BotHelpRequest }) {
  const [firstName, setFirstName] = useState(req.name?.split(" ")[0] ?? "");
  const [lastName, setLastName] = useState(req.name?.split(" ").slice(1).join(" ") ?? "");
  const [email, setEmail] = useState(req.email ?? "");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ sent: boolean; url: string } | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await createAccountForRequest({
        requestId: req.id,
        email,
        firstName,
        lastName,
      });
      if (!res.ok) return setError(res.error);
      setDone({ sent: res.sent, url: res.url });
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
        <p className="text-sm font-medium text-emerald-900">
          Кабинет создан для {email}
        </p>
        <p className="mt-1 text-xs text-emerald-800">
          {done.sent
            ? `Ссылка отправлена в ${CHANNEL[req.channel]}. Действует 24 часа.`
            : "Бот не принял сообщение — отправьте ссылку человеку сами:"}
        </p>
        {!done.sent && (
          <code className="mt-2 block break-all rounded-lg bg-white p-2 text-xs">
            {done.url}
          </code>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border bg-card p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold">
          {req.name || "Без имени"}
          {req.username && (
            <span className="ml-1.5 font-normal text-muted-foreground">
              @{req.username}
            </span>
          )}
        </p>
        <span className="shrink-0 text-xs text-muted-foreground">
          {CHANNEL[req.channel]} · {when(req.createdAt)}
        </span>
      </div>

      {req.email ? (
        <p className="mt-1 text-xs font-medium text-emerald-700">{req.email}</p>
      ) : (
        <p className="mt-1 text-xs text-amber-700">
          Почта не распозналась — уточните у человека в {CHANNEL[req.channel]} и впишите ниже
        </p>
      )}
      <a
        href={salebotClientUrl(req.salebotClientId)}
        target="_blank"
        rel="noreferrer"
        className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
      >
        <ExternalLink className="size-3" /> Открыть чат в Salebot
      </a>

      {req.note && (
        <p className="mt-1.5 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          {req.note}
        </p>
      )}

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <input
          className="rounded-lg border bg-background px-3 py-2 text-sm"
          placeholder="Имя"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <input
          className="rounded-lg border bg-background px-3 py-2 text-sm"
          placeholder="Фамилия"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <input
          className="rounded-lg border bg-background px-3 py-2 text-sm"
          placeholder="Почта"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {error && <p className="mt-2 text-sm text-[#8E1D2C]">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Check className="size-3.5" />
          )}
          Создать кабинет и отправить ссылку
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => start(async () => void (await declineRequest(req.id)))}
          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs text-muted-foreground hover:bg-muted disabled:opacity-60"
        >
          <X className="size-3.5" />
          Отклонить
        </button>
        {req.userId && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await resendLoginLink({ requestId: req.id });
                if (res.ok) setDone({ sent: res.sent, url: res.url });
                else setError(res.error);
              })
            }
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs text-muted-foreground hover:bg-muted disabled:opacity-60"
          >
            <Link2 className="size-3.5" />
            Прислать ссылку заново
          </button>
        )}
      </div>
    </form>
  );
}
