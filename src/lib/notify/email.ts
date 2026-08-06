import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Отправка письма с кодом подтверждения.
 *
 * Реальная отправка идёт через SMTP (у sovetmam.ru почта на Beget —
 * smtp.beget.com:465, SSL). Настройки берём из env:
 *   SMTP_HOST  (по умолчанию smtp.beget.com)
 *   SMTP_PORT  (по умолчанию 465)
 *   SMTP_USER  — полный адрес ящика, напр. noreply@sovetmam.ru
 *   SMTP_PASS  — пароль этого ящика
 *   SMTP_FROM  — от кого (по умолчанию «Шпаргалка для родителей <SMTP_USER>»)
 *
 * Если SMTP_USER/SMTP_PASS не заданы — работает ЗАГЛУШКА: код пишется в
 * серверную консоль (и показывается на экране в dev). Логику менять не нужно —
 * достаточно заполнить env, и письма пойдут по-настоящему.
 */

let cached: Transporter | null = null;

function getTransport(): Transporter | null {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null; // нет доступов — работаем заглушкой
  if (cached) return cached;

  const host = process.env.SMTP_HOST ?? "smtp.beget.com";
  const port = Number(process.env.SMTP_PORT ?? 465);
  cached = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 = SSL; 587/2525 = STARTTLS
    auth: { user, pass },
  });
  return cached;
}

function otpHtml(code: string): string {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:440px;margin:0 auto;padding:24px;color:#1A1A1A">
    <p style="font-size:15px;line-height:1.5">Здравствуйте!</p>
    <p style="font-size:15px;line-height:1.5">Ваш код для входа в «Шпаргалку для родителей»:</p>
    <div style="margin:20px 0;padding:14px 0;text-align:center;background:#F3F1EC;border-radius:10px;
                font-size:30px;font-weight:700;letter-spacing:8px;color:#1B3A6B">${code}</div>
    <p style="font-size:13px;line-height:1.5;color:#6b7078">Код действует 10 минут. Если вы не запрашивали вход — просто проигнорируйте это письмо.</p>
    <p style="font-size:12px;color:#9aa0a8;margin-top:20px">Проект «Совета матерей»</p>
  </div>`;
}

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  const transport = getTransport();

  if (!transport) {
    // eslint-disable-next-line no-console
    console.log(`[OTP][stub] Код для ${email}: ${code}`);
    return;
  }

  const from =
    process.env.SMTP_FROM ??
    `Шпаргалка для родителей <${process.env.SMTP_USER}>`;

  await transport.sendMail({
    from,
    to: email,
    subject: `Код для входа: ${code}`,
    text: `Ваш код для входа в «Шпаргалку для родителей»: ${code}. Код действует 10 минут.`,
    html: otpHtml(code),
  });
}

// ── Письма по обращениям ───────────────────────────────────────────────────

function fromAddress(): string {
  return (
    process.env.SMTP_FROM ?? `Шпаргалка для родителей <${process.env.SMTP_USER}>`
  );
}

/** Экранирование: тексты приходят от пользователей и попадают в HTML письма. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function button(href: string, label: string): string {
  return `<a href="${esc(href)}" style="display:inline-block;background:#1B3A6B;color:#fff;
    text-decoration:none;font-size:15px;font-weight:700;padding:13px 26px;border-radius:10px">${esc(label)}</a>`;
}

function shell(inner: string): string {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1A1A1A">
    ${inner}
    <p style="font-size:12px;color:#9aa0a8;margin-top:24px">Проект «Совета матерей»</p>
  </div>`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:4px 12px 4px 0;font-size:13px;color:#6b7078;vertical-align:top;white-space:nowrap">${esc(label)}</td>
    <td style="padding:4px 0;font-size:14px">${esc(value)}</td>
  </tr>`;
}

export interface InquiryEmailData {
  inquiryId: string;
  userName: string;
  userEmail: string;
  region: string | null;
  typeLabel: string;
  subject: string;
  body: string;
  measureTitle: string | null;
  createdAt: string;
}

