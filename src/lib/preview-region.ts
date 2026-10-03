import "server-only";
import type { AppUser } from "@/lib/onboarding-db";
import type { AdminScope } from "@/lib/view-mode";

/**
 * Регион, который стоит показывать странице, — единственная точка правды.
 *
 * Настоящий координатор видит только свой закреплённый регион. Владелец и
 * техспец, примеряющие роль координатора, своего региона не имеют и видят все
 * регионы разом: выбор региона в шапке убран по просьбе Тани (03.10.2026).
 */
export async function resolveRegion(staff: AppUser, scope: AdminScope): Promise<string | null> {
  if (scope !== "coordinator") return null;
  return staff.role === "coordinator" ? staff.region : null;
}
