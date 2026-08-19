// Готовим анкету, на которой видны все блоки нового экрана результатов:
// срочная мера (ребёнку 4 месяца), меры «всем» и «вам», плашки статусов.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const now = new Date();
const born = new Date(now.getFullYear(), now.getMonth() - 4, 1);
const survey = {
  region: "Костромская область", settlementType: "city",
  pregnant: false, expectingChildNumber: null,
  hasChildren: true, childrenCount: 3,
  children: [
    { birthYear: born.getFullYear(), birthMonth: born.getMonth() + 1 },
    { birthYear: now.getFullYear() - 8, birthMonth: 5 },
    { birthYear: now.getFullYear() - 19, birthMonth: 9, studiesFullTime: true },
  ],
  childrenAges: [0, 8, 19], youngestChildAgeYears: 0, multipleBirthCount: 1,
  incomePm: 1, lowIncome: true,
  disabledChild: false, specialNeedsChild: false, rareDisease: false,
  lossOfBreadwinner: false, mortgageIntent: true, hasMortgage: false,
  svoFamily: false, svoRoles: [], singleParent: false, student: false,
  parentAge: 34, spouseAge: 36, parentUnder35: false,
  employmentStatus: "not-working", employmentKinds: [], unemployedStatus: false,
  previousEmployment: null, voluntaryInsurance: null, workFields: [],
  selfEmployed: false, entrepreneur: false, employed: false,
  taxSystem: null, hasEmployees: null, teacher: false,
  disabledParent: false, fosterParent: false,
  ownsHome: true, homeArea: 34, residentsCount: 5, homeUnfit: false,
  housingNeedStatus: "no", conscriptSpouse: false, veteranCombat: false,
  radiationAffected: false, hardship: false,
};
const { error } = await sb.from("app_users").update({ survey }).eq("email", process.argv[2]);
console.log(error ? "ошибка: " + error.message : "анкета записана: 3 детей (4 месяца, 8 и 19 лет), малоимущая, тесное жильё, без статуса безработного");
