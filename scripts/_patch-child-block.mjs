// Блок «Положено вашему ребёнку»: тип, чтение из базы, раскладка и вывод.
import { readFileSync, writeFileSync } from "node:fs";

const edit = (path, pairs) => {
  let s = readFileSync(path, "utf8");
  const nl = s.includes("\r\n") ? "\r\n" : "\n";
  for (const [from, to] of pairs) {
    const f = from.join(nl), t = to.join(nl);
    if (!s.includes(f)) throw new Error(`${path}: не нашла «${from[0].slice(0, 50)}»`);
    s = s.replace(f, t);
  }
  writeFileSync(path, s, "utf8");
  console.log("правлено:", path);
};

// 1) Тип меры.
edit("src/lib/measures.ts", [
  [
    ["  eligibility?: string | null;"],
    [
      "  eligibility?: string | null;",
      "  /**",
      "   * Заявление подаёт сам ребёнок — Пушкинская карта, образовательный",
      "   * кредит. Родителю такие меры показываем, но отдельным блоком в конце",
      "   * подборки: сделать по ним он ничего не может, а знать про них должен.",
      "   */",
      "  appliesByChild?: boolean;",
    ],
  ],
]);

// 2) Чтение из базы.
edit("src/lib/measures-db.ts", [
  [["  eligibility: string | null;"], ["  eligibility: string | null;", "  applies_by_child: boolean | null;"]],
  [["    eligibility: r.eligibility ?? null,"], ["    eligibility: r.eligibility ?? null,", "    appliesByChild: r.applies_by_child ?? false,"]],
  [
    ['  "slug, title, short_description, level, region, category, amount, segments, criteria, deadline, eligibility, how_to_apply, documents, tips, source_url, source_name, updated_at_label, is_published, sort_order";'],
    ['  "slug, title, short_description, level, region, category, amount, segments, criteria, deadline, eligibility, applies_by_child, how_to_apply, documents, tips, source_url, source_name, updated_at_label, is_published, sort_order";'],
  ],
]);

// 3) Раскладка.
edit("src/lib/podbor-groups.ts", [
  [
    ["export type PodborGroups = {", "  federal: PodborBlock;", "  regional: PodborBlock;"],
    [
      "export type PodborGroups = {",
      "  federal: PodborBlock;",
      "  regional: PodborBlock;",
      "  /** Меры, которые ребёнок оформляет сам, — отдельным блоком в конце. */",
      "  child: PodborBlock;",
    ],
  ],
  [
    ["  const groups: PodborGroups = {", "    federal: emptyBlock(),", "    regional: emptyBlock(),"],
    [
      "  const groups: PodborGroups = {",
      "    federal: emptyBlock(),",
      "    regional: emptyBlock(),",
      "    child: emptyBlock(),",
    ],
  ],
  [
    ["    const block = measure.level === \"federal\" ? groups.federal : groups.regional;"],
    [
      "    // Меры, которые оформляет сам ребёнок, идут в свой блок, а не к",
      "    // федеральным или региональным: родитель по ним не заявитель.",
      "    const block = measure.appliesByChild",
      "      ? groups.child",
      "      : measure.level === \"federal\"",
      "        ? groups.federal",
      "        : groups.regional;",
    ],
  ],
  [
    ["  for (const block of [groups.federal, groups.regional]) {"],
    ["  for (const block of [groups.federal, groups.regional, groups.child]) {"],
  ],
]);

// 4) Вывод.
edit("src/components/podbor-results.tsx", [
  [
    [
      "      <p className=\"mt-6 text-xs leading-relaxed text-muted-foreground\">",
      "        Условия и суммы меняются — проверяйте их при подаче заявления.",
      "      </p>",
    ],
    [
      "      {/* Последним — то, что оформляет сам ребёнок: родителю это знать",
      "          нужно, но подать заявление за него он не может. */}",
      "      <Block",
      "        title=\"Положено вашему ребёнку\"",
      "        note=\"Заявление ребёнок подаёт на себя сам — с 14 лет через свои Госуслуги. Родитель помогает, но заявителем не будет.\"",
      "        block={groups.child}",
      "      />",
      "",
      "      <p className=\"mt-6 text-xs leading-relaxed text-muted-foreground\">",
      "        Условия и суммы меняются — проверяйте их при подаче заявления.",
      "      </p>",
    ],
  ],
]);
