"use client";

import { LandingNavbar } from "./LandingNavbar";
import { LandingHero } from "./LandingHero";
import { LandingFeatures } from "./LandingFeatures";
import { LandingInsights } from "./LandingInsights";
import { LandingCta } from "./LandingCta";
import { LandingFooter } from "./LandingFooter";
import { BackToTop } from "./BackToTop";

export function LandingPage() {
  return (
    <main className="lp-page">
      <LandingNavbar />
      <LandingHero />
      <LandingFeatures />
      <LandingInsights />
      <LandingCta />
      <LandingFooter />
      <BackToTop />
    </main>
  );
}
