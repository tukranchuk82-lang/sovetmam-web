import { FounderHero } from "@/components/home/founder-hero";
import { AnketaBanner } from "@/components/home/anketa-banner";
import { SupportPyramid } from "@/components/home/support-pyramid";
import { MeasureTypes } from "@/components/home/measure-types";
import { LifeCategories } from "@/components/home/life-categories";
import { CatalogSituations } from "@/components/home/catalog-situations";
import { SiteFooter } from "@/components/home/site-footer";
import { InstallAppButton } from "@/components/install-app-button";
import { MotionFadeIn } from "@/components/motion";

export default function Home() {
  return (
    <div className="space-y-9 px-4 py-5">
      <MotionFadeIn>
        <FounderHero />
      </MotionFadeIn>

      <MotionFadeIn delay={0.05}>
        <AnketaBanner />
      </MotionFadeIn>

      <MotionFadeIn delay={0.1}>
        <SupportPyramid />
      </MotionFadeIn>

      <MotionFadeIn delay={0.1}>
        <MeasureTypes />
      </MotionFadeIn>

      <MotionFadeIn delay={0.1}>
        <LifeCategories />
      </MotionFadeIn>

      <MotionFadeIn delay={0.1}>
        <CatalogSituations />
      </MotionFadeIn>

      <MotionFadeIn delay={0.1}>
        <InstallAppButton />
        <SiteFooter />
      </MotionFadeIn>
    </div>
  );
}
