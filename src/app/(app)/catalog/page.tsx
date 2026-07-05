import { CatalogBrowser, type SlimMeasure } from "@/components/catalog-browser";
import { CATEGORIES, REGIONS } from "@/lib/measures";
import { getAllMeasures } from "@/lib/measures-db";

export const metadata = { title: "Каталог мер поддержки" };

export default async function CatalogPage() {
  const measures = await getAllMeasures();
  // Отдаём клиенту только поля, нужные фильтру и карточке.
  const slim: SlimMeasure[] = measures.map((m) => ({
    slug: m.slug,
    title: m.title,
    shortDescription: m.shortDescription,
    category: m.category,
    amount: m.amount ?? null,
    level: m.level,
    region: m.region ?? null,
  }));

  return (
    <CatalogBrowser measures={slim} categories={CATEGORIES} regions={REGIONS} />
  );
}
