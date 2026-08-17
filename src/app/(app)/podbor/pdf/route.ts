import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/user-session";
import { getAllMeasures } from "@/lib/measures-db";
import { matchMeasures, type UserProfile } from "@/lib/measures";
import { buildPodborPdf } from "@/lib/podbor-pdf";

/**
 * Подборка мер файлом PDF.
 *
 * Собираем заново из сохранённой анкеты, а не из того, что сейчас на экране:
 * ссылку могут открыть и с другого устройства, и через день. Ответы анкеты —
 * единственный надёжный источник.
 *
 * Регион уважаем: в файл идут федеральные меры и региональные того региона,
 * который человек указал. Если регион не указан, региональные не отсекаем —
 * иначе файл получился бы почти пустым, а человек не понял бы почему.
 */
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const user = await getCurrentAppUser();
  if (!user) redirect("/login?next=/podbor");

  const survey = user.survey as unknown as UserProfile | null;
  // Анкета не заполнена — собирать нечего, отправляем её заполнять.
  if (!survey || typeof survey.hasChildren !== "boolean") redirect("/podbor");

  const all = await getAllMeasures();
  const matched = matchMeasures(survey, all, { ignoreRegion: !survey.region });

  const pdf = await buildPodborPdf({
    measures: matched,
    userName: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
    region: survey.region || null,
  });

  const date = new Date().toISOString().slice(0, 10);
  const filename = `Меры поддержки ${date}.pdf`;

  return new Response(pdf as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      // Имя файла с кириллицей — только через filename*, иначе браузеры
      // сохранят его как «___.pdf».
      "Content-Disposition": `attachment; filename="podborka-${date}.pdf"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      // Подборка зависит от анкеты — кешировать её нельзя.
      "Cache-Control": "no-store",
    },
  });
}
