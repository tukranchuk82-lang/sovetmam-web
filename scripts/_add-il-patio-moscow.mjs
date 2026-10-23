// Скидка 30% многодетным в ресторанах iL Патио — карточки для Москвы и Московской области.
// Источник: проект «Семейная марка» (семейнаямарка.рф). Запуск: node scripts/_add-il-patio-moscow.mjs [--apply]
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=")).map((l) => {
    const i = l.indexOf("=");
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  }),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const apply = process.argv.includes("--apply");

const regions = [
  { region: "Москва", slug: "biznes-il-patio-skidka-mnogodetnym-moskva", where: "в Москве" },
  { region: "Московская область", slug: "biznes-il-patio-skidka-mnogodetnym-mosobl", where: "в Московской области" },
];

const rows = regions.map(({ region, slug, where }) => ({
  slug,
  title: "Скидка 30% в ресторанах iL Патио многодетным семьям",
  short_description:
    "Сеть итальянских ресторанов iL Патио даёт родителям с тремя и более детьми скидку 30% на основное меню. Нужно предъявить удостоверение многодетной семьи.",
  level: "regional",
  region,
  category: "Скидки в магазинах",
  amount: "30% на основное меню",
  segments: ["class-discount", "topic-shops", "topic-business"],
  criteria: { regions: [region], minChildren: 3 },
  eligibility: [
    `Скидка 30% на основное меню положена многодетным семьям — родителям с тремя и более детьми. Действует в ресторанах iL Патио ${where}.`,
    "Это скидка частной компании: сеть присоединилась к федеральному проекту «Семейная марка», в котором бизнес берёт на себя меры поддержки многодетных семей.",
    "Скидка действует во всех ресторанах сети, кроме заведений в аэропортах и на железнодорожных вокзалах.",
    "Это коммерческая акция, а не государственная льгота: условия устанавливает компания и вправе изменить их.",
  ].join(" "),
  how_to_apply: [
    "Выберите ресторан iL Патио — не в аэропорту и не на вокзале.",
    "Перед оплатой сообщите официанту или кассиру, что вы многодетная семья, и предъявите удостоверение многодетной семьи.",
    "Скидка 30% применяется к основному меню — проверьте итоговую сумму в чеке до оплаты.",
  ],
  documents: ["Удостоверение многодетной семьи — бумажное или электронное на Госуслугах"],
  tips: [
    "Скидка действует на основное меню — какие позиции в него входят, уточните у официанта до заказа.",
    "Скидка не действует в ресторанах iL Патио в аэропортах и на вокзалах — выбирайте обычные рестораны сети.",
    "Электронное удостоверение многодетной семьи из Госуслуг принимают наравне с бумажным.",
  ],
  source_url: "https://семейнаямарка.рф",
  source_name: "Проект «Семейная марка» — участник iL Патио",
  updated_at_label: "октябрь 2026",
  is_published: true,
  sort_order: 0,
  applies_by_child: false,
}));

for (const r of rows) {
  const { data: ex } = await sb.from("measures").select("slug").eq("slug", r.slug).maybeSingle();
  if (ex) {
    console.log("уже есть:", r.slug);
    continue;
  }
  if (!apply) {
    console.log("dry-run, добавил бы:", r.slug, "|", r.region);
    continue;
  }
  const { error } = await sb.from("measures").insert(r);
  console.log(error ? `ОШИБКА ${r.slug}: ${error.message}` : `добавлено: ${r.slug}`);
}
