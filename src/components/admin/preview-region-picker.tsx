"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { REGIONS } from "@/lib/measures";
import { setPreviewRegionAction } from "@/app/admin/preview-region-actions";

/**
 * Регион для предпросмотра роли координатора — виден только владельцу и
 * техспецу (своего региона у них нет, см. lib/preview-region.ts). Без
 * выбора координаторский экран показывает все регионы разом; с выбором —
 * ровно то, что видел бы настоящий координатор этого региона.
 *
 * После смены — полная перезагрузка страницы, а не router.refresh(): cookie
 * на сервере ставится верно (проверяли), но клиентский Router Cache Next
 * всё равно отдавал старый текст, пока не перезагрузишь руками. Для
 * административного переключателя, которым не щёлкают ежесекундно, честная
 * перезагрузка проще и надёжнее, чем воевать с кэшем.
 */
export function PreviewRegionPicker({ region }: { region: string | null }) {
  const [pending, setPending] = useState(false);

  return (
    <div className="flex items-center gap-1.5 rounded-xl border bg-background px-2.5 py-1.5 text-xs">
      <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
      <select
        name="region"
        defaultValue={region ?? ""}
        disabled={pending}
        onChange={async (e) => {
          setPending(true);
          const fd = new FormData();
          fd.set("region", e.target.value);
          await setPreviewRegionAction(fd);
          window.location.reload();
        }}
        className="min-w-0 max-w-[160px] bg-transparent font-medium focus:outline-none disabled:opacity-60"
      >
        <option value="">Все регионы</option>
        {REGIONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
    </div>
  );
}
