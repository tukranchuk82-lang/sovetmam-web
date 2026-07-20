// Разовый поиск: меры про ЖКУ/коммуналку — чтобы понять, что показала тестировщица.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data, error } = await sb
  .from("measures")
  .select("slug,title,short_description,amount,criteria,level,region,source_name,source_url,is_published")
  .or("title.ilike.%ЖКУ%,title.ilike.%коммунальн%,short_description.ilike.%ЖКУ%")
  .eq("level", "federal");
if (error) throw error;

for (const m of data) {
  console.log("=".repeat(70));
  console.log(m.slug, "|", m.title);
  console.log("  описание:", m.short_description);
  console.log("  сумма:", m.amount);
  console.log("  criteria:", JSON.stringify(m.criteria));
  console.log("  источник:", m.source_name, "—", m.source_url);
}
console.log("\nвсего федеральных про ЖКУ:", data.length);
