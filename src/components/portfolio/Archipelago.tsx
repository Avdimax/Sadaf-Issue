"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { asset } from "@/lib/asset";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SHELLS, type ShellKind } from "./shells";

/* ────────────────────────────────────────────────
   صدف‌های نشان‌ها — four floating shells of work.
   Each brand lives inside its own صدف: a mood-board
   terrain clipped by a unique shell silhouette, hover-
   breathing in pearl daylight. On hover the shell
   rises, a deep-ocean adjustment veil settles over
   the terrain, the silver rim and nacre lines brighten,
   and the brand's mark — the مروارید — surfaces with
   spring-like CSS physics. Zero JS at hover time.
   ──────────────────────────────────────────────── */

type Island = {
  id: string;
  shell: ShellKind;
  index: string;
  name: string;
  latin: string;
  full: string;
  tagline: string;
  category: string;
  year: string;
  mood: string;
  moodAlt: string;
  logo: string;
  logoAlt: string;
  logoW: number;
  logoH: number;
  portrait?: boolean;
  tilt: string;
  stage: "dark" | "paper";
  /** Optional custom mat beneath the mark (full radial-gradient string) */
  stageMat?: string;
  /** Optional mat footprint — defaults to h 52% / w 62% of the shell */
  stageSize?: { w: string; h: string };
  veil: { core: string; edge: string };
  palette: { hex: string; label: string }[];
  note: string;
  side: "start" | "end";
};

