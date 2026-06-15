import Link from "next/link";
import { MEASURE_TYPES, type MeasureType } from "@/lib/home-taxonomy";
import { MEASURE_TYPE_EMOJI, MEASURE_TYPE_DOODLE } from "./icons";
import { Doodle } from "./crayon-doodles";
import { SectionHeading } from "./section-heading";

/**
 * «Классификация поддержки»: по типу помощи и по частоте получения.
 * Карточка — иконка в яркой скруглённой плитке + заголовок капсом + описание.
 * Цвет плитки задаётся по id меры (как в одобренном референсе): бесплатно —
 * зелёный, со скидкой — жёлтый, деньги — красный; частота — оранжевый /
 * фиолетовый / синий. Цвета заданы утилитами Tailwind, поэтому видны во всех
 * темах, а не только в «kids».
 */
const TILE_COLORS: Record<string, string> = {
  // По типу помощи
  free: "bg-emerald-500 shadow-[0_8px_16px_-8px_rgba(16,185,129,0.8)]",
  discount: "bg-amber-400 shadow-[0_8px_16px_-8px_rgba(245,158,11,0.8)]",
  money: "bg-rose-500 shadow-[0_8px_16px_-8px_rgba(244,63,94,0.8)]",
  // По частоте получения
  "once-life": "bg-orange-500 shadow-[0_8px_16px_-8px_rgba(249,115,22,0.8)]",
  "once-year": "bg-violet-500 shadow-[0_8px_16px_-8px_rgba(139,92,246,0.8)]",
  "once-month": "bg-sky-500 shadow-[0_8px_16px_-8px_rgba(14,165,233,0.8)]",
  situational: "bg-teal-500 shadow-[0_8px_16px_-8px_rgba(20,184,166,0.8)]",
};
const TILE_FALLBACK = "bg-brand shadow-[0_8px_16px_-8px_rgba(27,58,107,0.7)]";
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
  const emoji = MEASURE_TYPE_EMOJI[item.id];
  const tile = TILE_COLORS[item.id] ?? TILE_FALLBACK;
  return (
    <Link
      href={item.href}
      data-variant={variant}
      className="sm-card flex items-center gap-3.5 rounded-xl bg-card p-3.5 ring-1 ring-border shadow-[0_4px_14px_-10px_rgba(27,58,107,0.5)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_12px_24px_-12px_rgba(27,58,107,0.6)] hover:ring-2 hover:ring-brand"
    >
      <span
        className={
          "sm-ico-tile flex size-12 shrink-0 items-center justify-center rounded-2xl text-2xl " +
          tile
        }
      >
        <span className="sm-ico-emoji">{emoji}</span>
        <span className="sm-ico-doodle">
          <Doodle name={MEASURE_TYPE_DOODLE[item.id]} className="size-8" />
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold uppercase leading-tight tracking-wide text-foreground">
          {item.title}
        </span>
        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
          {item.desc}
        </span>
      </span>
    </Link>
  );
}
