import { ORG_NAME, ORG_NAME_GENITIVE } from "@/lib/org-brand";

// Название организации всегда в кавычках-ёлочках и неразрывно: целиком на
// одной строке либо целиком переносится. genitive=true даёт родительный
// падеж — «Совета матерей» (в обычном режиме; см. lib/org-brand.ts, откуда
// оба варианта на самом деле берутся — там же временная подмена бренда).
export function OrgName({ genitive = false }: { genitive?: boolean }) {
  return (
    <span className="whitespace-nowrap">
      {genitive ? ORG_NAME_GENITIVE : ORG_NAME}
    </span>
  );
}
