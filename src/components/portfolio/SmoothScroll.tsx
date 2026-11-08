"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let lenisInstance: Lenis | null = null;

export function scrollToId(id: string) {
  const el = document.querySelector(id);
  if (!el) return;
  if (lenisInstance) {
    lenisInstance.scrollTo(el as HTMLElement, { offset: -20, duration: 1.15 });
  } else {
    (el as HTMLElement).scrollIntoView({ behavior: "smooth" });
  }
}

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    // Re-measure triggers when late layout shifts settle (fonts, window load)
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    document.fonts?.ready.then(refresh).catch(() => {});

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      // Respect reduced motion: native scroll, GSAP entrances resolve instantly
      gsap.globalTimeline.timeScale(1000);
      return () => window.removeEventListener("load", refresh);
    }

    const lenis = new Lenis({
      autoRaf: false, // GSAP ticker drives Lenis — one rAF loop for the whole page
      lerp: 0.1, // frame-rate independent smoothing (buttery on any display)
      smoothWheel: true,
      touchMultiplier: 1.4,
    });
    lenisInstance = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    // GSAP ticker time is in SECONDS — Lenis expects MILLISECONDS
    const raf = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Expose lenis for the preloader to pause/resume
    (window as unknown as { __lenis?: Lenis | null }).__lenis = lenis;

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisInstance = null;
      (window as unknown as { __lenis?: Lenis | null }).__lenis = null;
      window.removeEventListener("load", refresh);
    };
  }, []);

  return <>{children}</>;
}
