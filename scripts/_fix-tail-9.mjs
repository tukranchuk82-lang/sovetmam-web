// Хвост, партия 9: Ленинградская и Ямало-Ненецкий.
//
// Отклонила: «студента» и «до трёх лет» у наборов мер (комплекс мер
// многодетным, меры семьям СВО) — там перечислено много разного, сужать по
// одному признаку нельзя.
//
// Приняла и доделала руками:
//   lenobl-008 — компенсация на питание читалась как «малоимущая ИЛИ
//     беременная», а нужен низкий доход И (беременность или малыш до трёх);
//   lenobl-019 — в условиях лежало requiresMortgageIntent: false, что для
//     движка то же самое, что ничего: убрала;
//   yamal-007 — лекарства всем детям до трёх лет, многодетным до шести.
import { apply } from "./_apply-criteria.mjs";

const LEN = ["Ленинградская область"], YAM = ["Ямало-Ненецкий автономный округ"];
const SAD = { childAgeFromMonths: 18, childAgeToMonths: 84 };
const ROZHDENIE = { childAgeToMonths: 12, appliesToExpecting: true };

await apply("tail-9", {
  "lenobl-008": {
    regions: LEN, requiresFamily: true, requiresLowIncome: true,
    anyOf: [{ requiresPregnancy: true }, { maxYoungestChildAgeYears: 3 }],
  },
  "lenobl-015": {
    regions: LEN, requiresFamily: true, requiresStudent: true,
    maxParentAge: 25, ...ROZHDENIE,
  },
  "lenobl-016": {
    regions: LEN, minChildren: 3, requiresFamily: true,
    requiresParentUnder35: true, ...ROZHDENIE,
  },
  "lenobl-019": {
    regions: LEN, minChildren: 3, requiresFamily: true, minSimultaneousBirth: 3,
    requiresHousingNeed: true,
  },
  "lenobl-034": {
    regions: LEN, requiresChildren: true, hasChildAgedTo: 7,
    anyOf: [
      { minChildren: 3 },
      { requiresSvoFamily: true },
      { requiresDisabledChild: true },
      { requiresSingleParent: true },
    ],
  },
  "lenobl-035": { regions: LEN, requiresChildren: true, ...SAD },

  "yamal-007": {
    regions: YAM, requiresChildren: true,
    anyOf: [{ maxYoungestChildAgeYears: 3 }, { minChildren: 3, hasChildAgedTo: 6 }],
  },
  "yamal-025": { regions: YAM, requiresFosterParent: true },
  "yamal-026": { regions: YAM, requiresFosterParent: true },
  "yamal-037": {
    regions: YAM, requiresChildren: true, minSchoolChildren: 1,
    hasChildAgedFrom: 6, hasChildAgedTo: 18,
  },
});
