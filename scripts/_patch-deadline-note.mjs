// Пояснение к сроку (note) движок не показывал: у мер с годовым окном
// выходила плашка «Подать до 1 октября», хотя сгорает не сама мера, а
// возможность выбрать деньги вместо набора услуг. Теперь, если пояснение
// написано, показываем его — а счётчик дней добавляем к нему.
import { readFileSync, writeFileSync } from "node:fs";
const p = "src/lib/measures.ts";
let s = readFileSync(p, "utf8");
const nl = s.includes("\r\n") ? "\r\n" : "\n";
const L = (...x) => x.join(nl);

const pairs = [
  [
    L(
      "    if (left > URGENT_DAYS) {",
      "      return { text: `Подать до ${dateText(until, now)}`, urgent: false };",
      "    }",
    ),
    L(
      "    if (left > URGENT_DAYS) {",
      "      // Пока время есть, полезнее объяснить правило, чем показать дату.",
      "      return {",
      "        text: d.note ?? `Подать до ${dateText(until, now)}`,",
      "        urgent: false,",
      "      };",
      "    }",
    ),
  ],
  [
    L(
      "    const left = Math.ceil((to.getTime() - now.getTime()) / DAY_MS);",
      "    return {",
      "      text: `Подать до ${toText}: осталось ${pluralDays(left)}`,",
      "      urgent: left <= 45,",
      "    };",
    ),
    L(
      "    const left = Math.ceil((to.getTime() - now.getTime()) / DAY_MS);",
      "    const base = d.note ?? `Подать до ${toText}`;",
      "    return {",
      "      text: `${base}: осталось ${pluralDays(left)}`,",
      "      urgent: left <= 45,",
      "    };",
    ),
  ],
  [
    L(
      "  return {",
      "    text: `Успеть до 31 декабря: осталось ${pluralDays(left)}`,",
      "    urgent: left <= 60,",
      "  };",
    ),
    L(
      "  return {",
      "    text: `${d.note ?? \"Успеть до 31 декабря\"}: осталось ${pluralDays(left)}`,",
      "    urgent: left <= 60,",
      "  };",
    ),
  ],
];
for (const [from, to] of pairs) {
  if (!s.includes(from)) throw new Error("не нашла: " + from.slice(0, 60));
  s = s.replace(from, to);
}
writeFileSync(p, s, "utf8");
console.log("движок: пояснение к сроку теперь показывается");
