// Разметка пачки №3: условия и сроки подачи.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const CHANGES = {
  // «Ухаживающему за двумя и более детьми-инвалидами» — стояла инвалидность
  // без числа детей, и меру видели семьи с одним ребёнком-инвалидом.
  "mari-014": {
    criteria: {
      regions: ["Республика Марий Эл"], requiresChildren: true,
      requiresDisabledChild: true, minChildren: 2,
    },
  },
  // Капитал за второго ребёнка был помечен как мера для студентов — его не
  // видел никто, кроме студенческих семей. По тексту: второй и последующий
  // ребёнок, а с 2026 года ещё и студенческие семьи при первом.
  "hmao-001": {
    criteria: {
      regions: ["Ханты-Мансийский автономный округ — Югра"],
      requiresFamily: true,
      anyOf: [{ minChildren: 2 }, { requiresStudent: true }],
    },
  },
  // «Семьям с доходом ниже двукратного прожиточного минимума» — порог дохода
  // в условиях отсутствовал.
  "irkutsk-005": {
    criteria: {
      regions: ["Иркутская область"], minSimultaneousBirth: 2, maxIncomePm: 2,
    },
    deadline: {
      kind: "note",
      note: "Обращаться не раньше чем через 6 месяцев после рождения детей и не позднее 12 месяцев",
    },
  },
  // «При усыновлении второго, третьего и каждого последующего ребёнка».
  "krsk-014": {
    criteria: {
      regions: ["Курская область"], requiresChildren: true,
      requiresFosterParent: true, minChildren: 2,
    },
  },
  // «За второго и каждого следующего ребёнка» — стояло minChildren: 1, из-за
  // чего выплату видели семьи с одним ребёнком. Плюс срок: полгода.
  "chao-002": {
    criteria: {
      regions: ["Чукотский автономный округ"], requiresFamily: true,
      minChildren: 2,
    },
    deadline: { kind: "after-birth", months: 6 },
  },
  // «Подать заявление до того, как детям исполнится 2 года 6 месяцев».
  "chao-003": { deadline: { kind: "after-birth", months: 30 } },
  // «Подать заявление в течение 6 месяцев после рождения»; выплата до 3 лет.
  "bsh-003": {
    criteria: {
      regions: ["Республика Башкортостан"], requiresFamily: true,
      requiresLowIncome: true, minSimultaneousBirth: 2, childAgeToMonths: 36,
    },
    deadline: { kind: "after-birth", months: 6 },
  },
};

const slugs = Object.keys(CHANGES);
const { data: before, error } = await sb.from("measures").select("slug,title,criteria,deadline").in("slug", slugs);
if (error) throw error;
writeFileSync("scripts/_backup-batch3.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update(CHANGES[slug]).eq("slug", slug);
  console.log(e ? `ошибка ${slug}: ${e.message}` : `✔ ${slug}`);
}
console.log("\nбэкап: scripts/_backup-batch3.json");
