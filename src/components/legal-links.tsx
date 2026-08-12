/**
 * Ссылки на правовые документы.
 *
 * Документы общие для всех наших сервисов и живут отдельным сайтом
 * (doc.sovetmam.ru), поэтому здесь только ссылки. Показываем их не только при
 * регистрации: человек вправе перечитать политику в любой момент, а тот, кто
 * зарегистрировался раньше, галочек с ссылками вообще не видел.
 */

const DOCS_URL = "https://doc.sovetmam.ru";

const LINKS = [
  { href: `${DOCS_URL}/privacy`, title: "Политика конфиденциальности" },
  { href: `${DOCS_URL}/consent`, title: "Согласие на обработку персональных данных" },
  { href: `${DOCS_URL}/mailing`, title: "Согласие на рассылку" },
];

export function LegalLinks({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Документы
      </p>
      <ul className="mt-2 space-y-1.5">
        {LINKS.map((l) => (
          <li key={l.href}>
            <a
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#3A4D63] underline underline-offset-2 hover:text-[#8E1D2C]"
            >
              {l.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
