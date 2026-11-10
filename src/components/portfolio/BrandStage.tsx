"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollToId } from "./SmoothScroll";

/**
 * BrandStage — Module 01 · «نشانِ آتلیه»
 * The first section now houses the atelier's own brand mark — still in
 * the works — so it is staged as a drafting table: the ص monogram inside
 * a rotating girih star, held by dashed construction circles and
 * blueprint guides, wearing a quiet «در دستِ ساخت» badge.
 */
export default function BrandStage() {
  const rootRef = useRef<HTMLElement>(null);
  const emblemRef = useRef<HTMLDivElement>(null);
  const girihRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    /* ── The intro plays once, then the scroll parallax is "armed".
           The two never overlap, and the parallax pins BOTH ends of every
           tween (explicit fromTo) — so returning to the top of the page
           always restores exactly the settled intro state. This is what
           fixes the "scroll away and back → text vanished" bug: `.to()`
           tweens lazily record their start values from the live DOM, and a
           fonts/load refresh landing mid-intro used to poison them with
           half-animated values (lines parked at yPercent 115, meta at
           opacity 0). Explicit froms cannot be poisoned. ── */
    let armed = false;
    let introStarted = false;
    let introTl: gsap.core.Timeline | null = null;
    let parallax: ScrollTrigger | null = null;

    const finalState = () => {
      gsap.set(".brand-line", { yPercent: 0, rotate: 0 });
      gsap.set(".brand-emblem", { opacity: 1, scale: 1 });
      gsap.set(".brand-guide", { opacity: 1, scale: 1 });
      gsap.set(".brand-meta", { opacity: 1, y: 0 });
    };

    const armParallax = () => {
      if (armed) return;
      armed = true;
      // The stage recedes as the visitor descends — fromTo pins the resting
      // state, so scroll position 0 always renders the full settled hero.
      parallax = ScrollTrigger.create({
        trigger: rootRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
        animation: gsap
          .timeline()
          .fromTo(".brand-title-1", { yPercent: 0 }, { yPercent: -40, ease: "none", immediateRender: false }, 0)
          .fromTo(".brand-title-2", { yPercent: 0 }, { yPercent: 30, ease: "none", immediateRender: false }, 0)
          .fromTo(".brand-emblem", { yPercent: 0, scale: 1 }, { yPercent: -14, scale: 1.02, ease: "none", immediateRender: false }, 0)
          .fromTo(".brand-ghost", { yPercent: 0, xPercent: 0 }, { yPercent: 24, xPercent: -6, ease: "none", immediateRender: false }, 0)
          .fromTo(".brand-girih", { rotate: 0, scale: 1 }, { rotate: 22, scale: 1.1, ease: "none", immediateRender: false }, 0)
          .fromTo(".brand-horizon", { yPercent: 0 }, { yPercent: -160, ease: "none", immediateRender: false }, 0)
          .fromTo(".brand-meta", { opacity: 1, y: 0 }, { opacity: 0, y: -60, ease: "none", immediateRender: false }, 0),
      });
    };

    const runIntro = () => {
      introStarted = true;
      introTl = gsap.timeline({ onComplete: armParallax });
      introTl
        .fromTo(
          ".brand-line",
          { yPercent: 115, rotate: 3 },
          { yPercent: 0, rotate: 0, duration: 1.5, ease: "power4.out", stagger: 0.13 }
        )
        .fromTo(
          ".brand-emblem",
          { opacity: 0, scale: 0.88 },
          // no filter:blur tween — animating a blur filter re-rasterizes a large
          // element every frame exactly when the page is busiest. opacity+scale
          // alone read as the same soft landing at a fraction of the cost.
          { opacity: 1, scale: 1, duration: 1.6, ease: "power3.out" },
          0.35
        )
        .fromTo(
          ".brand-guide",
          { opacity: 0, scale: 1.15 },
          { opacity: 1, scale: 1, duration: 1.3, ease: "power2.out", stagger: 0.08 },
          0.55
        )
        .fromTo(
          ".brand-meta",
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 1.1, stagger: 0.12, ease: "power3.out" },
          0.8
        );
    };

    if ((window as unknown as { __atelierLoaded?: boolean }).__atelierLoaded) {
      runIntro();
    } else {
      window.addEventListener("atelier:loaded", runIntro, { once: true });
    }

    // If the visitor starts scrolling mid-intro, the hero is leaving the
    // stage anyway — settle it instantly and hand over to the parallax.
    const onGesture = () => {
      if (!introStarted || armed) return;
      introTl?.kill();
      finalState();
      armParallax();
    };
    window.addEventListener("wheel", onGesture, { passive: true });
    window.addEventListener("touchmove", onGesture, { passive: true });
    window.addEventListener("keydown", onGesture);
    const onScrollArm = () => onGesture();
    window.addEventListener("scroll", onScrollArm, { passive: true });

    // Cursor drift — emblem & girih lean toward the pointer (desktop only)
    let cleanupDrift = () => {};
    if (
      emblemRef.current &&
      girihRef.current &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      const exTo = gsap.quickTo(emblemRef.current, "x", { duration: 1, ease: "power3.out" });
      const eyTo = gsap.quickTo(emblemRef.current, "y", { duration: 1, ease: "power3.out" });
      const gxTo = gsap.quickTo(girihRef.current, "x", { duration: 1.4, ease: "power3.out" });
      const gyTo = gsap.quickTo(girihRef.current, "y", { duration: 1.4, ease: "power3.out" });
      const onMove = (e: PointerEvent) => {
        if (e.pointerType === "touch") return;
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        exTo(nx * 14);
        eyTo(ny * 11);
        gxTo(nx * -24);
        gyTo(ny * -16);
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      cleanupDrift = () => window.removeEventListener("pointermove", onMove);
    }

    return () => {
      window.removeEventListener("atelier:loaded", runIntro);
      window.removeEventListener("wheel", onGesture);
      window.removeEventListener("touchmove", onGesture);
      window.removeEventListener("keydown", onGesture);
      window.removeEventListener("scroll", onScrollArm);
      cleanupDrift();
      introTl?.kill();
      parallax?.kill();
    };
  }, []);

  return (
    <section
      ref={rootRef}
      id="top"
      className="dotgrid relative flex min-h-svh flex-col justify-between overflow-hidden bg-pearl pt-28"
      aria-label="نشانِ آتلیه"
    >
      {/* Ambient daylight washes — soft-edged radial gradients, NO css blur:
          a 64px Gaussian over a 44rem div is one of the most expensive
          rasters you can ask for, and the gradient already fades to
          transparent — the blur added nothing but GPU pain. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -start-40 top-1/4 h-[44rem] w-[44rem] rounded-full opacity-70"
        style={{
          background:
            "radial-gradient(circle, rgba(111,156,200,0.16) 0%, rgba(111,156,200,0.05) 45%, rgba(111,156,200,0) 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -end-52 bottom-0 h-[38rem] w-[38rem] rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(circle, rgba(79,154,148,0.10) 0%, rgba(79,154,148,0.03) 45%, rgba(79,154,148,0) 70%)",
        }}
      />

      {/* Ghost calligraphy behind the stage */}
      <span
        aria-hidden="true"
        className="brand-ghost nastaliq pointer-events-none absolute bottom-[4%] start-[1%] select-none text-[40vw] font-bold leading-none text-ink/[0.045] md:text-[24vw] lg:bottom-[1%] lg:start-[26%]"
        style={{ lineHeight: 1.4 }}
      >
        آتلیه
      </span>

      {/* Top meta row */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1600px] items-center justify-between px-6 md:px-12">
        <p className="brand-meta label-fa">پرتفولیو — ۱۴۰۵</p>
        <p className="brand-meta label-fa hidden sm:block">آتلیه‌ی طراحیِ لوگو و هویت</p>
        <p className="brand-meta label-fa flex items-center gap-2 text-ocean-deep">
          <span className="h-1.5 w-1.5 rounded-full bg-aqua" />
          اصفهان، ایران
        </p>
      </div>

      {/* Centre — the mark under construction */}
      <div className="relative z-10 mx-auto grid w-full max-w-[1600px] flex-1 items-center gap-10 px-6 py-8 md:px-12 lg:grid-cols-12 lg:gap-6">
        {/* ── The wordmark of the atelier ── */}
        <div className="lg:col-span-7">
          <h1 className="display-fa font-black leading-[1.12] tracking-tight">
            <span className="block overflow-hidden pb-[0.3em] -mb-[0.3em]">
              <span className="brand-line brand-title-1 block text-[13vw] text-ink md:text-[8.2vw]">
                آتلیه صدف
              </span>
            </span>
            <span className="block overflow-hidden pb-[0.34em] -mb-[0.26em]">
              <span className="brand-line brand-title-2 editorial block text-[11vw] font-medium text-ocean-deep md:text-[6.4vw]">
                صنعتگرِ نشان‌های ماندگار
              </span>
            </span>
          </h1>

          <p className="brand-meta mt-9 max-w-xl text-justify text-[0.98rem] font-light leading-loose text-ink-soft lg:text-right">
            این‌جا محلِ تقطیرِ نشان است — جایی که هندسه، خوشنویسی و نورِ ایران در خدمتِ
            برندهایی می‌نشینند که <span className="font-semibold text-ink">آرام حرف می‌زنند</span>.
            هر هویت، یک صدف است؛ با رنگ، نور و مرواریدِ خودش.
          </p>

          {/* The placeholder proclamation — borderless, hairline separated */}
          <div className="brand-meta mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
            {["هندسه", "خوشنویسی", "مینیمال", "میراثِ ایرانی"].map((f, i) => (
              <span key={f} className="flex items-center gap-2.5">
                <svg width="7" height="7" viewBox="0 0 8 8" aria-hidden="true" className="shrink-0">
                  <rect x="1.2" y="1.2" width="5.6" height="5.6" fill="#2E5C8F" transform="rotate(45 4 4)" opacity={i === 0 ? 0.9 : 0.55} />
                </svg>
                <span className="label-fa text-[0.74rem] text-ink-soft">{f}</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── The brand mark, staged as a work in progress ── */}
        <div className="relative mx-auto w-full max-w-[400px] lg:col-span-5 lg:max-w-[380px]">
          {/* Rotating girih star behind (drifts with the cursor) */}
          <div ref={girihRef} className="brand-girih pointer-events-none absolute -inset-14 md:-inset-16" aria-hidden="true">
            <svg viewBox="0 0 200 200" className="h-full w-full opacity-[0.2]" fill="none">
              <g stroke="#7E8B9D" strokeWidth="0.65">
                <rect x="42" y="42" width="116" height="116" />
                <rect x="42" y="42" width="116" height="116" transform="rotate(45 100 100)" />
                <circle cx="100" cy="100" r="81" />
                <circle cx="100" cy="100" r="58" strokeDasharray="2 4" />
                <circle cx="100" cy="100" r="34" />
              </g>
            </svg>
          </div>

          {/* Arch echo hairline */}
          <div
            aria-hidden="true"
            className="absolute inset-0 translate-x-3 translate-y-3 rounded-t-full border border-ocean/35"
          />

          {/* The drafting stage */}
          <div
            ref={emblemRef}
            data-cursor="view"
            className="brand-emblem relative aspect-[4/5] overflow-hidden rounded-t-full border border-ocean/25 bg-shell shadow-[0_45px_90px_-30px_rgba(22,35,58,0.38)]"
          >
            {/* Paper wash — an adjustment layer above the plate */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-10"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(125,140,160,0.06) 46%, rgba(22,35,58,0.12) 100%)",
              }}
            />

            {/* Construction guides — blueprint crosshair, quietly alive */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <span className="brand-guide absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-ink/10" />
              <span className="brand-guide absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-ink/10" />
              <span className="brand-guide absolute left-1/2 top-1/2 h-[128%] w-px -translate-x-1/2 -translate-y-1/2 rotate-45 bg-ink/[0.06]" />
              <span className="brand-guide absolute left-1/2 top-1/2 h-[128%] w-px -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-ink/[0.06]" />
              {/* corner ticks */}
              <span className="brand-guide absolute start-5 top-5 h-3 w-3 border-s border-t border-ocean/50" />
              <span className="brand-guide absolute end-5 top-5 h-3 w-3 border-e border-t border-ocean/50" />
              <span className="brand-guide absolute start-5 bottom-5 h-3 w-3 border-s border-b border-ocean/50" />
              <span className="brand-guide absolute end-5 bottom-5 h-3 w-3 border-e border-b border-ocean/50" />
            </div>

            {/* The mark itself — ص inside construction rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative flex aspect-square w-[74%] items-center justify-center">
                <div className="brand-guide spin-slow absolute inset-0 rounded-full border border-dashed border-ocean/60" />
                <div className="brand-guide spin-slower absolute inset-[13%] rounded-full border border-ink/15" />
                <svg viewBox="0 0 200 200" className="brand-guide absolute inset-[8%] h-auto w-[84%] opacity-[0.22]" fill="none" aria-hidden="true">
                  <g stroke="#7E8B9D" strokeWidth="0.75">
                    <rect x="46" y="46" width="108" height="108" />
                    <rect x="46" y="46" width="108" height="108" transform="rotate(45 100 100)" />
                  </g>
                </svg>
                <span className="nastaliq brand-guide relative select-none px-2 pb-2 text-[5.4rem] font-bold leading-none text-ink/85 md:text-[6rem]">
                  ص
                </span>
              </div>
            </div>

            {/* The badge — the honest placeholder */}
            <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center pb-7 pt-14"
              style={{ background: "linear-gradient(180deg, transparent, rgba(245,246,248,0.92) 55%)" }}>
              <span className="label-fa flex items-center gap-2.5 border border-ocean/50 bg-pearl px-4 py-2 text-[0.72rem] text-ink shadow-[0_8px_24px_rgba(22,35,58,0.12)]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ocean-bright opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ocean" />
                </span>
                نشانِ آتلیه — در دستِ ساخت
              </span>
            </div>
          </div>

          {/* Drifting gold dust beside the stage */}
          <div aria-hidden="true" className="pointer-events-none absolute -inset-8">
            {[
              { l: "4%", t: "18%", d: "0s" },
              { l: "88%", t: "34%", d: "1.3s" },
              { l: "12%", t: "66%", d: "2.4s" },
              { l: "94%", t: "72%", d: "0.8s" },
            ].map((s, i) => (
              <span
                key={i}
                className={`absolute h-1 w-1 rounded-full ${i % 3 === 0 ? "bg-ocean-bright" : "bg-silver"}`}
                style={{
                  left: s.l,
                  top: s.t,
                  boxShadow: i % 3 === 0 ? "0 0 8px rgba(111,156,200,0.65)" : "0 0 8px rgba(185,194,205,0.9)",
                  animation: `firefly ${5 + i}s ease-in-out ${s.d} infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Horizon hairline with glint */}
      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-6 md:px-12" aria-hidden="true">
        <div className="brand-horizon hairline w-full" />
      </div>

      {/* Bottom meta row */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1600px] items-end justify-between px-6 pb-10 pt-6 md:px-12">
        <button
          data-cursor="link"
          onClick={() => scrollToId("#archipelago")}
          className="brand-meta group flex items-center gap-4"
          aria-label="رفتن به بخش آثار"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-ocean/40 transition-all duration-500 group-hover:border-ocean group-hover:bg-ocean/10">
            <svg width="14" height="18" viewBox="0 0 14 18" fill="none" aria-hidden="true">
              <path d="M7 1v14m0 0l-5.5-5.5M7 15l5.5-5.5" stroke="#1D4066" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="label-fa text-ink-soft transition-colors group-hover:text-ocean-deep">
            به صدف‌ها سُر بخورید
          </span>
        </button>

        <p className="brand-meta label-fa hidden text-ink-faint lg:block">۰۱ — نشانِ آتلیه</p>
      </div>
    </section>
  );
}
