// Проверка условия requiresEmployer: мера открывается только ответом «да».
import { matchMeasures } from "../src/lib/measures.ts";

const m = {
  slug: "x", title: "x", shortDescription: "", level: "regional", region: "Тверская область",
  category: "Работа и занятость", segments: [], criteria: { regions: ["Тверская область"], requiresEmployer: "trikotazhny-dom" },
  howToApply: [], documents: [], tips: [], sourceUrl: "", sourceName: "", updatedAt: "",
};
const base = {
  pregnant: false, expectingChildNumber: null, hasChildren: false, childrenCount: 0,
  childrenAges: [], youngestChildAgeYears: null, multipleBirthCount: 1, region: "Тверская область",
  incomePm: null, lowIncome: false, disabledChild: false, specialNeedsChild: false,
  lossOfBreadwinner: false, mortgageIntent: false, svoFamily: false, singleParent: false,
  student: false, parentAge: 30, spouseAge: 32, parentUnder35: true, selfEmployed: false,
  entrepreneur: false, employed: true, taxSystem: null, hasEmployees: null,
  disabledParent: false, fosterParent: false, teacher: false,
};
const shown = (p) => matchMeasures(p, [m]).length > 0;
const check = (name, got, want) => console.log(`${got === want ? "  ok" : "  ОШИБКА"} ${name}`);
check("Тверь, ответ «да»", shown({ ...base, employers: ["trikotazhny-dom"] }), true);
check("Тверь, вопрос не задавали", shown({ ...base }), false);
check("Тверь, ответ «нет»", shown({ ...base, employers: [] }), false);
check("другая компания", shown({ ...base, employers: ["other"] }), false);
check("другой регион, ответ «да»", shown({ ...base, region: "Москва", employers: ["trikotazhny-dom"] }), false);
