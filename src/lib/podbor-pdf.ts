import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { SupportMeasure } from "@/lib/measures";

/**
 * Подборка мер в PDF — чтобы забрать её с собой.
 *
 * Зачем файл, а не страница: в соцзащите и МФЦ просят «принесите список»,
 * телефон могут попросить убрать, а интернет в здании ловит не всегда. Файл
 * лежит в загрузках и открывается без сети.
 *
 * Шрифт кладём в файл целиком: без встроенной кириллицы PDF показывает вместо
 * букв пустые квадраты. Взяли DejaVu Sans — свободная лицензия и полная
 * поддержка русского. Лежит в public/, потому что эта папка гарантированно
 * попадает в собранное приложение, в отличие от исходников.
 */

const FONTS_DIR = join(process.cwd(), "public", "fonts");

// Размеры страницы A4 в пунктах и поля документа.
const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 48;
const CONTENT_WIDTH = PAGE.width - MARGIN * 2;

const NAVY = rgb(0.13, 0.27, 0.48);
const BORDO = rgb(0.56, 0.11, 0.17);
const INK = rgb(0.1, 0.11, 0.13);
const INK_SOFT = rgb(0.42, 0.45, 0.5);
const LINE = rgb(0.85, 0.83, 0.78);

type Ctx = {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  regular: PDFFont;
  bold: PDFFont;
  pageNumber: number;
};

/** Разбивает текст на строки по ширине колонки. */
function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= width) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      // Слово длиннее строки (длинная ссылка или номер закона) — рвём по буквам,
      // иначе оно уедет за поля.
      if (font.widthOfTextAtSize(word, size) > width) {
        let chunk = "";
        for (const ch of word) {
          if (font.widthOfTextAtSize(chunk + ch, size) > width) {
            lines.push(chunk);
            chunk = ch;
          } else {
            chunk += ch;
          }
        }
        line = chunk;
      } else {
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}

function addPage(ctx: Ctx): void {
  ctx.page = ctx.doc.addPage([PAGE.width, PAGE.height]);
  ctx.pageNumber += 1;
  ctx.y = PAGE.height - MARGIN;
  footer(ctx);
}

/** Подпись внизу страницы: откуда файл и какая это страница. */
function footer(ctx: Ctx): void {
  const text = `«Шпаргалка для родителей» — проект «Совета матерей»`;
  ctx.page.drawText(text, {
    x: MARGIN,
    y: MARGIN - 22,
    size: 8,
    font: ctx.regular,
    color: INK_SOFT,
  });
  const num = String(ctx.pageNumber);
  ctx.page.drawText(num, {
    x: PAGE.width - MARGIN - ctx.regular.widthOfTextAtSize(num, 8),
    y: MARGIN - 22,
    size: 8,
    font: ctx.regular,
    color: INK_SOFT,
  });
}

/** Пишет абзац, перенося строки и заводя новую страницу, когда место кончилось. */
function text(
  ctx: Ctx,
  content: string,
  opts: {
    size?: number;
    bold?: boolean;
    color?: ReturnType<typeof rgb>;
    indent?: number;
    gap?: number;
  } = {},
): void {
  const size = opts.size ?? 10;
  const font = opts.bold ? ctx.bold : ctx.regular;
  const indent = opts.indent ?? 0;
  const lineHeight = size * 1.38;

  for (const line of wrap(content, font, size, CONTENT_WIDTH - indent)) {
    if (ctx.y - lineHeight < MARGIN) addPage(ctx);
    ctx.page.drawText(line, {
      x: MARGIN + indent,
      y: ctx.y - size,
      size,
      font,
      color: opts.color ?? INK,
    });
    ctx.y -= lineHeight;
  }
  if (opts.gap) ctx.y -= opts.gap;
}

function rule(ctx: Ctx): void {
  if (ctx.y - 12 < MARGIN) addPage(ctx);
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y - 6 },
    end: { x: PAGE.width - MARGIN, y: ctx.y - 6 },
    thickness: 0.7,
    color: LINE,
  });
  ctx.y -= 14;
}

/** Меру целиком стараемся не разрывать между страницами: так её легче читать. */
function measureHeight(ctx: Ctx, m: SupportMeasure): number {
  let h = 0;
  h += wrap(m.title, ctx.bold, 12, CONTENT_WIDTH).length * 12 * 1.38 + 4;
  if (m.amount) h += wrap(m.amount, ctx.bold, 10, CONTENT_WIDTH).length * 10 * 1.38 + 4;
  h += wrap(m.shortDescription, ctx.regular, 10, CONTENT_WIDTH).length * 10 * 1.38;
  return h;
}

