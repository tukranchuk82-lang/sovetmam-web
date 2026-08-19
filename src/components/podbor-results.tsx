"use client";

import { useMemo, useState } from "react";
import { Clock, AlertCircle } from "lucide-react";
import { MeasureCard } from "@/components/measure-card";
import { PENDING_TEXT, pluralMeasures, type SupportMeasure, type UserProfile } from "@/lib/measures";
import {
  groupPodbor,
  POCKET_TITLE,
  type PodborItem,
  type PocketKey,
} from "@/lib/podbor-groups";

/**
 * Экран результатов подбора.
 *
 * Раньше подборка была одной плоской лентой на 30–70 карточек, где маткапитал
 * мог оказаться двадцать седьмым, а первым — телефон доверия. Теперь порядок
 * задаёт книга: сверху то, что горит по срокам, затем «положено всем» (с этого
 * книга начинает разговор, потому что главный миф — «мне ничего не положено»),
 * следом «положено вам» — то, что открылось из-за состава семьи, дохода или
 * статуса. Внутри каждой группы — деньги, скидки, бесплатное.
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
          ? "mt-1.5 flex gap-1.5 rounded-xl bg-[#8E1D2C]/[0.08] px-3 py-2 text-[11.5px] font-semibold leading-snug text-[#8E1D2C]"
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

/** Один «карман» внутри группы: деньги, скидки или бесплатное. */
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

function Group({
  title,
  note,
  count,
  pockets,
}: {
  title: string;
  note: string;
  count: number;
  pockets: Record<PocketKey, PodborItem[]>;
}) {
  if (count === 0) return null;
  return (
    <section className="mt-7">
      <h2 className="text-[19px] font-semibold leading-tight text-[#1A1A1A]">
        {title} · {count}
      </h2>
      <p className="mt-1 text-xs leading-snug text-muted-foreground">{note}</p>
      {(["money", "discount", "free"] as PocketKey[]).map((key) => (
        <Pocket key={key} pocket={key} items={pockets[key]} />
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
      {/* Сроки — наверху и отдельно: книга Буцкой прямо говорит, что деньги
          теряют не от незнания, а от опоздания. Эти же меры остаются и в своих
          группах ниже, чтобы список не выглядел рваным. */}
      {groups.urgent.length > 0 && (
        <section className="mt-5 rounded-2xl border border-[#8E1D2C]/25 bg-[#8E1D2C]/[0.04] p-4">
          <h2 className="text-[17px] font-semibold leading-tight text-[#8E1D2C]">
            Успеть подать · {groups.urgent.length}
          </h2>
          <p className="mt-1 text-xs leading-snug text-[#8E1D2C]/80">
            У этих мер закрывается срок. Пропустите — право сгорит, и
            восстановить его будет нельзя.
          </p>
          <div className="mt-3 space-y-3">
            {groups.urgent.map((item) => (
              <Item key={item.measure.slug} item={item} />
            ))}
          </div>
        </section>
      )}

      <Group
        title="Положено всем"
        note="Эти меры не требуют ни особого статуса, ни проверки дохода — достаточно того, что у вас есть ребёнок или вы его ждёте."
        count={groups.forAllCount}
        pockets={groups.forAll}
      />

      <Group
        title="Положено вам"
        note="Открылись благодаря составу семьи, доходу или статусу. Если что-то изменится, список тоже изменится — обновите ответы."
        count={groups.forYouCount}
        pockets={groups.forYou}
      />

      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        Всего подобрано {pluralMeasures(groups.total)}. Условия и суммы
        меняются — проверяйте их при подаче заявления.
      </p>

      {footer}
    </div>
  );
}
