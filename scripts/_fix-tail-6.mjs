// Хвост, партия 6: Коми, Ставропольский, Пермский, Югра.
//
// Крупное: пермская единовременная выплата при рождении ребёнка и пермское
// бесплатное питание детям участников СВО были помечены как меры для
// студентов — обычные семьи их не видели. Коми: выплата одиноким родителям
// детей с инвалидностью читалась как «инвалидность ИЛИ опека ИЛИ одинокий
// родитель», хотя нужны обе части сразу.
//
// Отклонила: «студента» у школьного питания и у наборов мер, «до трёх лет»
// у надбавки приёмным родителям, «до семи лет» у проезда школьников.
import { apply } from "./_apply-criteria.mjs";

const KMI = ["Республика Коми"], STV = ["Ставропольский край"];
const PRM = ["Пермский край"], HMA = ["Ханты-Мансийский автономный округ — Югра"];
const SHKOLA = { minSchoolChildren: 1, hasChildAgedFrom: 6, hasChildAgedTo: 18 };
const SAD = { childAgeFromMonths: 18, childAgeToMonths: 84 };

await apply("tail-6", {
  "komi-005": { regions: KMI, requiresChildren: true, ...SHKOLA },
  "komi-014": {
    regions: KMI, minChildren: 3, requiresChildren: true,
    minSchoolChildren: 1, hasChildAgedFrom: 11, hasChildAgedTo: 18,
  },
  "komi-019": {
    regions: KMI, requiresChildren: true, requiresSingleParent: true,
    requiresDisabledChild: true,
  },
  "komi-036": { regions: KMI, requiresChildren: true, ...SAD },

  "stavropol-005": {
    regions: STV, requiresStudent: true, requiresFamily: true,
    childAgeToMonths: 12, appliesToExpecting: true,
  },
  "stavropol-006": { regions: STV, requiresChildren: true, ...SAD },
  "stavropol-010": { regions: STV, requiresSvoFamily: true, requiresChildren: true, ...SAD },
  "stavropol-011": { regions: STV, requiresSvoFamily: true, requiresChildren: true, ...SHKOLA },

  "perm-001": {
    regions: PRM, requiresFamily: true, childAgeToMonths: 12, appliesToExpecting: true,
  },
  "perm-002": {
    regions: PRM, requiresSvoFamily: true, requiresFamily: true,
    childAgeToMonths: 12, appliesToExpecting: true,
  },
  "perm-004": { regions: PRM, requiresSvoFamily: true, requiresChildren: true, ...SAD },
  "perm-005": { regions: PRM, requiresSvoFamily: true, requiresChildren: true, ...SHKOLA },
  "perm-009": {
    regions: PRM, requiresChildren: true, ...SHKOLA,
    anyOf: [{ minChildren: 3 }, { requiresLowIncome: true }],
  },
  "perm-010": { regions: PRM, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "perm-011": { regions: PRM, minChildren: 3, requiresChildren: true, hasChildAgedTo: 6 },
  "perm-013": {
    regions: PRM, minSimultaneousBirth: 2, requiresFamily: true,
    childAgeToMonths: 12, appliesToExpecting: true,
  },

  "hmao-007": { regions: HMA, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "hmao-011": {
    regions: HMA, requiresChildren: true, requiresDisabledChild: true, hasChildAgedTo: 18,
  },
});
