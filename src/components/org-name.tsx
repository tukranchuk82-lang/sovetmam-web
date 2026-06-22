// Название организации всегда в кавычках-ёлочках и неразрывно: оба слова
// «Совет матерей» либо целиком на одной строке, либо целиком переносятся.
// genitive=true даёт родительный падеж — «Совета матерей».
export function OrgName({ genitive = false }: { genitive?: boolean }) {
  return (
    <span className="whitespace-nowrap">
      {genitive ? "«Совета матерей»" : "«Совет матерей»"}
    </span>
  );
}
