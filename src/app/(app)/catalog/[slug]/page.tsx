import { notFound } from "next/navigation";
import Link from "next/link";
import { MessageSquarePlus, Lightbulb } from "lucide-react";
import { BackLink } from "@/components/back-link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { getAllMeasureSlugs, getMeasureBySlug } from "@/lib/measures-db";
import { getCurrentDemoUser } from "@/lib/demo-auth";

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
  return { title: m ? m.title : "Мера поддержки" };
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

  return (
    <div className="px-4 py-5">
      <BackLink href="/catalog" label="В каталог" />

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

        <section className="mt-6">
          <h2 className="text-lg font-bold">Какие документы нужны</h2>
          <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
            {m.documents.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </section>

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

        <Link
          href={inquiryHref}
          className={cn(
            buttonVariants(),
            "h-11 w-full gap-2 px-5",
          )}
        >
          <MessageSquarePlus className="size-4" />
          Задать вопрос про эту меру
        </Link>
      </article>
    </div>
  );
}
