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
