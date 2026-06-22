import Link from "next/link";
import { SupportPyramid } from "@/components/home/support-pyramid";
import { BackLink } from "@/components/back-link";
import { MotionFadeIn } from "@/components/motion";

export const metadata = { title: "Пирамида мер поддержки" };

export default function PyramidPage() {
  return (
    <div className="px-4 py-5">
      <MotionFadeIn>
        <BackLink href="/" label="На главную" />
      </MotionFadeIn>

      <MotionFadeIn delay={0.05}>
        <SupportPyramid />
      </MotionFadeIn>

      <MotionFadeIn delay={0.1}>
        <p className="mt-6 text-center text-sm font-semibold text-foreground">
          Меры поддержки на всех уровнях — для вашей семьи
        </p>
        <Link
          href="/catalog"
          className="sm-cta mx-auto mt-3 flex w-full items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground"
        >
          Перейти в каталог мер
        </Link>
      </MotionFadeIn>
    </div>
  );
}
