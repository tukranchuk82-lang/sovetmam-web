// Условие «родитель не работает»: выплаты по уходу назначают тому, кто ради
// ухода оставил работу. Работающей семье такая карточка только мешает.
import { readFileSync, writeFileSync } from "node:fs";
const p = "src/lib/measures.ts";
let s = readFileSync(p, "utf8");
const nl = s.includes("\r\n") ? "\r\n" : "\n";
const L = (...x) => x.join(nl);
const pairs = [
  [
    L("  requiresEmployed?: boolean;"),
    L(
      "  requiresEmployed?: boolean;",
      "  /**",
      "   * Родитель не работает. Отпуск по уходу к «не работает» не относим:",
      "   * место сохраняется, зарплата идёт, а выплаты по уходу назначают тем,",
      "   * кто работу оставил.",
      "   */",
      "  requiresNotEmployed?: boolean;",
    ),
  ],
  [
    L(
      "  if (c.requiresEmployed && profile.employmentStatus === \"not-working\") {",
      "    return false;",
      "  }",
    ),
    L(
      "  if (c.requiresEmployed && profile.employmentStatus === \"not-working\") {",
      "    return false;",
      "  }",
      "  if (c.requiresNotEmployed && profile.employmentStatus !== \"not-working\") {",
      "    return false;",
      "  }",
    ),
  ],
];
for (const [from, to] of pairs) {
  if (!s.includes(from)) throw new Error("не нашла: " + from.slice(0, 40));
  s = s.replace(from, to);
}
writeFileSync(p, s, "utf8");
console.log("движок: добавлено requiresNotEmployed");
