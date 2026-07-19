// Разметка мер по многоплодным родам: criteria.minSimultaneousBirth.
// 2 — двойня и более, 3 — тройня и более. Плюс правки текста для hak-019/020.
// Сухой прогон по умолчанию; запись — с флагом --apply.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";
const env = Object.fromEntries(readFileSync(".env.local","utf8").split(/\r?\n/).filter(l=>l&&!l.startsWith("#")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i),l.slice(i+1)];}));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const APPLY = process.argv.includes("--apply");

// Итоговая (выверенная вручную) карта: slug -> сколько детей за одни роды.
const N2 = ["eao-005","krasn-003","krg-012","mrm-002","omsk-002","oren-004","pnz-008","perm-013","bsh-003","dagestan-003","tuva-001","samara-007","saratov-013","ulyan-010","kam-016","ingushetia-002","yarosl-009","reg-novosibirskaya-oblast-016","irkutsk-005"];
const N3 = ["reg-altayskiy-kray-015","amur-012","arh-025","astra-013","krg-011","krsk-007","lenobl-010","lenobl-019","lpc-005","mrm-003","prim-020","psk-037","dagestan-004","kar-004","saha-028","tat-004","rst-012","sah-013","tomsk-002","tyumen-006","udm-014","khab-025"];
const countBySlug = {}; N2.forEach(s=>countBySlug[s]=2); N3.forEach(s=>countBySlug[s]=3);

// hak-019/020 — тройня, вдобавок исправляем текст (у них он был общий «многодетным»).
const HAK = {
  "hak-019": {
    short_description: "При одновременном рождении троих и более детей одному из родителей выплачивают крупную единовременную выплату.",
    amount: "1 000 000 ₽",
    tips: ["Выплачивается при рождении тройни и более одновременно."],
    _minsb: 3,
  },
  "hak-020": {
    short_description: "При одновременном рождении троих и более детей семье ежемесячно компенсируют оплату услуг няни, пока дети не посещают детский сад.",
    amount: "10 000 ₽ в месяц на всех детей",
    tips: ["Для семей, где одновременно родились трое и более детей, до достижения детьми 3 лет."],
    _minsb: 3,
    _maxYoungest: 3,
  },
};

const allSlugs = [...Object.keys(countBySlug), ...Object.keys(HAK)];
const { data: rows, error } = await sb.from("measures").select("slug,title,amount,short_description,criteria,tips").in("slug", allSlugs);
if (error) { console.log("ERR", error.message); process.exit(1); }
const cur = Object.fromEntries(rows.map(r=>[r.slug,r]));
writeFileSync("verification/backup-multiplebirth-apply.json", JSON.stringify(rows,null,2));

let ok=0, fail=0, changed=0;
// 1) простая разметка minSimultaneousBirth
for (const [slug, n] of Object.entries(countBySlug)) {
  const c = cur[slug];
  if (!c) { console.log("!! нет:", slug); fail++; continue; }
  const criteria = { ...(c.criteria||{}), minSimultaneousBirth: n };
  const was = c.criteria?.minSimultaneousBirth;
  console.log(`  →${n}  ${slug}  (было minSimultaneousBirth=${was ?? "-"})`);
  changed++;
  if (APPLY) { const {error}=await sb.from("measures").update({criteria}).eq("slug",slug); if(error){console.log("   FAIL",error.message);fail++;}else ok++; }
}
// 2) hak-019/020 — текст + minSimultaneousBirth (+ возраст для няни)
for (const [slug, e] of Object.entries(HAK)) {
  const c = cur[slug];
  if (!c) { console.log("!! нет:", slug); fail++; continue; }
  const criteria = { ...(c.criteria||{}), minSimultaneousBirth: e._minsb };
  if (e._maxYoungest != null) criteria.maxYoungestChildAgeYears = e._maxYoungest;
  const fields = { short_description: e.short_description, amount: e.amount, tips: e.tips, criteria };
  console.log(`\n# ${slug}\n   amount: ${c.amount}  =>  ${e.amount}\n   criteria: ${JSON.stringify(c.criteria)}  =>  ${JSON.stringify(criteria)}`);
  changed++;
  if (APPLY) { const {error}=await sb.from("measures").update(fields).eq("slug",slug); if(error){console.log("   FAIL",error.message);fail++;}else ok++; }
}
console.log(`\n${APPLY?"ЗАПИСАНО":"СУХОЙ ПРОГОН"}: помечено ${changed} мер (2→${N2.length}, 3→${N3.length}, hak +2)` + (APPLY?`, успешно ${ok}, ошибок ${fail}`:""));
if(!APPLY) console.log("Запись: node scripts/_apply-multiplebirth.mjs --apply");
