// Слияние дубля по ЖКУ Запорожской области.
//
// В базе с прежних заходов лежала скрытая мера zhku-mnogodetnym-zaporozhskaya,
// а сегодняшняя загрузка добавила ту же льготу как zapor-001. Оставляем
// zapor-001 (у неё подтверждённые реквизиты актов), но забираем из старой
// карточки два факта, которых в новой не было: компенсация покрывает ещё и
// твёрдое топливо, и доход семьи при этом не проверяют.
//
// Запуск: node scripts/_merge-zapor-zhku.mjs [--apply]

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
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

const OLD = "zhku-mnogodetnym-zaporozhskaya";

const merged = {
  short_description:
    "Многодетным семьям области возвращают половину расходов на жильё, коммунальные услуги и твёрдое топливо. Доход семьи значения не имеет — важен только статус многодетной.",
  amount: "50 % расходов на оплату жилого помещения, коммунальных услуг и твёрдого топлива",
  tips: [
    "Условия о среднедушевом доходе нет: мера даётся независимо от дохода семьи.",
    "Компенсация покрывает не только коммуналку, но и плату за жильё, а в домах с печным отоплением — покупку и доставку твёрдого топлива.",
    "Компенсацию не назначат при подтверждённом судом непогашенном долге за ЖКУ за последние три года.",
    "Семья должна быть постоянно зарегистрирована на территории области — по месту жительства или пребывания.",
    "Начинать нужно с удостоверения многодетной семьи: без него льготу не оформить.",
    "Регион новый, порядок ещё донастраивается — перед подачей уточните перечень документов в своём отделе соцзащиты.",
  ],
};

const APPLY = process.argv.includes("--apply");

if (!APPLY) {
  console.log("Сухой прогон:\n");
  console.log("  ПРАВКА zapor-001 — забираем твёрдое топливо и отсутствие проверки дохода");
  console.log(`  УДАЛИТЬ ${OLD} — дубль zapor-001 (скрытая мера прежних заходов)`);
  console.log("\nДля записи: node scripts/_merge-zapor-zhku.mjs --apply");
  process.exit(0);
}

mkdirSync("verification", { recursive: true });
const { data: before } = await sb.from("measures").select("*").in("slug", ["zapor-001", OLD]);
writeFileSync("verification/backup-zapor-zhku-merge.json", JSON.stringify(before, null, 2), "utf8");
console.log(`бэкап: verification/backup-zapor-zhku-merge.json (${(before || []).length} мер)\n`);

const { error: upErr } = await sb
  .from("measures")
  .update({ ...merged, updated_at_label: "2026" })
  .eq("slug", "zapor-001");
if (upErr) {
  console.log("FAIL правка zapor-001 -", upErr.message);
  process.exit(1);
}
console.log("OK   правка zapor-001");

const { error: delErr } = await sb.from("measures").delete().eq("slug", OLD);
if (delErr) {
  console.log("FAIL удаление", OLD, "-", delErr.message);
  process.exit(1);
}
console.log(`OK   удалён дубль ${OLD}`);
