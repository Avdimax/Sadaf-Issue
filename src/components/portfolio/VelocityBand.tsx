"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Velocity Band — a giant Farsi typographic ribbon whose speed and
 * direction answer the visitor's scroll velocity. The tween is paused
 * whenever the band is off-screen (ScrollTrigger onToggle).
 */
export default function VelocityBand() {
  const rootRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const track = trackRef.current!;
      const tween = gsap.to(track, {
        xPercent: -50,
        ease: "none",
        duration: 24,
        repeat: -1,
        paused: true, // idle until the band scrolls into view
      });

      ScrollTrigger.create({
        trigger: rootRef.current,
        start: "top bottom",
        end: "bottom top",
        // the band only breathes while it is on stage — zero cost off-screen
        onToggle: (self) => {
          if (self.isActive) tween.play();
          else tween.pause();
        },
        onUpdate: (self) => {
          const v = self.getVelocity();
          const speed = Math.min(Math.abs(v) / 260, 7);
          const dir = v >= 0 ? 1 : -1;
          gsap.to(tween, {
            timeScale: dir * (1 + speed),
            duration: 0.42,
            overwrite: true,
            ease: "power2.out",
          });
        },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const phrase = (
    <>
      <span className="mx-6 md:mx-10">طراحیِ لوگو</span>
      <span className="text-ocean">✦</span>
      <span className="editorial mx-6 text-[0.9em] font-medium text-ink-soft md:mx-10">هویتِ بصری</span>
      <span className="text-ocean">✦</span>
      <span className="mx-6 md:mx-10">مونوگرام</span>
      <span className="text-ocean">✦</span>
      <span className="editorial mx-6 text-[0.9em] font-medium text-ink-soft md:mx-10">وردمارک</span>
      <span className="text-ocean">✦</span>
      <span className="mx-6 md:mx-10">نشانِ تجاری</span>
      <span className="text-ocean">✦</span>
    </>
  );

  return (
    <section
      ref={rootRef}
      className="relative overflow-hidden border-y border-ink/10 bg-pearl-2 py-10 md:py-14"
      aria-label="حوزه‌های تخصصی"
    >
      <div className="flex w-max whitespace-nowrap will-change-transform" ref={trackRef} dir="ltr">
        <div className="display-fa flex items-center text-[11vw] font-extrabold leading-none text-ink/90 md:text-[6vw]">
          {phrase}
          {phrase}
        </div>
      </div>
    </section>
  );
}
