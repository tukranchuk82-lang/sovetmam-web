// Курганская область — меры поддержки семей с детьми (региональный бюджет).
// Источник: официальная форма субъекта (xlsx, запрос Т.В. Буцкой), 28 строк.
// Пропущена «Субсидия на ЖКУ» (ПП РФ № 761 — федеральная) → 27 мер.
// Порталы: sz.gov45.ru, kurgan-med.ru, sport/kultura/kmp.kurganobl.ru.
// Запуск: node scripts/_seed-kurgan.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(readFileSync(".env.local","utf8").split(/\r?\n/).filter(l=>l&&!l.startsWith("#")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i),l.slice(i+1)];}));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});

const REGION = "Курганская область";
const SN = "Главное управление социальной защиты населения Курганской области (sz.gov45.ru)";
const SZ = "https://sz.gov45.ru/gosuslugi/gosuslugi-dlya-semey-s-detmi/";
const MED = "https://kurgan-med.ru/";
const base = { level:"regional", region:REGION, updated_at_label:"2026", is_published:true, sort_order:0 };
const reg = (extra={}) => ({ regions:[REGION], ...extra });
const HOW = ["Подать заявление в управление социальной защиты населения по месту жительства, через МФЦ или на Госуслугах"];
const DOCS = ["Паспорт заявителя","Свидетельство о рождении ребёнка","Сведения о доходах семьи (при оценке нуждаемости)"];

const rows = [
{ ...base, slug:"krg-001", title:"Компенсация ЖКУ многодетным семьям (Курганская область)",
  short_description:"Многодетным семьям компенсируют часть расходов на оплату жилья и коммунальных услуг.",
  category:"Жильё и ипотека", amount:"Компенсация расходов на ЖКУ",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Квитанции ЖКУ"],
  tips:["Оформляется в том числе через Госуслуги."], source_url:"https://www.gosuslugi.ru/600175/1/form", source_name:SN },

{ ...base, slug:"krg-002", title:"Компенсация ЖКУ федеральным льготникам (Курганская область)",
  short_description:"Федеральным льготникам (в том числе семьям с ребёнком-инвалидом) компенсируют часть расходов на оплату жилья и коммунальных услуг.",
  category:"Жильё и ипотека", amount:"Компенсация расходов на ЖКУ",
  segments:["disability","single-parent"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW, documents:["Паспорт","Документы о льготной категории","Квитанции ЖКУ"],
  tips:["Для получателей федеральных льгот."], source_url:"https://sz.gov45.ru/gosuslugi/zhilishchno-kommunalnaya-vyplata.php", source_name:SN },

{ ...base, slug:"krg-003", title:"Выплата детям-инвалидам (Курганская область)",
  short_description:"Семьям, воспитывающим детей-инвалидов, выплачивают единовременную денежную выплату.",
  category:"Выплаты и пособия", amount:"Единовременная выплата",
  segments:["disability"], criteria:reg({ requiresChildren:true, requiresDisabledChild:true }),
  how_to_apply:HOW, documents:["Паспорт","Справка об инвалидности ребёнка","Свидетельство о рождении ребёнка"],
  tips:["Ежегодная поддержка семей с детьми-инвалидами."], source_url:"https://sz.gov45.ru/news/edinovremennaya-denezhnaya-vyplata-detyam-invalidam-v-2025-godu/", source_name:SN },

{ ...base, slug:"krg-004", title:"Выплата на авто или жильё семьям с 10 и более детьми (Курганская область)",
  short_description:"Малоимущим семьям, имеющим десять и более несовершеннолетних детей (в том числе усыновлённых), выплачивают единовременную выплату на приобретение автотранспорта или строительство дома.",
  category:"Жильё и ипотека", amount:"Единовременная выплата на автомобиль или строительство дома",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:10, requiresLowIncome:true }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Свидетельства о рождении детей","Сведения о доходах семьи"],
  tips:["Для самых больших малоимущих семей."], source_url:SZ+"edinovremennaya-denezhnaya-vyplata-maloimushchim-semyam-imeyushchim-desyat-i-bolee-nesovershennoletn/", source_name:SN },

{ ...base, slug:"krg-005", title:"Социальная выплата студентам из малоимущих семей (Курганская область)",
  short_description:"Студентам очной формы из малоимущих семей и малоимущим одиноко проживающим студентам предоставляют социальную выплату.",
  category:"Выплаты и пособия", amount:"Социальная выплата студентам",
  segments:["student-family"], criteria:reg({ requiresStudent:true, requiresLowIncome:true }),
  how_to_apply:HOW, documents:["Паспорт","Справка об очном обучении","Сведения о доходах семьи"],
  tips:["Для малоимущих студентов очной формы."], source_url:"https://www.gosuslugi.ru/600238/1/form", source_name:SN },

{ ...base, slug:"krg-006", title:"Социальный контракт (Курганская область)",
  short_description:"Гражданам, заключившим социальный контракт, оказывают материальную поддержку на поиск работы, своё дело, ведение личного подсобного хозяйства или преодоление трудной ситуации.",
  category:"Работа и занятость", amount:"Выплаты по социальному контракту (по направлению)",
  segments:["expecting-first","expecting-second","expecting-third-plus","single-parent"], criteria:reg({ requiresChildren:true, requiresLowIncome:true }),
  how_to_apply:HOW, documents:["Паспорт","Сведения о доходах семьи","Документы по программе"],
  tips:["Направления: работа, ИП/самозанятость, ЛПХ."], source_url:"https://sz.gov45.ru/gosuslugi/sotsialnye-kontrakty/", source_name:SN },

{ ...base, slug:"krg-007", title:"Помощь на улучшение питания семьям с 8 и более детьми (Курганская область)",
  short_description:"Малоимущим семьям, воспитывающим восемь и более детей, оказывают государственную социальную помощь на улучшение питания.",
  category:"Здоровье", amount:"Ежемесячное пособие на улучшение питания",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:8, requiresLowIncome:true }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Сведения о доходах семьи"],
  tips:["По социальному контракту для больших малоимущих семей."], source_url:SZ+"ezhemesyachnoe-posobie-na-uluchshenie-pitaniya-na-osnovanii-sotsialnogo-kontrakta-maloimushchim-semya/", source_name:SN },

