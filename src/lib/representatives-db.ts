import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { RegionalRepresentative } from "@/lib/representatives";

interface Row {
  id: string;
  region: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

function fromRow(r: Row): RegionalRepresentative {
  return {
    id: r.id,
    region: r.region,
    name: r.name,
    description: r.description,
    address: r.address,
    phone: r.phone,
    email: r.email,
    website: r.website,
  };
}

/** Опубликованные представители — то, что видят обычные пользователи. */
export async function getPublishedRepresentatives(): Promise<
  RegionalRepresentative[]
> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("regional_representatives")
    .select("*")
    .eq("is_published", true)
    .order("region");
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export interface RepresentativeAdminRow extends RegionalRepresentative {
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

function fromRowAdmin(r: Row): RepresentativeAdminRow {
  return {
    ...fromRow(r),
    isPublished: r.is_published,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/** Все представители, включая скрытые — для админки. */
export async function listRepresentativesForAdmin(): Promise<
  RepresentativeAdminRow[]
> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("regional_representatives")
    .select("*")
    .order("region");
  if (error) throw error;
  return (data ?? []).map(fromRowAdmin);
}

export async function getRepresentativeForAdmin(
  id: string,
): Promise<RepresentativeAdminRow | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("regional_representatives")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? fromRowAdmin(data) : null;
}

export interface RepresentativeInput {
  region: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  isPublished: boolean;
}

export async function createRepresentative(
  input: RepresentativeInput,
): Promise<string> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("regional_representatives")
    .insert({
      region: input.region,
      name: input.name,
      description: input.description,
      address: input.address,
      phone: input.phone,
      email: input.email,
      website: input.website,
      is_published: input.isPublished,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function updateRepresentative(
  id: string,
  input: RepresentativeInput,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("regional_representatives")
    .update({
      region: input.region,
      name: input.name,
      description: input.description,
      address: input.address,
      phone: input.phone,
      email: input.email,
      website: input.website,
      is_published: input.isPublished,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteRepresentative(id: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("regional_representatives")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
