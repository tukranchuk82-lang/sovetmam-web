// Хвост, партия 1: Красноярский край, Ярославская, Новосибирская, Татарстан.
//
// Предложения робота вычитаны руками. Что отклонила и почему:
//   krasn-001 — краевой маткапитал не требует ребёнка с инвалидностью:
//     адаптация детей-инвалидов там лишь направление расходования;
//   krasn-013 — знак «Материнская слава» не про опеку;
//   yarosl-004, rtadd-016, tat-011 — «студент» в тексте относится к ребёнку,
//     а не к заявителю-родителю;
//   novosib-008, novosib-017 — распоряжение капиталом и выплата взамен
//     участка не требуют учёта нуждающихся.
//
// Что приняла — ниже.
import { apply } from "./_apply-criteria.mjs";

const KRASN = ["Красноярский край"], YAR = ["Ярославская область"];
const NSK = ["Новосибирская область"], RT = ["Республика Татарстан"];

await apply("tail-1", {
  // Красноярский край
  "krasn-008": { regions: KRASN, minChildren: 3, requiresChildren: true, minSchoolChildren: 1 },
  "krasn-017": {
    regions: KRASN, requiresSvoFamily: true, requiresChildren: true,
    minSchoolChildren: 1, hasChildAgedFrom: 11, hasChildAgedTo: 18,
  },

  // Ярославская
  "yarosl-001": { regions: YAR, minChildren: 3, requiresChildren: true, requiresHousingNeed: true },
  "yarosl-002": { regions: YAR, minChildren: 8, requiresChildren: true, requiresHousingNeed: true },
  // Лекарства: всем детям до трёх лет, многодетным — до шести. Это ИЛИ.
  "yarosl-003": {
    regions: YAR, requiresChildren: true,
    anyOf: [{ maxYoungestChildAgeYears: 3 }, { minChildren: 3, hasChildAgedTo: 6 }],
  },
  "yarosl-009": {
    regions: YAR, minChildren: 2, requiresFamily: true, minSimultaneousBirth: 2,
    childAgeToMonths: 12, appliesToExpecting: true,
  },
  "yarosl-010": {
    regions: YAR, requiresChildren: true, minSchoolChildren: 1,
    hasChildAgedFrom: 6, hasChildAgedTo: 18,
  },
  "yarosl-021": {
    regions: YAR, minChildren: 3, requiresFamily: true, requiresParentUnder35: true,
    childAgeToMonths: 12, appliesToExpecting: true,
  },
  "yarosl-028": {
    regions: YAR, requiresSvoFamily: true, requiresChildren: true, hasChildAgedTo: 7,
  },
  "yarosl-030": {
    regions: YAR, requiresSvoFamily: true, requiresChildren: true,
    hasChildAgedFrom: 6, hasChildAgedTo: 18,
  },

  // Новосибирская
  "reg-novosibirskaya-oblast-013": {
    regions: NSK, requiresFamily: true, requiresParentUnder35: true,
    childAgeToMonths: 12, appliesToExpecting: true,
  },
  "reg-novosibirskaya-oblast-014": {
    regions: NSK, requiresStudent: true, requiresChildren: true,
    requiresParentUnder35: true, childAgeFromMonths: 18, childAgeToMonths: 84,
  },
  "reg-novosibirskaya-oblast-015": {
    regions: NSK, requiresChildren: true, requiresLowIncome: true,
    childAgeFromMonths: 18, childAgeToMonths: 84,
  },

  // Татарстан
  "rtadd-003": {
    regions: RT, requiresFamily: true, requiresHousingNeed: true,
    requiresParentUnder35: true, requiresMortgageIntent: true,
  },
  "rtadd-004": { regions: RT, requiresFamily: true, requiresMortgage: true },
  "rtadd-005": { regions: RT, requiresSvoFamily: true, requiresMortgageIntent: true },
  "rtadd-008": {
    regions: RT, requiresChildren: true, childAgeFromMonths: 18, childAgeToMonths: 84,
  },
  "rtadd-009": {
    regions: RT, minChildren: 3, requiresChildren: true, requiresLowIncome: true,
    childAgeFromMonths: 18, childAgeToMonths: 84,
  },
  "rtadd-015": {
    regions: RT, requiresFamily: true, requiresHousingNeed: true,
    requiresParentUnder35: true, requiresMortgageIntent: true,
  },
  "rtadd-016": {
    regions: RT, requiresSvoFamily: true, requiresChildren: true,
    minSchoolChildren: 1, childAgeFromMonths: 84, childAgeToMonths: 240,
  },
  "tat-002": {
    regions: RT, minChildren: 3, requiresChildren: true, minSchoolChildren: 1,
  },
  "tat-003": { regions: RT, minChildren: 3, requiresFamily: true, hasChildAgedTo: 6 },
  "tat-007": {
    regions: RT, requiresFamily: true, requiresLowIncome: true, maxYoungestChildAgeYears: 3,
  },
  "tat-011": {
    regions: RT, minChildren: 3, requiresFamily: true, requiresChildStudying: true,
  },
});
