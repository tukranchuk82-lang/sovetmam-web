// Карандашная иллюстрация «семья» (двое взрослых + двое детей). Своя графика
// вместо эмодзи 👨‍👩‍👧‍👦 — единый стиль и одинаковый вид на всех устройствах.
// Лёгкая шероховатость линий (feTurbulence + feDisplacementMap) даёт эффект
// наброска от руки.
export function FamilyDoodle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 92 58"
      className={className}
      role="img"
      aria-label="Семья"
    >
      <defs>
        <filter id="family-pencil" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.08 0.12"
            numOctaves="2"
            seed="7"
            result="n"
          />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" />
        </filter>
      </defs>
      <g filter="url(#family-pencil)">
        <g
          fill="none"
          stroke="#5a4f4a"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* плечи */}
          <path d="M6 52 C6 40 12 34 20 34 C28 34 34 40 34 52" />
          <path d="M28 52 C28 39 34 33 42 33 C50 33 56 39 56 52" />
          <path d="M48 52 C48 44 53 39 60 39 C67 39 72 44 72 52" />
          <path d="M66 52 C66 45 70 41 76 41 C82 41 86 45 86 52" />
          {/* головы */}
          <circle cx="20" cy="16" r="9" />
          <circle cx="42" cy="14" r="9" />
          <circle cx="60" cy="26" r="7" />
          <circle cx="76" cy="28" r="6" />
          {/* волосы */}
          <path d="M11 12 Q12 5 20 5 Q28 5 29 12" />
          <path d="M33 11 Q42 2 51 11" />
          <path d="M33 12 Q31 24 35 31" />
          <path d="M51 12 Q53 24 49 31" />
          <path d="M54 23 Q60 17 66 23" />
          <circle cx="53" cy="26" r="2.4" />
          <circle cx="67" cy="26" r="2.4" />
          <path d="M71 26 Q76 22 81 26" />
          {/* улыбки */}
          <path d="M17 19 Q20 22 23 19" />
          <path d="M39 17 Q42 20 45 17" />
          <path d="M57.5 28 Q60 30 62.5 28" />
          <path d="M74 30 Q76 31.5 78 30" />
        </g>
        <g fill="#5a4f4a">
          <circle cx="17" cy="15" r="1.1" />
          <circle cx="23" cy="15" r="1.1" />
          <circle cx="39" cy="13" r="1.1" />
          <circle cx="45" cy="13" r="1.1" />
          <circle cx="57.6" cy="25" r="0.9" />
          <circle cx="62.4" cy="25" r="0.9" />
          <circle cx="74.2" cy="27" r="0.8" />
          <circle cx="77.8" cy="27" r="0.8" />
        </g>
      </g>
    </svg>
  );
}
