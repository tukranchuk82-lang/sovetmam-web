/**
 * Карандашные дудлы для темы «Карандаш» — простые детские рисунки в стиле
 * восковых мелков: тёплый «карандашный» контур (#5b4f3f), мягкие заливки,
 * округлые штрихи. Рисуются кодом (SVG) — бесплатно, без чужих лицензий.
 *
 * Используются вместо эмодзи только в теме crayon (переключение через CSS:
 * .sm-ico-doodle / .sm-ico-emoji, см. globals.css).
 */
const OUTLINE = "#5b4f3f";

/** Мини-зайчик (голова + ушки + мордочка) для карточек «Семья с N детьми». */
const bun = (cx: number, cy: number, r: number, key: string) => (
  <g key={key}>
    <ellipse cx={cx - r * 0.45} cy={cy - r * 1.25} rx={r * 0.34} ry={r * 0.9} fill="#fff" stroke={OUTLINE} strokeWidth="2" />
    <ellipse cx={cx + r * 0.45} cy={cy - r * 1.25} rx={r * 0.34} ry={r * 0.9} fill="#fff" stroke={OUTLINE} strokeWidth="2" />
    <circle cx={cx} cy={cy} r={r} fill="#fff" stroke={OUTLINE} strokeWidth="2.2" />
    <circle cx={cx - r * 0.38} cy={cy - r * 0.05} r={Math.max(1, r * 0.13)} fill={OUTLINE} />
    <circle cx={cx + r * 0.38} cy={cy - r * 0.05} r={Math.max(1, r * 0.13)} fill={OUTLINE} />
    <circle cx={cx} cy={cy + r * 0.3} r={Math.max(1, r * 0.14)} fill="#f7a8b8" />
  </g>
);

