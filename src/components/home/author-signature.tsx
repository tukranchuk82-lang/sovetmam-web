import { OrgName } from "@/components/org-name";

// Подпись автора прямо у портрета — чистый текстовый блок на фоне страницы
// (без карточки/тени/рамки), как подпись автора книги. Имя → бордовая линия →
// регалии.
export function AuthorSignature({ className }: { className?: string }) {
  return (
    <div
      className={className}
      style={{ fontFamily: "var(--font-inter), sans-serif", marginLeft: "1ch" }}
    >
      <p
        className="whitespace-nowrap text-[clamp(16px,5vw,24px)] leading-tight text-[#1A1A1A]"
        style={{ fontFamily: "var(--font-marck), cursive" }}
      >
        Татьяна Буцкая
      </p>
      <span className="mt-2 block h-1 w-[60px] rounded-full bg-[#8E1D2C]" />
      <p
        className="mt-2 text-[12px] font-normal text-[#555555]"
        style={{ lineHeight: 1.6 }}
      >
        Депутат Государственной Думы, председатель <OrgName genitive />, автор
        проекта
      </p>
    </div>
  );
}
