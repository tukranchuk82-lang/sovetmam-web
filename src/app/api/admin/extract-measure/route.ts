import { NextResponse } from "next/server";
import { extractMeasure } from "@/lib/measure-extract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024; // 10 МБ
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const text = form.get("text");
    const textStr = typeof text === "string" ? text.trim() : "";

    let filePart: { base64: string; mime: string } | undefined;

    if (file && typeof file !== "string") {
      if (file.size > MAX_BYTES) {
        return NextResponse.json(
          { error: "Файл больше 10 МБ. Уменьшите или вставьте текст." },
          { status: 400 },
        );
      }
      if (!ALLOWED_MIME.has(file.type)) {
        const isWord =
          file.type.includes("word") ||
          file.name.endsWith(".docx") ||
          file.name.endsWith(".doc");
        return NextResponse.json(
          {
            error: isWord
              ? "Word пока не поддерживается напрямую. Сохраните документ как PDF или вставьте текст."
              : "Поддерживаются PDF и изображения (PNG/JPG/WebP). Или вставьте текст.",
          },
          { status: 400 },
        );
      }
      const buf = Buffer.from(await file.arrayBuffer());
      filePart = { base64: buf.toString("base64"), mime: file.type };
    }

    if (!filePart && !textStr) {
      return NextResponse.json(
        { error: "Прикрепите файл или вставьте текст меры." },
        { status: 400 },
      );
    }

    const draft = await extractMeasure({ file: filePart, text: textStr || undefined });
    return NextResponse.json({ draft });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Не удалось разобрать документ.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
