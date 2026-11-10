"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { asset } from "@/lib/asset";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useOrderStore } from "@/lib/order-store";

/**
 * Designer — Module 06 · «صدف»
 * The personal module closes the journey: the portrait in a Persian arch,
 * the facts, the girih — and a quiet door into the order theater.
 */
export default function Designer() {
  const rootRef = useRef<HTMLElement>(null);
  const portraitInnerRef = useRef<HTMLDivElement>(null);
  const girihRef = useRef<HTMLDivElement>(null);
  const openOrder = useOrderStore((s) => s.openOrder);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".designer-line",
        { yPercent: 115, rotate: 3 },
        { yPercent: 0, rotate: 0, duration: 1.4, ease: "power4.out", stagger: 0.12,
          scrollTrigger: { trigger: rootRef.current, start: "top 70%" } }
      );
      gsap.fromTo(
        ".designer-portrait",
        // opacity+scale only — a filter:blur tween would re-raster the
        // portrait every frame during the entrance
        { opacity: 0, scale: 0.92 },
        { opacity: 1, scale: 1, duration: 1.6, ease: "power3.out",
          scrollTrigger: { trigger: rootRef.current, start: "top 64%" } }
      );
      gsap.fromTo(
        ".designer-seal",
        { opacity: 0, scale: 0.4, rotate: -40 },
        { opacity: 1, scale: 1, rotate: 0, duration: 1.2, ease: "back.out(1.8)",
          scrollTrigger: { trigger: rootRef.current, start: "top 55%" } }
      );
      gsap.fromTo(
        ".designer-meta",
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: "power3.out",
          scrollTrigger: { trigger: rootRef.current, start: "top 58%" } }
      );

      // Gentle parallax — the portrait drifts as the section leaves
      ScrollTrigger.create({
        trigger: rootRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        animation: gsap
          .timeline()
          .to(".designer-portrait", { yPercent: -8, scale: 1.02, ease: "none" }, 0)
          .to(".designer-ghost", { yPercent: 22, xPercent: 5, ease: "none" }, 0)
          .to(".designer-girih", { rotate: 18, scale: 1.08, ease: "none" }, 0),
      });
    }, rootRef);

    // Cursor drift — the portrait leans toward the pointer (desktop only)
    let cleanupDrift = () => {};
    if (
      portraitInnerRef.current &&
      girihRef.current &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      const pxTo = gsap.quickTo(portraitInnerRef.current, "x", { duration: 1, ease: "power3.out" });
      const pyTo = gsap.quickTo(portraitInnerRef.current, "y", { duration: 1, ease: "power3.out" });
      const gxTo = gsap.quickTo(girihRef.current, "x", { duration: 1.4, ease: "power3.out" });
      const gyTo = gsap.quickTo(girihRef.current, "y", { duration: 1.4, ease: "power3.out" });
      const onMove = (e: PointerEvent) => {
        if (e.pointerType === "touch") return;
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        pxTo(nx * 16);
        pyTo(ny * 12);
        gxTo(nx * -26);
        gyTo(ny * -18);
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      cleanupDrift = () => window.removeEventListener("pointermove", onMove);
    }

    return () => {
      cleanupDrift();
      ctx.revert();
    };
  }, []);

  const facts = [
    "۲۵ ساله",
    "ساکنِ اصفهان",
    "کارشناسی ارشد — دانشگاه اصفهان",
    "هندسه · گرافیک · لوگو",
  ];

  return (
    <section
      ref={rootRef}
      id="designer"
      className="dotgrid relative overflow-hidden bg-pearl py-28 md:py-36"
      aria-label="طراح — معرفیِ صدف"
    >
      {/* Ambient daylight wash — gradient only, no css blur (see BrandStage) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -start-40 top-1/3 h-[40rem] w-[40rem] rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(circle, rgba(111,156,200,0.14) 0%, rgba(111,156,200,0.04) 45%, rgba(111,156,200,0) 70%)",
        }}
      />

      {/* Ghost signature */}
      <span
        aria-hidden="true"
        className="designer-ghost nastaliq pointer-events-none absolute bottom-[2%] end-[1%] select-none text-[34vw] font-bold leading-none text-ink/[0.045] md:text-[20vw]"
        style={{ lineHeight: 1.4 }}
      >
        صدف
      </span>

      <div className="relative z-10 mx-auto max-w-[1500px] px-6 md:px-12">
        {/* Head */}
        <div className="mb-16 md:mb-20">
          <div className="flex items-center gap-5">
            <span className="label-fa text-ocean-deep">۰۶ — طراح</span>
            <span className="h-px flex-1 bg-ink/15" />
          </div>
          <h2 className="display-fa mt-8 font-black leading-[1.12] tracking-tight">
            <span className="block overflow-hidden pb-[0.3em] -mb-[0.3em]">
              <span className="designer-line block text-[11vw] text-ink md:text-[6.4vw]">
                دستِ پشتِ
              </span>
            </span>
            <span className="block overflow-hidden pb-[0.4em] -mb-[0.2em]">
              <span className="designer-line editorial block text-[11vw] font-medium text-ocean-deep md:text-[6.4vw]">
                نشان‌ها
              </span>
            </span>
          </h2>
        </div>

        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-6">
          {/* ── The portrait in a Persian arch (start side) ── */}
          <div className="relative mx-auto order-1 w-full max-w-[400px] lg:order-1 lg:col-span-5 lg:max-w-[380px]">
            {/* Rotating girih star behind */}
            <div ref={girihRef} className="designer-girih pointer-events-none absolute -inset-14 md:-inset-20" aria-hidden="true">
              <svg viewBox="0 0 200 200" className="h-full w-full opacity-[0.15]" fill="none">
                <g stroke="#7E8B9D" strokeWidth="0.6">
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

            {/* The arch portrait */}
            <div
              data-cursor="view"
              className="designer-portrait relative aspect-[4/5] overflow-hidden rounded-t-full shadow-[0_45px_90px_-25px_rgba(22,35,58,0.4)]"
            >
              <div ref={portraitInnerRef} className="absolute inset-0">
                <Image
                  src={asset("/portrait.jpg")}
                  alt="صدف — طراح لوگو و صنعتگر هویت، ۲۵ ساله، ساکن اصفهان"
                  fill
                  quality={85}
                  sizes="(max-width: 1024px) 80vw, 34vw"
                  className="img-reveal object-cover"
                  onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
                />
              </div>
              {/* Adjustment layer above the photo — warm gallery glaze */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-10"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.13) 0%, rgba(125,140,160,0.07) 46%, rgba(22,35,58,0.16) 100%)",
                }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1/3"
                style={{
                  background:
                    "radial-gradient(80% 90% at 50% 0%, rgba(255,255,255,0.2), transparent 70%)",
                }}
              />
            </div>

            {/* The floating atelier seal */}
            <div className="designer-seal absolute -bottom-9 -end-7 md:-end-10" data-cursor="view">
              <div className="relative flex h-28 w-28 items-center justify-center md:h-32 md:w-32">
                <div className="spin-slow absolute inset-0 rounded-full border border-dashed border-ocean/45 bg-pearl/90" />
                <div className="spin-slower absolute inset-2 rounded-full border border-ink/10" />
                <div className="logo-bob relative">
                  <Image
                    src={asset("/work/hoor-color.png")}
                    alt="نشانِ کافه هور — مُهرِ آتلیه"
                    width={1554}
                    height={795}
                    className="w-16 object-contain md:w-[4.7rem]"
                  />
                </div>
              </div>
            </div>

            {/* Drifting gold dust */}
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

          {/* ── The words ── */}
          <div className="lg:order-2 lg:col-span-7 lg:ps-8">
            <h3 className="display-fa text-6xl font-extrabold leading-none text-ink md:text-7xl">
              صدف
            </h3>
            <p className="designer-meta editorial mt-4 text-3xl font-medium text-ocean-deep md:text-4xl">
              طراحِ لوگو، صنعتگرِ هویتِ بصری
            </p>

            <p className="designer-meta mt-8 max-w-xl text-justify text-[0.98rem] font-light leading-loose text-ink-soft lg:text-right">
              من <span className="font-semibold text-ink">صدف</span> هستم؛ ۲۵ ساله و ساکنِ اصفهان.
              عاشقِ هندسه‌ام و جهان را از زاویه‌ی خط‌ها، دایره‌ها و تناسب‌ها می‌بینم — با مدرک
              کارشناسی ارشد از <span className="font-semibold text-ink">دانشگاه اصفهان</span>، در
              حوزه‌های طراحی گرافیک و طراحی لوگو نشان‌هایی می‌سازم که ماندگار می‌شوند.
            </p>

            {/* Fact chips */}
            <div className="designer-meta mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
              {facts.map((f, i) => (
                <span key={f} className="flex items-center gap-2.5">
                  <svg width="7" height="7" viewBox="0 0 8 8" aria-hidden="true" className="shrink-0">
                    <rect x="1.2" y="1.2" width="5.6" height="5.6" fill="#2E5C8F" transform="rotate(45 4 4)" opacity={i === 0 ? 0.9 : 0.55} />
                  </svg>
                  <span className="label-fa text-[0.74rem] text-ink-soft">{f}</span>
                </span>
              ))}
            </div>

            {/* Quiet door into the order theater */}
            <button
              data-cursor="link"
              onClick={openOrder}
              className="designer-meta group mt-12 flex items-center gap-4 border border-ocean/40 px-8 py-4 transition-colors duration-500 hover:border-ocean hover:bg-ocean"
              aria-label="شروع سفارش طراحی لوگو"
            >
              <span className="label-fa text-[0.8rem] text-ocean-deep transition-colors duration-500 group-hover:text-pearl">
                نشانِ شما را بسازیم؟
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-ocean/50 transition-all duration-500 group-hover:border-pearl/40 group-hover:bg-pearl/10">
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M1 13L13 1M13 1H4M13 1v9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-ocean-deep transition-colors duration-500 group-hover:text-pearl" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