{ ...base, slug:"krg-008", title:"Пособие на развитие ЛПХ семьям с 5 и более детьми (Курганская область)",
  short_description:"Малоимущим семьям, воспитывающим пять и более детей, по социальному контракту выплачивают единовременное пособие на развитие личного подсобного хозяйства.",
  category:"Работа и занятость", amount:"До 38 000 ₽",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:5, requiresLowIncome:true }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Сведения о доходах семьи"],
  tips:["По социальному контракту на ведение хозяйства."], source_url:SZ+"edinovremennoe-posobie-na-razvitie-lichnogo-podsobnogo-khozyaystva-na-osnovanii-sotsialnogo-kontrakt/", source_name:SN },

{ ...base, slug:"krg-009", title:"Выплата пострадавшим от пожара (Курганская область)",
  short_description:"Малоимущим семьям и малоимущим одиноко проживающим гражданам, пострадавшим от пожара, выплачивают единовременную выплату.",
  category:"Помощь и сопровождение", amount:"Единовременная выплата",
  segments:["expecting-first","expecting-second","expecting-third-plus","single-parent"], criteria:reg({ requiresChildren:true, requiresLowIncome:true }),
  how_to_apply:HOW, documents:["Паспорт","Документы о пожаре","Сведения о доходах семьи"],
  tips:["Помощь при утрате имущества из-за пожара."], source_url:SZ+"edinovremennaya-vyplata-maloimushchim-semyam-i-maloimushchim-odinoko-prozhivayushchim-grazhdanam-pos/", source_name:SN },

