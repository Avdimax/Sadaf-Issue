"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { asset } from "@/lib/asset";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Variations — Module 04 · «کارگاهِ نشان»
 *
 * How the atelier actually makes a mark, staged as one continuous workshop:
 * scrolling walks each island through the process — geometry (a drafting
 * grid draws itself over the pencil-dark mark), then colour (the mark at
 * full presence on its brand-tinted ground), then the variant sheet
 * (رنگی، مشکی، سفید — the white mark on an ink plaque, the classic
 * reversed-logo presentation from brand guideline sheets).
 *
 * · the process is scroll-driven; state changes only on discrete steps
 * · the mark itself is animated: mask-sweep arrival + a quiet auto-cycle
 *   through its variants (a manual pick pauses the cycle for a while)
 * · every transition rides on opacity/transform only — compositor-friendly
 * · only the current island's three marks live in the DOM at a time
 */

type VariantKey = "color" | "black" | "white";

type Variant = {
  src: string;
  key: VariantKey;
  short: string;
  name: string;
  alt: string;
  w: number;
  h: number;
};

type Brand = {
  id: string;
  name: string;
  latin: string;
  tagline: string;
  note: string;
  pool: string;
  palette: { hex: string; label: string }[];
  variants: Variant[];
};

const BRANDS: Brand[] = [
  {
    id: "oxin",
    name: "اکسین",
    latin: "OXIN PERFUME",
    tagline: "عطری که در طلا تقطیر می‌شود",
    note: "بطری و مونوگرام در هم تنیده‌اند: قوطیِ گرد، Oِ خوشنویسی‌شده است؛ پیچازیِ بطری تاجِ آن و جرقه‌ی چهارپر، درخششِ عطر بر فرازش.",
    pool: "rgba(201,161,91,0.2)",
    palette: [
      { hex: "#C9A86A", label: "شامپاین" },
      { hex: "#8A5A1E", label: "عنبر" },
      { hex: "#161616", label: "ویترین" },
    ],
    variants: [
      { src: "/work/oxin-gradient.png", key: "color", short: "رنگی", name: "گرادیانتِ طلا — اصلی", alt: "نشانِ عطر اکسین با گرادیانتِ طلا — نسخه‌ی اصلی", w: 1049, h: 672 },
      { src: "/work/oxin-dark.png", key: "black", short: "مشکی", name: "نسخه‌ی تیره", alt: "نشانِ عطر اکسین در نسخه‌ی تیره", w: 412, h: 246 },
      { src: "/work/oxin-white.png", key: "white", short: "سفید", name: "نسخه‌ی سفید", alt: "نشانِ عطر اکسین در سفیدِ خالص — برای زمینه‌ی تیره", w: 1049, h: 672 },
    ],
  },
  {
    id: "hoor",
    name: "هور",
    latin: "HOOR CAFÉ",
    tagline: "طلوع، بر خطِ افق",
    note: "«هور» یعنی خورشید: دو O در هم گره خورده‌اند و خطِ افق از میانشان می‌گذرد؛ خورشیدِ کهربایی در قلبِ نخستین O می‌درخشد.",
    pool: "rgba(217,143,78,0.18)",
    palette: [
      { hex: "#4A2B22", label: "اسپرسو" },
      { hex: "#D98F4E", label: "سپیده" },
      { hex: "#F2F2F2", label: "خامه" },
    ],
    variants: [
      { src: "/work/hoor-color.png", key: "color", short: "رنگی", name: "رنگی — اصلی", alt: "وردمارکِ کافه هور به رنگ — قهوه‌ایِ اسپرسو با خورشیدِ کهربایی", w: 1554, h: 795 },
      { src: "/work/hoor-bw.png", key: "black", short: "مشکی", name: "سیاه‌وسفید", alt: "وردمارکِ کافه هور در سیاه‌وسفید", w: 1554, h: 795 },
      { src: "/work/hoor-white.png", key: "white", short: "سفید", name: "نسخه‌ی سفید", alt: "وردمارکِ کافه هور در سفیدِ خالص — برای زمینه‌ی تیره", w: 1554, h: 795 },
    ],
  },
  {
    id: "northpeak",
    name: "نورث‌پیک",
    latin: "NORTH PEAK ACADEMY",
    tagline: "قله، در قلبِ N",
    note: "سفیدیِ حروف قله را فتح می‌کند: شکمِ N جای کوه‌ها را نگه می‌دارد و ساقه‌اش به پیکان ختم می‌شود — رشد، ارتفاع، شمال.",
    pool: "rgba(62,95,68,0.18)",
    palette: [
      { hex: "#3E5F44", label: "جنگل" },
      { hex: "#1E3B3A", label: "کاج" },
      { hex: "#F3E4D3", label: "برفاب" },
    ],
    variants: [
      { src: "/work/northpeak-color.png", key: "color", short: "رنگی", name: "رنگی — اصلی", alt: "مونوگرامِ آکادمی نورث‌پیک در سبزِ جنگلی و سنگِ آلپ", w: 906, h: 617 },
      { src: "/work/northpeak-black.png", key: "black", short: "مشکی", name: "مشکیِ توپر", alt: "مونوگرامِ آکادمی نورث‌پیک در مشکیِ توپر", w: 912, h: 609 },
      { src: "/work/northpeak-white.png", key: "white", short: "سفید", name: "نسخه‌ی سفید", alt: "مونوگرامِ آکادمی نورث‌پیک در سفیدِ خالص — برای زمینه‌ی تیره", w: 906, h: 617 },
    ],
  },
  {
    id: "soha",
    name: "سُها",
    latin: "SOHA TEA",
    tagline: "چایِ ایرانی، با خطِ خوش",
    note: "لاله‌ای ایرانی پیچیده در قابِ بیضی، با امضای خوشنویسیِ فارسی — نشانِ چایِ سُها؛ میراثِ ایرانی، دم‌شده در فنجان.",
    pool: "rgba(61,90,54,0.18)",
    palette: [
      { hex: "#3D5A36", label: "برگِ چای" },
      { hex: "#6B7A3F", label: "زیتونی" },
      { hex: "#E8DFD0", label: "کرم" },
    ],
    variants: [
      { src: "/work/soha-color.png", key: "color", short: "رنگی", name: "رنگی — اصلی", alt: "نشانِ چای سُها در سبزِ زیتونی با خوشنویسیِ فارسی", w: 1202, h: 1427 },
      { src: "/work/soha-black.png", key: "black", short: "مشکی", name: "مشکیِ توپر", alt: "نشانِ چای سُها در مشکیِ توپر", w: 720, h: 844 },
      { src: "/work/soha-white.png", key: "white", short: "سفید", name: "نسخه‌ی سفید", alt: "نشانِ چای سُها در سفیدِ خالص — برای زمینه‌ی تیره", w: 1202, h: 1427 },
    ],
  },
];

