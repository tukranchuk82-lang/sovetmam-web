// Хвост, партия 10: Вологодская, Хабаровский, Амурская, Удмуртская.
//
// Отклонила: «опеку» у амурского маткапитала и у услуг ранней помощи,
// «инвалидность» у содержания подопечных детей, «школьников» у выплаты на
// частный сад для малышей 1,5–3 лет, «нуждаемость в жилье» у вологодской
// выплаты многодетным.
//
// Приняла и доделала руками:
//   khab-012 — питание школьников падало всем семьям с детьми;
//   khab-035, khab-036, udm-019, udm-022 — меры для сирот и приёмных семей
//     показывались всем;
//   vol-007 — пособие женщинам без права на декретные: добавлено условие о
//     занятости, иначе оно приходило работающим.
import { apply } from "./_apply-criteria.mjs";

const VOL = ["Вологодская область"], KHB = ["Хабаровский край"];
const AMR = ["Амурская область"], UDM = ["Удмуртская Республика"];
const SHKOLA = { minSchoolChildren: 1, hasChildAgedFrom: 6, hasChildAgedTo: 18 };
const SAD = { childAgeFromMonths: 18, childAgeToMonths: 84 };
const ROZHDENIE = { childAgeToMonths: 12, appliesToExpecting: true };

await apply("tail-10", {
  "vol-001": {
    regions: VOL, requiresFamily: true, maxParentAge: 25,
    requiresParentUnder35: true, ...ROZHDENIE,
  },
  "vol-002": {
    regions: VOL, minChildren: 3, requiresFamily: true,
    requiresParentUnder35: true, ...ROZHDENIE,
  },
  "vol-003": { regions: VOL, minChildren: 3, requiresFamily: true, ...ROZHDENIE },
  "vol-007": {
    regions: VOL, requiresFamily: true, requiresLowIncome: true,
    requiresNotEmployed: true, ...ROZHDENIE,
  },
  "vol-015": { regions: VOL, requiresChildren: true, requiresLowIncome: true, ...SAD },
  "vol-026": { regions: VOL, minChildren: 3, requiresChildren: true, ...SHKOLA },

  "khab-001": { regions: KHB, requiresFamily: true, ...ROZHDENIE },
  "khab-003": { regions: KHB, minChildren: 2, requiresFamily: true, ...ROZHDENIE },
  "khab-010": { regions: KHB, requiresChildren: true, ...SAD },
  "khab-011": { regions: KHB, minChildren: 3, requiresChildren: true, hasChildAgedTo: 7 },
  "khab-012": {
    regions: KHB, requiresChildren: true, ...SHKOLA,
    anyOf: [
      { hasChildAgedFrom: 6, hasChildAgedTo: 11 },
      { minChildren: 3 },
      { requiresLowIncome: true },
      { requiresDisabledChild: true },
    ],
  },
  "khab-018": { regions: KHB, requiresSvoFamily: true, requiresChildren: true, ...SAD },
  "khab-030": { regions: KHB, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "khab-035": { regions: KHB, requiresFosterParent: true },
  "khab-036": { regions: KHB, requiresFosterParent: true },

  "amur-002": { regions: AMR, requiresFamily: true, ...ROZHDENIE },
  "amur-003": { regions: AMR, requiresFamily: true, requiresStudent: true, ...ROZHDENIE },
  "amur-017": { regions: AMR, requiresChildren: true, ...SHKOLA },
  "amur-031": { regions: AMR, requiresChildren: true, ...SAD },
  "amur-032": { regions: AMR, requiresChildren: true, ...SHKOLA },

  "udm-002": { regions: UDM, requiresFamily: true, requiresStudent: true, ...ROZHDENIE },
  "udm-003": {
    regions: UDM, minChildren: 3, requiresFamily: true,
    requiresParentUnder35: true, ...ROZHDENIE,
  },
  "udm-012": { regions: UDM, requiresChildren: true, ...SHKOLA },
  "udm-019": { regions: UDM, requiresFosterParent: true },
  "udm-022": {
    regions: UDM, requiresChildren: true,
    anyOf: [{ requiresFosterParent: true }, { requiresDisabledChild: true }],
  },
  "udm-026": {
    regions: UDM, requiresChildren: true, ...SHKOLA,
    anyOf: [{ requiresLowIncome: true }, { requiresSpecialNeedsChild: true }],
  },
});
