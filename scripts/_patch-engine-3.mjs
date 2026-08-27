// Условие «детей ещё нет»: для мер, которые нужны именно планирующим.
// requiresChildren: false движок просто игнорировал — поле читается как
// «ограничения нет», поэтому ЭКО показывалось и маме подростка.
import { readFileSync, writeFileSync } from "node:fs";
const p = "src/lib/measures.ts";
let s = readFileSync(p, "utf8");
const nl = s.includes("\r\n") ? "\r\n" : "\n";
const L = (...x) => x.join(nl);
const pairs = [
  [
    L("  requiresChildren?: boolean;"),
    L(
      "  requiresChildren?: boolean;",
      "  /**",
      "   * Детей ещё нет — мера для планирующих. Отдельное поле, потому что",
      "   * requiresChildren: false читается движком как «ограничения нет».",
      "   */",
      "  requiresNoChildren?: boolean;",
    ),
  ],
  [
    L("  if (c.requiresChildren && !profile.hasChildren) return false;"),
    L(
      "  if (c.requiresChildren && !profile.hasChildren) return false;",
      "  if (c.requiresNoChildren && (profile.hasChildren || profile.pregnant)) {",
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
console.log("движок: добавлено requiresNoChildren");
