// Регионы без живых анкет, партия 16: Севастополь, Орловская,
// Кабардино-Балкария, Ненецкий АО.
//
// Отклонила: «многодетность» у социального контракта в КБР (он для
// малоимущих и семей СВО), «неработающего» у пособия по уходу 1,5–3 лет.
import { apply } from "./_apply-criteria.mjs";

const SEV = ["Севастополь"], ORL = ["Орловская область"];
const KBR = ["Кабардино-Балкарская Республика"], NAO = ["Ненецкий автономный округ"];
const SHKOLA = { minSchoolChildren: 1, hasChildAgedFrom: 6, hasChildAgedTo: 18 };
const SAD = { childAgeFromMonths: 18, childAgeToMonths: 84 };
const ROZHDENIE = { childAgeToMonths: 12, appliesToExpecting: true };

await apply("tail-16", {
  "sev-001": { regions: SEV, requiresChildren: true, ...SAD },
  "sev-002": {
    regions: SEV, requiresChildren: true, requiresSpecialNeedsChild: true, ...SAD,
  },
  "sev-003": {
    regions: SEV, requiresChildren: true, ...SAD,
    anyOf: [{ requiresDisabledChild: true }, { requiresFosterParent: true }],
  },
  "sev-015": { regions: SEV, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "sev-016": {
    regions: SEV, minChildren: 3, requiresFamily: true,
    requiresParentUnder35: true, ...ROZHDENIE,
  },

  "orl-005": { regions: ORL, minChildren: 3, requiresChildren: true, ...SHKOLA },
  "orl-012": {
    regions: ORL, minChildren: 3, requiresFamily: true,
    requiresParentUnder35: true, ...ROZHDENIE,
  },
  "orl-014": { regions: ORL, requiresFosterParent: true },
  "orl-027": { regions: ORL, requiresChildren: true, ...SHKOLA },
  "orl-029": { regions: ORL, requiresChildren: true, ...SAD },

  "kbr-002": {
    regions: KBR, requiresFamily: true, minSimultaneousBirth: 3, ...ROZHDENIE,
  },

  "nao-004": { regions: NAO, minChildren: 2, requiresFamily: true, ...ROZHDENIE },
  "nao-022": { regions: NAO, minChildren: 3, requiresChildren: true, ...SHKOLA },
});
