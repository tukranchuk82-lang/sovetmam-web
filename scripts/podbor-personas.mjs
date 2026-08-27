// Эталонные анкеты для проверки подбора.
//
// Каждая — живая семейная ситуация. Проверяем не только «что должно прийти»,
// но и «чего быть не должно»: именно лишние меры выводят человека из себя.
// Запреты не пишем руками — их выводит _check-personas.mjs из самой анкеты
// (см. ЗАПРЕТЫ там): если в анкете нет детей до трёх лет, ни одна мера со
// словами «до трёх лет» в названии в подборку попасть не может.

const base = {
  student: false, teacher: false, hardship: false, ownsHome: true,
  homeUnfit: false, svoRoles: [], svoFamily: false, rareDisease: false,
  entrepreneur: false, fosterParent: false, selfEmployed: false,
  singleParent: false, disabledChild: false, veteranCombat: false,
  disabledParent: false, mortgageIntent: false, hasMortgage: false,
  conscriptSpouse: false, lossOfBreadwinner: false, radiationAffected: false,
  specialNeedsChild: false, multipleBirthCount: 1, registeredEarly: null,
  targetedContract: null, unemployedStatus: null, voluntaryInsurance: null,
  housingNeedStatus: "no", studyLevel: null, studyFunding: null,
  taxSystem: null, workFields: [], previousEmployment: null,
  expectingChildNumber: null, pregnancyStage: null, settlementType: "city",
  residentsCount: 3, homeArea: 60, parentUnder35: false, hasEmployees: null,
};

// Возраст ребёнка задаём годами — так анкеты читаются глазами.
const child = (years, months = 0, extra = {}) => {
  const now = new Date(2026, 7, 27);
  const total = Math.round(years * 12 + months);
  const d = new Date(now.getFullYear(), now.getMonth() - total, 1);
  return { birthYear: d.getFullYear(), birthMonth: d.getMonth() + 1, ...extra };
};

const kids = (list) => ({
  children: list,
  hasChildren: list.length > 0,
  childrenCount: list.length,
  childrenAges: list.map((c) => 2026 - c.birthYear),
  youngestChildAgeYears: list.length
    ? Math.min(...list.map((c) => (2026 - c.birthYear) * 12 + (8 - c.birthMonth)) ) / 12
    : null,
});

export const PERSONAS = [
  {
    name: "Москва, работает, дети 15 и 23 (анкета заказчицы)",
    survey: { ...base, region: "Москва", employed: true, employmentStatus: "working",
      employmentKinds: ["hired"], workFields: ["public"], pregnant: false,
      incomePm: null, lowIncome: false, parentAge: 51, spouseAge: 60,
      ...kids([child(23, 0, { studiesFullTime: true }), child(15)]) },
  },
  {
    name: "Санкт-Петербург, беременна первым, работает",
    survey: { ...base, region: "Санкт-Петербург", employed: true, employmentStatus: "working",
      employmentKinds: ["hired"], pregnant: true, pregnancyStage: "second",
      expectingChildNumber: 1, registeredEarly: true, incomePm: 1.4, lowIncome: false,
      parentAge: 29, parentUnder35: true, ...kids([]) },
  },
  {
    name: "Чувашия, в декрете, ребёнку 4 месяца",
    survey: { ...base, region: "Чувашская Республика", employed: true,
      employmentStatus: "parental-leave", employmentKinds: ["hired"], pregnant: false,
      incomePm: 0.8, lowIncome: true, parentAge: 27, parentUnder35: true,
      ...kids([child(0, 4)]) },
  },
  {
    name: "Саратовская, многодетная малоимущая, село",
    survey: { ...base, region: "Саратовская область", employed: false,
      employmentStatus: "not-working", pregnant: false, settlementType: "village",
      incomePm: 0.6, lowIncome: true, parentAge: 36, residentsCount: 5,
      ...kids([child(2), child(7), child(12)]) },
  },
  {
    name: "Рязанская, ребёнок с инвалидностью, работает",
    survey: { ...base, region: "Рязанская область", employed: true,
      employmentStatus: "working", employmentKinds: ["hired"], pregnant: false,
      disabledChild: true, specialNeedsChild: true, incomePm: 1.1, lowIncome: false,
      parentAge: 40, ...kids([child(9)]) },
  },
  {
    name: "Смоленская, одинокая мама, двое, малоимущая",
    survey: { ...base, region: "Смоленская область", employed: true,
      employmentStatus: "working", employmentKinds: ["hired"], pregnant: false,
      singleParent: true, incomePm: 0.7, lowIncome: true, parentAge: 33,
      ...kids([child(4), child(10)]) },
  },
  {
    name: "Краснодарский край, семья участника СВО",
    survey: { ...base, region: "Краснодарский край", employed: false,
      employmentStatus: "not-working", pregnant: false, svoFamily: true,
      svoRoles: ["contract"], incomePm: 0.9, lowIncome: true, parentAge: 31,
      parentUnder35: true, ...kids([child(3), child(6)]) },
  },
  {
    name: "Ростовская, студенческая семья, ребёнку год",
    survey: { ...base, region: "Ростовская область", employed: false,
      employmentStatus: "not-working", pregnant: false, student: true,
      studyLevel: "higher", studyFunding: "budget", incomePm: 0.5, lowIncome: true,
      parentAge: 21, parentUnder35: true, ...kids([child(1)]) },
  },
  {
    name: "Челябинская, не работает, ищет работу, ребёнок 6",
    survey: { ...base, region: "Челябинская область", employed: false,
      employmentStatus: "not-working", previousEmployment: "hired", pregnant: false,
      incomePm: 0.8, lowIncome: true, parentAge: 34, parentUnder35: true,
      ...kids([child(6)]) },
  },
  {
    name: "Нижегородская, самозанятая, ребёнок 4",
    survey: { ...base, region: "Нижегородская область", employed: true,
      employmentStatus: "working", employmentKinds: ["self-employed"],
      selfEmployed: true, pregnant: false, incomePm: 1.2, lowIncome: false,
      parentAge: 38, ...kids([child(4)]) },
  },
  {
    name: "Иркутская, детей нет, планируют",
    survey: { ...base, region: "Иркутская область", employed: true,
      employmentStatus: "working", employmentKinds: ["hired"], pregnant: false,
      incomePm: 1.5, lowIncome: false, parentAge: 30, parentUnder35: true,
      residentsCount: 2, ...kids([]) },
  },
  {
    name: "Московская область, приёмная семья, ипотека",
    survey: { ...base, region: "Московская область", employed: true,
      employmentStatus: "working", employmentKinds: ["hired"], pregnant: false,
      fosterParent: true, hasMortgage: true, incomePm: 1.3, lowIncome: false,
      parentAge: 44, ...kids([child(8), child(13)]) },
  },
  {
    name: "Москва, многодетная, дети 5, 9, 14",
    survey: { ...base, region: "Москва", employed: true, employmentStatus: "working",
      employmentKinds: ["hired"], pregnant: false, incomePm: 1.0, lowIncome: false,
      parentAge: 41, residentsCount: 5, ...kids([child(5), child(9), child(14)]) },
  },
  {
    name: "Чувашия, ждёт третьего, работает, ипотека в планах",
    survey: { ...base, region: "Чувашская Республика", employed: true,
      employmentStatus: "working", employmentKinds: ["hired"], pregnant: true,
      pregnancyStage: "third", expectingChildNumber: 3, mortgageIntent: true,
      incomePm: 1.1, lowIncome: false, parentAge: 34, parentUnder35: true,
      ...kids([child(6), child(11)]) },
  },
];
