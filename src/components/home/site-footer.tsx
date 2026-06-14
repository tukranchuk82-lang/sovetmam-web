import Image from "next/image";

/** Подвал в стиле «Шпаргалки»: navy-блок с красной чертой сверху. */
export function SiteFooter() {
  return (
    <footer className="-mx-4 mt-2 border-t-4 border-accent-red bg-brand px-5 py-6 text-center text-brand-foreground">
      <div className="flex items-center justify-center gap-2.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white">
          <Image
            src="/logo.png"
            alt="Совет матерей"
            width={28}
            height={28}
            className="size-7 rounded-full object-contain"
          />
        </div>
        <span className="font-serif text-base font-bold uppercase tracking-wide">
          Шпаргалка для родителей
        </span>
      </div>
      <p className="mt-2 text-xs text-white/70">
        Официальный проект «Совета матерей»
      </p>
      <p className="mt-3 text-[11px] leading-relaxed text-white/55">
        © 2026 Общероссийская общественная организация «Совет матерей»
      </p>
    </footer>
  );
}
