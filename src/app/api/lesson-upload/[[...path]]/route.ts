import { NextResponse } from "next/server";
import { getCurrentStaff } from "@/lib/user-session";
import { LESSON_BUCKET } from "@/lib/lessons-db";

/**
 * Загрузка видео-уроков по протоколу tus (докачка кусками по 6 МБ).
 *
 * Большой файл одним запросом через прокси сайта не проходит: обрывается по
 * времени. Хранилище умеет принимать его кусками (tus), но открывать ему доступ
 * напрямую из браузера нельзя — для этого нужен ключ, который светить нельзя.
 * Поэтому браузер шлёт куски сюда, а мы после проверки, что это владелец или
 * техспец, пересылаем их в хранилище своим ключом.
 *
 * Можно писать только в бакет уроков и только в папку lessons/ — иначе через
 * эту дорожку можно было бы перезаписать чужие файлы.
 */

const UPSTREAM = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`;
const PASS_REQUEST = [
  "tus-resumable",
  "upload-length",
  "upload-metadata",
  "upload-offset",
  "upload-defer-length",
  "content-type",
  "x-upsert",
];
const PASS_RESPONSE = ["tus-resumable", "upload-offset", "upload-length", "upload-expires", "cache-control"];

function decodeMetadata(raw: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of (raw ?? "").split(",")) {
    const [k, v] = pair.trim().split(" ");
    if (k && v) out[k] = Buffer.from(v, "base64").toString("utf8");
  }
  return out;
}

async function proxy(req: Request, ctx: { params: Promise<{ path?: string[] }> }): Promise<Response> {
  const staff = await getCurrentStaff();
  if (!staff || (staff.role !== "owner" && staff.role !== "tech")) {
    return NextResponse.json({ error: "Загружать видео могут владелец и техспец" }, { status: 403 });
  }

  const { path = [] } = await ctx.params;
  const method = req.method;

  if (method === "POST") {
    const meta = decodeMetadata(req.headers.get("upload-metadata"));
    if (meta.bucketName !== LESSON_BUCKET || !/^lessons\/[\w.-]+$/.test(meta.objectName ?? "")) {
      return NextResponse.json({ error: "Сюда можно загружать только видео уроков" }, { status: 400 });
    }
  }

  const headers: Record<string, string> = {
    authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  };
  for (const h of PASS_REQUEST) {
    const v = req.headers.get(h);
    if (v) headers[h] = v;
  }

  const target = UPSTREAM + (path.length ? `/${path.map(encodeURIComponent).join("/")}` : "");
  const upstream = await fetch(target, {
    method,
    headers,
    body: method === "PATCH" || method === "POST" ? await req.arrayBuffer() : undefined,
    redirect: "manual",
  });

  const out = new Headers();
  for (const h of PASS_RESPONSE) {
    const v = upstream.headers.get(h);
    if (v) out.set(h, v);
  }
  // Адрес продолжения загрузки возвращаем нашим: дальнейшие куски пойдут сюда же.
  const location = upstream.headers.get("location");
  if (location) {
    const id = location.split("/upload/resumable/")[1];
    if (id) out.set("location", `/api/lesson-upload/${id}`);
  }
  const body = upstream.status === 204 || method === "HEAD" ? null : await upstream.text();
  return new Response(body, { status: upstream.status, headers: out });
}

export const POST = proxy;
export const PATCH = proxy;
export const HEAD = proxy;
export const DELETE = proxy;
