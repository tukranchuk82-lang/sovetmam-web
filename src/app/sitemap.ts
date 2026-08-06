import type { MetadataRoute } from "next";
import { getAllMeasureSlugs } from "@/lib/measures-db";
import { SEGMENTS } from "@/lib/measures";
import { siteUrl } from "@/lib/site";
import {
  CLASS_KEYS,
  FAMILY_KEYS,
  SITUATION_KEYS,
  TOPIC_KEYS,
} from "@/lib/taxonomy";

/**
 * Карта сайта — список всех страниц, которые мы предлагаем поисковику.
 *
 * Без неё робот нашёл бы только то, до чего дошёл по ссылкам, а меры лежат
 * глубоко: с главной до конкретной выплаты — три-четыре перехода. Карта же
 * показывает все страницы мер разом.
 *
 * changeFrequency и priority — подсказки, а не приказ: поисковик вправе их
 * игнорировать. Расставлены по смыслу: чаще всего меняется каталог, реже —
 * рассказ об организации.
 *
 * Список разделов берём из lib/taxonomy — того же, по которому страницы
 * строятся. Появится новая плитка — она попадёт сюда сама.
 */
export const revalidate = 86400; // раз в сутки

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${base}/catalog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/podbor`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${base}/pyramid`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/about`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];

  // Разделы: темы, классификация, жизненные ситуации, размер семьи, сегменты
  // анкеты. Это витрины — именно их ищут словами «выплаты многодетным»,
  // «пособие малоимущим семьям».
  const sections: MetadataRoute.Sitemap = [
    ...TOPIC_KEYS.map((key) => `/topic/${key}`),
    ...CLASS_KEYS.map((key) => `/class/${key}`),
    ...SITUATION_KEYS.map((key) => `/situation/${key}`),
    ...FAMILY_KEYS.map((count) => `/family/${count}`),
    ...SEGMENTS.map((s) => `/segment/${s.id}`),
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Страницы мер — самая ценная часть: на каждый вопрос «сколько платят и как
  // оформить» у нас есть отдельная страница с ответом.
  const slugs = await getAllMeasureSlugs();
  const measures: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${base}/catalog/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...sections, ...measures];
}
