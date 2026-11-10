"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { asset } from "@/lib/asset";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Mood Reel — a cinematic gallery built as a tall scroll runway with a
 * sticky stage (CSS-native pinning — immune to React reconciliation).
 * The seven mood boards crossfade inside a museum mat with Ken Burns
 * breathing and drifting Farsi captions beneath the frame.
 * Frames render through next/image: lazy, sized, optimized.
 */
const FRAMES = [
  { src: "/mood/boutique.jpg", word: "بوتیک", sub: "نور، پشتِ شیشه" },
  { src: "/mood/cafe.jpg", word: "کافه", sub: "گچِ گرم و برنج" },
  { src: "/mood/alpine.jpg", word: "آلپاین", sub: "آسمانِ هلو، سکوتِ کاج‌ها" },
  { src: "/mood/tea.jpg", word: "چای", sub: "برگِ سبز و عطرِ بهار" },
  { src: "/mood/silk.jpg", word: "ابریشم", sub: "درخشش در حرکت" },
  { src: "/mood/satin.jpg", word: "ساتن", sub: "نورِ مایع" },
  { src: "/mood/horizon.jpg", word: "افق", sub: "یک خطِ طلایی" },
];

export default function MoodReel() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const layers = gsap.utils.toArray<HTMLElement>(".reel-layer");
      const words = gsap.utils.toArray<HTMLElement>(".reel-word");
      const dots = gsap.utils.toArray<HTMLElement>(".reel-dot");

      // The runway: sticky stage held while the frames crossfade.
      // 52svh per frame — the reel moves at a reading pace, not a crawl.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.55,
          onUpdate: (self) => {
            const idx = Math.min(
              FRAMES.length - 1,
              Math.floor(self.progress * (FRAMES.length - 0.001))
            );
            dots.forEach((d, di) => d.classList.toggle("active", di <= idx));
          },
        },
      });

      gsap.set(layers[0], { opacity: 1, scale: 1.02 });
      gsap.set(words[0], { opacity: 1, y: 0 });
      dots[0]?.classList.add("active");

      for (let i = 1; i < layers.length; i++) {
        const seg = 1;
        tl.fromTo(
          layers[i],
          { opacity: 0, scale: 1.14 },
          { opacity: 1, scale: 1.02, duration: seg, ease: "power1.inOut" },
          i
        );
        tl.to(
          layers[i - 1],
          { opacity: 0, scale: 1.0, duration: seg, ease: "power1.inOut" },
          i
        );
        tl.to(words[i - 1], { opacity: 0, y: -30, duration: seg * 0.5, ease: "power2.in" }, i);
        tl.fromTo(
          words[i],
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: seg * 0.5, ease: "power2.out" },
          i + 0.5
        );
      }
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative"
      style={{ height: `calc(${FRAMES.length * 52}svh + 100svh)` }}
      aria-label="مودبوردها — فضای پیش از هر نشان"
    >
      {/* Sticky stage — the museum wall */}
      <div className="dotgrid sticky top-0 flex h-svh flex-col justify-between overflow-hidden bg-pearl py-20 md:py-24">
        {/* Head row */}
        <div className="relative z-10 mx-auto flex w-full max-w-[1600px] items-center gap-5 px-6 md:px-12">
          <span className="label-fa text-ocean-deep">حال‌وهوا — فضای پیش از نشان</span>
          <span className="h-px flex-1 bg-ink/15" />
        </div>

        {/* The framed reel */}
        <div
          className="relative z-10 mx-auto w-full px-6"
          style={{ width: "min(1080px, 86vw, calc((100svh - 330px) * 1.55))" }}
        >
          {/* Museum mat — borderless, layered soft shadow */}
          <div className="relative bg-shell p-4 shadow-[0_36px_90px_-18px_rgba(22,35,58,0.28),0_4px_14px_rgba(22,35,58,0.1)] md:p-7">
            <div className="relative aspect-[16/10] overflow-hidden">
              {FRAMES.map((f, i) => (
                <div
                  key={f.src + i}
                  className="reel-layer absolute inset-0 scale-[1.02] opacity-0 will-change-transform"
                  aria-hidden={i !== 0}
                >
                  <Image
                    src={asset(f.src)}
                    alt=""
                    fill
                    priority={i === 0}
                    quality={80}
                    sizes="(max-width: 1080px) 86vw, 1080px"
                    className="img-reveal object-cover"
                    onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
                  />
                </div>
              ))}
              {/* Adjustment glaze above the photographs (never on them) */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-10"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(245,246,248,0.14) 0%, transparent 22%, transparent 74%, rgba(22,35,58,0.2) 100%)",
                }}
              />
              {/* mat window bevel */}
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 border border-ink/10" />
            </div>
          </div>

          {/* Caption beneath the frame */}
          <div className="relative mx-auto mt-7 h-[15vw] md:h-[6vw]">
            {FRAMES.map((f, i) => (
              <div key={f.word + i} className="reel-word absolute inset-0 flex items-center justify-center gap-5 opacity-0 md:gap-7">
                <h3 className="display-fa text-[8.5vw] font-extrabold leading-none text-ink md:text-[3.6vw]">
                  {f.word}
                </h3>
                <span aria-hidden="true" className="hidden h-8 w-px bg-ocean/40 md:block" />
                <p className="editorial text-[5.5vw] font-medium text-ocean-deep md:text-[2vw]">
                  {f.sub}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Progress dots */}
        <div className="relative z-10 mx-auto flex w-full max-w-[1600px] items-end justify-between px-6 md:px-12">
          <div className="flex gap-3" aria-hidden="true">
            {FRAMES.map((f, i) => (
              <span
                key={f.word + i}
                className="reel-dot block h-1 w-8 origin-right scale-x-[0.35] bg-ocean/40 transition-all duration-500 [&.active]:scale-x-100 [&.active]:bg-ocean-deep"
              />
            ))}
          </div>
          <p className="label-fa hidden text-ink-faint md:block">
            به اسکرول ادامه دهید — گالری با اسکرول نفس می‌کشد
          </p>
        </div>
      </div>
    </section>
  );
}
