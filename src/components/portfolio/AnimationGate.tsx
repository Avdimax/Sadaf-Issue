"use client";

import { useEffect } from "react";

/**
 * AnimationGate — a single IntersectionObserver for the whole page.
 *
 * The atelier is 20+ viewports tall and used to run ~30 infinite CSS
 * animations (fireflies, spins, floats, bobs, ripples, marquees) even
 * while their section was far off-screen. This gate stamps
 * `data-anim-off` on any top-level section outside the viewport;
 * globals.css turns that into `animation-play-state: paused` for the
 * entire subtree — paused animations cost the browser literally nothing.
 *
 * · one observer, ~9 targets — no per-frame work
 * · rootMargin wakes a section slightly before it scrolls into view,
 *   so nothing is ever caught mid-pause
 * · GSAP scroll-driven tweens are unaffected (they only run on scroll);
 *   the one always-running GSAP marquee (VelocityBand) pauses itself
 *   via its own ScrollTrigger onToggle
 */
export default function AnimationGate() {
  useEffect(() => {
    // Safety net for cached images: an <img> that finishes decoding before
    // hydration never fires React's onLoad, which would leave it stuck at
    // opacity 0 (the img-reveal fade). Sweep once on window load.
    const sweep = () => {
      document.querySelectorAll<HTMLImageElement>("img.img-reveal").forEach((img) => {
        if (img.complete) img.classList.add("is-loaded");
      });
    };
    if (document.readyState === "complete") sweep();
    else window.addEventListener("load", sweep, { once: true });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets = Array.from(
      document.querySelectorAll<HTMLElement>("main > section, main > div, .grain > footer")
    );

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.toggleAttribute("data-anim-off", !entry.isIntersecting);
        }
      },
      { rootMargin: "25% 0px 25% 0px" }
    );

    targets.forEach((t) => io.observe(t));
    return () => {
      io.disconnect();
      window.removeEventListener("load", sweep);
    };
  }, []);

  return null;
}
