// Хвост, партия 8: Тульская, Томская, Кировская, Архангельская, Липецкая.
//
// Отклонила: «нуждаемость в жилье» у земельных участков и жилищных субсидий
// многодетным (там она не условие), «ипотеку» у кировского маткапитала.
//
// Приняла и доделала руками:
//   kirov-007 — пособие на ребёнка с инвалидностью читалось как «приёмная
//     семья ИЛИ одинокий родитель» и саму инвалидность не проверяло;
//   arh-006 — пособие по уходу за ребёнком с инвалидностью требовало опеки
//     вместо инвалидности;
//   kirov-004 — выплата за второго ребёнка 1,5–3 лет, не посещающего сад.
import { apply } from "./_apply-criteria.mjs";

const TUL = ["Тульская область"], TOM = ["Томская область"], KIR = ["Кировская область"];
const ARH = ["Архангельская область"], LPC = ["Липецкая область"];
const SHKOLA = { minSchoolChildren: 1, hasChildAgedFrom: 6, hasChildAgedTo: 18 };
const SAD = { childAgeFromMonths: 18, childAgeToMonths: 84 };
const ROZHDENIE = { childAgeToMonths: 12, appliesToExpecting: true };

await apply("tail-8", {
  "tula-001": { regions: TUL, requiresFamily: true, ...ROZHDENIE },
  "tula-002": { regions: TUL, requiresFamily: true, requiresStudent: true, ...ROZHDENIE },
  "tula-014": { regions: TUL, minChildren: 3, requiresChildren: true, hasChildAgedTo: 7 },
  "tula-025": {
    regions: TUL, requiresChildren: true, requiresDisabledChild: true,
    requiresNotEmployed: true,
  },

  "tomsk-002": {
    regions: TOM, minChildren: 3, requiresFamily: true, minSimultaneousBirth: 3, ...ROZHDENIE,
  },
  "tomsk-006": { regions: TOM, requiresChildren: true, ...SAD },
  "tomsk-007": { regions: TOM, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "tomsk-018": {
    regions: TOM, minChildren: 3, requiresFamily: true, requiresParentUnder35: true, ...ROZHDENIE,
  },
  "tomsk-022": {
    regions: TOM, requiresChildren: true, ...SHKOLA,
    anyOf: [{ minChildren: 3 }, { requiresLowIncome: true }],
  },

  "kirov-004": {
    regions: KIR, minChildren: 2, requiresChildren: true,
    childAgeFromMonths: 18, childAgeToMonths: 36,
  },
  "kirov-005": { regions: KIR, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "kirov-007": {
    regions: KIR, requiresChildren: true, requiresDisabledChild: true,
    requiresNotEmployed: true,
  },
  "kirov-015": { regions: KIR, minChildren: 3, requiresChildren: true, hasChildAgedTo: 6 },
  "kirov-029": {
    regions: KIR, minChildren: 3, requiresChildren: true, requiresMortgage: true,
  },

  "arh-006": {
    regions: ARH, requiresChildren: true, requiresDisabledChild: true,
    requiresNotEmployed: true,
  },
  "arh-013": {
    regions: ARH, requiresChildren: true, minSchoolChildren: 1,
    hasChildAgedFrom: 11, hasChildAgedTo: 15,
  },
  "arh-016": { regions: ARH, requiresChildren: true, ...SAD },
  "arh-024": { regions: ARH, minChildren: 7, requiresFamily: true },

  "lpc-001": { regions: LPC, requiresFamily: true, maxParentAge: 24, ...ROZHDENIE },
  "lpc-004": {
    regions: LPC, minChildren: 3, requiresFamily: true, requiresParentUnder35: true, ...ROZHDENIE,
  },
  "lpc-005": {
    regions: LPC, minChildren: 3, requiresFamily: true, minSimultaneousBirth: 3, ...ROZHDENIE,
  },
  "lpc-010": {
    regions: LPC, requiresChildren: true, ...SAD,
    anyOf: [{ minChildren: 3 }, { requiresLowIncome: true }],
  },
  "lpc-017": {
    regions: LPC, minChildren: 3, requiresChildren: true,
    hasChildAgedFrom: 6, hasChildAgedTo: 18,
  },
});
