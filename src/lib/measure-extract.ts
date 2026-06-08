import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { CATEGORIES, REGIONS, SEGMENTS } from "@/lib/measures";
import type { MeasureAdminRow } from "@/lib/measures-admin";

// Извлечение структуры меры господдержки из документа/текста через Claude.
// AI готовит ЧЕРНОВИК — человек обязательно проверяет и сохраняет вручную.

const MODEL = "claude-opus-4-8";

// --- Транслитерация для генерации slug ---
const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .split("")
    .map((ch) => (ch in TRANSLIT ? TRANSLIT[ch] : ch))
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// --- JSON-схема ответа (structured output) ---
// Все поля обязательны; «неизвестно» = пустая строка / пустой массив / false / 0.
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "shortDescription",
    "level",
    "region",
    "category",
    "segments",
    "amount",
    "howToApply",
    "documents",
    "sourceUrl",
    "sourceName",
    "updatedAtLabel",
    "criteria",
  ],
  properties: {
    title: { type: "string" },
    shortDescription: { type: "string" },
    level: { type: "string", enum: ["federal", "regional"] },
    region: { type: "string" },
    category: { type: "string", enum: CATEGORIES },
    segments: {
      type: "array",
      items: { type: "string", enum: SEGMENTS.map((s) => s.id) },
    },
    amount: { type: "string" },
    howToApply: { type: "array", items: { type: "string" } },
    documents: { type: "array", items: { type: "string" } },
    sourceUrl: { type: "string" },
    sourceName: { type: "string" },
    updatedAtLabel: { type: "string" },
    criteria: {
      type: "object",
      additionalProperties: false,
      required: [
        "requiresPregnancy",
        "requiresChildren",
        "requiresLowIncome",
        "requiresDisabledChild",
        "requiresMortgageIntent",
        "requiresSvoFamily",
        "requiresSingleParent",
        "requiresStudent",
        "minChildren",
        "maxYoungestChildAgeYears",
      ],
      properties: {
        requiresPregnancy: { type: "boolean" },
        requiresChildren: { type: "boolean" },
        requiresLowIncome: { type: "boolean" },
        requiresDisabledChild: { type: "boolean" },
        requiresMortgageIntent: { type: "boolean" },
        requiresSvoFamily: { type: "boolean" },
        requiresSingleParent: { type: "boolean" },
        requiresStudent: { type: "boolean" },
        minChildren: { type: "integer" },
        maxYoungestChildAgeYears: { type: "integer" },
      },
    },
  },
} as const;

const SYSTEM_PROMPT = `Ты — ассистент-структуризатор каталога мер государственной поддержки семей с детьми в России. По присланному документу, тексту или изображению извлеки данные одной меры поддержки строго в заданную JSON-схему. Весь текст — на русском языке.

Правила:
- НЕ ВЫДУМЫВАЙ факты. Если чего-то нет в источнике — оставляй пустую строку "", пустой массив [], false или 0.
- title — короткое понятное название меры.
- shortDescription — 1–2 фразы, суть меры простым языком.
- level: "federal" — действует по всей России; "regional" — только в конкретном субъекте.
- region: ТОЛЬКО для региональной меры — точное название субъекта РФ из этого списка (иначе ""):
${REGIONS.join(", ")}.
- category — ровно одно из: ${CATEGORIES.join(", ")}.
- segments — к каким жизненным ситуациям относится мера (можно несколько). Допустимые id:
${SEGMENTS.map((s) => `  ${s.id} — ${s.title}`).join("\n")}
- amount — размер/сумма выплаты как в источнике (напр. "от 630 тыс. ₽", "до 6%"), или "".
- howToApply — шаги оформления, каждый отдельным элементом массива.
- documents — какие документы нужны, каждый отдельным элементом.
- sourceUrl / sourceName — ссылка и название официального источника, если есть.
- updatedAtLabel — год актуальности информации (напр. "2024"), если указан, иначе "".
- criteria — условия, при которых мера подходит (для авто-подбора по анкете):
  - булевы флаги ставь true только если в источнике явно есть такое условие;
  - minChildren — минимальное число детей (0 если не указано);
  - maxYoungestChildAgeYears — макс. возраст младшего ребёнка в годах (0 если не указано).`;

