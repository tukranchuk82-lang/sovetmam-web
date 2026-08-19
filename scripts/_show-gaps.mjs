import { readFileSync } from "node:fs";
const gaps = JSON.parse(readFileSync("scripts/_gaps.json", "utf8"));
const kind = process.argv[2];
const from = Number(process.argv[3] ?? 0), to = Number(process.argv[4] ?? 999);
const list = gaps.filter((g) => g.gap === kind).slice(from, to);
console.log(`${kind}: показываю ${list.length}\n`);
for (const m of list) {
  console.log(`${m.slug} [${m.region ?? "федеральная"}]`);
  console.log(`  ${m.title}`);
  console.log(`  ${(m.short_description ?? "").slice(0, 230)}`);
  console.log(`  сейчас в условиях: ${JSON.stringify(m.criteria)}\n`);
}
