// Кузбасс: критерий нуждаемости и разбор ошибок отбора.
//
// Заказчица указала, что выплата многодетным идёт только малоимущим семьям.
// Это подтверждается и открытыми источниками: с 1 марта 2026 года льготы
// многодетным Кузбасса дают с учётом критерия нуждаемости — доход на человека
// не выше прожиточного минимума. Под критерий попали: ежемесячная и
// ежеквартальная выплаты, компенсация 30 % ЖКУ, школьная и спортивная форма,
// питание в школе, бесплатные лекарства детям до шести лет и льготы по
// обучению.
//
// Заодно поправлены ошибки отбора, найденные при разборе:
//   kemerovo-009 — выплата на школьную форму требовала родителя-студента;
//   kemerovo-012 — доплата семьям СВО требовала ребёнка с инвалидностью,
//     хотя она для семей погибших и родителей с инвалидностью I–II группы;
//   kemerovo-014 — оплата обучения детям участников СВО требовала, чтобы
//     студентом был родитель, и не проверяла участие в СВО.
import { apply } from "./_apply-criteria.mjs";

const R = ["Кемеровская область — Кузбасс"];
const MNOGODETNYE_NUZHDA = { regions: R, minChildren: 3, requiresChildren: true, requiresLowIncome: true };
const SHKOLA = { minSchoolChildren: 1, hasChildAgedFrom: 6, hasChildAgedTo: 18 };

await apply("kuzbass", {
  "kemerovo-003": MNOGODETNYE_NUZHDA,
  "kemerovo-004": MNOGODETNYE_NUZHDA,
  "kemerovo-005": MNOGODETNYE_NUZHDA,
  "kemerovo-006": { ...MNOGODETNYE_NUZHDA, ...SHKOLA },
  "kemerovo-008": { ...MNOGODETNYE_NUZHDA, hasChildAgedTo: 6 },
  "kemerovo-009": { ...MNOGODETNYE_NUZHDA, ...SHKOLA },
  "kemerovo-011": {
    regions: R, requiresChildren: true, requiresDisabledChild: true,
  },
  "kemerovo-012": {
    regions: R, requiresSvoFamily: true,
    anyOf: [{ requiresDisabledParent: true }, { requiresLossOfBreadwinner: true }],
  },
  "kemerovo-014": {
    regions: R, requiresSvoFamily: true, requiresChildren: true,
    requiresChildStudying: true,
  },
});