{ ...base, slug:"krg-010", title:"Пособие за знак «Материнская слава» (Курганская область)",
  short_description:"Матерям, награждённым знаком отличия Курганской области «Материнская слава», выплачивают единовременное денежное пособие.",
  category:"Выплаты и пособия", amount:"Единовременное пособие к награде",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение к знаку «Материнская слава»","Свидетельства о рождении детей"],
  tips:["Для многодетных матерей, отмеченных наградой."], source_url:SZ, source_name:SN },

{ ...base, slug:"krg-011", title:"Субсидия на жильё при рождении тройни и более (Курганская область)",
  short_description:"Семьям при рождении или усыновлении одновременно трёх и более детей предоставляют субсидию на улучшение жилищных условий.",
  category:"Жильё и ипотека", amount:"Субсидия на приобретение или строительство жилья",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельства о рождении детей (одновременное рождение)","Документы о жилищных условиях"],
  tips:["Право — при одновременном рождении трёх и более детей."], source_url:SZ, source_name:SN },

{ ...base, slug:"krg-012", title:"Пособие при рождении двойни и более (Курганская область)",
  short_description:"Семьям при рождении или усыновлении одновременно двух и более детей выплачивают единовременное пособие.",
  category:"Выплаты и пособия", amount:"Единовременное пособие при рождении двойни и более",
  segments:["expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:2 }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельства о рождении детей (одновременное рождение)"],
  tips:["Назначается при одновременном рождении двух и более детей."], source_url:SZ, source_name:SN },

{ ...base, slug:"krg-013", title:"Удостоверение многодетной семьи (Курганская область)",
  short_description:"Семьям выдают документ, подтверждающий статус многодетной семьи, дающий право на региональные льготы.",
  category:"Помощь и сопровождение", amount:"Удостоверение многодетной семьи",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельства о рождении детей"],
  tips:["Даёт доступ ко всем льготам для многодетных."], source_url:SZ, source_name:SN },

{ ...base, slug:"krg-014", title:"Пособие на школьную одежду многодетным (Курганская область)",
  short_description:"Многодетным семьям ежегодно выплачивают пособие на приобретение школьной одежды и спортивной формы.",
  category:"Выплаты и пособия", amount:"Ежегодное пособие на одежду и спортивную форму",
  segments:["schoolchild","expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Справка об обучении"],
  tips:["Выплачивается ежегодно к учебному году."], source_url:SZ, source_name:SN },

