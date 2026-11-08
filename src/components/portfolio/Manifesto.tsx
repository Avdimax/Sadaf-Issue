"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Manifesto — words surface from the paper as the visitor scrolls.
 */
export default function Manifesto() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const words = gsap.utils.toArray<HTMLElement>(".manifesto-word");
      // opacity + motion only — no blur: animating filters on ~30 words
      // forces a repaint per word per frame while scrubbing
      gsap.fromTo(
        words,
        { opacity: 0.1, y: 12 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.06,
          ease: "none",
          scrollTrigger: {
            trigger: ".manifesto-copy",
            start: "top 78%",
            end: "bottom 45%",
            scrub: 0.6,
          },
        }
      );

      gsap.fromTo(
        ".manifesto-mark",
        { rotate: -10, scale: 0.85, opacity: 0 },
        {
          rotate: 0,
          scale: 1,
          opacity: 1,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: { trigger: ".manifesto-mark", start: "top 85%" },
        }
      );

      gsap.to(".manifesto-panel", {
        yPercent: -6,
        ease: "none",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  // accent words render in Markazi + burgundy
  const accents = ["تقطیر", "می‌شود.", "سکوت.", "خط"];

  const sentence = [
    "لوگو", "ترسیم", "نمی‌شود؛", "تقطیر", "می‌شود.",
    "هر", "منحنی،", "حاملِ", "یک", "قول", "است", "و", "هر", "سفیدی،", "نگه‌دارنده‌ی", "یک", "سکوت.",
    "من", "به", "دنبالِ", "همان", "یک", "خطم", "که", "همه‌چیز", "را", "بگوید.",
  ];

  return (
    <section
      ref={rootRef}
      className="relative overflow-hidden bg-paper-2 py-28 text-ink md:py-40"
      aria-label="مانیفست"
    >
      {/* faint plaster warmth — plain alpha, no mix-blend (blend modes force
          costly cross-layer compositing; at 50% opacity the eye can't tell) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(80% 60% at 15% 10%, rgba(201,161,91,0.12), transparent 60%), radial-gradient(70% 55% at 88% 90%, rgba(46,140,134,0.07), transparent 60%)",
        }}
      />

      <div className="manifesto-panel relative mx-auto max-w-[1600px] px-6 md:px-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 flex items-center gap-5">
            <span className="label-fa text-brass-deep">۰۲ — باور</span>
            <span className="h-px flex-1 bg-ink/15" />
          </div>

          <p className="manifesto-copy display-fa text-[7vw] font-medium leading-[1.38] text-ink md:text-[2.9rem] lg:text-[3.4rem]">
            {sentence.map((w, i) => (
              <span key={i} className="manifesto-word inline-block">
                {accents.includes(w) ? (
                  <em className="editorial not-italic text-[1.12em] font-medium text-burgundy">
                    {w}
                  </em>
                ) : (
                  w
                )}
                {"\u00A0"}
              </span>
            ))}
          </p>

          <div className="mt-16 grid gap-10 border-t border-ink/15 pt-10 md:grid-cols-3">
            {[
              { n: "۱۲+", t: "نشانِ تقطیرشده" },
              { n: "۰۴", t: "هویتِ زنده" },
              { n: "∞", t: "اسکیس برای هر نشان" },
            ].map((s) => (
              <div key={s.t} className="flex items-baseline gap-4">
                <span className="display-fa text-4xl font-extrabold text-brass-deep md:text-5xl">{s.n}</span>
                <span className="label-fa">{s.t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rotating girih ornament */}
        <div className="manifesto-mark pointer-events-none absolute end-6 top-8 hidden lg:block" aria-hidden="true">
          <div className="relative flex h-36 w-36 items-center justify-center">
            <svg viewBox="0 0 200 200" className="spin-slow absolute inset-0 h-full w-full opacity-25" fill="none">
              <g stroke="#7C5A28" strokeWidth="1">
                <rect x="42" y="42" width="116" height="116" />
                <rect x="42" y="42" width="116" height="116" transform="rotate(45 100 100)" />
                <circle cx="100" cy="100" r="82" strokeDasharray="3 6" />
              </g>
            </svg>
            <span className="editorial relative text-4xl font-medium text-burgundy">ص</span>
          </div>
        </div>
      </div>
    </section>
  );
}
