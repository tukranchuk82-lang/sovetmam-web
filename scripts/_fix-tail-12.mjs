// Хвост, партия 12: Кемеровская, Тюменская, ЛНР, Запорожская.
//
// Отклонила: «нуждаемость в жилье» у кузбасского маткапитала, «студента» у
// адресного пособия и наборов мер, «до семи лет» у льгот детям СВО в
// Запорожской (там перечислено разное).
//
// Приняла и доделала руками:
//   kemerovo-002 — выплата студенческим семьям при рождении ребёнка;
//   kemerovo-006 — питание школьникам из многодетных читалось как
//     «многодетная ИЛИ студент»;
//   tyumen-010 — питание школьников требовало быть семьёй СВО И иметь
//     ребёнка с инвалидностью одновременно.
import { apply } from "./_apply-criteria.mjs";

const KEM = ["Кемеровская область — Кузбасс"], TMN = ["Тюменская область"];
const LNR = ["Луганская Народная Республика"], ZPR = ["Запорожская область"];
const SHKOLA = { minSchoolChildren: 1, hasChildAgedFrom: 6, hasChildAgedTo: 18 };
const SAD = { childAgeFromMonths: 18, childAgeToMonths: 84 };
const ROZHDENIE = { childAgeToMonths: 12, appliesToExpecting: true };

await apply("tail-12", {
  "kemerovo-002": {
    regions: KEM, requiresStudent: true, requiresFamily: true, ...ROZHDENIE,
  },
  "kemerovo-006": { regions: KEM, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "kemerovo-007": { regions: KEM, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "kemerovo-008": { regions: KEM, minChildren: 3, requiresChildren: true, hasChildAgedTo: 6 },

  "tyumen-005": {
    regions: TMN, requiresFamily: true, requiresLowIncome: true,
    anyOf: [{ requiresPregnancy: true }, { maxYoungestChildAgeYears: 3 }],
  },
  "tyumen-007": {
    regions: TMN, requiresChildren: true,
    anyOf: [
      { requiresLowIncome: true, maxYoungestChildAgeYears: 3 },
      { minChildren: 3, hasChildAgedTo: 6 },
    ],
  },
  "tyumen-010": {
    regions: TMN, requiresChildren: true, ...SHKOLA,
    anyOf: [{ requiresSvoFamily: true }, { requiresDisabledChild: true }],
  },
  "tyumen-019": { regions: TMN, requiresSvoFamily: true, requiresChildren: true, ...SAD },

  "lnr-013": { regions: LNR, requiresChildren: true, ...SHKOLA },
});
