import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/user-session";
import { getMeasureBySlug } from "@/lib/measures-db";
import { REGIONS } from "@/lib/measures";
import { REGION_COOKIE } from "@/lib/region";
import { createInquiryAction } from "@/app/(app)/profile/inquiries/actions";
import { NewInquiryForm } from "@/components/new-inquiry-form";
import type { InquiryType } from "@/lib/inquiries";

export const metadata = {
  title: "Новое обращение",
  robots: { index: false, follow: false },
};
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
  const initialType: InquiryType =
    sp.type === "proposal"
      ? "proposal"
      : sp.type === "clarification"
        ? "clarification"
        : "question";

  // Регион по умолчанию — из cookie (если пользователь уже выбирал его в каталоге).
  const c = await cookies();
  const cookieRegion = c.get(REGION_COOKIE)?.value ?? null;
  const defaultRegion =
    cookieRegion && REGIONS.includes(cookieRegion as (typeof REGIONS)[number])
      ? cookieRegion
      : "";

  return (
    // Тот же приём, что в чате с координатором: тёмный фон страницы выносит
    // светлую панель формы на первый план — сразу видно, где заполнять.
    <div
      className="min-h-[75vh] px-4 py-5"
      style={{ background: "linear-gradient(180deg, #16233F 0%, #101A30 100%)" }}
    >
      <h1 className="mt-3 text-xl font-extrabold tracking-tight text-white">
        Новое обращение
      </h1>
      <p className="mt-1 text-sm text-white/60">
        Опишите вопрос или предложение. Ответ придёт в личный кабинет
        {user.messengerConnected ? " и в подключённый мессенджер" : ""}.
      </p>

      {/* Панель заметно темнее полей формы — иначе подписи «Регион», «Кратко о
          вашей ситуации» и сами белые поля ввода сливаются в одно бледное
          пятно и непонятно, где именно нужно писать. */}
      <div className="mt-4 rounded-3xl bg-[#DDD9CD] p-4 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.45)]">
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