/**
 * Опознавательный знак письма по обращению.
 *
 * Почтовые клиенты собирают переписку в одну ветку по этим заголовкам. Все
 * письма одного обращения ссылаются на первое — тогда продолжение разговора
 * приходит Татьяне в ту же цепочку, а не отдельным письмом без контекста.
 */
export function inquiryThreadId(inquiryId: string): string {
  return `<inquiry-${inquiryId}@sovetmam.ru>`;
}

/** Заголовок письма обращения: одинаковый у всей ветки, у продолжений — с «Re:». */
function inquirySubject(subject: string, followUp = false): string {
  return `${followUp ? "Re: " : ""}Новое обращение: ${subject}`;
}

/**
 * Письмо тому, кто разбирает обращения: полный текст плюс кнопка «Ответить»,
 * которая открывает форму ответа по одноразовой ссылке — без входа в
 * приложение, чтобы можно было ответить прямо с телефона.
 */
export async function sendNewInquiryEmail(
  to: string,
  data: InquiryEmailData,
  replyUrl: string,
): Promise<void> {
  const transport = getTransport();
  const date = new Date(data.createdAt).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (!transport) {
    // eslint-disable-next-line no-console
    console.log(`[Обращение][stub] ${to}: «${data.subject}» — ответить: ${replyUrl}`);
    return;
  }

  const html = shell(`
    <p style="font-size:13px;color:#6b7078;margin:0 0 4px">Новое обращение в приложении</p>
    <h1 style="font-size:19px;line-height:1.35;margin:0 0 16px">${esc(data.subject)}</h1>

    <table style="border-collapse:collapse;margin-bottom:18px">
      ${row("От кого", data.userName)}
      ${row("Почта", data.userEmail)}
      ${data.region ? row("Регион", data.region) : ""}
      ${row("Тип", data.typeLabel)}
      ${data.measureTitle ? row("О мере", data.measureTitle) : ""}
      ${row("Когда", date)}
    </table>

    <div style="background:#F3F1EC;border-radius:10px;padding:14px 16px;font-size:15px;line-height:1.55;white-space:pre-wrap">${esc(data.body)}</div>

    <p style="margin:22px 0 8px">${button(replyUrl, "Ответить")}</p>
    <p style="font-size:12px;color:#9aa0a8;margin:0">
      Ссылка откроет форму ответа и действует 14 дней. Ответ увидит человек
      в приложении, ему придут уведомления в мессенджер и на почту.
    </p>
  `);

  await transport.sendMail({
    from: fromAddress(),
    to,
    subject: inquirySubject(data.subject),
    // Первое письмо задаёт ветку: продолжения будут ссылаться на него.
    messageId: inquiryThreadId(data.inquiryId),
    text:
      `Новое обращение в приложении.\n\n` +
      `От кого: ${data.userName} (${data.userEmail})\n` +
      (data.region ? `Регион: ${data.region}\n` : "") +
      `Тип: ${data.typeLabel}\n` +
      (data.measureTitle ? `О мере: ${data.measureTitle}\n` : "") +
      `Когда: ${date}\n\n` +
      `Тема: ${data.subject}\n\n${data.body}\n\n` +
      `Ответить: ${replyUrl}`,
    html,
  });
}

/**
 * Продолжение разговора: человек написал в уже созданное обращение.
 *
 * Письмо уходит в ту же ветку, что и первое, — Татьяна видит переписку целиком
 * в одном месте почты, а не отдельным письмом без контекста. Для верности
 * прикладываем предыдущие сообщения прямо в тексте: почтовые клиенты сворачивают
 * цитату, но она есть, если письмо открыли отдельно.
 */
