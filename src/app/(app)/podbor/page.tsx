import { PodborGate } from "@/components/podbor-gate";
import { getAllMeasures } from "@/lib/measures-db";
import { getCurrentDemoUser } from "@/lib/demo-auth";
import { getCurrentAppUser } from "@/lib/user-session";
import { getPublishedRepresentatives } from "@/lib/representatives-db";

export const metadata = {
  title: "Подбор мер поддержки по вашей ситуации",
  description:
    "Ответьте на несколько вопросов о семье, детях и регионе — и узнайте, какие выплаты, льготы и компенсации положены именно вам.",
  alternates: { canonical: "/podbor" },
};
export const dynamic = "force-dynamic";

export default async function PodborPage() {
  const demoUser = await getCurrentDemoUser();
  const appUser = demoUser ? null : await getCurrentAppUser();
  const authed = Boolean(demoUser || appUser);

  const measures = await getAllMeasures();
  // Восстанавливаем последнюю заполненную анкету, чтобы подбор не слетал после
  // перехода к мере и обратно (сохраняется в app_users.survey при отправке).
  const savedSurvey = appUser?.survey ?? null;
  const representatives = await getPublishedRepresentatives();

  return (
    <PodborGate
      authed={authed}
      measures={measures}
      savedSurvey={savedSurvey}
      representatives={representatives}
    />
  );
}