const ISLANDS: Island[] = [
  {
    id: "oxin",
    shell: "scallop",
    index: "۰۱",
    name: "اکسین",
    latin: "OXIN PERFUME",
    full: "عطرِ اکسین",
    tagline: "عطری که در طلا تقطیر می‌شود",
    category: "عطر و لوکس",
    year: "۱۴۰۵",
    mood: "/mood/boutique.jpg",
    moodAlt: "بطری‌های کریستالیِ عطر در ویترینِ نقره‌ایِ نورگیری‌شده",
    logo: "/work/oxin-gradient.png",
    logoAlt: "نشانِ عطر اکسین — بطری‌شکلی از Oِ خوشنویسی با جرقه‌ای چهارپر",
    logoW: 1049,
    logoH: 672,
    tilt: "-2.5deg",
    stage: "dark",
    veil: { core: "rgba(21,34,54,0.34)", edge: "rgba(13,24,40,0.5)" },
    palette: [
      { hex: "#C9A86A", label: "شامپاین" },
      { hex: "#8A5A1E", label: "عنبر" },
      { hex: "#E4C88A", label: "طلاکوب" },
      { hex: "#161616", label: "ویترین" },
    ],
    note: "بطری و مونوگرام در هم تنیده‌اند: قوطیِ گرد، Oِ خوشنویسی‌شده است؛ پیچازیِ بطری تاجِ آن و جرقه‌ی چهارپر، درخششِ عطر بر فرازش.",
    side: "start",
  },
  {
    id: "hoor",
    shell: "oyster",
    index: "۰۲",
    name: "هور",
    latin: "HOOR CAFÉ",
    full: "کافه هور",
    tagline: "طلوع، بر خطِ افق",
    category: "کافه و رُستری",
    year: "۱۴۰۵",
    mood: "/mood/cafe.jpg",
    moodAlt: "فضای کافه با پنجره‌ی قوسی، ماشینِ اسپرسوی نقره‌ای و چوبِ گردو",
    logo: "/work/hoor-island.png",
    logoAlt: "وردمارکِ کافه هور — دو Oِ درهم‌تنیده که خطِ افق از میانشان می‌گذرد",
    logoW: 1634,
    logoH: 875,
    tilt: "2deg",
    stage: "paper",
    veil: { core: "rgba(21,34,54,0.3)", edge: "rgba(13,24,40,0.46)" },
    palette: [
      { hex: "#4A2B22", label: "اسپرسو" },
      { hex: "#D98F4E", label: "سپیده" },
      { hex: "#6B4030", label: "رُست" },
      { hex: "#F2F2F2", label: "خامه" },
    ],
    note: "«هور» یعنی خورشید: دو O در هم گره خورده‌اند و خطِ افق از میانشان می‌گذرد؛ خورشیدِ کهربایی در قلبِ نخستین O می‌درخشد.",
    side: "end",
  },
  {
    id: "northpeak",
    shell: "nautilus",
    index: "۰۳",
    name: "نورث‌پیک",
    latin: "NORTH PEAK ACADEMY",
    full: "آکادمی نورث‌پیک",
    tagline: "قله، در قلبِ N",
    category: "آموزش و مربی‌گری",
    year: "۱۴۰۵",
    mood: "/mood/alpine.jpg",
    moodAlt: "دره‌ی آلپی مه‌آلود — قله‌های برفی، جنگلِ کاج و آبِ آرام",
    logo: "/work/northpeak-island.png",
    logoAlt: "مونوگرامِ آکادمی نورث‌پیک — حرف N با رشته‌کوه در شکمش و پیکانی رو به بالا",
    logoW: 986,
    logoH: 697,
    tilt: "-1.5deg",
    stage: "paper",
    // A wider, near-opaque SNOW patch: the mark's strokes are deep forest
    // green, so they need a bright, solid floor — and cover wide enough that
    // no stroke drifts off the mat onto the dark pines or the misty peaks.
    // Snow for an alpine academy is the mark's own weather.
    stageMat:
      "radial-gradient(closest-side, rgba(252,253,254,0.96) 0%, rgba(250,251,253,0.85) 50%, rgba(250,251,253,0) 78%)",
    stageSize: { w: "78%", h: "64%" },
    veil: { core: "rgba(16,28,46,0.36)", edge: "rgba(10,20,36,0.54)" },
    palette: [
      { hex: "#3E5F44", label: "جنگل" },
      { hex: "#8A8F8A", label: "سنگ" },
      { hex: "#1E3B3A", label: "کاج" },
      { hex: "#F3E4D3", label: "برفاب" },
    ],
    note: "سفیدیِ حروف قله را فتح می‌کند: شکمِ N جای کوه‌ها را نگه می‌دارد و ساقه‌اش به پیکان ختم می‌شود — رشد، ارتفاع، شمال.",
    side: "start",
  },
  {
    id: "soha",
    shell: "conch",
    index: "۰۴",
    name: "سُها",
    latin: "SOHA TEA",
    full: "چایِ سُها",
    tagline: "چایِ ایرانی، با خطِ خوش",
    category: "چای و دمنش",
    year: "۱۴۰۵",
    mood: "/mood/tea.jpg",
    moodAlt: "برگ‌های چایِ سبز، نعناعِ خشک و قوریِ شیشه‌ای روی رومیزیِ کتانی",
    logo: "/work/soha-island.png",
    logoAlt: "نشانِ چای سُها — لاله‌ای ایرانی در قابِ صدفی با خوشنویسیِ فارسی",
    logoW: 1282,
    logoH: 1507,
    portrait: true,
    tilt: "2.5deg",
    stage: "paper",
    veil: { core: "rgba(16,28,46,0.26)", edge: "rgba(10,20,36,0.42)" },
    palette: [
      { hex: "#3D5A36", label: "برگِ چای" },
      { hex: "#6B7A3F", label: "زیتونی" },
      { hex: "#A3B18A", label: "خزه" },
      { hex: "#E8DFD0", label: "کرم" },
    ],
    note: "لاله‌ای ایرانی پیچیده در قابِ صدف، با امضای خوشنویسیِ فارسی — نشانِ چایِ سُها؛ میراثِ ایرانی، دم‌شده در فنجان.",
    side: "end",
  },
];