/* ── The atelier's process — the rail above the stage ── */
const STEPS = [
  { key: "talk", title: "گفت‌وگو", sub: "بریف و مودبورد — زمینِ برند" },
  { key: "geometry", title: "هندسه", sub: "خطوطِ پنهان، ساختِ نشان" },
  { key: "color", title: "رنگ", sub: "روحِ نشان در رنگ می‌نشیند" },
  { key: "variants", title: "نسخه‌ها", sub: "رنگی، مشکی، سفید — برای هر سطحی" },
] as const;

type Phase = (typeof STEPS)[number]["key"] & ("geometry" | "color" | "variants");

const faNum = (n: number) =>
  String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

const CYCLE_MS = 2700;
const MANUAL_HOLD_MS = 8000;

export default function Variations() {
  const rootRef = useRef<HTMLElement>(null);
  const [brandIdx, setBrandIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("geometry");
  const [variantIdx, setVariantIdx] = useState(0);
  const holdUntilRef = useRef(0);

  const brand = BRANDS[brandIdx];
  const variant = brand.variants[variantIdx];

  /* ── Scroll walks each island through the process ── */
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: rootRef.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const p = self.progress * BRANDS.length;
          const bi = Math.min(BRANDS.length - 1, Math.floor(p));
          const sub = Math.min(1, p - bi);
          setBrandIdx((prev) => (prev === bi ? prev : bi));
          const ph: Phase = sub < 0.38 ? "geometry" : sub < 0.72 ? "color" : "variants";
          setPhase((prev) => (prev === ph ? prev : ph));
        },
      });

      gsap.fromTo(
        ".varx-head-line",
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: 1.2,
          ease: "power4.out",
          stagger: 0.1,
          scrollTrigger: { trigger: rootRef.current, start: "top 72%" },
        }
      );
      gsap.fromTo(
        ".varx-rail-in",
        { opacity: 0, y: 22 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.07,
          scrollTrigger: { trigger: rootRef.current, start: "top 60%" },
        }
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  /* New island → the curtain rises on its geometry */
  useEffect(() => {
    setVariantIdx(0);
    holdUntilRef.current = 0;
  }, [brandIdx]);

  /* ── The mark lives through its variations ──
     A quiet auto-cycle, once colour has arrived. A manual pick from the
     variant rail holds the chosen version for a few seconds. */
  useEffect(() => {
    if (phase === "geometry") return;
    if (phase === "color") setVariantIdx(0);
    const iv = setInterval(() => {
      if (Date.now() < holdUntilRef.current) return;
      setVariantIdx((v) => (v + 1) % brand.variants.length);
    }, CYCLE_MS);
    return () => clearInterval(iv);
  }, [phase, brandIdx]);

  const pick = (vi: number) => {
    setVariantIdx(vi);
    holdUntilRef.current = Date.now() + MANUAL_HOLD_MS;
  };

  const activeStepIdx = STEPS.findIndex((s) => s.key === phase);
  const showVariants = phase !== "geometry";
  const isWhite = showVariants && variant.key === "white";

  const phaseLabel =
    phase === "geometry"
      ? "گامِ هندسه — خطوطِ پنهان"
      : phase === "color"
        ? `گامِ رنگ — ${variant.name}`
        : `گامِ نسخه‌ها — ${variant.name}${isWhite ? " · روی زمینه‌ی تیره" : ""}`;

  return (
    <section
      ref={rootRef}
      id="variations"
      className="relative bg-pearl-2"
      aria-label="کارگاهِ نشان — فرآیندِ ساخت و تنوع‌ها"
      style={{ height: `calc(100svh + ${BRANDS.length * 70}svh)` }}
    >
      {/* Sticky stage — the workshop bench */}
      <div className="sticky top-0 flex h-svh flex-col justify-center overflow-hidden pt-16 md:pt-20">
        {/* Warm daylight atmosphere */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(90% 60% at 14% 0%, rgba(111,156,200,0.10), transparent 55%), radial-gradient(70% 55% at 90% 100%, rgba(79,154,148,0.06), transparent 60%)",
          }}
        />

        {/* Section head + the process rail */}
        <div className="relative z-10 mx-auto w-full max-w-[1600px] px-6 md:px-12">
          <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="label-fa text-ocean-deep">۰۴ — مجموعه · کارگاهِ نشان</span>
            <span className="h-px w-10 bg-ink/20" />
            <span className="label-fa text-[0.62rem] text-ink-faint">
              اسکرول کنید — فرآیندِ ساختِ هر نشان، گام‌به‌گام
            </span>
          </div>
          <h2 className="display-fa font-black leading-[1.12] tracking-tight">
            <span className="block overflow-hidden pb-[0.3em] -mb-[0.3em]">
              <span className="varx-head-line block text-[8vw] text-ink md:text-[4.4vw]">
                از هندسه،
              </span>
            </span>
            <span className="block overflow-hidden pb-[0.4em] -mb-[0.2em]">
              <span className="varx-head-line editorial block text-[8.6vw] font-medium text-ocean-deep md:text-[4.7vw]">
                تا هر آب‌وهوایی
              </span>
            </span>
          </h2>

          {/* The process rail — the atelier's four steps */}
          <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-2.5 md:gap-x-3">
            {STEPS.map((s, i) => {
              const active = s.key === phase;
              const done = i === 0 || i < activeStepIdx;
              return (
                <span key={s.key} data-step={s.key} className="varx-rail-in flex items-center gap-2.5 md:gap-3">
                  <span
                    className={`flex items-center gap-2.5 border px-3.5 py-2 transition-all duration-500 ${
                      active
                        ? "border-ocean/60 bg-shell shadow-[0_10px_26px_rgba(22,35,58,0.12)]"
                        : done
                          ? "border-ink/10 bg-transparent"
                          : "border-ink/10 bg-transparent opacity-70"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rotate-45 transition-colors duration-500 ${
                        active || done ? "bg-ocean-deep" : "bg-ink/20"
                      }`}
                    />
                    <span className={`label-fa text-[0.68rem] ${active ? "text-ink" : "text-ink-soft"}`}>
                      {faNum(i + 1)}. {s.title}
                    </span>
                  </span>
                  {active && (
                    <span className="label-fa hidden text-[0.64rem] text-ocean-deep md:inline">{s.sub}</span>
                  )}
                  {i < STEPS.length - 1 && (
                    <span className="hidden h-px w-5 bg-ink/15 md:block" aria-hidden="true" />
                  )}
                </span>
              );
            })}
          </div>
        </div>

        {/* The bench + the island programme */}
        <div className="relative z-10 mx-auto mt-4 grid w-full max-w-[1600px] flex-1 items-center gap-6 px-6 md:mt-5 md:px-12 lg:grid-cols-12 lg:gap-4">
          {/* ── The workshop bench ── */}
          <div
            className="varx-stage relative order-1 flex h-[46vw] items-center justify-center md:h-[34vw] lg:order-1 lg:col-span-7 lg:h-[29vw]"
            data-cursor="view"
          >
            {/* Brand-tinted ground pool — present for the colour mark */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-[4%] inset-y-[10%] rounded-[50%] transition-opacity duration-700"
              style={{
                background: `radial-gradient(closest-side, ${brand.pool} 0%, transparent 76%)`,
                opacity: showVariants && variantIdx === 0 ? 1 : 0,
              }}
            />

            {/* The ink plaque — the reversed (white) mark's dark ground */}
            <div
              aria-hidden="true"
              data-varx-plaque
              className="pointer-events-none absolute inset-x-[7%] inset-y-[6%] rounded-[2.2rem] transition-all duration-700 md:rounded-[2.6rem]"
              style={{
                background:
                  "radial-gradient(120% 90% at 50% 38%, #1d2c48 0%, #152238 62%)",
                boxShadow:
                  "0 34px 90px -26px rgba(15,26,44,0.55), inset 0 0 0 1px rgba(185,194,205,0.22)",
                opacity: isWhite ? 1 : 0,
                transform: isWhite ? "scale(1)" : "scale(0.955)",
              }}
            />

            {/* The mark + its drafting grid — keyed by island so each
                arrival replays the mask-sweep entrance and the grid draw */}
            <div key={brand.id} className="varx-mark-in relative flex h-full w-full items-center justify-center">
              {/* Construction grid — the geometry step */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-[5%] transition-opacity duration-700"
                style={{ opacity: phase === "geometry" ? 1 : 0 }}
              >
                <svg viewBox="0 0 200 200" className="h-full w-full" fill="none">
                  <g stroke="#1D4066" strokeWidth="0.7" opacity="0.6">
                    <line x1="100" y1="4" x2="100" y2="196" pathLength="100" className="varx-draw" style={{ animationDelay: "0.05s" }} />
                    <line x1="4" y1="100" x2="196" y2="100" pathLength="100" className="varx-draw" style={{ animationDelay: "0.18s" }} />
                    <circle cx="100" cy="100" r="90" pathLength="100" className="varx-draw" style={{ animationDelay: "0.3s" }} />
                    <rect x="42" y="42" width="116" height="116" pathLength="100" className="varx-draw" style={{ animationDelay: "0.5s" }} />
                    <rect x="42" y="42" width="116" height="116" transform="rotate(45 100 100)" pathLength="100" className="varx-draw" style={{ animationDelay: "0.68s" }} />
                    <circle cx="100" cy="100" r="58" strokeDasharray="2.5 4.5" className="varx-fade-in" />
                    <circle cx="100" cy="100" r="30" strokeDasharray="2.5 4.5" className="varx-fade-in" />
                  </g>
                  <g stroke="#1D4066" strokeWidth="1" opacity="0.55">
                    <path d="M4 4h10M4 4v10" className="varx-fade-in" />
                    <path d="M196 4h-10M196 4v10" className="varx-fade-in" />
                    <path d="M4 196h10M4 196v-10" className="varx-fade-in" />
                    <path d="M196 196h-10M196 196v-10" className="varx-fade-in" />
                  </g>
                </svg>
              </div>

              {/* The three variations — one persistent stack */}
              <div className="logo-bob relative flex h-full w-full items-center justify-center">
                {brand.variants.map((v, vi) => {
                  const active = phase === "geometry" ? vi === 1 : vi === variantIdx;
                  const draft = phase === "geometry" && vi === 1;
                  const portrait = v.h > v.w;
                  return (
                    <div
                      key={v.src}
                      aria-hidden={!active}
                      className="varx-layer absolute inset-0 flex items-center justify-center px-8 py-4 md:px-12"
                      style={{
                        opacity: draft ? 0.42 : active ? 1 : 0,
                        transform: active ? "scale(1) translateY(0)" : "scale(0.94) translateY(12px)",
                      }}
                    >
                      <Image
                        src={asset(v.src)}
                        alt={v.alt}
                        width={v.w}
                        height={v.h}
                        sizes="(max-width: 1024px) 72vw, 38vw"
                        className={`img-reveal object-contain ${
                          portrait
                            ? "h-[88%] w-auto"
                            : "w-[min(74%,560px)] lg:w-[min(76%,580px)]"
                        }`}
                        onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stage caption — the current step of the process */}
            <div data-varx-caption className="absolute bottom-0 start-0 z-10 md:bottom-1 md:start-1">
              <span className="label-fa flex items-center gap-2 border border-ink/10 bg-pearl/90 px-3 py-1.5 text-[0.64rem] text-ink-soft">
                <span className="h-1 w-1 rotate-45 bg-ocean" />
                {phaseLabel}
              </span>
            </div>
          </div>

          {/* ── The programme: the island, its palette, its variant sheet ── */}
          <div className="order-2 lg:order-2 lg:col-span-5 lg:ps-10">
            <div key={brand.id} className="varx-meta-in">
              <div className="flex items-center gap-4">
                <span className="h-px w-10 bg-ocean/60" />
                <span className="label-fa text-ocean-deep">صدف {faNum(brandIdx + 1).padStart(2, "۰")}</span>
              </div>

              <h3 className="display-fa mt-4 text-4xl font-extrabold leading-[1.15] text-ink md:text-5xl">
                {brand.name}
              </h3>
              <p className="label mt-2 text-[0.6rem] tracking-[0.3em] text-ink-faint">
                {brand.latin}
              </p>
              <p className="editorial mt-3 text-2xl font-medium text-ocean-deep lg:text-3xl">
                {brand.tagline}
              </p>
              <p className="mt-5 max-w-md text-[0.9rem] font-light leading-loose text-ink-soft">
                {brand.note}
              </p>

              {/* Palette — the colours the mark was distilled from */}
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                {brand.palette.map((c) => (
                  <span key={c.hex} className="group/chip flex items-center gap-2.5">
                    <span
                      className="h-5 w-5 rounded-full border border-ink/15 transition-transform duration-300 group-hover/chip:scale-125"
                      style={{ backgroundColor: c.hex, boxShadow: `0 2px 10px ${c.hex}66` }}
                    />
                    <span className="label-fa text-[0.62rem]">{c.label}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* The variant sheet — three tiles, always in view */}
            <div className="mt-7 border-t border-ink/10 pt-5">
              <div className="mb-3 flex items-center justify-between gap-4">
                <span className="label-fa text-[0.7rem] text-ink-soft">برگه‌ی نسخه‌ها</span>
                <span className="label-fa text-[0.62rem] text-ink-faint">
                  {showVariants ? "روی هر نسخه کلیک کنید" : "پس از گامِ رنگ"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2.5 md:gap-3">
                {brand.variants.map((v, vi) => {
                  const active = showVariants && vi === variantIdx;
                  return (
                    <button
                      key={v.src}
                      type="button"
                      data-cursor="link"
                      data-variant={v.key}
                      onClick={() => pick(vi)}
                      aria-pressed={active}
                      aria-label={`${v.name} — ${v.short}`}
                      className={`group relative flex flex-col items-center gap-2 border p-2.5 transition-all duration-500 md:p-3 ${
                        active
                          ? "border-ocean bg-shell shadow-[0_12px_30px_rgba(22,35,58,0.16)]"
                          : "border-ink/15 bg-transparent hover:border-ocean/50 hover:bg-shell/60"
                      }`}
                    >
                      <span
                        className={`relative flex h-14 w-full items-center justify-center overflow-hidden md:h-16 ${
                          v.key === "white" ? "bg-ink" : "bg-shell"
                        }`}
                      >
                        <Image
                          src={asset(v.src)}
                          alt=""
                          width={v.w}
                          height={v.h}
                          sizes="120px"
                          className={`h-9 w-auto object-contain md:h-11 ${
                            v.key === "black" ? "opacity-90" : ""
                          }`}
                        />
                      </span>
                      <span
                        className={`label-fa text-[0.64rem] transition-colors duration-300 ${
                          active ? "text-ocean-deep" : "text-ink-soft group-hover:text-ink"
                        }`}
                      >
                        {v.short}
                      </span>
                      {active && (
                        <span className="absolute -bottom-1 start-1/2 h-1 w-1 -translate-x-1/2 rotate-45 bg-ocean" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="relative z-10 mx-auto flex w-full max-w-[1600px] items-end justify-between px-6 pt-3 md:px-12">
          <p className="label-fa hidden text-ink-faint md:block">
            {brandIdx < BRANDS.length - 1
              ? `ادامه‌ی اسکرول — کارگاهِ ${BRANDS[brandIdx + 1].name}`
              : "پایانِ کارگاه — سفر ادامه دارد"}
          </p>
          <span className="label-fa text-[0.62rem] text-ink-faint">
            {faNum(BRANDS.length * 70 + 100)} واحدِ اسکرول — {faNum(BRANDS.length)} کارگاه
          </span>
        </div>
      </div>
    </section>
  );
}
