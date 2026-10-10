import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const R = ["Ивановская область"];
// «Мать младше 24 лет при рождении первого ребёнка» → по текущему возрасту анкеты (maxParentAge):
// ребёнку до 1,5 лет — маме сейчас не больше 25; для мер без возраста ребёнка берём с запасом.
const patches = {
  "ivn-005": { criteria: { regions: R, gender: "female", requiresChildren: true, maxYoungestChildAgeYears: 1, maxParentAge: 25 } },
  "ivn-006": {
    criteria: { regions: R, gender: "female", requiresChildren: true, maxParentAge: 26 },
    eligibility: "Первый ребёнок рождён женщиной в возрасте до 24 лет. Доход семьи и другие получаемые выплаты не учитываются.",
  },
  "ivn-007": {
    criteria: { regions: R, gender: "female", requiresFamily: true, requiresStudent: true, maxParentAge: 26 },
    eligibility: "Родители впервые обучаются очно в вузе или колледже, матери на день рождения первого ребёнка меньше 24 лет, ребёнок родился с 1 апреля 2024 года, место жительства ребёнка и хотя бы одного родителя — Ивановская область. Доход не учитывается. Деньги можно направить на жильё, образование ребёнка или ежемесячные выплаты маме до 3 лет ребёнка.",
  },
};
for (const [s, p] of Object.entries(patches)) {
  const { error } = await sb.from("measures").update(p).eq("slug", s);
  console.log(s, error?.message ?? "ok");
}
