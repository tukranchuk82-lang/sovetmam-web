import { ShareButton } from "@/components/share-button";

/**
 * «Расскажите другим родителям» — блок в конце главной.
 *
 * Стоит именно здесь: человек уже пролистал главную и видел, что внутри. Просить
 * поделиться на первом экране, до того как он сам разобрался, — просить впустую.
 */
export function ShareSection() {
  return (
    <section className="mt-8 px-5">
      <div className="rounded-3xl bg-[#22457B] px-5 py-6 text-white shadow-[0_18px_40px_-20px_rgba(34,69,123,0.9)]">
        <h2
          className="text-[22px] font-semibold leading-tight tracking-[-0.01em]"
          style={{ fontFamily: "var(--font-playfair), serif" }}
        >
          Расскажите другим родителям
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-white/75">
          Многие семьи не получают положенное просто потому, что не знают о нём.
          Отправьте ссылку тем, кому она пригодится.
        </p>
        <ShareButton
          path="/"
          title="Шпаргалка для родителей"
          text="Все меры поддержки семей с детьми в одном месте — узнайте, что положено вашей семье."
          className="mt-4 border-transparent bg-white text-[#22457B] hover:bg-white/90"
        />
      </div>
    </section>
  );
}
