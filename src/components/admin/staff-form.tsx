"use client";

import { useActionState } from "react";
import type { StaffFormState } from "@/app/admin/staff/actions";

/**
 * Форма на странице сотрудников с сообщением о результате. Ошибка («такого
 * email нет») показывается под полями, а не уводит на страницу сбоя; успех
 * подтверждается зелёной строкой.
 */
export function StaffForm({
  action,
  className,
  children,
}: {
  action: (prev: StaffFormState, fd: FormData) => Promise<StaffFormState>;
  className?: string;
  children: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, { error: null, done: null });
  return (
    <form action={formAction} className={className}>
      {children}
      {state.error && (
        <p className="basis-full rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-800">{state.error}</p>
      )}
      {state.done && (
        <p className="basis-full rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          {state.done}
        </p>
      )}
    </form>
  );
}
