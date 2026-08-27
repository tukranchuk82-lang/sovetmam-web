// Регионы без живых анкет, партия 17: Хакасия, Марий Эл, Карачаево-Черкесия,
// Курская, Чечня.
//
// Отклонила: «нуждаемость в жилье» у выплат взамен земельного участка,
// «школьников» у справки о признании семьи малоимущей, «до семи лет» у
// первоочередного приёма в сад, школу и кружки (там перечислено разное).
import { apply } from "./_apply-criteria.mjs";

const HAK = ["Республика Хакасия"], MRI = ["Республика Марий Эл"];
const KCH = ["Карачаево-Черкесская Республика"], KRS = ["Курская область"];
const CHE = ["Чеченская Республика"];
const SHKOLA = { minSchoolChildren: 1, hasChildAgedFrom: 6, hasChildAgedTo: 18 };
const SAD = { childAgeFromMonths: 18, childAgeToMonths: 84 };
const ROZHDENIE = { childAgeToMonths: 12, appliesToExpecting: true };

await apply("tail-17", {
  "hak-004": {
    regions: HAK, requiresFamily: true, requiresLowIncome: true,
    anyOf: [{ requiresPregnancy: true }, { maxYoungestChildAgeYears: 3 }],
  },
  "hak-007": { regions: HAK, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "hak-009": {
    regions: HAK, requiresChildren: true, hasChildAgedTo: 7,
    anyOf: [
      { minChildren: 3 },
      { requiresSvoFamily: true },
      { requiresDisabledChild: true },
      { requiresSingleParent: true },
    ],
  },
  "hak-014": {
    regions: HAK, requiresChildren: true, ...SHKOLA,
    anyOf: [{ minChildren: 3 }, { requiresLowIncome: true }],
  },
  "hak-015": {
    regions: HAK, minChildren: 3, requiresChildren: true,
    requiresLowIncome: true, ...SHKOLA,
  },
  "hak-023": {
    regions: HAK, minChildren: 7, requiresChildren: true, requiresNotEmployed: true,
  },

  "mari-011": { regions: MRI, requiresChildren: true, ...SAD },
  "mari-020": { regions: MRI, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "mari-021": { regions: MRI, minChildren: 3, requiresChildren: true, hasChildAgedTo: 7 },

  "kchr-001": { regions: KCH, minChildren: 2, requiresFamily: true, ...ROZHDENIE },
  "kchr-002": { regions: KCH, minChildren: 3, requiresFamily: true, ...ROZHDENIE },
  "kchr-009": {
    regions: KCH, minChildren: 3, requiresFamily: true,
    requiresParentUnder35: true, ...ROZHDENIE,
  },
  "kchr-015": { regions: KCH, requiresSvoFamily: true, requiresChildren: true, ...SAD },
  "kchr-022": {
    regions: KCH, requiresSvoFamily: true, requiresChildren: true,
    minSchoolChildren: 1, hasChildAgedFrom: 11, hasChildAgedTo: 18,
  },

  "krsk-005": {
    regions: KRS, requiresChildren: true, ...SHKOLA,
    anyOf: [{ minChildren: 3 }, { requiresSvoFamily: true }],
  },
  "krsk-007": {
    regions: KRS, minChildren: 3, requiresFamily: true,
    minSimultaneousBirth: 3, ...ROZHDENIE,
  },
  "krsk-008": { regions: KRS, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "krsk-017": {
    regions: KRS, minChildren: 3, requiresFamily: true,
    requiresParentUnder35: true, ...ROZHDENIE,
  },
  "krsk-018": { regions: KRS, requiresFamily: true, requiresStudent: true, ...ROZHDENIE },

  "chech-006": {
    regions: CHE, requiresChildren: true, minSchoolChildren: 1,
    hasChildAgedFrom: 7, hasChildAgedTo: 18,
    anyOf: [
      { minChildren: 3 },
      { requiresLowIncome: true },
      { requiresSpecialNeedsChild: true },
      { requiresFosterParent: true },
      { requiresSvoFamily: true },
    ],
  },
  "chech-013": {
    regions: CHE, requiresSvoFamily: true, requiresLossOfBreadwinner: true,
    minSchoolChildren: 1, hasChildAgedFrom: 11, hasChildAgedTo: 18,
  },
});
