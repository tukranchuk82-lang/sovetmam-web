// Хвост, партия 5: Башкортостан, Владимирская, Псковская, Приморский.
//
// Отклонила: «инвалидность» у пособия усыновителям и у земельного участка
// (там она про повышенный размер и про отдельную категорию, которая уже
// учтена), «студента» у компенсации обучения детей, «нуждаемость» у
// приморской выплаты на жильё.
//
// Приняла и доделала руками:
//   bsh-005 — пособие по уходу за ребёнком-инвалидом падало любой семье
//     республики и не проверяло, что родитель не работает;
//   bsh-012 — условия были вложены сами в себя (ошибка прежней разметки),
//     переписала;
//   bsh-018 — сертификат на частный сад для ребёнка, которому не дали место;
//   psk-012 — питание детям из семей СВО требовало родителя-студента.
import { apply } from "./_apply-criteria.mjs";

const BSH = ["Республика Башкортостан"], VLD = ["Владимирская область"];
const PSK = ["Псковская область"], PRM = ["Приморский край"];
const SHKOLA = { minSchoolChildren: 1, hasChildAgedFrom: 6, hasChildAgedTo: 18 };
const SAD = { childAgeFromMonths: 18, childAgeToMonths: 84 };

await apply("tail-5", {
  "bsh-005": {
    regions: BSH, requiresChildren: true, requiresDisabledChild: true,
    requiresNotEmployed: true,
  },
  "bsh-009": {
    regions: BSH, requiresChildren: true, ...SHKOLA,
    anyOf: [{ minChildren: 3 }, { requiresLowIncome: true }],
  },
  "bsh-012": {
    regions: BSH, requiresFamily: true, requiresLowIncome: true,
    anyOf: [{ requiresPregnancy: true }, { maxYoungestChildAgeYears: 3 }],
  },
  "bsh-013": { regions: BSH, minChildren: 3, requiresFamily: true, hasChildAgedTo: 6 },
  "bsh-018": { regions: BSH, requiresChildren: true, ...SAD },

  "vld-002": {
    regions: VLD, minChildren: 3, requiresFamily: true, requiresParentUnder35: true,
    childAgeToMonths: 12, appliesToExpecting: true,
  },
  "vld-008": {
    regions: VLD, minChildren: 2, requiresFamily: true,
    childAgeToMonths: 12, appliesToExpecting: true,
  },
  "vld-013": { regions: VLD, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "vld-015": { regions: VLD, minChildren: 3, requiresChildren: true, ...SAD },

  "psk-009": {
    regions: PSK, requiresChildren: true, ...SHKOLA,
    anyOf: [{ minChildren: 3 }, { requiresLowIncome: true }],
  },
  "psk-012": {
    regions: PSK, requiresSvoFamily: true, requiresChildren: true, ...SHKOLA,
  },
  "psk-015": { regions: PSK, requiresSvoFamily: true, requiresChildren: true, hasChildAgedTo: 7 },
  "psk-020": {
    regions: PSK, requiresChildren: true, ...SHKOLA,
    anyOf: [{ minChildren: 3 }, { requiresLowIncome: true }],
  },
  "psk-025": {
    regions: PSK, minChildren: 3, requiresFamily: true, requiresParentUnder35: true,
    childAgeToMonths: 12, appliesToExpecting: true,
  },
  "psk-031": {
    regions: PSK, requiresFamily: true, requiresParentUnder35: true,
    childAgeToMonths: 12, appliesToExpecting: true,
  },

  "prim-002": {
    regions: PRM, requiresFamily: true, childAgeToMonths: 12, appliesToExpecting: true,
  },
  "prim-008": { regions: PRM, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "prim-010": { regions: PRM, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "prim-017": {
    regions: PRM, requiresChildren: true, requiresDisabledChild: true,
    requiresNotEmployed: true,
  },
});
