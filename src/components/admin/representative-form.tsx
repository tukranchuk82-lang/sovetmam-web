"use client";

import { REGIONS } from "@/lib/measures";
import type { RepresentativeAdminRow } from "@/lib/representatives-db";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

export function RepresentativeForm({
  initial,
  action,
  submitLabel,
}: {
  initial: RepresentativeAdminRow | null;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <Field label="Регион" hint="Должен дословно совпадать с регионом в каталоге мер.">
        <select name="region" defaultValue={initial?.region ?? ""} required className={inputCls}>
          <option value="" disabled>
            Выберите регион
          </option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Название организации">
        <input
          name="name"
          defaultValue={initial?.name ?? ""}
          required
          className={inputCls}
        />
      </Field>

      <Field label="Описание" hint="Пара предложений о том, чем помогает организация — необязательно.">
        <textarea
          name="description"
          defaultValue={initial?.description ?? ""}
          rows={3}
          className={inputCls}
        />
      </Field>

      <Field label="Адрес">
        <input name="address" defaultValue={initial?.address ?? ""} className={inputCls} />
      </Field>

      <Field label="Телефон">
        <input name="phone" defaultValue={initial?.phone ?? ""} className={inputCls} />
      </Field>

      <Field label="Email">
        <input
          type="email"
          name="email"
          defaultValue={initial?.email ?? ""}
          className={inputCls}
        />
      </Field>

      <Field label="Сайт">
        <input name="website" defaultValue={initial?.website ?? ""} className={inputCls} />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={initial?.isPublished ?? true}
          className="size-4 rounded border-muted-foreground/40"
        />
        Опубликовано (видно пользователям)
      </label>

      <button type="submit" className={cn(buttonVariants(), "h-10 w-full text-sm")}>
        {submitLabel}
      </button>
    </form>
  );
}
