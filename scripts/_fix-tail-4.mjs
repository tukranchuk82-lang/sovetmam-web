// Хвост, партия 4: Волгоградская, Оренбургская, Пензенская, Омская.
//
// Отклонила: «многодетность» у обычного пособия малоимущим (Волгоград),
// «нуждаемость в жилье» и «ипотеку» у бесплатного участка, «опеку» у
// выплаты на ребёнка с инвалидностью, «студента» у выплат опекунам.
//
// Приняла и доделала руками:
//   oren-020 — первоочередной приём в сад падал всем семьям с детьми;
//   oren-022 — звание «Ветеран труда» родителям детей с инвалидностью и
//     многодетным приходило любой семье;
//   omsk-019 — путёвки детям-сиротам показывались всем.
import { apply } from "./_apply-criteria.mjs";

const VLG = ["Волгоградская область"], ORN = ["Оренбургская область"];
const PNZ = ["Пензенская область"], OMS = ["Омская область"];
const SHKOLA = { minSchoolChildren: 1, hasChildAgedFrom: 6, hasChildAgedTo: 18 };
const SAD = { childAgeFromMonths: 18, childAgeToMonths: 84 };

await apply("tail-4", {
  "volgograd-022": { regions: VLG, requiresChildren: true, requiresLowIncome: true, ...SAD },

  "oren-004": {
    regions: ORN, minChildren: 2, requiresFamily: true, minSimultaneousBirth: 2,
    childAgeToMonths: 12, appliesToExpecting: true,
  },
  "oren-007": { regions: ORN, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "oren-018": { regions: ORN, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "oren-020": {
    regions: ORN, requiresChildren: true, hasChildAgedTo: 7,
    anyOf: [
      { minChildren: 3 },
      { requiresSvoFamily: true },
      { requiresDisabledChild: true },
      { requiresSingleParent: true },
    ],
  },
  "oren-022": {
    regions: ORN, requiresChildren: true,
    anyOf: [{ minChildren: 3 }, { requiresDisabledChild: true }],
  },

  "pnz-008": {
    regions: PNZ, minChildren: 2, requiresFamily: true, minSimultaneousBirth: 2,
    childAgeToMonths: 12, appliesToExpecting: true,
  },
  "pnz-013": {
    regions: PNZ, requiresFamily: true, requiresStudent: true,
    childAgeToMonths: 12, appliesToExpecting: true,
  },
  "pnz-014": { regions: PNZ, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "pnz-015": { regions: PNZ, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "pnz-031": {
    regions: PNZ, requiresFamily: true, requiresStudent: true,
    childAgeToMonths: 12, appliesToExpecting: true,
  },

  "omsk-005": {
    regions: OMS, requiresFamily: true, requiresStudent: true,
    childAgeToMonths: 12, appliesToExpecting: true,
  },
  "omsk-009": {
    regions: OMS, requiresChildren: true, requiresParentUnder35: true,
    requiresHousingNeed: true,
  },
  "omsk-013": {
    regions: OMS, minChildren: 3, requiresChildren: true,
    minSchoolChildren: 1, hasChildAgedFrom: 11, hasChildAgedTo: 18,
  },
  "omsk-014": { regions: OMS, minChildren: 3, requiresChildren: true, ...SAD },
  "omsk-019": { regions: OMS, requiresFosterParent: true },
});
