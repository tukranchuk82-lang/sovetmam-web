"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { recordAdminSectionView } from "@/app/admin/activity-actions";

/** Невидимая отметка: координатор открыл раздел. Нужна для отчёта по его работе. */
export function AdminActivityPing() {
  const pathname = usePathname();
  useEffect(() => {
    void recordAdminSectionView(pathname);
  }, [pathname]);
  return null;
}
