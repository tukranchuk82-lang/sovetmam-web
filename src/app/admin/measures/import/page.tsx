import Link from "next/link";
import { MeasureImport } from "@/components/admin/measure-import";

export const metadata = { title: "Загрузить меру из документа" };

export default function ImportMeasurePage() {
  return (
    <div className="px-4 py-5">
      <Link
        href="/admin"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← К списку мер
      </Link>
      <h1 className="mt-2 text-xl font-extrabold tracking-tight">
        Загрузить меру из документа
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Прикрепите PDF или фото меры (или вставьте текст) — AI заполнит форму
        черновиком, а вы проверите и сохраните.
      </p>
      <div className="mt-5">
        <MeasureImport />
      </div>
    </div>
  );
}
