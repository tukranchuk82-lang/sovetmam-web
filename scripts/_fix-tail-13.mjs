// Хвост, партия 13: Карелия, Самарская, Брянская, Дагестан.
// Это последние регионы, где есть живые анкеты.
//
// Отклонила: «многодетность» у дагестанского пособия школьнику 17–18 лет,
// «срок обращения» у самарской ежемесячной выплаты (она платится до трёх
// лет, а не разово).
//
// Приняла и доделала руками:
//   samara-004 — ежемесячная выплата на третьего ребёнка до трёх лет стояла
//     только с условием о доходе;
//   samara-008 — пособие на детей 1,5–3 лет, не посещающих сад, — без
//     возраста вовсе;
//   samara-014 и brn-010 — доплаты по уходу за ребёнком с инвалидностью не
//     проверяли ни инвалидность, ни занятость родителя;
//   kar-013 — доплата приёмным родителям за ребёнка с инвалидностью.
import { apply } from "./_apply-criteria.mjs";

const KAR = ["Республика Карелия"], SAM = ["Самарская область"];
const BRN = ["Брянская область"], DAG = ["Республика Дагестан"];
const SHKOLA = { minSchoolChildren: 1, hasChildAgedFrom: 6, hasChildAgedTo: 18 };
const SAD = { childAgeFromMonths: 18, childAgeToMonths: 84 };
const ROZHDENIE = { childAgeToMonths: 12, appliesToExpecting: true };

await apply("tail-13", {
  "kar-001": { regions: KAR, requiresFamily: true, ...ROZHDENIE },
  "kar-013": {
    regions: KAR, requiresChildren: true, requiresFosterParent: true,
    requiresDisabledChild: true,
  },
  "kar-021": { regions: KAR, requiresChildren: true, ...SHKOLA },

  "samara-001": {
    regions: SAM, requiresFamily: true, requiresParentUnder35: true, ...ROZHDENIE,
  },
  "samara-004": {
    regions: SAM, minChildren: 3, requiresChildren: true,
    requiresLowIncome: true, maxYoungestChildAgeYears: 3,
  },
  "samara-008": {
    regions: SAM, requiresChildren: true, requiresLowIncome: true,
    childAgeFromMonths: 18, childAgeToMonths: 36,
  },
  "samara-010": { regions: SAM, requiresChildren: true, ...SAD },
  "samara-011": {
    regions: SAM, requiresChildren: true, ...SHKOLA,
    anyOf: [{ minChildren: 3 }, { requiresLowIncome: true }],
  },
  "samara-013": { regions: SAM, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "samara-014": {
    regions: SAM, requiresChildren: true, requiresDisabledChild: true,
    requiresNotEmployed: true,
  },
  "samara-018": { regions: SAM, requiresSvoFamily: true, requiresChildren: true, ...SAD },

  "brn-005": { regions: BRN, requiresFamily: true, ...ROZHDENIE },
  "brn-006": { regions: BRN, minChildren: 3, requiresFamily: true, ...ROZHDENIE },
  "brn-008": {
    regions: BRN, requiresChildren: true, ...SHKOLA,
    anyOf: [{ minChildren: 3 }, { requiresLowIncome: true }],
  },
  "brn-009": { regions: BRN, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "brn-010": {
    regions: BRN, requiresChildren: true, requiresDisabledChild: true,
    requiresNotEmployed: true,
  },
  "brn-015": {
    regions: BRN, minChildren: 3, requiresFamily: true,
    requiresParentUnder35: true, ...ROZHDENIE,
  },

  "dagestan-001": { regions: DAG, minChildren: 5, requiresFamily: true, ...ROZHDENIE },
  "dagestan-002": { regions: DAG, minChildren: 10, requiresFamily: true, ...ROZHDENIE },
  "dagestan-014": { regions: DAG, requiresSvoFamily: true, requiresChildren: true, ...SHKOLA },
  "dagestan-015": { regions: DAG, requiresSvoFamily: true, requiresChildren: true, ...SAD },
});
