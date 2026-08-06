import { notFound } from "next/navigation";
import Link from "next/link";
import { MessageSquarePlus, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { SaveHeart } from "@/components/save-heart";
import { ShareButton } from "@/components/share-button";
import { getAllMeasureSlugs, getMeasureBySlug } from "@/lib/measures-db";
import { getCurrentDemoUser } from "@/lib/demo-auth";
import { JsonLd } from "@/components/json-ld";
import { absoluteUrl } from "@/lib/site";

export async function generateStaticParams() {
  const slugs = await getAllMeasureSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const m = await getMeasureBySlug(slug);
  if (!m) return { title: "Мера поддержки" };

  // Описание для выдачи: сумма впереди, если она известна. Именно её человек
  // ищет глазами в списке результатов — «сколько платят».
  const description = [m.amount, m.shortDescription].filter(Boolean).join(". ");

  // Регион в заголовке помогает найтись по запросу «пособие + область», но у
  // многих мер он уже вписан в название — тогда второй раз не добавляем.
  const title =
    m.region && !m.title.includes(m.region)
      ? `${m.title} — ${m.region}`
      : m.title;

  return {
    title,
    description,
    alternates: { canonical: `/catalog/${m.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/catalog/${m.slug}`,
    },
  };
}

export default async function MeasurePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const m = await getMeasureBySlug(slug);
  if (!m) notFound();
  const user = await getCurrentDemoUser();
  const inquiryHref = user
    ? `/profile/inquiries/new?measure=${m.slug}`
    : `/login?next=/profile/inquiries/new?measure=${m.slug}`;

  // Паспорт меры для поисковика. GovernmentService — тип как раз для
  // госуслуг и мер поддержки: у него есть и «кто предоставляет», и «кому
  // положено». Хлебные крошки рисуют под ссылкой в выдаче путь
  // «Каталог → название меры» вместо голого адреса.
  const measureSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "GovernmentService",
        name: m.title,
        description: m.shortDescription,
        url: absoluteUrl(`/catalog/${m.slug}`),
        serviceType: m.category,
        inLanguage: "ru-RU",
        provider: {
          "@type": "GovernmentOrganization",
          name: m.sourceName,
          ...(m.sourceUrl ? { url: m.sourceUrl } : {}),
        },
        areaServed: {
          "@type": m.level === "federal" ? "Country" : "AdministrativeArea",
          name: m.level === "federal" ? "Россия" : (m.region ?? "Россия"),
        },
        audience: {
          "@type": "PeopleAudience",
          audienceType: "Семьи с детьми",
        },
        ...(m.amount ? { award: m.amount } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Каталог мер поддержки",
            item: absoluteUrl("/catalog"),
          },
          { "@type": "ListItem", position: 2, name: m.title },
        ],
      },
    ],
  };

  return (
    <div className="px-4 py-5">
      <JsonLd data={measureSchema} />

      <article className="mt-3 rounded-2xl bg-white p-5 text-foreground shadow-[0_12px_32px_-12px_rgba(0,0,0,0.4)]">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={m.level === "federal" ? "default" : "secondary"}>
            {m.level === "federal" ? "Федеральная мера" : "Региональная мера"}
          </Badge>
          <Badge variant="outline">{m.category}</Badge>
          {m.region ? <Badge variant="outline">{m.region}</Badge> : null}
        </div>

        <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight">
          {m.title}
        </h1>
        {m.amount ? (
          <p className="mt-2 text-lg font-semibold text-primary">{m.amount}</p>
        ) : null}
        <p className="mt-3 text-muted-foreground">{m.shortDescription}</p>

        {m.howToApply.length > 0 && (
          <>
            <Separator className="my-6" />
            <section>
              <h2 className="text-lg font-bold">Как оформить</h2>
              <ol className="mt-3 space-y-3">
                {m.howToApply.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {i + 1}
                    </span>
                    <span className="text-sm text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          </>
        )}

        {m.documents.length > 0 && (
          <section className="mt-6">
            <h2 className="text-lg font-bold">Какие документы нужны</h2>
            <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
              {m.documents.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </section>
        )}

        {m.tips.length > 0 && (
          <section className="mt-6 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
            <h2 className="flex items-center gap-2 text-base font-bold text-amber-900">
              <Lightbulb className="size-5 shrink-0" />
              Полезно знать
            </h2>
            <ul className="mt-2.5 space-y-2 text-sm text-amber-900/90">
              {m.tips.map((t, i) => (
                <li key={i} className="flex gap-2">
                  <span aria-hidden className="mt-0.5 text-amber-500">
                    •
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Separator className="my-6" />

        <div className="space-y-2.5">
          <SaveHeart slug={m.slug} variant="button" />
          <ShareButton
            path={`/catalog/${m.slug}`}
            title={m.title}
            text={m.amount ? `${m.title} — ${m.amount}` : m.title}
          />
          <Link
            href={inquiryHref}
            className={cn(
              buttonVariants(),
              "h-11 w-full gap-2 px-5 bg-[#3A4D63] text-white hover:bg-[#2F3F52]",
            )}
          >
            <MessageSquarePlus className="size-4" />
            Задать вопрос про эту меру
          </Link>
        </div>
      </article>
    </div>
  );
}
