import Link from "next/link";
import { Share2, ExternalLink } from "lucide-react";
import { getShareStats } from "@/lib/share-admin";
import { AdminPageHeader } from "@/components/admin/page-header";

export const metadata = { title: "Поделились" };
export const dynamic = "force-dynamic";

/** Понятное имя метки вместо служебного слова в ссылке. */
const SOURCE_LABEL: Record<string, string> = {
  share: "Кнопка «Поделиться»",
  "без метки": "Без метки",
};

/** Понятное имя способа отправки. */
const CHANNEL_LABEL: Record<string, string> = {
  telegram: "Telegram",
  max: "MAX",
  whatsapp: "WhatsApp",
  vk: "ВКонтакте",
  copy: "Скопировали ссылку",
  through: "Другие приложения (окно телефона)",
  неизвестно: "Не записано (до появления выбора)",
};

export default async function SharePage() {
  const stats = await getShareStats();

  return (
    <div className="px-4 py-5 md:px-6">
      <AdminPageHeader
        icon={<Share2 />}
        title="Поделились"
        description="Сколько раз отправили ссылку на приложение, сколько людей по ней пришло и сколько осталось."
      />

      {/* Цепочка целиком: поделились → пришли → зарегистрировались. Три числа
          рядом показывают, где теряются люди. */}
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Поделились всего" value={stats.shares.total} accent />
        <Stat label="Поделились за 7 дней" value={stats.shares.last7} />
        <Stat label="Пришло людей" value={stats.people} accent />
        <Stat label="Из них зарегистрировались" value={stats.signups} />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Переходов всего" value={stats.visits.total} />
        <Stat label="Переходов за 7 дней" value={stats.visits.last7} />
        <Stat label="Переходов за 30 дней" value={stats.visits.last30} />
        <Stat label="Поделились за 30 дней" value={stats.shares.last30} />
      </div>

      <div className="mt-2 rounded-2xl border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Чем делятся чаще всего
        </p>

        {stats.topPaths.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Пока никто не делился. Кнопка «Поделиться» стоит внизу главной
            страницы и на странице каждой меры.
          </p>
        ) : (
          <ul className="mt-3 space-y-1.5">
            {stats.topPaths.map((p) => (
              <li
                key={p.path}
                className="flex items-baseline justify-between gap-3 border-b pb-1.5 last:border-0"
              >
                <Link
                  href={p.path}
                  className="inline-flex min-w-0 items-center gap-1.5 text-sm hover:underline"
                >
                  <span className="truncate">{p.title ?? p.path}</span>
                  <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
                </Link>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {p.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-2 rounded-2xl border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Куда отправляют
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Что нажали в окне «Поделиться». Отправил человек ссылку в чужом
          приложении или передумал — нам уже не видно, поэтому это счёт
          намерений, а не доставленных сообщений.
        </p>

        {stats.byChannel.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Пока никто не делился.
          </p>
        ) : (
          <ul className="mt-3 space-y-1.5">
            {stats.byChannel.map((c) => (
              <li
                key={c.channel}
                className="flex items-baseline justify-between gap-3 border-b pb-1.5 last:border-0"
              >
                <span className="truncate text-sm">
                  {CHANNEL_LABEL[c.channel] ?? c.channel}
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {c.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-2 rounded-2xl border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Откуда приходят
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Метка в ссылке. Кнопка «Поделиться» ставит свою; той же меткой можно
          размечать ссылки в рассылках и постах — они попадут в этот же список.
        </p>

        {stats.bySource.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Переходов по размеченным ссылкам пока не было.
          </p>
        ) : (
          <ul className="mt-3 space-y-1.5">
            {stats.bySource.map((s) => (
              <li
                key={s.source}
                className="flex items-baseline justify-between gap-3 border-b pb-1.5 last:border-0"
              >
                <span className="truncate text-sm">
                  {SOURCE_LABEL[s.source] ?? s.source}
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {s.visits}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        «Пришло людей» считается по устройствам: десять заходов с одного
        телефона — это один человек. Переходы считаются один раз за визит,
        поэтому обновление страницы счётчик не накручивает.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={
          accent
            ? "mt-1 text-2xl font-extrabold text-[#8E1D2C]"
            : "mt-1 text-2xl font-extrabold"
        }
      >
        {value}
      </p>
    </div>
  );
}
