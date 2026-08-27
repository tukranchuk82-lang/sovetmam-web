// Хвост, партия 7: Тверская, Тамбовская, Мурманская, Северная Осетия,
// Забайкальский.
//
// Отклонила: «нуждаемость в жилье» у жилья «Матери-героине» и у земельного
// участка многодетным — там она не условие; «село» у выплаты на жильё в
// Тверской (текст шире).
//
// Приняла и доделала руками: тамбовское питание детям СВО требовало
// родителя-студента; выплаты выпускникам-сиротам показывались всем семьям.
import { apply } from "./_apply-criteria.mjs";

const TVR = ["Тверская область"], TMB = ["Тамбовская область"], MRM = ["Мурманская область"];
const OSE = ["Республика Северная Осетия — Алания"], ZAB = ["Забайкальский край"];
const SHKOLA = { minSchoolChildren: 1, hasChildAgedFrom: 6, hasChildAgedTo: 18 };
const SAD = { childAgeFromMonths: 18, childAgeToMonths: 84 };

await apply("tail-7", {
  "tver-004": { regions: TVR, requiresChildren: true, requiresLowIncome: true, ...SHKOLA },
  "tver-006": { regions: TVR, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "tver-019": {
    regions: TVR, minChildren: 3, requiresFamily: true, requiresParentUnder35: true,
    childAgeToMonths: 12, appliesToExpecting: true,
  },

  "tamb-003": {
    regions: TMB, requiresFamily: true, childAgeToMonths: 12, appliesToExpecting: true,
  },
  "tamb-006": { regions: TMB, requiresChildren: true, ...SAD },
  "tamb-007": { regions: TMB, requiresSvoFamily: true, requiresChildren: true, ...SAD },
  "tamb-008": { regions: TMB, requiresSvoFamily: true, requiresChildren: true, ...SHKOLA },
  "tamb-012": { regions: TMB, requiresFosterParent: true, requiresChildren: true, ...SHKOLA },
  "tamb-015": {
    regions: TMB, requiresFosterParent: true, requiresChildren: true,
    hasChildAgedFrom: 15, hasChildAgedTo: 23,
  },

  "mrm-002": {
    regions: MRM, minChildren: 2, requiresFamily: true, minSimultaneousBirth: 2,
    childAgeToMonths: 12, appliesToExpecting: true,
  },
  "mrm-003": {
    regions: MRM, minChildren: 3, requiresFamily: true, minSimultaneousBirth: 3,
    childAgeToMonths: 12, appliesToExpecting: true,
  },

  "osetia-001": {
    regions: OSE, requiresChildren: true, hasChildAgedTo: 7,
    anyOf: [
      { minChildren: 3 },
      { requiresSvoFamily: true },
      { requiresDisabledChild: true },
      { requiresSingleParent: true },
    ],
  },
  "osetia-002": { regions: OSE, requiresChildren: true, ...SHKOLA },
  "osetia-004": { regions: OSE, requiresChildren: true, ...SAD },
  "osetia-005": {
    regions: OSE, requiresChildren: true, ...SAD,
    anyOf: [
      { requiresDisabledChild: true },
      { requiresFosterParent: true },
      { requiresSvoFamily: true },
    ],
  },

  "zab-001": {
    regions: ZAB, requiresFamily: true, childAgeToMonths: 12, appliesToExpecting: true,
  },
  "zab-005": { regions: ZAB, minChildren: 3, requiresChildren: true, ...SHKOLA },
});
