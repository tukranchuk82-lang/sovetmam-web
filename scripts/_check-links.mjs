// Что распознаётся как ссылка в текстах мер — ищем ложные срабатывания.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = {};
for (const l of readFileSync(".env.local", "utf8").split("\n")) {
  const s = l.trim(); if (!s || s.startsWith("#") || !s.includes("=")) continue;
  const i = s.indexOf("="); env[s.slice(0, i)] = s.slice(i + 1);
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const rows = [];
for (let f = 0; ; f += 1000) {
  const { data, error } = await sb.from("measures").select("slug,eligibility,how_to_apply,documents,tips,short_description").eq("is_published", true).range(f, f + 999);
  if (error) throw error;
  rows.push(...data); if (data.length < 1000) break;
}

// Та же регулярка, что в компоненте RichText.
const LINK = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|((?:https?:\/\/|www\.)[^\s<>()]+[^\s<>().,;:]|(?:[a-z0-9-]+\.)+(?:ru|рф|com|org|net)(?:\/[^\s<>()]*[^\s<>().,;:])?)/gi;

const found = new Map();
for (const r of rows) {
  const texts = [r.eligibility, r.short_description, ...(r.how_to_apply ?? []), ...(r.documents ?? []), ...(r.tips ?? [])].filter(Boolean);
  for (const t of texts) {
    LINK.lastIndex = 0;
    let m;
    while ((m = LINK.exec(t)) !== null) {
      const hit = m[2] ?? m[3];
      found.set(hit, (found.get(hit) ?? 0) + 1);
    }
  }
}
const sorted = [...found.entries()].sort((a, b) => b[1] - a[1]);
console.log(`распознано ссылок: ${sorted.length} видов\n`);
for (const [link, n] of sorted.slice(0, 30)) console.log(`  ${String(n).padStart(4)} × ${link}`);
