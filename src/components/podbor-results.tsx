"use client";

import { useState } from "react";
import { Clock, AlertCircle, Sparkles } from "lucide-react";
import { MeasureCard } from "@/components/measure-card";
import { PENDING_TEXT } from "@/lib/measures";
import {
  POCKET_ORDER,
  POCKET_TITLE,
  type PodborBlock,
  type PodborGroups,
  type PodborItem,
  type PocketKey,
} from "@/lib/podbor-groups";
import { PRIORITY_SITUATIONS, type PrioritySituationKey } from "@/lib/taxonomy";

/**
 * Экран результатов подбора.
 *
 * Порядок: сначала тема, которую человек назвал самой важной, затем
 * федеральные меры и меры своего региона. Внутри каждого блока одинаковый
 * порядок — выплаты, бесплатное, скидки, права и поддержка, — а меры со
 * сгорающим сроком подняты в начало блока: деньги теряют не от незнания, а от
 * опоздания.
 *
 * Оформление — фирменное: кремовый фон, засечные заголовки, бордо как
 * единственный акцент. Раньше здесь были бледно-синие подложки на каждом
 * блоке, и экран выглядел «как в больнице» (замечание заказчика 09.09.2026).
 */

const PAGE = 5;
const SERIF = { fontFamily: "var(--font-playfair), serif" } as const;
const INK = "#15234A"; // тёмно-синий текст заголовков — как на главной

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
    <div className="rounded-2xl bg-[#8E1D2C]/[0.045] p-2.5 ring-1 ring-[#8E1D2C]/20">
      <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#8E1D2C] px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-white shadow-[0_6px_14px_-8px_rgba(142,29,44,0.9)]">
        <Clock className="size-3" aria-hidden />
        Скоро истечёт срок
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
    <div className="mt-5">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f97]">
        <span className="h-px w-5 bg-[#8E1D2C]/45" aria-hidden />
        {POCKET_TITLE[pocket]}
        <span className="text-[#c3c7cd]">{items.length}</span>
      </p>
      <div className="mt-2.5 space-y-3">
        {items.slice(0, shown).map((item) => (
          <Item key={item.measure.slug} item={item} />
        ))}
      </div>
      {items.length > shown && (
        <button
          type="button"
          onClick={() => setShown((n) => n + PAGE)}
          className="mt-3 w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-[#8E1D2C] shadow-[0_8px_20px_-16px_rgba(26,26,26,0.5)] ring-1 ring-[#8E1D2C]/20 transition-all hover:bg-[#8E1D2C]/[0.04] active:scale-[0.99]"
        >
          Показать ещё {Math.min(PAGE, items.length - shown)} из {items.length - shown}
        </button>
      )}
    </div>
  );
}

function BlockBody({ block }: { block: PodborBlock }) {
  return (
    <>
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
    </>
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
    <section className="mt-8">
      <div className="flex items-baseline gap-2">
        <h2
          className="text-[22px] font-normal leading-tight"
          style={{ ...SERIF, color: INK }}
        >
          {title}
        </h2>
        <span className="text-[13px] font-semibold text-[#8E1D2C]">{block.count}</span>
      </div>
      {/* Тонкая бордовая черта под заголовком — тот же приём, что на главной. */}
      <div className="mt-1.5 h-px w-10 bg-[#8E1D2C]/50" aria-hidden />
      <p className="mt-2 text-xs leading-snug text-muted-foreground">{note}</p>
      <BlockBody block={block} />
    </section>
  );
}

/** Блок выбранной темы — выделен карточкой: это то, за чем человек пришёл. */
function PriorityBlock({
  situation,
  block,
}: {
  situation: (typeof PRIORITY_SITUATIONS)[number];
  block: PodborBlock;
}) {
  return (
    <section className="mt-5 rounded-3xl bg-white p-4 shadow-[0_16px_36px_-28px_rgba(26,26,26,0.7)] ring-1 ring-[#8E1D2C]/15">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#8E1D2C]/[0.08] px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#8E1D2C]">
        <Sparkles className="size-3" aria-hidden />
        Важно для вас сейчас
      </span>
      <div className="mt-2 flex items-baseline gap-2">
        <h2
          className="text-[24px] font-normal leading-tight"
          style={{ ...SERIF, color: INK }}
        >
          {situation.title}
        </h2>
        <span className="text-[13px] font-semibold text-[#8E1D2C]">{block.count}</span>
      </div>
      <p className="mt-1 text-xs leading-snug text-muted-foreground">{situation.short}</p>
      <BlockBody block={block} />
    </section>
  );
}

export function PodborResults({
  groups,
  prioritySituation,
  footer,
}: {
  groups: PodborGroups;
  prioritySituation?: PrioritySituationKey | null;
  footer?: React.ReactNode;
}) {
  const situation = prioritySituation
    ? PRIORITY_SITUATIONS.find((s) => s.key === prioritySituation)
    : undefined;

  if (groups.total === 0) return null;

  return (
    <div>
      {/* Тема, которую человек назвал самой важной сейчас, — до всего
          остального: за ней он и пришёл. */}
      {situation && groups.priority.count > 0 && (
        <PriorityBlock situation={situation} block={groups.priority} />
      )}

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
