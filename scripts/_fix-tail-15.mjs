// Регионы без живых анкет, партия 15: Сахалинская, Чукотка, Якутия.
//
// Отклонила: «инвалидность» у чукотского маткапитала, «опеку» у якутской
// выплаты на транспорт, «неработающего» у бесплатного проезда матери-героини.
import { apply } from "./_apply-criteria.mjs";

const SAH = ["Сахалинская область"], CHA = ["Чукотский автономный округ"];
const SAK = ["Республика Саха (Якутия)"];
const SHKOLA = { minSchoolChildren: 1, hasChildAgedFrom: 6, hasChildAgedTo: 18 };
const SAD = { childAgeFromMonths: 18, childAgeToMonths: 84 };
const ROZHDENIE = { childAgeToMonths: 12, appliesToExpecting: true };

await apply("tail-15", {
  "sah-001": { regions: SAH, requiresChildren: true, ...SAD },
  "sah-003": {
    regions: SAH, requiresChildren: true, ...SHKOLA,
    anyOf: [
      { minChildren: 3 },
      { requiresLowIncome: true },
      { requiresSingleParent: true },
    ],
  },
  "sah-004": {
    regions: SAH, requiresChildren: true, minSchoolChildren: 1,
    hasChildAgedFrom: 6, hasChildAgedTo: 11,
  },
  "sah-013": {
    regions: SAH, minChildren: 3, requiresFamily: true,
    minSimultaneousBirth: 3, ...ROZHDENIE,
  },
  "sah-022": {
    regions: SAH, requiresChildren: true, requiresLowIncome: true, ...SHKOLA,
  },
  "sah-023": { regions: SAH, requiresFamily: true, ...ROZHDENIE },
  "sah-028": {
    regions: SAH, requiresFosterParent: true, requiresChildren: true,
    requiresDisabledChild: true,
  },

  "chao-001": { regions: CHA, requiresFamily: true, ...ROZHDENIE },
  "chao-002": { regions: CHA, minChildren: 2, requiresFamily: true, ...ROZHDENIE },
  "chao-008": { regions: CHA, requiresFamily: true, ...ROZHDENIE },
  "chao-023": {
    regions: CHA, requiresChildren: true, minSchoolChildren: 1,
    hasChildAgedFrom: 7, hasChildAgedTo: 17,
  },

  "saha-001": { regions: SAK, requiresChildren: true, ...SHKOLA },
  "saha-003": { regions: SAK, requiresChildren: true, ...SAD },
  "saha-005": { regions: SAK, requiresFamily: true, ...ROZHDENIE },
  "saha-013": { regions: SAK, minChildren: 3, requiresChildren: true, ...SHKOLA },
});