/* ── A single shell ── */
function IslandBlock({ island }: { island: Island }) {
  const blockRef = useRef<HTMLDivElement>(null);
  const isStart = island.side === "start";
  const shell = SHELLS[island.shell];

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      // Entrance — shell rises, text drifts in
      gsap.fromTo(
        ".island-terrain",
        { yPercent: 14 },
        {
          yPercent: -10,
          ease: "none",
          scrollTrigger: {
            trigger: blockRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
      gsap.fromTo(
        ".island-landmass",
        { y: 130, opacity: 0, rotate: isStart ? -5 : 5, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          rotate: 0,
          scale: 1,
          duration: 1.5,
          ease: "power3.out",
          scrollTrigger: { trigger: blockRef.current, start: "top 82%" },
        }
      );
      gsap.fromTo(
        ".island-caption",
        { y: 70, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.1,
          ease: "power3.out",
          stagger: 0.1,
          scrollTrigger: { trigger: blockRef.current, start: "top 74%" },
        }
      );
      gsap.fromTo(
        ".island-number",
        { opacity: 0, y: 120 },
        {
          opacity: 1,
          y: 0,
          duration: 1.4,
          ease: "power2.out",
          scrollTrigger: { trigger: blockRef.current, start: "top 85%" },
        }
      );
    }, blockRef);
    return () => ctx.revert();
  }, [isStart]);

  return (
    <div
      ref={blockRef}
      className="relative mx-auto grid w-full max-w-[1500px] items-center gap-10 px-6 md:px-12 lg:grid-cols-12 lg:gap-6"
    >
      {/* Ghost index number — floats over the caption side */}
      <span
        aria-hidden="true"
        className={`island-number display-fa pointer-events-none absolute -top-10 z-0 select-none text-[26vw] font-black leading-none text-transparent lg:-top-16 lg:text-[13rem] ${
          isStart ? "-end-1 lg:end-[4%]" : "-start-1 lg:start-[3%]"
        }`}
        style={{ WebkitTextStroke: "1px rgba(22,35,58,0.15)" }}
      >
        {island.index}
      </span>

      {/* ── The shell (hover choreography lives in CSS — see globals.css) ── */}
      <div
        className={`island-landmass relative z-10 lg:col-span-7 ${isStart ? "lg:order-1" : "lg:order-2"}`}
        data-cursor="view"
      >
        <div className="island-lift relative" style={{ "--tilt": island.tilt } as React.CSSProperties}>
          {/* Orbit ring + satellite */}
          <div aria-hidden="true" className="pointer-events-none absolute -inset-6 md:-inset-9">
            <div className="spin-slow absolute inset-0 rounded-full border border-dashed border-silver/40" />
            <div className="spin-slow absolute inset-0">
              <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-ocean-bright/90" />
            </div>
          </div>

          {/* The shell body — its aspect and silhouette come from the shell spec */}
          <div className="relative w-full" style={{ aspectRatio: shell.aspect }}>
            {/* everything inside is clipped to the shell silhouette */}
            <div
              className="island-float absolute inset-0"
              style={{
                clipPath: `url(#shell-clip-${island.id})`,
                WebkitClipPath: `url(#shell-clip-${island.id})`,
              }}
            >
              {/* mood board terrain w/ inner parallax — the raster itself stays untouched */}
              <div className="island-terrain-scale absolute -inset-y-[12%] inset-x-0">
                <div className="island-terrain relative h-full w-full">
                  <Image
                    src={asset(island.mood)}
                    alt={island.moodAlt}
                    fill
                    sizes="(max-width: 1024px) 92vw, 56vw"
                    className="img-reveal object-cover"
                    onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
                  />
                </div>
              </div>

              {/* Adjustment veil ABOVE the terrain — deep ocean tint, settles in
                  on hover so the mark can surface (never on the raster itself) */}
              <div
                aria-hidden="true"
                className="island-veil pointer-events-none absolute inset-0"
                style={{
                  background: `radial-gradient(90% 72% at 50% 32%, ${island.veil.core}, ${island.veil.edge} 85%)`,
                }}
              />

              {/* Soft inner shading hugging the silhouette (a shadow, not a glow) */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(74% 68% at 50% 44%, transparent 58%, rgba(15,26,44,0.26) 100%)",
                }}
              />

              {/* ── The mark surfacing — the مروارید inside the صدف ── */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* A small, contained mat beneath the mark — an adjustment layer,
                    soft-edged and much smaller than the shell (never a glare) */}
                <div aria-hidden="true" className="island-stage pointer-events-none absolute inset-0">
                  <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[50%]"
                    style={{
                      width: island.stageSize?.w ?? "62%",
                      height: island.stageSize?.h ?? "52%",
                      background: island.stageMat
                        ? island.stageMat
                        : island.stage === "dark"
                          ? "radial-gradient(closest-side, rgba(10,18,32,0.5) 0%, rgba(10,18,32,0.24) 55%, rgba(10,18,32,0) 74%)"
                          : "radial-gradient(closest-side, rgba(251,252,254,0.6) 0%, rgba(251,252,254,0.28) 55%, rgba(251,252,254,0) 74%)",
                    }}
                  />
                </div>
                <div className="island-mark relative px-8 py-6">
                  <div className="logo-bob relative">
                    <Image
                      src={asset(island.logo)}
                      alt={island.logoAlt}
                      width={island.logoW}
                      height={island.logoH}
                      className={
                        island.portrait
                          ? "h-[min(42vw,300px)] w-auto lg:h-[min(19vw,300px)] object-contain"
                          : "w-[min(54vw,430px)] lg:w-[min(26vw,430px)] object-contain"
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* The shell's own drawing: rim + nacre lines + both clip defs.
                Sits exactly over the clipped box (same aspect → no distortion). */}
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox={shell.viewBox}
              preserveAspectRatio="none"
            >
              <defs>
                <clipPath id={`shell-clip-${island.id}`} clipPathUnits="objectBoundingBox">
                  <path
                    d={shell.outline}
                    transform={`scale(${1 / shell.w} ${1 / shell.h})`}
                  />
                </clipPath>
                <clipPath id={`shell-lines-${island.id}`} clipPathUnits="userSpaceOnUse">
                  <path d={shell.outline} />
                </clipPath>
              </defs>
              <g clipPath={`url(#shell-lines-${island.id})`}>
                <path
                  d={shell.lines}
                  className="shell-lines"
                  fill="none"
                  stroke="#e7edf4"
                  strokeWidth="1.15"
                  strokeLinecap="round"
                />
              </g>
              <path
                d={shell.outline}
                className="island-rim"
                fill="none"
                stroke="#7e8b9d"
                strokeWidth="1.7"
              />
            </svg>

            {/* Specimen chips — pinned to the shell's frame, never clipped */}
            <span className="island-chip label-fa absolute start-4 top-4 z-10 border border-ocean/30 bg-pearl/85 px-3.5 py-1.5 text-[0.68rem] text-ink shadow-[0_4px_18px_rgba(22,35,58,0.14)]">
              {island.category}
            </span>
            <span className="island-chip island-chip-2 label-fa absolute end-4 top-4 z-10 text-[0.68rem] text-ink/80">
              {island.year}
            </span>
          </div>

          {/* Wake ripples — the shell hovers over still water */}
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2">
            <div className="relative h-14 w-[86%]">
              <span className="absolute left-1/2 top-1/2 h-1 w-full -translate-x-1/2 animate-[ripple_3.2s_ease-out_infinite] rounded-[50%] border border-silver-deep/50" />
              <span className="absolute left-1/2 top-1/2 h-1 w-full -translate-x-1/2 animate-[ripple_3.2s_ease-out_1.1s_infinite] rounded-[50%] border border-silver-deep/30" />
              <span className="absolute left-1/2 top-1/2 h-1 w-full -translate-x-1/2 animate-[ripple_3.2s_ease-out_2.2s_infinite] rounded-[50%] border border-silver-deep/20" />
            </div>
          </div>

          {/* Ambient shadow beneath the shell (a shadow, not a glow) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-14 left-1/2 h-20 w-[68%] -translate-x-1/2 rounded-[50%] bg-[rgba(22,35,58,0.16)] blur-2xl"
          />
        </div>
      </div>

      {/* ── The caption ── */}
      <div
        className={`relative z-10 lg:col-span-5 ${isStart ? "lg:order-2 lg:pe-8" : "lg:order-1 lg:ps-8 lg:text-end"}`}
      >
        <div className={`island-caption flex items-center gap-4 ${isStart ? "" : "lg:justify-end"}`}>
          <span className="h-px w-10 bg-ocean/60" />
          <span className="label-fa text-ocean-deep">صدف {island.index}</span>
        </div>

        <h3 className="island-caption display-fa mt-5 text-5xl font-extrabold leading-[1.15] text-ink md:text-6xl lg:text-[4.2rem]">
          {island.name}
        </h3>
        <p className="island-caption label mt-3 text-[0.6rem] tracking-[0.3em] text-ink-faint">
          {island.latin}
        </p>

        <p className="island-caption editorial mt-4 text-2xl font-medium text-ocean-deep lg:text-3xl">
          {island.tagline}
        </p>

        <p className={`island-caption mt-6 max-w-md text-[0.92rem] font-light leading-loose text-ink-soft ${isStart ? "" : "lg:ms-auto"}`}>
          {island.note}
        </p>

        {/* Palette chips */}
        <div className={`island-caption mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 ${isStart ? "" : "lg:justify-end"}`}>
          {island.palette.map((c) => (
            <span key={c.hex} className="group/chip flex items-center gap-2.5">
              <span
                className="h-5 w-5 rounded-full border border-ink/15 transition-transform duration-300 group-hover/chip:scale-125"
                style={{ backgroundColor: c.hex, boxShadow: `0 2px 10px ${c.hex}66` }}
              />
              <span className="label-fa text-[0.62rem]">{c.label}</span>
            </span>
          ))}
        </div>

        <div className={`island-caption mt-10 flex items-center gap-6 ${isStart ? "" : "lg:justify-end"}`}>
          <span className="label-fa">{island.full}</span>
          <span className="h-1 w-1 rounded-full bg-ocean/70" />
          <span className="label-fa text-ocean-deep">
            <span className="media-hover-text">برای بیدار شدن، هاور کنید</span>
            <span className="media-touch-text">در لمس، همیشه بیدار است</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Section ── */
