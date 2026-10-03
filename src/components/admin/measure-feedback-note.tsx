import { Info } from "lucide-react";

/**
 * Куда писать координатору, если в мерах нашлась неточность или он знает о
 * новой мере: меры он только читает, а правки принимает председатель.
 * Название организации здесь намеренно настоящее, а не из org-brand: текст
 * адресован самим сотрудникам, и Таня задала его слово в слово (03.10.2026).
 *
 * Ссылка ведёт в личный профиль Татьяны Буцкой в MAX (профиль → «Поделиться»).
 */
const BUTSKAYA_MAX_URL = "https://max.ru/u/f9LHodD0cOIcf4ZBlhAKUKwv5gARnaiKUmvO-Tq6P_R58easd78qkHe6JWQ";

export function MeasureFeedbackNote({ className }: { className?: string }) {
  return (
    <p
      className={
        "flex items-start gap-2.5 rounded-xl border border-[#E3D9C9] bg-[#FBF8F3] px-3.5 py-2.5 text-[13px] leading-snug text-[#2b2f36] " +
        (className ?? "")
      }
    >
      <Info className="mt-0.5 size-4 shrink-0 text-[#8E1D2C]" />
      <span>
        Если вы нашли неполную или некорректную информацию, а также хотите сообщить о новых мерах в своём регионе,
        напишите председателю «Совета матерей» Татьяне Буцкой в{" "}
        <a
          href={BUTSKAYA_MAX_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[#8E1D2C] underline underline-offset-2 hover:text-[#6f1622]"
        >
          мессенджер MAX
        </a>
        .
      </span>
    </p>
  );
}
