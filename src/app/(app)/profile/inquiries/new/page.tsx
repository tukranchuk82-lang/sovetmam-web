import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/user-session";
import { getMeasureBySlug } from "@/lib/measures-db";
import { REGIONS } from "@/lib/measures";
import { REGION_COOKIE } from "@/lib/region";
import { createInquiryAction } from "@/app/(app)/profile/inquiries/actions";
import { NewInquiryForm } from "@/components/new-inquiry-form";
import { BackLink } from "@/components/back-link";

export const metadata = { title: "Новое обращение" };
export const dynamic = "force-dynamic";

export default async function NewInquiryPage({
  searchParams,
}: {
  searchParams: Promise<{ measure?: string; type?: string }>;
}) {
  const user = await getCurrentAppUser();
  if (!user || !user.emailVerifiedAt) {
    redirect("/login?next=/profile/inquiries/new");
  }

  const sp = await searchParams;
  const measure = sp.measure ? await getMeasureBySlug(sp.measure) : null;
  const initialType =
    sp.type === "proposal" ? "proposal" : ("question" as const);

  // Регион по умолчанию — из cookie (если пользователь уже выбирал его в каталоге).
  const c = await cookies();
  const cookieRegion = c.get(REGION_COOKIE)?.value ?? null;
  const defaultRegion =
    cookieRegion && REGIONS.includes(cookieRegion as (typeof REGIONS)[number])
      ? cookieRegion
      : "";

  return (
    <div className="px-4 py-5">
      <BackLink href="/profile" label="В кабинет" />
      <h1 className="mt-3 text-xl font-extrabold tracking-tight">
        Новое обращение
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Опишите вопрос или предложение. Ответ придёт в личный кабинет
        {user.messengerConnected ? " и в подключённый мессенджер" : ""}.
      </p>

      <div className="mt-5">
        <NewInquiryForm
          action={createInquiryAction}
          initialType={initialType}
          measureSlug={measure?.slug ?? null}
          measureTitle={measure?.title ?? null}
          regions={REGIONS}
          defaultRegion={defaultRegion}
        />
      </div>
    </div>
  );
}