type RawCriteria = {
  requiresPregnancy: boolean;
  requiresChildren: boolean;
  requiresLowIncome: boolean;
  requiresDisabledChild: boolean;
  requiresMortgageIntent: boolean;
  requiresSvoFamily: boolean;
  requiresSingleParent: boolean;
  requiresStudent: boolean;
  minChildren: number;
  maxYoungestChildAgeYears: number;
};

type RawExtract = {
  title: string;
  shortDescription: string;
  level: string;
  region: string;
  category: string;
  segments: string[];
  amount: string;
  howToApply: string[];
  documents: string[];
  sourceUrl: string;
  sourceName: string;
  updatedAtLabel: string;
  criteria: RawCriteria;
};

const SEGMENT_IDS = new Set<string>(SEGMENTS.map((s) => s.id));

function toDraft(d: RawExtract): MeasureAdminRow {
  const level = d.level === "regional" ? "regional" : "federal";
  const region =
    level === "regional" && REGIONS.includes(d.region as (typeof REGIONS)[number])
      ? d.region
      : undefined;
  const category = (CATEGORIES as readonly string[]).includes(d.category)
    ? (d.category as MeasureAdminRow["category"])
    : CATEGORIES[0];

  const c = d.criteria ?? ({} as RawCriteria);
  const criteria: MeasureAdminRow["criteria"] = {};
  if (c.requiresPregnancy) criteria.requiresPregnancy = true;
  if (c.requiresChildren) criteria.requiresChildren = true;
  if (c.requiresLowIncome) criteria.requiresLowIncome = true;
  if (c.requiresDisabledChild) criteria.requiresDisabledChild = true;
  if (c.requiresMortgageIntent) criteria.requiresMortgageIntent = true;
  if (c.requiresSvoFamily) criteria.requiresSvoFamily = true;
  if (c.requiresSingleParent) criteria.requiresSingleParent = true;
  if (c.requiresStudent) criteria.requiresStudent = true;
  if (c.minChildren > 0) criteria.minChildren = c.minChildren;
  if (c.maxYoungestChildAgeYears > 0)
    criteria.maxYoungestChildAgeYears = c.maxYoungestChildAgeYears;
  if (region) criteria.regions = [region];

  const title = (d.title ?? "").trim();

  return {
    slug: title ? slugify(title) : "",
    title,
    shortDescription: (d.shortDescription ?? "").trim(),
    level,
    region,
    category,
    amount: d.amount?.trim() ? d.amount.trim() : undefined,
    segments: (d.segments ?? []).filter((s) => SEGMENT_IDS.has(s)) as MeasureAdminRow["segments"],
    criteria,
    howToApply: (d.howToApply ?? []).map((s) => s.trim()).filter(Boolean),
    documents: (d.documents ?? []).map((s) => s.trim()).filter(Boolean),
    tips: [],
    sourceUrl: (d.sourceUrl ?? "").trim(),
    sourceName: (d.sourceName ?? "").trim(),
    updatedAt: (d.updatedAtLabel ?? "").trim(),
    // AI-черновик не публикуем автоматически — человек включит после проверки.
    isPublished: false,
    sortOrder: 100,
  };
}

export interface ExtractInput {
  file?: { base64: string; mime: string };
  text?: string;
}

/** Извлекает черновик меры из документа/текста. Бросает понятную ошибку при сбое. */
export async function extractMeasure(
  input: ExtractInput,
): Promise<MeasureAdminRow> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "Не настроен ключ AI. Добавьте ANTHROPIC_API_KEY в .env.local и перезапустите сервер.",
    );
  }

  const client = new Anthropic();

  const content: Anthropic.ContentBlockParam[] = [];

  if (input.file) {
    if (input.file.mime === "application/pdf") {
      content.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: input.file.base64,
        },
      });
    } else {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: input.file.mime as
            | "image/jpeg"
            | "image/png"
            | "image/gif"
            | "image/webp",
          data: input.file.base64,
        },
      });
    }
  }

  if (input.text?.trim()) {
    content.push({ type: "text", text: input.text.trim() });
  }

  content.push({
    type: "text",
    text: "Извлеки данные этой меры поддержки строго по схеме. Если в источнике несколько мер — возьми основную/первую.",
  });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: SCHEMA as Record<string, unknown> },
    },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("AI не вернул структурированный ответ. Попробуйте ещё раз.");
  }

  let raw: RawExtract;
  try {
    raw = JSON.parse(textBlock.text) as RawExtract;
  } catch {
    throw new Error("Не удалось разобрать ответ AI. Попробуйте ещё раз.");
  }

  return toDraft(raw);
}
