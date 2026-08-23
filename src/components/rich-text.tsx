import { Fragment } from "react";

/**
 * Текст меры со «живыми» ссылками.
 *
 * В карточках мы называем конкретные адреса — «Работа России» (trudvsem.ru),
 * госуслуги, сайты ведомств. Человек читает их с телефона, и переписывать
 * адрес руками он не станет: ссылка должна открываться нажатием.
 *
 * Полноценный markdown тут не нужен и опасен: в текстах хватает звёздочек,
 * кавычек и процентов. Разбираем ровно два случая — [подпись](адрес) и
 * «голый» адрес вида trudvsem.ru или https://… — остальное показываем как есть.
 */

// Голый адрес: с протоколом или начинающийся с домена вроде trudvsem.ru.
// Хвостовую пунктуацию (точку, запятую, скобку) в ссылку не забираем.
const LINK = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|((?:https?:\/\/|www\.)[^\s<>()]+[^\s<>().,;:]|(?:[a-z0-9-]+\.)+(?:ru|рф|com|org|net)(?:\/[^\s<>()]*[^\s<>().,;:])?)/gi;

function href(raw: string): string {
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

export function RichText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  LINK.lastIndex = 0;
  while ((match = LINK.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));

    const [full, label, url, bare] = match;
    const target = url ?? bare;
    parts.push(
      <a
        key={`${match.index}-${target}`}
        href={href(target)}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-primary underline underline-offset-2 hover:opacity-80"
      >
        {label ?? bare}
      </a>,
    );
    last = match.index + full.length;
  }
  if (last < text.length) parts.push(text.slice(last));

  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>{p}</Fragment>
      ))}
    </>
  );
}
