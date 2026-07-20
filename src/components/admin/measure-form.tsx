"use client";

import { useState } from "react";
import { CATEGORIES, REGIONS, SEGMENTS } from "@/lib/measures";
import type { MeasureAdminRow } from "@/lib/measures-admin";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const inputCls =
  "w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
const labelCls = "text-xs font-medium text-muted-foreground";

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <div className="mt-1">{children}</div>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </label>
  );
}

const CRITERIA_FLAGS: Array<{ key: string; label: string }> = [
  { key: "requiresPregnancy", label: "беременность" },
  { key: "requiresChildren", label: "есть дети" },
  { key: "requiresLowIncome", label: "низкий доход (до 1 ПМ)" },
  { key: "requiresDisabledChild", label: "ребёнок-инвалид" },
  { key: "requiresMortgageIntent", label: "планирует ипотеку" },
  { key: "requiresSvoFamily", label: "семья участника СВО" },
  { key: "requiresSingleParent", label: "единственный родитель" },
  { key: "requiresStudent", label: "родители-студенты" },
  { key: "requiresParentUnder35", label: "родители до 35 лет" },
  { key: "requiresDisabledParent", label: "родитель-инвалид" },
  { key: "requiresFosterParent", label: "приёмный родитель / опекун" },
  { key: "requiresSelfEmployed", label: "самозанятый" },
  { key: "requiresEntrepreneur", label: "ИП" },
  { key: "requiresTeacher", label: "учитель" },
];

export function MeasureForm({
  initial,
  action,
  submitLabel,
}: {
  initial: MeasureAdminRow | null;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
}) {
  const [level, setLevel] = useState<"federal" | "regional">(
    initial?.level ?? "federal",
  );

  return (
    <form action={action} className="space-y-4">
      <Field label="Slug (часть URL)" hint="латиница, цифры, дефис. Меняется только в редких случаях.">
        <input
          name="slug"
          defaultValue={initial?.slug ?? ""}
          required
          pattern="[a-z0-9-]+"
          className={inputCls}
        />
      </Field>

      <Field label="Название меры">
        <input
          name="title"
          defaultValue={initial?.title ?? ""}
          required
          className={inputCls}
        />
      </Field>

      <Field label="Короткое описание (2–3 строки)">
        <textarea
          name="shortDescription"
          defaultValue={initial?.shortDescription ?? ""}
          required
          rows={3}
          className={inputCls}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Уровень">
          <select
            name="level"
            value={level}
            onChange={(e) => setLevel(e.target.value as "federal" | "regional")}
            className={inputCls}
          >
            <option value="federal">Федеральная</option>
            <option value="regional">Региональная</option>
          </select>
        </Field>

        <Field label="Категория">
          <select
            name="category"
            defaultValue={initial?.category ?? CATEGORIES[0]}
            required
            className={inputCls}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {level === "regional" && (
        <Field label="Регион (для региональной меры)">
          <select
            name="region"
            defaultValue={initial?.region ?? ""}
            className={inputCls}
          >
            <option value="">— не выбран —</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label="Сумма / размер (если есть)" hint="например: «от 630 тыс. ₽» или «ставка до 6%»">
        <input
          name="amount"
          defaultValue={initial?.amount ?? ""}
          className={inputCls}
        />
      </Field>

      <Field label="Подходит для сегментов">
        <div className="flex flex-wrap gap-2">
          {SEGMENTS.map((s) => {
            const checked = initial?.segments?.includes(s.id) ?? false;
            return (
              <label
                key={s.id}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary/10"
              >
                <input
                  type="checkbox"
                  name="segment"
                  value={s.id}
                  defaultChecked={checked}
                  className="size-3.5"
                />
                {s.title}
              </label>
            );
          })}
        </div>
      </Field>

      <fieldset className="rounded-xl border bg-muted/30 p-3">
        <legend className="px-1 text-xs font-medium text-muted-foreground">
          Когда мера подходит (правила подбора)
        </legend>
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
          {CRITERIA_FLAGS.map(({ key, label }) => (
            <label key={key} className="inline-flex items-center gap-1.5">
              <input
                type="checkbox"
                name={`criteria_${key}`}
                defaultChecked={Boolean(
                  (initial?.criteria as Record<string, unknown> | undefined)?.[key],
                )}
              />
              {label}
            </label>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Мин. детей">
            <input
              type="number"
              min={0}
              name="criteria_minChildren"
              defaultValue={initial?.criteria.minChildren ?? ""}
              className={inputCls}
            />
          </Field>
          <Field label="Макс. возраст младшего (лет)">
            <input
              type="number"
              min={0}
              name="criteria_maxYoungestChildAgeYears"
              defaultValue={initial?.criteria.maxYoungestChildAgeYears ?? ""}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="mt-3">
          <Field
            label="Потолок дохода на человека"
            hint="Мера подойдёт всем, чей доход не выше указанного порога. «До 1 ПМ» — то же, что галочка «низкий доход»."
          >
            <select
              name="criteria_maxIncomePm"
              defaultValue={initial?.criteria.maxIncomePm?.toString() ?? ""}
              className={inputCls}
            >
              <option value="">не ограничен</option>
              <option value="1">до 1 ПМ</option>
              <option value="1.5">до 1,5 ПМ</option>
              <option value="2">до 2 ПМ</option>
            </select>
          </Field>
        </div>
        <Field label="Регионы (по одному на строку, для региональных правил)">
          <textarea
            name="criteria_regions"
            defaultValue={initial?.criteria.regions?.join("\n") ?? ""}
            rows={2}
            className={inputCls}
          />
        </Field>
      </fieldset>

      <Field label="Как оформить" hint="каждый шаг — отдельной строкой">
        <textarea
          name="howToApply"
          defaultValue={initial?.howToApply.join("\n") ?? ""}
          rows={4}
          className={inputCls}
        />
      </Field>

      <Field label="Какие документы нужны" hint="каждый документ — отдельной строкой">
        <textarea
          name="documents"
          defaultValue={initial?.documents.join("\n") ?? ""}
          rows={4}
          className={inputCls}
        />
      </Field>

      <Field
        label="Полезно знать"
        hint="факты и советы рядом с мерой (не выплата) — каждый с новой строки"
      >
        <textarea
          name="tips"
          defaultValue={initial?.tips.join("\n") ?? ""}
          rows={4}
          className={inputCls}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Ссылка на источник">
          <input
            name="sourceUrl"
            type="url"
            defaultValue={initial?.sourceUrl ?? ""}
            required
            className={inputCls}
          />
        </Field>
        <Field label="Название источника">
          <input
            name="sourceName"
            defaultValue={initial?.sourceName ?? ""}
            required
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Лейбл «обновлено»" hint="например: «2024»">
          <input
            name="updatedAtLabel"
            defaultValue={initial?.updatedAt ?? ""}
            className={inputCls}
          />
        </Field>
        <Field label="Порядок сортировки">
          <input
            type="number"
            name="sortOrder"
            defaultValue={initial?.sortOrder ?? 100}
            className={inputCls}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={initial?.isPublished ?? true}
        />
        Опубликовать (показывать в каталоге и подборе)
      </label>

      <button
        type="submit"
        className={cn(buttonVariants(), "h-11 w-full text-base")}
      >
        {submitLabel}
      </button>
    </form>
  );
}