export function buildPodborPdf(input: {
  measures: SupportMeasure[];
  userName: string | null;
  region: string | null;
}): Promise<Uint8Array> {
  return (async () => {
    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit);

    const regular = await doc.embedFont(readFileSync(join(FONTS_DIR, "DejaVuSans.ttf")), {
      subset: true,
    });
    const bold = await doc.embedFont(readFileSync(join(FONTS_DIR, "DejaVuSans-Bold.ttf")), {
      subset: true,
    });

    const ctx: Ctx = {
      doc,
      page: doc.addPage([PAGE.width, PAGE.height]),
      y: PAGE.height - MARGIN,
      regular,
      bold,
      pageNumber: 1,
    };
    footer(ctx);

    // ── Титул ────────────────────────────────────────────────────────────
    text(ctx, "Меры поддержки для вашей семьи", { size: 20, bold: true, color: NAVY });
    ctx.y -= 4;

    const today = new Date().toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const subtitle = [
      input.userName ? `Подбор для: ${input.userName}` : null,
      input.region ? `Регион: ${input.region}` : "Регион не указан",
      `Составлено ${today}`,
    ]
      .filter(Boolean)
      .join(" · ");
    text(ctx, subtitle, { size: 9, color: INK_SOFT, gap: 6 });

    text(
      ctx,
      `Подобрано мер: ${input.measures.length}. Список составлен по ответам анкеты. ` +
        `Условия и суммы могут меняться — уточняйте их при подаче заявления.`,
      { size: 9.5, color: INK_SOFT, gap: 8 },
    );
    rule(ctx);

    // ── Меры: сначала федеральные, потом региональные ────────────────────
    const groups: { title: string; list: SupportMeasure[] }[] = [
      {
        title: "Федеральные меры",
        list: input.measures.filter((m) => m.level === "federal"),
      },
      {
        title: "Региональные меры",
        list: input.measures.filter((m) => m.level !== "federal"),
      },
    ];

    for (const group of groups) {
      if (group.list.length === 0) continue;

      if (ctx.y - 40 < MARGIN) addPage(ctx);
      ctx.y -= 6;
      text(ctx, `${group.title} — ${group.list.length}`, {
        size: 13,
        bold: true,
        color: NAVY,
        gap: 6,
      });

      group.list.forEach((m, i) => {
        // Если на странице осталось меньше, чем занимает «шапка» меры,
        // начинаем новую — иначе название повиснет внизу отдельно от текста.
        if (ctx.y - measureHeight(ctx, m) < MARGIN + 20) addPage(ctx);

        text(ctx, `${i + 1}. ${m.title}`, { size: 12, bold: true, color: INK, gap: 2 });

        if (m.amount) text(ctx, m.amount, { size: 10, bold: true, color: BORDO, gap: 2 });
        if (m.region) text(ctx, m.region, { size: 8.5, color: INK_SOFT, gap: 2 });

        text(ctx, m.shortDescription, { size: 10, gap: 4 });

        if (m.howToApply.length > 0) {
          text(ctx, "Как оформить", { size: 9.5, bold: true, color: NAVY, gap: 1 });
          m.howToApply.forEach((step, n) => {
            text(ctx, `${n + 1}. ${step}`, { size: 9.5, indent: 10 });
          });
          ctx.y -= 3;
        }

        if (m.documents.length > 0) {
          text(ctx, "Документы", { size: 9.5, bold: true, color: NAVY, gap: 1 });
          m.documents.forEach((d) => text(ctx, `• ${d}`, { size: 9.5, indent: 10 }));
          ctx.y -= 3;
        }

        if (m.tips.length > 0) {
          text(ctx, "Важно знать", { size: 9.5, bold: true, color: NAVY, gap: 1 });
          m.tips.forEach((t) => text(ctx, `• ${t}`, { size: 9.5, indent: 10 }));
          ctx.y -= 3;
        }

        if (m.sourceName) {
          text(ctx, `Источник: ${m.sourceName}`, { size: 8.5, color: INK_SOFT });
        }

        rule(ctx);
      });
    }

    // ── Хвост ────────────────────────────────────────────────────────────
    if (ctx.y - 40 < MARGIN) addPage(ctx);
    ctx.y -= 4;
    text(
      ctx,
      "Список носит справочный характер. Точные условия, суммы и перечень документов " +
        "уточняйте при подаче заявления — в отделении социальной защиты, МФЦ или на Госуслугах.",
      { size: 9, color: INK_SOFT },
    );

    return doc.save();
  })();
}
