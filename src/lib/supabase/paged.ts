import "server-only";

/**
 * Постраничное чтение из Supabase.
 *
 * PostgREST отдаёт максимум 1000 строк за запрос и НЕ говорит, что список
 * обрезан: приходит ровно тысяча, как будто это всё. Из-за этого в админке
 * «Всего пользователей» замерло на 1000, хотя людей было 1268, а рядом
 * честно считалось «183 за неделю» — цифры противоречили друг другу.
 *
 * Поэтому любую выборку, которая может перерасти тысячу строк, читаем
 * страницами. Сортировка обязана быть устойчивой (уникальное поле в конце),
 * иначе между страницами появятся пропуски и дубли.
 */
export async function fetchAllPages<T>(
  page: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  { pageSize = 1000, maxRows = 200_000 }: { pageSize?: number; maxRows?: number } = {},
): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; from < maxRows; from += pageSize) {
    const { data, error } = await page(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    all.push(...rows);
    if (rows.length < pageSize) break;
  }
  return all;
}