const PATHS: Record<string, React.ReactNode> = {
  sun: (
    <>
      <g fill="none" stroke="#f5a623" strokeWidth="3" strokeLinecap="round">
        <path d="M24 3v6M24 39v6M3 24h6M39 24h6M9 9l4 4M35 35l4 4M39 9l-4 4M13 35l-4 4" />
      </g>
      <circle cx="24" cy="24" r="12" fill="#ffd24a" stroke="#f5a623" strokeWidth="3" />
      <circle cx="20" cy="22" r="1.6" fill={OUTLINE} />
      <circle cx="28" cy="22" r="1.6" fill={OUTLINE} />
      <path d="M20 27q4 4 8 0" fill="none" stroke={OUTLINE} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  cloud: (
    <path
      d="M14 34a8 8 0 0 1 0-16 10 10 0 0 1 19-3 8 8 0 0 1 3 19z"
      fill="#dff0fb"
      stroke="#7bb6e0"
      strokeWidth="3"
      strokeLinejoin="round"
    />
  ),
  flower: (
    <>
      <g stroke="#e8743b" strokeWidth="2.5">
        <circle cx="24" cy="11" r="6" fill="#f7b7c4" />
        <circle cx="37" cy="24" r="6" fill="#f7b7c4" />
        <circle cx="11" cy="24" r="6" fill="#f7b7c4" />
        <circle cx="24" cy="37" r="6" fill="#f7b7c4" />
      </g>
      <circle cx="24" cy="24" r="6.5" fill="#ffd24a" stroke="#e8743b" strokeWidth="2.5" />
    </>
  ),
  ball: (
    <>
      <circle cx="24" cy="24" r="15" fill="#ffd24a" stroke={OUTLINE} strokeWidth="3" />
      <path d="M9 24h30M24 9v30" stroke={OUTLINE} strokeWidth="2.2" fill="none" />
      <path d="M13 14q11 4 21 20M35 14q-11 4-21 20" stroke="#e0533a" strokeWidth="2.2" fill="none" opacity="0.75" />
    </>
  ),
  balloon: (
    <>
      <path
        d="M24 6c7 0 11 6 11 12 0 8-7 13-11 13s-11-5-11-13c0-6 4-12 11-12z"
        fill="#f47c7c"
        stroke={OUTLINE}
        strokeWidth="3"
      />
      <path d="M24 31l-1 4M24 35c2 1 2 3 0 4" stroke={OUTLINE} strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  ),
  house: (
    <>
      <path d="M7 23 24 9l17 14z" fill="#e98c6b" stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
      <path d="M12 22v17h24V22" fill="#fcd9a8" stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
      <rect x="20" y="29" width="8" height="10" fill="#a9cdee" stroke={OUTLINE} strokeWidth="2" />
    </>
  ),
  tree: (
    <>
      <rect x="21" y="27" width="6" height="15" rx="2" fill="#b07a4a" stroke={OUTLINE} strokeWidth="2.5" />
      <circle cx="24" cy="18" r="13" fill="#8bc34a" stroke={OUTLINE} strokeWidth="3" />
    </>
  ),
  dog: (
    <>
      <path d="M12 15c-4 1-6 6-3 12" fill="#d39a5c" stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
      <path d="M36 15c4 1 6 6 3 12" fill="#d39a5c" stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
      <ellipse cx="24" cy="26" rx="13" ry="11" fill="#f0c08a" stroke={OUTLINE} strokeWidth="3" />
      <circle cx="19" cy="24" r="1.8" fill={OUTLINE} />
      <circle cx="29" cy="24" r="1.8" fill={OUTLINE} />
      <ellipse cx="24" cy="29" rx="2.4" ry="1.8" fill={OUTLINE} />
      <path d="M24 31v3" stroke={OUTLINE} strokeWidth="2" />
    </>
  ),
  cat: (
    <>
      <path d="M14 13 18 23 10 23z" fill="#f2b06a" stroke={OUTLINE} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M34 13 38 23 30 23z" fill="#f2b06a" stroke={OUTLINE} strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="24" cy="27" r="12" fill="#f6c389" stroke={OUTLINE} strokeWidth="3" />
      <circle cx="20" cy="26" r="1.7" fill={OUTLINE} />
      <circle cx="28" cy="26" r="1.7" fill={OUTLINE} />
      <path d="M24 29v2M24 31c-1 1-3 1-4 0M24 31c1 1 3 1 4 0" stroke={OUTLINE} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M7 27h6M7 31h6M35 27h6M35 31h6" stroke={OUTLINE} strokeWidth="1.4" />
    </>
  ),
  bunny: (
    <>
      <ellipse cx="19" cy="12" rx="3.5" ry="9" fill="#fff" stroke={OUTLINE} strokeWidth="2.5" />
      <ellipse cx="29" cy="12" rx="3.5" ry="9" fill="#fff" stroke={OUTLINE} strokeWidth="2.5" />
      <circle cx="24" cy="30" r="12" fill="#fff" stroke={OUTLINE} strokeWidth="3" />
      <circle cx="20" cy="29" r="1.6" fill={OUTLINE} />
      <circle cx="28" cy="29" r="1.6" fill={OUTLINE} />
      <circle cx="24" cy="32" r="1.6" fill="#f7a8b8" />
    </>
  ),
  bear: (
    <>
      <circle cx="14" cy="15" r="5" fill="#c79a6b" stroke={OUTLINE} strokeWidth="2.5" />
      <circle cx="34" cy="15" r="5" fill="#c79a6b" stroke={OUTLINE} strokeWidth="2.5" />
      <circle cx="24" cy="27" r="13" fill="#dcb486" stroke={OUTLINE} strokeWidth="3" />
      <circle cx="19" cy="25" r="1.7" fill={OUTLINE} />
      <circle cx="29" cy="25" r="1.7" fill={OUTLINE} />
      <ellipse cx="24" cy="30" rx="4" ry="3" fill="#f0dcc0" stroke={OUTLINE} strokeWidth="2" />
      <circle cx="24" cy="29" r="1.5" fill={OUTLINE} />
    </>
  ),
  heart: (
    <path
      d="M24 39 9 24a8 8 0 0 1 11-11l4 4 4-4a8 8 0 0 1 11 11z"
      fill="#f47c7c"
      stroke={OUTLINE}
      strokeWidth="3"
      strokeLinejoin="round"
    />
  ),
  star: (
    <path
      d="M24 5 29 18 43 19 32 28 36 42 24 34 12 42 16 28 5 19 19 18z"
      fill="#ffd24a"
      stroke={OUTLINE}
      strokeWidth="3"
      strokeLinejoin="round"
    />
  ),
  book: (
    <>
      <path
        d="M24 12c-4-3-10-3-14-1v23c4-2 10-2 14 1 4-3 10-3 14-1V11c-4-2-10-2-14 1z"
        fill="#bfe0f3"
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M24 12v23" stroke={OUTLINE} strokeWidth="2.5" />
    </>
  ),
  cap: (
    <>
      <path d="M24 12 6 20l18 8 18-8z" fill="#5b6b8a" stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
      <path d="M14 24v8c0 3 20 3 20 0v-8" fill="#7d8db0" stroke={OUTLINE} strokeWidth="3" />
      <path d="M42 20v9" stroke={OUTLINE} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  gift: (
    <>
      <path d="M24 20c-3-9-13-6-9 0M24 20c3-9 13-6 9 0" fill="#ffd24a" stroke={OUTLINE} strokeWidth="2.5" />
      <rect x="9" y="20" width="30" height="19" rx="2" fill="#f47c7c" stroke={OUTLINE} strokeWidth="3" />
      <path d="M9 27h30M24 20v19" stroke={OUTLINE} strokeWidth="2.5" />
    </>
  ),
  coin: (
    <>
      <circle cx="24" cy="24" r="15" fill="#ffd24a" stroke={OUTLINE} strokeWidth="3" />
      <path d="M20 16h6a5 5 0 0 1 0 10h-6M20 13v22M16 21h10" stroke={OUTLINE} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  ),
  bulb: (
    <>
      <path
        d="M24 8a11 11 0 0 0-7 19c2 2 2 3 2 5h10c0-2 0-3 2-5a11 11 0 0 0-7-19z"
        fill="#ffe9a8"
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M19 36h10M20 40h8" stroke={OUTLINE} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  bus: (
    <>
      <rect x="8" y="14" width="32" height="20" rx="5" fill="#ffd24a" stroke={OUTLINE} strokeWidth="3" />
      <rect x="12" y="18" width="9" height="7" rx="2" fill="#bfe0f3" stroke={OUTLINE} strokeWidth="2" />
      <rect x="27" y="18" width="9" height="7" rx="2" fill="#bfe0f3" stroke={OUTLINE} strokeWidth="2" />
      <circle cx="16" cy="36" r="3.5" fill={OUTLINE} />
      <circle cx="32" cy="36" r="3.5" fill={OUTLINE} />
    </>
  ),
  bag: (
    <>
      <path d="M13 18h22l-2 21H15z" fill="#f7c8da" stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
      <path d="M18 18a6 6 0 0 1 12 0" fill="none" stroke={OUTLINE} strokeWidth="3" />
    </>
  ),
  tag: (
    <>
      <path
        d="M22 9 39 26a3 3 0 0 1 0 4l-9 9a3 3 0 0 1-4 0L9 22V9z"
        fill="#cfe8b4"
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="16" r="2.5" fill={OUTLINE} />
    </>
  ),
  doc: (
    <>
      <path d="M14 8h14l8 8v24H14z" fill="#fff" stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
      <path d="M28 8v8h8M19 24h12M19 30h12" stroke={OUTLINE} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  ),

  // Семья с N детьми — N зайчиков
  family1: bun(24, 28, 10, "a"),
  family2: <>{bun(15, 29, 8, "a")}{bun(33, 29, 8, "b")}</>,
  family3: (
    <>
      {bun(24, 17, 7, "a")}
      {bun(14, 32, 7, "b")}
      {bun(34, 32, 7, "c")}
    </>
  ),
  family4: (
    <>
      {bun(15, 16, 6.5, "a")}
      {bun(33, 16, 6.5, "b")}
      {bun(15, 33, 6.5, "c")}
      {bun(33, 33, 6.5, "d")}
    </>
  ),
  family5: (
    <>
      {bun(14, 15, 5.6, "a")}
      {bun(34, 15, 5.6, "b")}
      {bun(24, 25, 5.6, "c")}
      {bun(14, 35, 5.6, "d")}
      {bun(34, 35, 5.6, "e")}
    </>
  ),
  familyMany: (
    <>
      {bun(12, 15, 4.6, "a")}
      {bun(24, 12, 4.6, "b")}
      {bun(36, 15, 4.6, "c")}
      {bun(12, 31, 4.6, "d")}
      {bun(24, 28, 4.6, "e")}
      {bun(36, 31, 4.6, "f")}
      {bun(24, 41, 4.6, "g")}
    </>
  ),

  // Одинокий родитель — взрослый и ребёнок
  adultchild: (
    <g stroke={OUTLINE} strokeWidth="2.5" strokeLinejoin="round">
      <circle cx="17" cy="13" r="6" fill="#f6c389" />
      <path d="M8 41c0-10 4-16 9-16s9 6 9 16z" fill="#7bb6e0" />
      <circle cx="34" cy="22" r="4.5" fill="#f6c389" />
      <path d="M27 41c0-7 3-11 7-11s7 4 7 11z" fill="#f7a8b8" />
    </g>
  ),

  // Родитель-инвалид — большая инвалидная коляска
  wheelchair: (
    <>
      <circle cx="19" cy="32" r="11" fill="none" stroke={OUTLINE} strokeWidth="2.8" />
      <g stroke={OUTLINE} strokeWidth="1.5">
        <path d="M19 21v22M8 32h22M11 24l16 16M27 24l-16 16" />
      </g>
      <circle cx="19" cy="32" r="2.6" fill={OUTLINE} />
      <circle cx="36" cy="40" r="4" fill="none" stroke={OUTLINE} strokeWidth="2.6" />
      <circle cx="31" cy="11" r="5" fill="#f6c389" stroke={OUTLINE} strokeWidth="2.5" />
      <path d="M26 18l-3 8h13" fill="#7bb6e0" stroke={OUTLINE} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M30 32h7" fill="none" stroke={OUTLINE} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),

  // Ясли — погремушка
  rattle: (
    <>
      <circle cx="20" cy="18" r="11" fill="#f7c8da" stroke={OUTLINE} strokeWidth="2.6" />
      <circle cx="20" cy="18" r="3" fill="#fff" stroke={OUTLINE} strokeWidth="1.6" />
      <circle cx="15" cy="14" r="1.4" fill="#fff" />
      <circle cx="25" cy="22" r="1.4" fill="#fff" />
      <path d="M24 27l8 11" stroke={OUTLINE} strokeWidth="4" strokeLinecap="round" />
      <circle cx="34" cy="40" r="3.6" fill="#ffd24a" stroke={OUTLINE} strokeWidth="2.4" />
    </>
  ),

  // Школа — портфель
  satchel: (
    <>
      <path d="M16 18v-2a8 8 0 0 1 16 0v2" fill="none" stroke={OUTLINE} strokeWidth="2.6" />
      <rect x="9" y="18" width="30" height="21" rx="4" fill="#e0a05c" stroke={OUTLINE} strokeWidth="2.6" />
      <rect x="9" y="24" width="30" height="7" fill="#c9854a" stroke={OUTLINE} strokeWidth="2.2" />
      <rect x="21" y="26" width="6" height="5" rx="1" fill="#fcd9a8" stroke={OUTLINE} strokeWidth="1.8" />
    </>
  ),

  // Колледж — стопка книг
  bookstack: (
    <g stroke={OUTLINE} strokeWidth="2.4" strokeLinejoin="round">
      <rect x="9" y="30" width="30" height="8" rx="1.5" fill="#f47c7c" />
      <rect x="12" y="22" width="27" height="8" rx="1.5" fill="#8bc34a" />
      <rect x="8" y="14" width="26" height="8" rx="1.5" fill="#4a90d9" />
    </g>
  ),

  // Бабушки и дедушки — бабушка и дедушка
  grandparents: (
    <g stroke={OUTLINE} strokeWidth="2.3" strokeLinejoin="round">
      <path d="M9 41c0-9 3-14 8-14s8 5 8 14z" fill="#f7a8b8" />
      <circle cx="17" cy="14" r="6" fill="#f6c389" />
      <path d="M11 15a6 6 0 0 1 12 0z" fill="#dcdcdc" />
      <path d="M25 41c0-9 3-14 8-14s8 5 8 14z" fill="#7bb6e0" />
      <circle cx="33" cy="15" r="6" fill="#f6c389" />
      <path d="M27 14a6 6 0 0 1 12 0v1" fill="#dcdcdc" />
      <g stroke={OUTLINE} strokeWidth="1.4" fill="none">
        <circle cx="31" cy="15" r="1.8" /><circle cx="36" cy="15" r="1.8" /><path d="M33 15h0.5" />
      </g>
    </g>
  ),

  // Семейный бизнес — офисное кресло
  officechair: (
    <g stroke={OUTLINE} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
      <path d="M18 9h6a4 4 0 0 1 4 4v12H14V13a4 4 0 0 1 4-4z" fill="#5b6b8a" />
      <rect x="12" y="25" width="20" height="6" rx="2" fill="#7d8db0" />
      <path d="M22 31v8" fill="none" />
      <path d="M13 43l9-4 9 4" fill="none" />
      <circle cx="13" cy="43" r="1.8" fill={OUTLINE} />
      <circle cx="31" cy="43" r="1.8" fill={OUTLINE} />
    </g>
  ),

  // Карандаш — для баннера «Своя жизненная ситуация»
  pencil: (
    <g stroke={OUTLINE} strokeWidth="2.5" strokeLinejoin="round">
      <path d="M31 7l10 10-21 21-13 3 3-13z" fill="#ffd24a" />
      <path d="M31 7l5-4 10 10-4 5z" fill="#f47c7c" />
      <path d="M10 38l2-9 7 7z" fill="#f6c389" />
      <path d="M10 38l1-5 4 4z" fill={OUTLINE} />
    </g>
  ),

  // Стрелка вправо — рисованная
  arrow: (
    <g fill="none" stroke={OUTLINE} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 24c10-1 20-1 31 0" />
      <path d="M28 13l12 11-12 11" />
    </g>
  ),
};

export type DoodleName = keyof typeof PATHS;

export function Doodle({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const inner = PATHS[name] ?? PATHS.star;
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      aria-hidden
      role="img"
      strokeLinecap="round"
    >
      {inner}
    </svg>
  );
}
