import Link from "next/link";
import { MeasureForm } from "@/components/admin/measure-form";
import { createMeasureAction } from "@/app/admin/_actions";

export const metadata = { title: "Новая мера" };

export default function NewMeasurePage() {
  return (
    <div className="px-4 py-5">
      <Link
        href="/admin"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← К списку мер
      </Link>
      <h1 className="mt-2 text-xl font-extrabold tracking-tight">
        Новая мера поддержки
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Заполните минимум обязательные поля. После сохранения попадёте на
        страницу редактирования.
      </p>
      <div className="mt-5">
        <MeasureForm
          initial={null}
          action={createMeasureAction}
          submitLabel="Создать меру"
        />
      </div>
    </div>
  );
}
