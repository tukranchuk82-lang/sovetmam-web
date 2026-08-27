// Условие «сейчас не беременна» — для мер, которые нужны до наступления
// беременности. Пока такая одна: ЭКО. Наличие детей ему не помеха (бывает
// вторичное бесплодие), а вот женщине, которая уже ждёт ребёнка, показывать
// его незачем.
import { readFileSync, writeFileSync } from "node:fs";
const p = "src/lib/measures.ts";
let s = readFileSync(p, "utf8");
const nl = s.includes("\r\n") ? "\r\n" : "\n";
const L = (...x) => x.join(nl);
const pairs = [
  [
    L("  requiresNoChildren?: boolean;"),
    L(
      "  requiresNoChildren?: boolean;",
      "  /** Беременности сейчас нет: мера нужна до неё, а не во время. */",
      "  requiresNotPregnant?: boolean;",
    ),
  ],
  [
    L(
      "  if (c.requiresNoChildren && (profile.hasChildren || profile.pregnant)) {",
      "    return false;",
      "  }",
    ),
    L(
      "  if (c.requiresNoChildren && (profile.hasChildren || profile.pregnant)) {",
      "    return false;",
      "  }",
      "  if (c.requiresNotPregnant && profile.pregnant) return false;",
    ),
  ],
];
for (const [from, to] of pairs) {
  if (!s.includes(from)) throw new Error("не нашла: " + from.slice(0, 40));
  s = s.replace(from, to);
}
writeFileSync(p, s, "utf8");
console.log("движок: добавлено requiresNotPregnant");
