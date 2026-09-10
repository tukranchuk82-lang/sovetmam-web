/**
 * Представитель «Совета матерей» в регионе — аккредитованная организация,
 * к которой можно обратиться по мерам её региона. Тип общий для
 * серверных и клиентских компонентов (без "server-only"), потому что
 * список представителей приходит пропом и в клиентские экраны подбора.
 */
export interface RegionalRepresentative {
  id: string;
  region: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
}

/** Представитель нужного региона, если он есть среди опубликованных. */
export function findRepresentative(
  representatives: RegionalRepresentative[],
  region: string | null | undefined,
): RegionalRepresentative | null {
  if (!region) return null;
  return representatives.find((r) => r.region === region) ?? null;
}
