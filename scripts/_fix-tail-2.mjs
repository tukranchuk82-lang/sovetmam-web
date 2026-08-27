// Хвост, партия 2: Костромская, Ульяновская, Свердловская.
//
// Отклонила: предложения добавить «студент» там, где учится ребёнок, а не
// родитель; «нуждаемость в жилье» к выплатам взамен земельного участка;
// «опеку» и «инвалидность» к маткапиталу и выплатам усыновителям — там эти
// слова в тексте про повышенный размер, а не про условие.
//
// Приняла и доделала руками:
//   ulyan-024 — питание школьников требовало, чтобы студентом был родитель;
//   sve-007 — пособие родителю ребёнка с инвалидностью не проверяло саму
//     инвалидность и приходило любой семье области;
//   sve-019 — лекарства: всем детям до трёх лет, многодетным — до шести,
//     а стояло «только многодетным»;
//   sve-021 — путёвки детям-сиротам показывались всем семьям.
import { apply } from "./_apply-criteria.mjs";

const KOS = ["Костромская область"], ULY = ["Ульяновская область"], SVE = ["Свердловская область"];

await apply("tail-2", {
  "kostroma-014": {
    regions: KOS, requiresSvoFamily: true, requiresChildren: true,
    minSchoolChildren: 1, hasChildAgedFrom: 6, hasChildAgedTo: 18,
  },

  "ulyan-005": {
    regions: ULY, minChildren: 3, requiresFamily: true, requiresParentUnder35: true,
    childAgeToMonths: 12, appliesToExpecting: true,
  },
  "ulyan-016": {
    regions: ULY, minChildren: 3, requiresChildren: true,
    minSchoolChildren: 1, hasChildAgedFrom: 6, hasChildAgedTo: 18,
  },
  "ulyan-017": {
    regions: ULY, minChildren: 3, requiresChildren: true,
    minSchoolChildren: 1, hasChildAgedFrom: 6, hasChildAgedTo: 18,
  },
  "ulyan-024": {
    regions: ULY, requiresChildren: true, minSchoolChildren: 1,
    hasChildAgedFrom: 6, hasChildAgedTo: 21,
  },

  "sve-002": {
    regions: SVE, minChildren: 3, requiresFamily: true, maxYoungestChildAgeYears: 3,
  },
  "sve-007": {
    regions: SVE, requiresChildren: true, requiresDisabledChild: true,
  },
  "sve-019": {
    regions: SVE, requiresChildren: true,
    anyOf: [{ maxYoungestChildAgeYears: 3 }, { minChildren: 3, hasChildAgedTo: 6 }],
  },
  "sve-021": { regions: SVE, requiresFosterParent: true },
});
