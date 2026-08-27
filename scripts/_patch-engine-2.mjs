// Новое условие: сколько нужно НЕСОВЕРШЕННОЛЕТНИХ детей.
//
// minChildren считает всех детей, включая взрослых, — а половина мер написана
// про несовершеннолетних. Из-за этого «Семейный автомобиль» («двое детей до
// 18») попадал семье с одним подростком и одним взрослым ребёнком.
import { readFileSync, writeFileSync } from "node:fs";
const p = "src/lib/measures.ts";
let s = readFileSync(p, "utf8");
const nl = s.includes("\r\n") ? "\r\n" : "\n";
const L = (...x) => x.join(nl);

const decl = [
  L("  minChildren?: number;"),
  L(
    "  minChildren?: number;",
    "  /**",
    "   * Сколько нужно несовершеннолетних детей. Не то же, что minChildren:",
    "   * тот считает всех, включая взрослых. Мера «двое детей до 18» семье",
    "   * с подростком и студентом не положена, хотя детей у неё двое.",
    "   */",
    "  minChildrenUnder18?: number;",
  ),
];
const check = [
  L("  if (c.requiresChildren && !profile.hasChildren) return false;"),
  L(
    "  if (c.requiresChildren && !profile.hasChildren) return false;",
    "  if (c.minChildrenUnder18 != null) {",
    "    const minors = (profile.childrenAges ?? []).filter((a) => a < 18).length;",
    "    if (minors < c.minChildrenUnder18) return false;",
    "  }",
  ),
];
for (const [from, to] of [decl, check]) {
  if (!s.includes(from)) throw new Error("не нашла: " + from.slice(0, 50));
  s = s.replace(from, to);
}
writeFileSync(p, s, "utf8");
console.log("движок: добавлено minChildrenUnder18");
