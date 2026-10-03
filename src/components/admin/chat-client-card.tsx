import type { ClientCard } from "@/lib/chat-client-card";
import { Avatar } from "@/components/avatar";
import { cn } from "@/lib/utils";

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
}

function Row({ label, children, dark }: { label: string; children: React.ReactNode; dark: boolean }) {
  return (
    <div className="grid grid-cols-[96px_1fr] gap-2 py-2.5 text-[13px]">
      <dt className={dark ? "text-white/55" : "text-muted-foreground"}>{label}</dt>
      <dd className="min-w-0 break-words font-medium">{children}</dd>
    </div>
  );
}

function Group({ title, children, dark }: { title: string; children: React.ReactNode; dark: boolean }) {
  return (
    <section className="mt-5">
      <h3
        className={cn(
          "text-[11px] font-semibold uppercase tracking-wide",
          dark ? "text-white/50" : "text-muted-foreground",
        )}
      >
        {title}
      </h3>
      <dl className={cn("mt-1 divide-y", dark ? "divide-white/10" : "")}>{children}</dl>
    </section>
  );
}

/**
 * Карточка выбранного человека: справа от переписки на широком экране (тёмная
 * панель), в боковой панели — на телефоне (светлая).
 */
export function ChatClientCardView({ card, dark = false }: { card: ClientCard; dark?: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <Avatar name={card.name} color={dark ? "#4F73B8" : "#1B3A6B"} size={46} />
        <div className="min-w-0">
          <p className="truncate font-bold leading-snug">{card.name}</p>
          <p className={cn("truncate text-xs", dark ? "text-white/55" : "text-muted-foreground")}>{card.email}</p>
        </div>
      </div>

      <Group title="Клиент" dark={dark}>
        <Row label="Регион" dark={dark}>{card.region ?? "—"}</Row>
        {card.settlement && <Row label="Где живёт" dark={dark}>{card.settlement}</Row>}
        <Row label="В приложении с" dark={dark}>{fmt(card.createdAt)}</Row>
        <Row label="Мессенджеры" dark={dark}>
          {card.messengers.length ? card.messengers.join(", ") : "не подключены"}
        </Row>
      </Group>

      <Group title="Семья по анкете" dark={dark}>
        {card.hasSurvey ? (
          <>
            <Row label="Детей" dark={dark}>{card.childrenCount ?? "нет"}</Row>
            <Row label="Особенности" dark={dark}>{card.flags.length ? card.flags.join(", ") : "—"}</Row>
            <Row label="Анкета от" dark={dark}>{fmt(card.surveyUpdatedAt)}</Row>
          </>
        ) : (
          <Row label="Анкета" dark={dark}>не заполнена</Row>
        )}
      </Group>

      <Group title="Активность" dark={dark}>
        <Row label="В избранном" dark={dark}>
          {card.savedCount > 0 ? (
            <>
              {card.savedCount}
              <span className={cn("mt-1 block text-xs font-normal", dark ? "text-white/55" : "text-muted-foreground")}>
                {card.savedTitles.join(" · ")}
              </span>
            </>
          ) : (
            "ничего"
          )}
        </Row>
        <Row label="Прежние обращения" dark={dark}>
          {card.earlierInquiries > 0 ? `${card.earlierInquiries} по почте` : "не было"}
        </Row>
      </Group>
    </div>
  );
}
