// Три краснодарские меры адресованы не всем семьям СВО, а только семьям
// погибших и инвалидов боевых действий. Обычной семье участника СВО они
// приходили зря — на это и указала проверка эталонными анкетами.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const R = ["Краснодарский край"];
const POGIBSHIE = [
  { requiresLossOfBreadwinner: true },
  { requiresDisabledParent: true },
];
const PATCHES = {
  "krd-020": { criteria: { regions: R, requiresSvoFamily: true, anyOf: POGIBSHIE } },
  "krdadd-012": { criteria: { regions: R, requiresSvoFamily: true, anyOf: POGIBSHIE } },
  "krdadd-013": {
    criteria: {
      regions: R, requiresSvoFamily: true, requiresChildren: true,
      hasChildAgedTo: 18, anyOf: POGIBSHIE,
    },
  },
};
for (const [slug, patch] of Object.entries(PATCHES)) {
  const { error } = await sb.from("measures").update(patch).eq("slug", slug);
  if (error) throw new Error(`${slug}: ${error.message}`);
  console.log(slug, "→", JSON.stringify(patch.criteria));
}
