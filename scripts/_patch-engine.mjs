// Правки движка отбора: занятость и регионы-исключения.
import { readFileSync, writeFileSync } from "node:fs";

const p = "src/lib/measures.ts";
let s = readFileSync(p, "utf8");
const nl = s.includes("\r\n") ? "\r\n" : "\n";
const L = (...lines) => lines.join(nl);

const patches = [
  [
    L("  regions?: string[];", "}"),
    L(
      "  regions?: string[];",
      "  /**",
      "   * Регионы, где федеральная мера НЕ работает.",
      "   *",
      "   * Такое бывает: федеральное правило есть, а регион в нём не участвует",
      "   * или заменил его своим порядком. Пример — сертификат дополнительного",
      "   * образования: в Москве кружки записывают через mos.ru, сертификатов",
      "   * там не выдают. Показывать такую меру москвичке — обманывать её.",
      "   */",
      "  excludeRegions?: string[];",
      "  /**",
      "   * Человек работает: трудовой договор, самозанятость, своё дело.",
      "   *",
      "   * Нужен мерам, которые дают права ИМЕННО на работе — трудовые",
      "   * гарантии, вычеты с зарплаты. Отпуск по уходу считается работой:",
      "   * место сохраняется, права тоже.",
      "   */",
      "  requiresEmployed?: boolean;",
      "}",
    ),
  ],
  [
    L("  if (c.requiresHardship && !profile.hardship) return false;"),
    L(
      "  if (c.requiresHardship && !profile.hardship) return false;",
      "  // Права «на работе» не нужны тому, кто не работает.",
      "  if (c.requiresEmployed && profile.employmentStatus === \"not-working\") {",
      "    return false;",
      "  }",
    ),
  ],
  [
    L(
      "  if (c.requiresUnemployedStatus && profile.unemployedStatus !== true) {",
      "    if (!pending) return false;",
      "    pending.add(\"unemployed\");",
      "  }",
    ),
    L(
      "  if (c.requiresUnemployedStatus && profile.unemployedStatus !== true) {",
      "    // Кто работает или в отпуске по уходу, безработным стать не может:",
      "    // место за ним сохраняется. Раньше движок предлагал таким «оформить",
      "    // статус» — и работающая женщина видела в подборке пособие по",
      "    // безработице.",
      "    if (",
      "      profile.employmentStatus === \"working\" ||",
      "      profile.employmentStatus === \"parental-leave\"",
      "    ) {",
      "      return false;",
      "    }",
      "    if (!pending) return false;",
      "    pending.add(\"unemployed\");",
      "  }",
    ),
  ],
  [
    L(
      "  const pending = new Set<PendingReason>();",
      "  if (!matchesCriteria(profile, c, strict ? undefined : pending)) {",
      "    return { fits: false, pending: [] };",
      "  }",
    ),
    L(
      "  // Регион, где меры нет. Работает и для федеральных мер — в этом смысл.",
      "  if (",
      "    !ignoreRegion &&",
      "    c.excludeRegions &&",
      "    profile.region &&",
      "    c.excludeRegions.includes(profile.region)",
      "  ) {",
      "    return { fits: false, pending: [] };",
      "  }",
      "",
      "  const pending = new Set<PendingReason>();",
      "  if (!matchesCriteria(profile, c, strict ? undefined : pending)) {",
      "    return { fits: false, pending: [] };",
      "  }",
    ),
  ],
];

for (const [from, to] of patches) {
  if (!s.includes(from)) throw new Error("не нашла кусок: " + from.slice(0, 60));
  s = s.replace(from, to);
}
writeFileSync(p, s, "utf8");
console.log("движок поправлен");
