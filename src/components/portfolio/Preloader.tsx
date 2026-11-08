"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

/** Farsi digits for the counter */
const faNum = (n: number) =>
  String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

/**
 * Preloader — paper curtains, the Nastaliq signature «صدف»,
 * a brass counter in Farsi digits, then the reveal.
 *
 * The counter + signature always play for ~2 seconds — the atelier's
 * visual overture — and the hero intro is chained to the moment the
 * curtains begin to part, so the first headline rises *underneath* the
 * opening paper: one continuous movement, no hard cut.
 * (Reduced-motion visitors still skip straight to the atelier.)
 */
export default function Preloader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const lenis = (window as unknown as { __lenis?: { stop(): void; start(): void } }).__lenis;
    lenis?.stop();
    document.body.style.overflow = "hidden";

    /* The hero intro begins as the curtains *start* to part —
       the reveal reads as one continuous breath. */
    const announceHero = () => {
      (window as unknown as { __atelierLoaded?: boolean }).__atelierLoaded = true;
      window.dispatchEvent(new CustomEvent("atelier:loaded"));
    };

    /* Scroll is handed back shortly after the curtains start moving,
       so the visitor is never left frozen on a finished frame. */
    const unlockScroll = () => {
      lenis?.start();
      document.body.style.overflow = "";
    };

    const finish = () => setGone(true);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      announceHero();
      unlockScroll();
      finish();
      return;
    }

    const counter = { v: 0 };
    const bar = rootRef.current?.querySelector<HTMLElement>(".preloader-bar");
    const tl = gsap.timeline();

    /* Absolute positions keep the overture on the beat:
       counter runs to ~1s, content breathes out, curtains part at 1.45s,
       fully open at 2.25s — a two-second stage setting, no more. */
    tl.to(counter, {
      v: 100,
      duration: 1.0,
      ease: "power2.inOut",
      onUpdate: () => {
        if (counterRef.current) {
          counterRef.current.textContent = faNum(Math.round(counter.v)).padStart(3, "۰");
        }
        if (bar) bar.style.transform = `scaleX(${counter.v / 100})`;
      },
    })
      // the counter, signature and bar breathe out together
      .to(".preloader-fade", {
        opacity: 0,
        y: -26,
        duration: 0.3,
        ease: "power3.in",
        stagger: 0.04,
      }, 1.2)
      // the hero's first headline rises beneath the parting paper
      .call(announceHero, [], 1.35)
      .to(".preloader-curtain-top", {
        yPercent: -100,
        duration: 0.8,
        ease: "power4.inOut",
      }, 1.45)
      .to(".preloader-curtain-bottom", {
        yPercent: 100,
        duration: 0.8,
        ease: "power4.inOut",
      }, 1.45)
      // scroll returns to the visitor as the paper is still lifting
      .call(unlockScroll, [], 1.65)
      // the layer itself breathes away, then is released
      .to(rootRef.current, { opacity: 0, duration: 0.2, ease: "power1.out" }, 2.05)
      .call(finish, [], 2.3);

    return () => {
      tl.kill();
      document.body.style.overflow = "";
    };
  }, []);

  if (gone) return null;

  return (
    <div ref={rootRef} className="fixed inset-0 z-[400]" role="status" aria-label="در حال بارگذاری">
      {/* Paper curtains */}
      <div className="preloader-curtain-top absolute inset-x-0 top-0 h-1/2 bg-paper-2" />
      <div className="preloader-curtain-bottom absolute inset-x-0 bottom-0 h-1/2 bg-paper-2" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-7">
        {/* The Nastaliq signature inside rotating girih rings */}
        <div className="preloader-fade relative flex h-40 w-40 items-center justify-center">
          <div className="spin-slow absolute inset-0 rounded-full border border-dashed border-brass/40" />
          <div className="spin-slower absolute inset-3 rounded-full border border-brass/25" />
          <span className="nastaliq select-none px-4 pb-3 text-6xl font-bold leading-none text-ink">
            صدف
          </span>
        </div>

        <div className="preloader-fade flex items-center gap-5">
          <span className="label-fa text-brass-deep">آتلیه صدف</span>
          <span className="h-px w-10 bg-brass/40" />
          <span className="label-fa text-ink-soft">طراحیِ لوگو و هویت</span>
        </div>

        <div className="preloader-fade flex items-baseline gap-2">
          <span ref={counterRef} className="display-fa text-5xl font-semibold tabular-nums text-brass-deep">
            ۰۰۰
          </span>
          <span className="label-fa text-ink-faint">/ ۱۰۰</span>
        </div>

        <div className="preloader-fade h-px w-56 overflow-hidden bg-ink/10">
          <div
            className="preloader-bar h-full w-full origin-right scale-x-0 bg-gradient-to-l from-brass-bright via-brass to-brass-deep"
            style={{ animation: "none" }}
          />
        </div>
      </div>
    </div>
  );
}
