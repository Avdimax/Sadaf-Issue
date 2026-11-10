"use client";

import dynamic from "next/dynamic";
import SmoothScroll from "@/components/portfolio/SmoothScroll";
import Cursor from "@/components/portfolio/Cursor";
import Preloader from "@/components/portfolio/Preloader";
import Navbar from "@/components/portfolio/Navbar";
import AnimationGate from "@/components/portfolio/AnimationGate";
import BrandStage from "@/components/portfolio/BrandStage";
import Marquee from "@/components/portfolio/Marquee";
import Manifesto from "@/components/portfolio/Manifesto";
import MoodReel from "@/components/portfolio/MoodReel";
import Archipelago from "@/components/portfolio/Archipelago";
import Variations from "@/components/portfolio/Variations";
import VelocityBand from "@/components/portfolio/VelocityBand";
import Craft from "@/components/portfolio/Craft";
import Designer from "@/components/portfolio/Designer";
import Footer from "@/components/portfolio/Footer";

/* The order theater renders null until the visitor opens it — loading it
   as a lazy client-only chunk keeps its JS out of the critical path. */
const OrderTheater = dynamic(
  () => import("@/components/portfolio/OrderTheater"),
  { ssr: false }
);

export default function Page() {
  return (
    <SmoothScroll>
      <div className="grain relative min-h-screen bg-pearl text-ink">
        <Preloader />
        <Cursor />
        <Navbar />
        <AnimationGate />
        <OrderTheater />

        <main>
          {/* 01 — the atelier's own mark (a placeholder while it is in the works) */}
          <BrandStage />
          <Marquee />
          <Manifesto />
          <MoodReel />
          <Archipelago />
          <Variations />
          <VelocityBand />
          <Craft />
          {/* 06 — the designer herself closes the journey */}
          <Designer />
        </main>

        {/* 07 — the horizon of the UX: the order */}
        <Footer />
      </div>
    </SmoothScroll>
  );
}
