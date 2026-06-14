import Link from "next/link";
import { MEASURE_TYPES, type MeasureType } from "@/lib/home-taxonomy";
import { MEASURE_TYPE_ICONS } from "./icons";
import { SectionHeading } from "./section-heading";

/**
 * «Классификация поддержки»: по типу помощи и по частоте получения.
 * Карточка — иконка в круглой подложке + заголовок капсом + описание.
 * Карточки частоты помечены красной полосой слева.
 */
export function MeasureTypes() {
  const byType = MEASURE_TYPES.filter((t) => t.group === "type");
  const byFreq = MEASURE_TYPES.filter((t) => t.group === "frequency");

  return (
    <section>
      <SectionHeading>Классификация поддержки</SectionHeading>

      <div className="mt-5 space-y-5">
        <Group title="По типу помощи" items={byType} variant="type" />
        <Group title="По частоте получения" items={byFreq} variant="freq" />
      </div>
    </section>
  );
}

function Group({
  title,
  items,
  variant,
}: {
  title: string;
  items: MeasureType[];
  variant: "type" | "freq";
}) {
  return (
    <div>
      <p className="mb-2.5 border-b border-border pb-2 text-center text-xs font-bold uppercase tracking-wide text-brand/80">
        {title}
      </p>
      <div className="space-y-2.5">
        {items.map((t) => (
          <TypeCard key={t.id} item={t} variant={variant} />
        ))}
      </div>
    </div>
  );
}

function TypeCard({
  item,
  variant,
}: {
  item: MeasureType;
  variant: "type" | "freq";
}) {
  const Icon = MEASURE_TYPE_ICONS[item.id];
  const isFreq = variant === "freq";
  return (
    <Link
      href={item.href}
      className={
        "flex items-center gap-3.5 rounded-xl bg-card p-3.5 ring-1 ring-border shadow-[0_4px_14px_-10px_rgba(27,58,107,0.5)] transition-all hover:ring-brand/40 " +
        (isFreq ? "border-l-4 border-accent-red" : "")
      }
    >
      <span
        className={
          "flex size-12 shrink-0 items-center justify-center rounded-full " +
          (isFreq
            ? "bg-accent-red-soft text-accent-red"
            : "bg-brand-soft text-brand")
        }
      >
        {Icon && <Icon className="size-5" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold uppercase leading-tight tracking-wide text-brand">
          {item.title}
        </span>
        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
          {item.desc}
        </span>
      </span>
    </Link>
  );
}
