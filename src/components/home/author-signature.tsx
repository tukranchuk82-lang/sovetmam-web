import { OrgName } from "@/components/org-name";

// Подпись автора в герое — чистый текстовый блок на фоне страницы (без
// карточки/тени/рамки), как подпись автора книги. Имя → бордовая линия →
// регалии.
//
// С 2026-08 блок стоит СЛЕВА от портрета и занимает место прежнего списка
// преимуществ (три иконки со строчками), который заказчик попросил убрать
// вместе с декоративной чертой. Ширину блок не задаёт: её диктует колонка-
// родитель. Кегль ужимается тем же коэффициентом --s, что и остальная
// композиция героя, но не ниже читаемого минимума.
export function AuthorSignature({ className }: { className?: string }) {
  return (
    <div className={className} style={{ fontFamily: "var(--font-inter), sans-serif" }}>
      <p
        className="whitespace-nowrap text-[max(18px,calc(26_*_var(--s,1px)))] leading-tight text-[#1A1A1A]"
        style={{ fontFamily: "var(--font-marck), cursive" }}
      >
        Татьяна Буцкая
      </p>
      <span className="mt-2 block h-1 w-[calc(60_*_var(--s,1px))] rounded-full bg-[#8E1D2C]" />
      <p
        className="mt-2 text-[max(12px,calc(13_*_var(--s,1px)))] font-normal text-[#555555]"
        style={{ lineHeight: 1.55 }}
      >
        Председатель общероссийской общественной организации <OrgName />,
        депутат ГосДумы VIII созыва, автор курса
      </p>
    </div>
  );
}
