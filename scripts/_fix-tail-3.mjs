// Хвост, партия 3: Алтайский край, Крым, Мордовия.
//
// Отклонила: «инвалидность» и «до трёх лет» у вознаграждения приёмным
// родителям (там это про повышенный размер), «студента» у школьной формы
// в Крыму, «школьников» у выплат опекунам в Мордовии.
import { apply } from "./_apply-criteria.mjs";

const ALT = ["Алтайский край"], KRM = ["Республика Крым"], MRD = ["Республика Мордовия"];

await apply("tail-3", {
  "altadd-006": { regions: ALT, requiresSvoFamily: true, requiresChildren: true, hasChildAgedTo: 7 },
  "altadd-013": { regions: ALT, requiresSvoFamily: true, requiresChildren: true, hasChildAgedTo: 7 },
  "reg-altayskiy-kray-004": {
    regions: ALT, requiresStudent: true, requiresFamily: true, maxParentAge: 27,
    childAgeToMonths: 12, appliesToExpecting: true,
  },
  "reg-altayskiy-kray-005": {
    regions: ALT, minChildren: 3, requiresFamily: true, requiresParentUnder35: true,
    childAgeToMonths: 12, appliesToExpecting: true,
  },

  "krym-002": {
    regions: KRM, minChildren: 3, requiresChildren: true,
    minSchoolChildren: 1, hasChildAgedFrom: 6, hasChildAgedTo: 18,
  },
  "krym-012": {
    regions: KRM, requiresChildren: true, minSchoolChildren: 1,
    hasChildAgedFrom: 6, hasChildAgedTo: 18,
  },
  "krym-016": {
    regions: KRM, requiresChildren: true, childAgeFromMonths: 18, childAgeToMonths: 84,
  },

  "mord-001": {
    regions: MRD, requiresFamily: true, childAgeToMonths: 12, appliesToExpecting: true,
  },
  "mord-004": {
    regions: MRD, requiresChildren: true, childAgeFromMonths: 18, childAgeToMonths: 84,
  },
  "mord-016": {
    regions: MRD, minChildren: 3, requiresChildren: true,
    minSchoolChildren: 1, hasChildAgedFrom: 6, hasChildAgedTo: 18,
  },
  "mord-019": { regions: MRD, minChildren: 3, requiresChildren: true, hasChildAgedTo: 7 },
  "mord-020": { regions: MRD, requiresSvoFamily: true, requiresChildren: true, hasChildAgedTo: 7 },
});