export async function sendInquiryFollowUpEmail(
  to: string,
  data: {
    inquiryId: string;
    subject: string;
    userName: string;
    body: string;
    history: { author: "user" | "staff"; body: string; createdAt: string }[];
  },
  replyUrl: string,
): Promise<void> {
  const transport = getTransport();

  if (!transport) {
    console.log(`[Обращение][stub] ${to}: продолжение «${data.subject}» — ${replyUrl}`);
    return;
  }

  const when = (iso: string) =>
    new Date(iso).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });

  const historyHtml = data.history
    .map(
      (m) => `
      <div style="margin:0 0 10px">
        <p style="font-size:12px;color:#9aa0a8;margin:0 0 3px">
          ${m.author === "user" ? esc(data.userName) : "Мы"} · ${esc(when(m.createdAt))}
        </p>
        <div style="background:${m.author === "user" ? "#F3F1EC" : "#EEF3EE"};border-radius:10px;
                    padding:10px 12px;font-size:14px;line-height:1.5;white-space:pre-wrap">${esc(m.body)}</div>
      </div>`,
    )
    .join("");

  const html = shell(`
    <p style="font-size:13px;color:#6b7078;margin:0 0 4px">Человек написал в обращение</p>
    <h1 style="font-size:19px;line-height:1.35;margin:0 0 16px">${esc(data.subject)}</h1>

    <div style="background:#F3F1EC;border-radius:10px;padding:14px 16px;font-size:15px;line-height:1.55;white-space:pre-wrap">${esc(data.body)}</div>

    <p style="margin:22px 0 8px">${button(replyUrl, "Ответить")}</p>

    ${
      data.history.length
        ? `<p style="font-size:12px;color:#9aa0a8;margin:22px 0 8px">Что было раньше:</p>${historyHtml}`
        : ""
    }
  `);

  await transport.sendMail({
    from: fromAddress(),
    to,
    subject: inquirySubject(data.subject, true),
    // Ссылка на первое письмо обращения — по ней почта собирает ветку.
    inReplyTo: inquiryThreadId(data.inquiryId),
    references: inquiryThreadId(data.inquiryId),
    text:
      `${data.userName} написал в обращение «${data.subject}»:\n\n${data.body}\n\n` +
      `Ответить: ${replyUrl}\n\n` +
      (data.history.length
        ? `Что было раньше:\n${data.history
            .map(
              (m) =>
                `\n[${m.author === "user" ? data.userName : "Мы"}, ${when(m.createdAt)}]\n${m.body}`,
            )
            .join("\n")}`
        : ""),
    html,
  });
}

/** Письмо пользователю: на его обращение ответили. */
export async function sendInquiryAnswerEmail(
  to: string,
  data: { subject: string; response: string; answeredBy: string },
  appLink: string,
): Promise<void> {
  const transport = getTransport();

  if (!transport) {
    // eslint-disable-next-line no-console
    console.log(`[Ответ][stub] ${to}: «${data.subject}» — ${appLink}`);
    return;
  }

  const html = shell(`
    <p style="font-size:13px;color:#6b7078;margin:0 0 4px">На ваше обращение ответили</p>
    <h1 style="font-size:19px;line-height:1.35;margin:0 0 16px">${esc(data.subject)}</h1>

    <div style="background:#F3F1EC;border-radius:10px;padding:14px 16px;font-size:15px;line-height:1.55;white-space:pre-wrap">${esc(data.response)}</div>
    <p style="font-size:13px;color:#6b7078;margin:10px 0 0">${esc(data.answeredBy)}</p>

    <p style="margin:22px 0 8px">${button(appLink, "Открыть в приложении")}</p>
    <p style="font-size:12px;color:#9aa0a8;margin:0">
      Ответ также сохранён в вашем личном кабинете.
    </p>
  `);

  await transport.sendMail({
    from: fromAddress(),
    to,
    subject: `Ответ на ваше обращение: ${data.subject}`,
    text:
      `На ваше обращение ответили.\n\n` +
      `Тема: ${data.subject}\n\n${data.response}\n\n${data.answeredBy}\n\n` +
      `Открыть в приложении: ${appLink}`,
    html,
  });
}
