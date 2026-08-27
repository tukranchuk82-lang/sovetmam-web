// Хвост, партия 11: Адыгея, Курганская, Белгородская, Воронежская,
// Калининградская.
//
// Отклонила: «опеку» у знака «Материнская слава» и у компенсации проезда,
// «студента» у школьного питания и у выплаты раненым детям, «нуждаемость в
// жилье» у земельных участков многодетным, «до трёх лет» у пособия
// студенческим семьям.
//
// Приняла и доделала руками:
//   krg-002 — компенсация ЖКУ федеральным льготникам падала всем семьям;
//   krg-018 — бесплатный спорт показывался всем;
//   voronezh-006 — компенсация ЖКУ малообеспеченным многодетным не
//     проверяла доход.
import { apply } from "./_apply-criteria.mjs";

const ADG = ["Республика Адыгея"], KRG = ["Курганская область"];
const BLG = ["Белгородская область"], VRN = ["Воронежская область"];
const KLD = ["Калининградская область"];
const SHKOLA = { minSchoolChildren: 1, hasChildAgedFrom: 6, hasChildAgedTo: 18 };
const SAD = { childAgeFromMonths: 18, childAgeToMonths: 84 };
const ROZHDENIE = { childAgeToMonths: 12, appliesToExpecting: true };

await apply("tail-11", {
  "adg-002": { regions: ADG, requiresFamily: true, ...ROZHDENIE },
  "adg-006": { regions: ADG, requiresFamily: true, maxParentAge: 26, ...ROZHDENIE },
  "adg-007": {
    regions: ADG, minChildren: 3, requiresFamily: true,
    requiresParentUnder35: true, ...ROZHDENIE,
  },
  "adg-009": { regions: ADG, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "adg-023": { regions: ADG, requiresChildren: true, ...SHKOLA },
  "adg-026": { regions: ADG, requiresChildren: true, ...SAD },

  "krg-002": {
    regions: KRG, requiresChildren: true,
    anyOf: [{ requiresDisabledChild: true }, { requiresDisabledParent: true }],
  },
  "krg-012": {
    regions: KRG, minChildren: 2, requiresFamily: true,
    minSimultaneousBirth: 2, ...ROZHDENIE,
  },
  "krg-018": {
    regions: KRG, requiresChildren: true,
    anyOf: [
      { minChildren: 3 },
      { requiresLowIncome: true },
      { requiresFosterParent: true },
    ],
  },
  "krg-023": {
    regions: KRG, requiresChildren: true, minSchoolChildren: 1,
    hasChildAgedFrom: 11, hasChildAgedTo: 18,
    anyOf: [
      { minChildren: 3 },
      { requiresLowIncome: true },
      { requiresSvoFamily: true },
    ],
  },
  "krg-024": { regions: KRG, minChildren: 3, requiresChildren: true, ...SHKOLA },

  "blg-001": { regions: BLG, minChildren: 5, requiresFamily: true, ...ROZHDENIE },
  "blg-008": { regions: BLG, requiresSvoFamily: true, requiresChildren: true, ...SHKOLA },
  "blg-011": {
    regions: BLG, minChildren: 3, requiresFamily: true,
    requiresParentUnder35: true, ...ROZHDENIE,
  },
  "blg-018": { regions: BLG, minChildren: 3, requiresChildren: true, ...SHKOLA },

  "voronezh-002": {
    regions: VRN, minChildren: 3, requiresFamily: true,
    requiresParentUnder35: true, ...ROZHDENIE,
  },
  "voronezh-003": {
    regions: VRN, minChildren: 2, requiresFamily: true,
    maxParentAge: 28, requiresParentUnder35: true, ...ROZHDENIE,
  },
  "voronezh-006": {
    regions: VRN, minChildren: 3, requiresChildren: true, requiresLowIncome: true,
  },
  "voronezh-019": {
    regions: VRN, requiresSvoFamily: true, requiresChildren: true, hasChildAgedTo: 7,
  },

  "reg-kaliningradskaya-oblast-003": {
    regions: KLD, minChildren: 3, requiresFamily: true,
    requiresParentUnder35: true, ...ROZHDENIE,
  },
  "reg-kaliningradskaya-oblast-009": {
    regions: KLD, requiresFamily: true, requiresStudent: true, ...ROZHDENIE,
  },
});
