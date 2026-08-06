// Перенос старых обращений в ленту сообщений.
//
// До появления переписки обращение было парой полей: body — вопрос человека,
// response — ответ Татьяны. Чтобы старые обращения выглядели так же, как новые,
// раскладываем их по сообщениям: сначала вопрос, потом ответ (если он был).
//
// Повторный запуск безопасен: обращения, у которых лента уже есть, пропускаем.
//
// Запуск: node scripts/_backfill-inquiry-messages.mjs [--apply]
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const APPLY = process.argv.includes("--apply");

const { data: inquiries, error } = await sb
  .from("inquiries")
  .select("id,body,response,responded_at,responded_by_name,created_at,user_name,status")
  .order("created_at");
if (error) throw new Error(error.message);

const { data: existing } = await sb.from("inquiry_messages").select("inquiry_id");
const haveThread = new Set((existing ?? []).map((m) => m.inquiry_id));

let planned = 0;
let done = 0;

for (const inq of inquiries) {
  if (haveThread.has(inq.id)) continue;

  const messages = [
    {
      inquiry_id: inq.id,
      author: "user",
      author_name: inq.user_name,
      body: inq.body,
      created_at: inq.created_at,
      // Вопрос для Татьяны прочитан, если она на него ответила.
      read_at: inq.response ? inq.responded_at : null,
    },
  ];

  if (inq.response) {
    messages.push({
      inquiry_id: inq.id,
      author: "staff",
      author_name: inq.responded_by_name,
      body: inq.response,
      created_at: inq.responded_at ?? inq.created_at,
      // Старые ответы считаем прочитанными: человек их уже видел, и незачем
      // сегодня зажигать у него счётчик непрочитанного на давних переписках.
      read_at: inq.responded_at ?? inq.created_at,
    });
  }

  planned += messages.length;
  console.log(`${inq.id.slice(0, 8)} — ${messages.length} сообщ. (${inq.status})`);

  if (APPLY) {
    const { error: e } = await sb.from("inquiry_messages").insert(messages);
    if (e) console.log("  ОШИБКА:", e.message);
    else done += messages.length;
  }
}

console.log(
  `\n${APPLY ? "ЗАПИСАНО" : "СУХОЙ ПРОГОН"}: обращений ${inquiries.length}, ` +
    `сообщений ${APPLY ? done : planned}` +
    (haveThread.size ? `, пропущено с готовой лентой: ${haveThread.size}` : ""),
);
if (!APPLY) console.log("Для записи: node scripts/_backfill-inquiry-messages.mjs --apply");
