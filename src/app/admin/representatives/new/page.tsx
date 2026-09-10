import Link from "next/link";
import { RepresentativeForm } from "@/components/admin/representative-form";
import { createRepresentativeAction } from "@/app/admin/representatives/actions";

export const metadata = { title: "Новый представитель" };

export default function NewRepresentativePage() {
  return (
    <div className="px-4 py-5 md:px-6">
      <Link
        href="/admin/representatives"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← К списку представителей
      </Link>
      <h1 className="mt-2 text-xl font-extrabold tracking-tight">
        Новый представитель
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Появится в подборке и в карточках мер выбранного региона сразу после
        сохранения, если стоит галочка «Опубликовано».
      </p>
      <div className="mt-5">
        <RepresentativeForm
          initial={null}
          action={createRepresentativeAction}
          submitLabel="Создать"
        />
      </div>
    </div>
  );
}