export default function Archipelago() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".arch-title-line",
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: 1.3,
          ease: "power4.out",
          stagger: 0.12,
          scrollTrigger: { trigger: ".arch-head", start: "top 76%" },
        }
      );
      gsap.fromTo(
        ".arch-sub",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: ".arch-head", start: "top 68%" },
        }
      );

      // Slow drifting background word
      gsap.to(".arch-ghost", {
        xPercent: -18,
        ease: "none",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="archipelago"
      className="relative overflow-hidden bg-pearl py-28 md:py-36"
      aria-label="آثارِ برگزیده — صدف‌های نشان"
    >
      {/* Shallow-water daylight gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 55% at 50% -10%, rgba(111,156,200,0.12), transparent 60%), radial-gradient(90% 50% at 50% 115%, rgba(79,154,148,0.07), transparent 65%)",
        }}
      />

      {/* Ghost word drifting behind the shells */}
      <span
        aria-hidden="true"
        className="arch-ghost display-fa pointer-events-none absolute top-24 start-0 select-none whitespace-nowrap text-[22vw] font-black leading-none text-ink/[0.03]"
      >
        مروارید · صدف · مروارید · صدف
      </span>

      {/* Pearl dust drifting in daylight */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className={`absolute h-1 w-1 rounded-full ${i % 3 === 0 ? "bg-ocean-bright/70" : "bg-silver/80"}`}
            style={{
              left: `${(i * 37 + 8) % 96}%`,
              top: `${(i * 53 + 12) % 90}%`,
              boxShadow:
                i % 3 === 0
                  ? "0 0 8px rgba(111,156,200,0.7)"
                  : "0 0 8px rgba(221,227,234,0.85)",
              animation: `firefly ${5 + (i % 5)}s ease-in-out ${i * 0.7}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Section head */}
      <div className="arch-head relative z-10 mx-auto max-w-[1600px] px-6 pb-24 pt-6 md:px-12 md:pb-32">
        <div className="flex items-center gap-5">
          <span className="label-fa text-ocean-deep">۰۳ — آثارِ برگزیده</span>
          <span className="h-px flex-1 bg-ink/15" />
        </div>
        <h2 className="display-fa mt-8 font-black leading-[1.1] tracking-tight">
          <span className="block overflow-hidden pb-[0.28em] -mb-[0.28em]">
            <span className="arch-title-line block text-[11vw] text-ink md:text-[7vw]">
              صدف‌های نشان‌ها
            </span>
          </span>
          <span className="block overflow-hidden pb-[0.4em] -mb-[0.2em]">
            <span className="arch-title-line editorial block text-[8.5vw] font-medium text-stroke-ocean md:text-[4.6vw]">
              چهار صدف، چهار مروارید
            </span>
          </span>
        </h2>
        <p className="arch-sub mt-8 max-w-xl text-[0.95rem] font-light leading-loose text-ink-soft">
          هر برند، یک صدف است — آب‌وهوایی خاص، رنگ و نورِ خودش را دارد. مودبوردها
          پوسته‌ی هر صدف‌اند و نشان، مرواری‌ای که در دلش می‌روید.{" "}
          <span className="font-semibold text-ocean-deep">روی هر صدف دریفت کنید</span> تا
          بیدار شود.
        </p>
      </div>

      {/* Shells */}
      <div className="relative z-10 flex flex-col gap-36 md:gap-48 lg:gap-56">
        {ISLANDS.map((island) => (
          <IslandBlock key={island.id} island={island} />
        ))}
      </div>
    </section>
  );
}
