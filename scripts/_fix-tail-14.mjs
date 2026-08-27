// Регионы без живых анкет, партия 14: Магаданская, Ивановская.
//
// Здесь семей пока нет, но люди придут — пусть подборка будет честной сразу.
//
// Отклонила: «школьников» у выплаты на дошкольника и у путёвок в лагерь,
// «нуждаемость в жилье» у ивановской выплаты при рождении.
import { apply } from "./_apply-criteria.mjs";

const MGD = ["Магаданская область"], IVN = ["Ивановская область"];
const SHKOLA = { minSchoolChildren: 1, hasChildAgedFrom: 6, hasChildAgedTo: 18 };
const SAD = { childAgeFromMonths: 18, childAgeToMonths: 84 };
const ROZHDENIE = { childAgeToMonths: 12, appliesToExpecting: true };

await apply("tail-14", {
  "mgd-001": { regions: MGD, requiresFamily: true, ...ROZHDENIE },
  "mgd-002": {
    regions: MGD, minChildren: 2, requiresFamily: true,
    minSimultaneousBirth: 2, ...ROZHDENIE,
  },
  "mgd-003": { regions: MGD, minChildren: 3, requiresFamily: true, ...ROZHDENIE },
  "mgd-007": { regions: MGD, requiresChildren: true, ...SAD },
  "mgd-020": { regions: MGD, requiresChildren: true, ...SHKOLA },
  "mgd-022": { regions: MGD, minChildren: 3, requiresChildren: true, hasChildAgedTo: 7 },
  "mgd-023": {
    regions: MGD, minChildren: 3, requiresChildren: true,
    hasChildAgedFrom: 6, hasChildAgedTo: 18,
  },
  "mgd-043": {
    regions: MGD, requiresFosterParent: true, requiresChildren: true, ...SHKOLA,
  },
  "mgd-051": { regions: MGD, requiresFamily: true, requiresStudent: true, ...ROZHDENIE },
  "mgd-053": {
    regions: MGD, requiresChildren: true, requiresLowIncome: true,
    minSchoolChildren: 1, hasChildAgedFrom: 6, hasChildAgedTo: 8,
  },

  "ivn-009": {
    regions: IVN, minChildren: 3, requiresFamily: true,
    requiresParentUnder35: true, ...ROZHDENIE,
  },
  "ivn-018": { regions: IVN, minChildren: 3, requiresChildren: true, hasChildAgedTo: 7 },
  "ivn-019": { regions: IVN, minChildren: 3, requiresChildren: true, ...SAD },
  "ivn-020": {
    regions: IVN, requiresChildren: true, minSchoolChildren: 1,
    hasChildAgedFrom: 11, hasChildAgedTo: 21,
  },
  "ivn-028": {
    regions: IVN, requiresChildren: true,
    hasChildAgedFrom: 6, hasChildAgedTo: 18,
    anyOf: [{ minChildren: 3 }, { requiresFosterParent: true }],
  },
  "ivn-036": {
    regions: IVN, requiresSvoFamily: true, requiresChildren: true,
    minSchoolChildren: 1, hasChildAgedFrom: 11, hasChildAgedTo: 18,
  },
  "ivn-037": { regions: IVN, requiresSvoFamily: true, requiresChildren: true, ...SAD },
});
