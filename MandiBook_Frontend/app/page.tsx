import { Hero1 } from "@/components/blocks/hero-1";
import { Features1 } from "@/components/blocks/features-1";
import { Showcase1 } from "@/components/blocks/showcase-1";
import SocialProof5 from "@/components/blocks/social-proof-5";
import Stats3 from "@/components/blocks/stats-3";
import Comparison3 from "@/components/blocks/comparison-3";
import FAQ3 from "@/components/blocks/faq-3";
import CTA1 from "@/components/blocks/cta-1";
import Footer1 from "@/components/blocks/footer-1";
import { createMetadata, siteConfig } from "@/lib/metadata";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = createMetadata({
  title: "MandiBook — Book Your Mandi Slot, Sell Smarter",
  description: `Welcome to ${siteConfig.name}. ${siteConfig.description}`,
  path: "/",
});

export default function HomePage(): ReactNode {
  return (
    <main id="main-content" className="flex-1">
      {/* 1. Hero — fills viewport, only thing visible on initial load */}
      <Hero1 />

      {/* 2. Features — what MandiBook offers */}
      <Features1 />

      {/* 3. How It Works — step-by-step guide */}
      <Showcase1 />

      {/* 4. Social Proof — farmer testimonials + partner logos */}
      <SocialProof5 />

      {/* 5. Platform Stats — numbers that build trust */}
      <Stats3 />

      {/* 6. Comparison — MandiBook vs Traditional */}
      <Comparison3 />

      {/* 7. FAQ — organized by topic */}
      <FAQ3 />

      {/* 8. CTA — final call to action */}
      <CTA1 />

      {/* 9. Footer */}
      <Footer1 />
    </main>
  );
}
