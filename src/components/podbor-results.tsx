"use client";

import { useMemo, useState } from "react";
import { Clock, AlertCircle } from "lucide-react";
import { MeasureCard } from "@/components/measure-card";
import { PENDING_TEXT, pluralMeasures, type SupportMeasure, type UserProfile } from "@/lib/measures";
import {
  groupPodbor,
  POCKET_ORDER,
  POCKET_TITLE,
  type PodborBlock,
  type PodborItem,
  type PocketKey,
} from "@/lib/podbor-groups";

/**
 * Экран результатов подбора.
 *
 * Сверху — одна общая цифра: сколько мер подошло семье. Дальше два блока:
 * федеральные меры и меры своего региона. Внутри каждого одинаковый порядок —
 * выплаты, бесплатное, скидки, права и поддержка, — а меры со сгорающим сроком
 * подняты в самое начало блока и выделены цветом: деньги теряют не от
 * незнания, а от опоздания.
 */

const PAGE = 5;

function Pending({ item }: { item: PodborItem }) {
  if (item.pending.length === 0) return null;
  return (
    <div className="mt-1.5 space-y-1.5">
      {item.pending.map((reason) => (
        <p
          key={reason}
          className="flex gap-1.5 rounded-xl bg-[#8E1D2C]/[0.06] px-3 py-2 text-[11.5px] leading-snug text-[#8E1D2C]"
        >
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
          {PENDING_TEXT[reason]}
        </p>
      ))}
    </div>
  );
}

function Deadline({ item }: { item: PodborItem }) {
  if (!item.deadline) return null;
  return (
    <p
      className={
        item.deadline.urgent
          ? "mt-1.5 flex gap-1.5 rounded-xl bg-white/70 px-3 py-2 text-[11.5px] font-semibold leading-snug text-[#8E1D2C]"
          : "mt-1.5 flex gap-1.5 rounded-xl bg-black/[0.03] px-3 py-2 text-[11.5px] leading-snug text-muted-foreground"
      }
    >
      <Clock className="mt-px size-3.5 shrink-0" aria-hidden />
      {item.deadline.text}
    </p>
  );
}

function Item({ item }: { item: PodborItem }) {
  return (
    <div>
      <MeasureCard measure={item.measure} />
      <Deadline item={item} />
      <Pending item={item} />
    </div>
  );
}

/**
 * Мера, у которой закрывается срок: подкрашенная подложка и прямая надпись.
 * Такую карточку нельзя пролистать не заметив — в этом весь смысл.
 */
function UrgentItem({ item }: { item: PodborItem }) {
  return (
    <div className="rounded-2xl border border-[#8E1D2C]/30 bg-[#8E1D2C]/[0.05] p-2.5">
      <p className="mb-2 inline-flex items-center gap-1.5 rounded-lg bg-[#8E1D2C] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-white">
        <Clock className="size-3" aria-hidden />
        Скоро истечёт срок действия
      </p>
      <Item item={item} />
    </div>
  );
}

/** Карман внутри блока: выплаты, бесплатное, скидки, права и поддержка. */
function Pocket({ pocket, items }: { pocket: PocketKey; items: PodborItem[] }) {
  const [shown, setShown] = useState(PAGE);
  if (items.length === 0) return null;
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#3A4D63]">
        {POCKET_TITLE[pocket]} · {items.length}
      </p>
      <div className="mt-2 space-y-3">
        {items.slice(0, shown).map((item) => (
          <Item key={item.measure.slug} item={item} />
        ))}
      </div>
      {items.length > shown && (
        <button
          type="button"
          onClick={() => setShown((n) => n + PAGE)}
          className="mt-3 w-full rounded-xl border border-[#1B3A6B]/25 bg-[#1B3A6B]/[0.04] py-2.5 text-sm font-semibold text-[#1B3A6B] transition-colors hover:bg-[#1B3A6B]/[0.08]"
        >
          Показать ещё {Math.min(PAGE, items.length - shown)} из{" "}
          {items.length - shown}
        </button>
      )}
    </div>
  );
}

function Block({
  title,
  note,
  block,
}: {
  title: string;
  note: string;
  block: PodborBlock;
}) {
  if (block.count === 0) return null;
  return (
    <section className="mt-7">
      <h2 className="text-[19px] font-semibold leading-tight text-[#1A1A1A]">
        {title} · {block.count}
      </h2>
      <p className="mt-1 text-xs leading-snug text-muted-foreground">{note}</p>

      {block.urgent.length > 0 && (
        <div className="mt-3 space-y-3">
          {block.urgent.map((item) => (
            <UrgentItem key={item.measure.slug} item={item} />
          ))}
        </div>
      )}

      {POCKET_ORDER.map((key) => (
        <Pocket key={key} pocket={key} items={block.pockets[key]} />
      ))}
    </section>
  );
}

export function PodborResults({
  profile,
  measures,
  footer,
}: {
  profile: UserProfile;
  measures: SupportMeasure[];
  footer?: React.ReactNode;
}) {
  const groups = useMemo(() => groupPodbor(profile, measures), [profile, measures]);

  if (groups.total === 0) return null;

  return (
    <div>
      {/* Общий счёт — первое, что человек видит: сколько мер ему подошло. */}
      <section className="mt-5 rounded-2xl border border-[#1B3A6B]/20 bg-[#1B3A6B]/[0.04] px-4 py-3.5">
        <p className="text-[22px] font-semibold leading-tight text-[#1B3A6B]">
          Вам подходит {pluralMeasures(groups.total)}
        </p>
        <p className="mt-1 text-xs leading-snug text-muted-foreground">
          {groups.urgentCount > 0
            ? "Меры со сгорающим сроком отмечены и подняты наверх — с них и начните."
            : "Сначала федеральные меры, затем меры вашего региона."}
        </p>
      </section>

      <Block
        title="Федеральные меры"
        note="Действуют по всей стране — не зависят от того, где вы живёте."
        block={groups.federal}
      />

      <Block
        title="Меры вашего региона"
        note="Их назначают местные власти, и в соседней области условия могут быть другими."
        block={groups.regional}
      />

      {/* Последним — то, что оформляет сам ребёнок: родителю это знать
          нужно, но подать заявление за него он не может. */}
      <Block
        title="Положено вашему ребёнку"
        note="Заявление ребёнок подаёт на себя сам — с 14 лет через свои Госуслуги. Родитель помогает, но заявителем не будет."
        block={groups.child}
      />

      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        Условия и суммы меняются — проверяйте их при подаче заявления.
      </p>

      {footer}
    </div>
  );
}
