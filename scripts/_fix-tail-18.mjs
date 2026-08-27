// Регионы без живых анкет, партия 18 — последняя.
//
// Астраханская, ДНР, Еврейская АО, Калужская, Камчатский, Алтай, Бурятия,
// Ингушетия, Калмыкия, Тыва. В Херсонской и Новгородской расхождений нет.
//
// Отклонила: «нуждаемость в жилье» у калужской выплаты на жильё и у
// тывинского маткапитала, «до семи лет» у компенсации родителям детей с
// инвалидностью на домашнем обучении.
import { apply } from "./_apply-criteria.mjs";

const AST = ["Астраханская область"], DNR = ["Донецкая Народная Республика"];
const EAO = ["Еврейская автономная область"], KLG = ["Калужская область"];
const KAM = ["Камчатский край"], ALT = ["Республика Алтай"], BUR = ["Республика Бурятия"];
const ING = ["Республика Ингушетия"], KLM = ["Республика Калмыкия"], TUV = ["Республика Тыва"];
const SHKOLA = { minSchoolChildren: 1, hasChildAgedFrom: 6, hasChildAgedTo: 18 };
const SAD = { childAgeFromMonths: 18, childAgeToMonths: 84 };
const ROZHDENIE = { childAgeToMonths: 12, appliesToExpecting: true };

await apply("tail-18", {
  "astra-002": { regions: AST, requiresChildren: true, ...SAD },
  "astra-006": { regions: AST, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "astra-007": { regions: AST, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "astra-009": { regions: AST, minChildren: 3, requiresChildren: true, ...SHKOLA },

  "dnr-007": {
    regions: DNR, requiresChildren: true, hasChildAgedTo: 7,
    anyOf: [
      { minChildren: 3 },
      { requiresSvoFamily: true },
      { requiresDisabledChild: true },
      { requiresSingleParent: true },
    ],
  },
  "dnr-008": { regions: DNR, requiresChildren: true, ...SHKOLA },
  "dnr-013": { regions: DNR, requiresChildren: true, ...SHKOLA },

  "eao-001": { regions: EAO, requiresFamily: true, ...ROZHDENIE },
  "eao-005": {
    regions: EAO, minChildren: 2, requiresFamily: true,
    minSimultaneousBirth: 2, ...ROZHDENIE,
  },
  "eao-009": { regions: EAO, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "eao-011": { regions: EAO, minChildren: 3, requiresChildren: true, ...SAD },
  "eao-012": { regions: EAO, minChildren: 3, requiresChildren: true, hasChildAgedTo: 7 },
  "eao-013": { regions: EAO, requiresSvoFamily: true, requiresChildren: true, ...SAD },
  "eao-014": {
    regions: EAO, requiresChildren: true, ...SAD,
    anyOf: [{ requiresDisabledChild: true }, { requiresFosterParent: true }],
  },
  "eao-015": { regions: EAO, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "eao-016": { regions: EAO, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "eao-017": {
    regions: EAO, requiresSvoFamily: true, requiresChildren: true,
    minSchoolChildren: 1, hasChildAgedFrom: 11, hasChildAgedTo: 18,
  },

  "klg-006": { regions: KLG, requiresSvoFamily: true, requiresChildren: true, ...SHKOLA },
  "klg-007": { regions: KLG, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "klg-012": { regions: KLG, minChildren: 3, requiresChildren: true, ...SHKOLA },

  "kam-007": { regions: KAM, requiresFamily: true, ...ROZHDENIE },
  "kam-009": { regions: KAM, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "kam-016": {
    regions: KAM, minChildren: 2, requiresFamily: true,
    minSimultaneousBirth: 2, ...ROZHDENIE,
  },

  "ralt-003": { regions: ALT, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "ralt-004": {
    regions: ALT, requiresChildren: true, ...SHKOLA,
    anyOf: [{ minChildren: 3 }, { requiresLowIncome: true }],
  },

  "bur-004": { regions: BUR, requiresChildren: true, requiresLowIncome: true, ...SAD },
  "bur-006": { regions: BUR, requiresFamily: true, ...ROZHDENIE },
  "bur-009": { regions: BUR, minChildren: 3, requiresChildren: true, ...SHKOLA },

  "ingushetia-001": {
    regions: ING, minChildren: 8, requiresFamily: true, ...ROZHDENIE,
  },
  "ingushetia-002": {
    regions: ING, minChildren: 2, requiresFamily: true,
    minSimultaneousBirth: 2, ...ROZHDENIE,
  },

  "klm-001": { regions: KLM, requiresFamily: true, ...ROZHDENIE },
  "klm-004": { regions: KLM, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "klm-007": { regions: KLM, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "klm-012": { regions: KLM, requiresChildren: true, ...SAD },

  "tuva-001": {
    regions: TUV, minChildren: 2, requiresFamily: true,
    minSimultaneousBirth: 2, ...ROZHDENIE,
  },
  "tuva-003": { regions: TUV, requiresChildren: true, ...SHKOLA },
  "tuva-004": { regions: TUV, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "tuva-005": { regions: TUV, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "tuva-006": { regions: TUV, requiresSvoFamily: true, requiresChildren: true, ...SHKOLA },
  "tuva-add-detsad-svo": {
    regions: TUV, requiresSvoFamily: true, requiresChildren: true, ...SAD,
  },
  "tuva-add-nabor": { regions: TUV, requiresFamily: true, ...ROZHDENIE },
});
