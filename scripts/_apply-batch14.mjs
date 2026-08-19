// Разметка пачки №14.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const CHANGES = {
  // «Выплата на третьего ребёнка до 18 лет, при очном обучении — до 23».
  // Речь о возрасте самого ребёнка, на которого назначают выплату.
  "zab-004": {
    regions: ["Забайкальский край"], minChildren: 3, requiresChildren: true,
    childAgeToMonths: 23 * 12,
  },
  // «Компенсируют платное очное обучение детей до 23 лет по программам СПО» —
  // мера адресована именно учащемуся ребёнку.
  "bur-010": {
    regions: ["Республика Бурятия"], minChildren: 3, requiresChildren: true,
    requiresChildStudying: true,
  },
  // Компенсация за детский сад: только семьям с назначенным ежемесячным
  // пособием (то есть по доходу) и только на детей садовского возраста.
  "msk-kompensaciya-detsad": {
    regions: ["Москва"], requiresChildren: true, requiresLowIncome: true,
    childAgeFromMonths: 18, childAgeToMonths: 7 * 12,
  },
  // Проезд детям Героев России и Героев Советского Союза. Стояла метка
  // «родители учатся очно» — совсем чужой признак. Своей метки для этой
  // награды у нас нет и заводить её ради одной меры незачем, поэтому
  // убираем меру из подбора: в каталоге и разделах она остаётся.
  "psk-019": {
    regions: ["Псковская область"], requiresChildren: true,
    excludeFromMatching: true,
  },
};

const CHECKED = JSON.parse(readFileSync("scripts/_studying-checked.json", "utf8"));
CHECKED.push(
  // Исключены из подбора.
  "chao-027", "chao-033",
  // «До 23 лет при очном обучении» — правило подсчёта состава семьи.
  "zhku-mnogodetnym-chukotka", "ulyan-012", "ryaz-031",
  "zhku-mnogodetnym-kaluga", "zhku-mnogodetnym-omsk",
  // Выплата и супругам, и детям: возрастное окно отсекло бы супругов.
  "pnz-023",
);
writeFileSync("scripts/_studying-checked.json", JSON.stringify([...new Set(CHECKED)], null, 1), "utf8");

const slugs = Object.keys(CHANGES);
const { data: before, error } = await sb.from("measures").select("slug,title,criteria").in("slug", slugs);
if (error) throw error;
writeFileSync("scripts/_backup-batch14.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update({ criteria: CHANGES[slug] }).eq("slug", slug);
  console.log(e ? `ошибка ${slug}: ${e.message}` : `✔ ${slug}`);
}
console.log("\nбэкап: scripts/_backup-batch14.json");
