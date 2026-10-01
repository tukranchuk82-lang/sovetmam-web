"use client";

import { useRouter } from "next/navigation";
import { FilterSelect } from "@/components/admin/ui/filter-bar";

/** Выбор региона в отчёте: меняет ?region= и сохраняет остальные параметры адреса. */
export function RegionFilter({
  regions,
  value,
  basePath,
  period,
}: {
  regions: string[];
  value: string;
  basePath: string;
  period: string;
}) {
  const router = useRouter();
  return (
    <FilterSelect
      label="Регион"
      value={value}
      onChange={(v) => {
        const params = new URLSearchParams({ period });
        if (v) params.set("region", v);
        router.push(`${basePath}?${params.toString()}`, { scroll: false });
      }}
    >
      <option value="">Все регионы</option>
      {regions.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </FilterSelect>
  );
}