{ ...base, slug:"krg-015", title:"Кратковременный присмотр за детьми (Курганская область)",
  short_description:"Организации соцобслуживания предоставляют услуги кратковременного присмотра за детьми, в том числе для студенческих семей, на базе игротек и групп кратковременного пребывания.",
  category:"Помощь и сопровождение", amount:"Бесплатный кратковременный присмотр за детьми",
  segments:["expecting-first","expecting-second","expecting-third-plus","student-family"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельство о рождении ребёнка"],
  tips:["Помогает родителям выкроить время на дела или учёбу."], source_url:SZ+"uslugi-kratkovremennogo-prismotra-za-detmi-/", source_name:SN },

{ ...base, slug:"krg-016", title:"Пункты проката вещей для новорождённых (Курганская область)",
  short_description:"На базе центров социального обслуживания работают пункты проката предметов первой необходимости для новорождённых.",
  category:"Помощь и сопровождение", amount:"Бесплатный прокат вещей для новорождённого",
  segments:["expecting-first","expecting-second","single-parent","student-family"], criteria:reg({ requiresChildren:true, maxYoungestChildAgeYears:1 }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельство о рождении ребёнка"],
  tips:["Коляски, кроватки и другие вещи для малыша во временное пользование."], source_url:SZ+"punkty-prokata-predmetov-pervoy-neobkhodimosti-dlya-novorozhdennykh-i-maloletnikh-detey", source_name:SN },

{ ...base, slug:"krg-017", title:"Социальная выплата молодым семьям на жильё (Курганская область)",
  short_description:"Молодым семьям предоставляют социальные выплаты на приобретение жилья или индивидуальное жилищное строительство.",
  category:"Жильё и ипотека", amount:"Социальная выплата на жильё",
  segments:["expecting-first","expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true }),
  how_to_apply:["Встать в очередь по программе «Молодая семья»"], documents:["Паспорта супругов","Свидетельства о рождении детей","Документы о нуждаемости"],
  tips:["Можно направить на первоначальный взнос по ипотеке."], source_url:"https://kmp.kurganobl.ru/activity/molodye-semi.php", source_name:SN },

{ ...base, slug:"krg-018", title:"Бесплатное посещение спортивных объектов (Курганская область)",
  short_description:"Бесплатное посещение спортивных объектов предоставляют детям из многодетных и малоимущих семей, детям-сиротам, детям-инвалидам, а также участникам СВО и членам их семей.",
  category:"Культура и отдых", amount:"Бесплатное посещение спортобъектов",
  segments:["expecting-third-plus","disability","foster-family","svo-family"], criteria:reg({ requiresChildren:true }),
  how_to_apply:["Обратиться в государственное спортивное учреждение с подтверждающими документами"], documents:["Паспорт","Документы о льготной категории"],
  tips:["Для широкого круга льготных категорий."], source_url:"https://sport.kurganobl.ru/5125.html", source_name:SN },

{ ...base, slug:"krg-019", title:"Полноценное питание беременным, кормящим и детям до 3 лет (Курганская область)",
  short_description:"Беременных женщин, кормящих матерей и детей до трёх лет обеспечивают полноценным питанием.",
  category:"Здоровье", amount:"Обеспечение полноценным питанием",
  segments:["expecting-first","expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true, maxYoungestChildAgeYears:3 }),
  how_to_apply:["Получить назначение у врача в медицинской организации"], documents:["Полис ОМС","Заключение врача","Свидетельство о рождении ребёнка / справка о беременности"],
  tips:["По медицинскому заключению; охватывает и будущих мам."], source_url:MED, source_name:SN },

{ ...base, slug:"krg-020", title:"Бесплатные лекарства детям до 3 лет (Курганская область)",
  short_description:"Детей в возрасте до трёх лет бесплатно обеспечивают лекарственными препаратами.",
  category:"Здоровье", amount:"Бесплатные лекарства (дети до 3 лет)",
  segments:["expecting-first","expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true, maxYoungestChildAgeYears:3 }),
  how_to_apply:["Получить рецепт у врача и обратиться в аптеку, отпускающую льготные лекарства"], documents:["Полис ОМС","Льготный рецепт","Свидетельство о рождении ребёнка"],
  tips:["Для всех детей до 3 лет по рецептам врачей."], source_url:MED, source_name:SN },

{ ...base, slug:"krg-021", title:"Бесплатные лекарства детям из многодетных семей до 6 лет (Курганская область)",
  short_description:"Детей из многодетных семей до шести лет бесплатно обеспечивают лекарственными препаратами.",
  category:"Здоровье", amount:"Бесплатные лекарства (дети до 6 лет)",
  segments:["expecting-first","expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3, maxYoungestChildAgeYears:6 }),
  how_to_apply:["Получить рецепт у врача и обратиться в аптеку, отпускающую льготные лекарства"], documents:["Полис ОМС","Льготный рецепт","Удостоверение многодетной семьи"],
  tips:["Для детей до 6 лет из многодетных семей."], source_url:MED, source_name:SN },

{ ...base, slug:"krg-022", title:"Льготное посещение учреждений культуры (Курганская область)",
  short_description:"Семьям с детьми предоставляют льготное посещение мероприятий областных организаций культуры.",
  category:"Культура и отдых", amount:"Льготное / бесплатное посещение",
  segments:["expecting-third-plus","schoolchild"], criteria:reg({ requiresChildren:true }),
  how_to_apply:["Уточнить условия в учреждении культуры"], documents:["Документы, подтверждающие льготную категорию"],
  tips:["Семейный культурный досуг со скидкой."], source_url:"https://kultura.kurganobl.ru/activity/projects/", source_name:SN },

{ ...base, slug:"krg-023", title:"Бесплатное питание 5–11 классов льготным категориям (Курганская область)",
  short_description:"Обучающимся 5–11 классов из малоимущих, многодетных семей, семей военнослужащих и семей погибших военнослужащих предоставляют бесплатное горячее питание.",
  category:"Образование", amount:"Бесплатное горячее питание",
  segments:["schoolchild","expecting-third-plus","svo-family"], criteria:reg({ requiresChildren:true }),
  how_to_apply:["Подать заявление в школу"], documents:["Паспорт","Справка об обучении","Документы о льготной категории"],
  tips:["Дополняет федеральное питание для 1–4 классов."], source_url:"https://kurganobl.ru/", source_name:SN },

{ ...base, slug:"krg-024", title:"Бесплатный проезд школьников из многодетных семей (Курганская область)",
  short_description:"Школьникам из многодетных семей в городах Курган, Шадринск, Далматово и Куртамыш предоставляют бесплатный проезд автомобильным транспортом в городском сообщении.",
  category:"Транспорт", amount:"Бесплатный проезд (кроме такси)",
  segments:["schoolchild","expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Справка об обучении"],
  tips:["Действует в Кургане, Шадринске, Далматово и Куртамыше."], source_url:"https://kurganobl.ru/", source_name:SN },

{ ...base, slug:"krg-025", title:"Бесплатное питание студентов СПО из многодетных семей и семей СВО (Курганская область)",
  short_description:"Обучающихся из многодетных семей и из семей погибших участников СВО в областных колледжах обеспечивают бесплатным питанием.",
  category:"Образование", amount:"Бесплатное питание",
  segments:["expecting-third-plus","svo-family","schoolchild"], criteria:reg({ requiresChildren:true }),
  how_to_apply:["Подать заявление в образовательную организацию"], documents:["Паспорт","Удостоверение многодетной семьи / документы о статусе","Справка об обучении"],
  tips:["Для студентов профессиональных образовательных организаций."], source_url:"https://kurganobl.ru/", source_name:SN },

{ ...base, slug:"krg-026", title:"Перевод детей погибших участников СВО на бесплатное обучение (Курганская область)",
  short_description:"Детей из семей погибших участников СВО переводят с платного на бесплатное обучение в областных колледжах.",
  category:"Образование", amount:"Перевод на бесплатное обучение (СПО)",
  segments:["svo-family","schoolchild"], criteria:reg({ requiresSvoFamily:true, requiresChildren:true }),
  how_to_apply:["Обратиться в образовательную организацию"], documents:["Паспорт","Документы о статусе члена семьи погибшего участника СВО","Справка об обучении"],
  tips:["Для обучающихся по программам СПО."], source_url:"https://kurganobl.ru/", source_name:SN },

{ ...base, slug:"krg-027", title:"Бесплатное общежитие детям погибших участников СВО (Курганская область)",
  short_description:"Детям погибших участников СВО, обучающимся в областных колледжах, предоставляют бесплатное проживание в общежитиях.",
  category:"Образование", amount:"Бесплатное проживание в общежитии",
  segments:["svo-family","schoolchild"], criteria:reg({ requiresSvoFamily:true, requiresChildren:true }),
  how_to_apply:["Обратиться в образовательную организацию"], documents:["Паспорт","Документы о статусе члена семьи погибшего участника СВО","Справка об обучении"],
  tips:["Для студентов СПО из семей погибших участников СВО."], source_url:"https://kurganobl.ru/", source_name:SN },
];

let ok=0, fail=0;
for (const r of rows){
  const { error } = await sb.from("measures").upsert(r, { onConflict:"slug" });
  if(error){ console.log("FAIL", r.slug, "-", error.message); fail++; }
  else { console.log("OK  ", r.slug, "—", r.title.slice(0,56)); ok++; }
}
console.log(`\nDONE: ${ok} upserted, ${fail} failed`);
const { count } = await sb.from("measures").select("*",{count:"exact",head:true}).eq("region",REGION);
console.log("КУРГАНСКАЯ ОБЛАСТЬ В БАЗЕ ТЕПЕРЬ:", count);
