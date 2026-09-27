import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AppRole } from "@/lib/onboarding-db";

export interface StaffRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AppRole;
  region: string | null;
  createdAt: string;
}

function fromRow(r: Record<string, unknown>): StaffRow {
  return {
    id: r.id as string,
    email: r.email as string,
    firstName: r.first_name as string,
    lastName: r.last_name as string,
    role: r.role as AppRole,
    region: (r.region as string | null) ?? null,
    createdAt: r.created_at as string,
  };
}

const SELECT = "id, email, first_name, last_name, role, region, created_at";

export async function listByRole(role: AppRole): Promise<StaffRow[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("app_users")
    .select(SELECT)
    .eq("role", role)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

/** Назначить роль (и, для координатора, регион). region игнорируется для остальных ролей. */
export async function setUserRole(
  userId: string,
  role: AppRole,
  region: string | null = null,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("app_users")
    .update({ role, region: role === "coordinator" ? region : null })
    .eq("id", userId);
  if (error) throw error;
}

// ── Передача прав владельца ────────────────────────────────────────────────
//
// Владелец назначает нового владельца мгновенно — он и так полностью
// доверенный аккаунт. Техспец может только ПРЕДЛОЖИТЬ кандидата: заявка
// висит, пока действующий владелец её не подтвердит или не отклонит.

export interface OwnerRoleRequest {
  id: string;
  requestedBy: string;
  requestedByName: string;
  targetUserId: string;
  targetName: string;
  targetEmail: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export async function createOwnerRequest(
  requestedBy: string,
  targetUserId: string,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("owner_role_requests")
    .insert({ requested_by: requestedBy, target_user_id: targetUserId });
  if (error) throw error;
}

export async function listPendingOwnerRequests(): Promise<OwnerRoleRequest[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("owner_role_requests")
    .select(
      "id, requested_by, target_user_id, status, created_at, requester:app_users!owner_role_requests_requested_by_fkey(first_name,last_name), target:app_users!owner_role_requests_target_user_id_fkey(first_name,last_name,email)",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => {
    const row = r as unknown as {
      id: string;
      requested_by: string;
      target_user_id: string;
      status: "pending" | "approved" | "rejected";
      created_at: string;
      requester: { first_name: string; last_name: string } | null;
      target: { first_name: string; last_name: string; email: string } | null;
    };
    return {
      id: row.id,
      requestedBy: row.requested_by,
      requestedByName: row.requester ? `${row.requester.first_name} ${row.requester.last_name}`.trim() : "—",
      targetUserId: row.target_user_id,
      targetName: row.target ? `${row.target.first_name} ${row.target.last_name}`.trim() : "—",
      targetEmail: row.target?.email ?? "",
      status: row.status,
      createdAt: row.created_at,
    };
  });
}

export async function decideOwnerRequest(
  requestId: string,
  decidedBy: string,
  approve: boolean,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { data: reqRow, error: reqError } = await supabase
    .from("owner_role_requests")
    .select("id, target_user_id, status")
    .eq("id", requestId)
    .maybeSingle();
  if (reqError) throw reqError;
  if (!reqRow || reqRow.status !== "pending") return;

  const { error } = await supabase
    .from("owner_role_requests")
    .update({
      status: approve ? "approved" : "rejected",
      decided_by: decidedBy,
      decided_at: new Date().toISOString(),
    })
    .eq("id", requestId);
  if (error) throw error;

  if (approve) await setUserRole(reqRow.target_user_id as string, "owner");
}
