import { OrgName } from "@/components/org-name";

// Подпись автора прямо у портрета — чистый текстовый блок на фоне страницы
// (без карточки/тени/рамки), как подпись автора книги. Имя → бордовая линия →
// регалии.
//
// Ширину блок не задаёт: её диктует колонка-родитель (--col в герое), общая
// с портретом — так фото и подпись совпадают по краям. Кегль ужимается тем же
// коэффициентом --s, что и остальная композиция героя, но не ниже читаемого
// минимума.
export function AuthorSignature({ className }: { className?: string }) {
  return (
    <div className={className} style={{ fontFamily: "var(--font-inter), sans-serif" }}>
      <p
        className="whitespace-nowrap text-[max(15px,calc(24_*_var(--s,1px)))] leading-tight text-[#1A1A1A]"
        style={{ fontFamily: "var(--font-marck), cursive" }}
      >
        Татьяна Буцкая
      </p>
      <span className="mt-2 block h-1 w-[calc(60_*_var(--s,1px))] rounded-full bg-[#8E1D2C]" />
      <p
        className="mt-2 text-[max(11px,calc(12_*_var(--s,1px)))] font-normal text-[#555555]"
        style={{ lineHeight: 1.6 }}
      >
        Депутат Государственной Думы, председатель <OrgName genitive />, автор
        проекта
      </p>
    </div>
  );
}
