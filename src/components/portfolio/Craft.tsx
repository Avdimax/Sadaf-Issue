"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { asset } from "@/lib/asset";

/**
 * Craft — the four movements of the process,
 * rising over quiet pearl with ocean spines.
 */
const STEPS = [
  {
    n: "۰۱",
    title: "شنیدن",
    body: "پیش از هر خط، زمینِ بازی را می‌شناسم: تاریخِ برند، مخاطب، رقبا و سکوت‌هایش. مودبوردها نقشه می‌شوند — اینجاست که هر صدف برای نخستین‌بار گشوده می‌شود.",
  },
  {
    n: "۰۲",
    title: "تقطیر",
    body: "ده‌ها اسکیس به یک ایده فرومی‌ریزد. خورشیدی در قلبِ O. کوهی در شکمِ N. آزمون بی‌رحم است: اگر نشان را پس از یک نگاه بتوان از حفظ کشید، زنده می‌ماند.",
  },
  {
    n: "۰۳",
    title: "پالایش",
    body: "تصحیح‌های اپتیکی، وزنِ خطوط، تنشِ هر سفیدی. سپس کلِ سیستم — رنگ، سیاه‌وسفید، گرادیانت و نسخه‌های تیره؛ هر کدام در ۱۶ پیکسل و در ۱۶ متر آزموده می‌شود.",
  },
  {
    n: "۰۴",
    title: "رهاسازی",
    body: "راهنمایِ استفاده، لاک‌آپ‌ها، فضای امن و مواردِ سوءاستفاده. نشان با هرچه برای زندگیِ چندده‌ساله لازم دارد، آتلیه را ترک می‌کند.",
  },
];

export default function Craft() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".craft-title-line",
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: 1.2,
          ease: "power4.out",
          stagger: 0.1,
          scrollTrigger: { trigger: ".craft-head", start: "top 78%" },
        }
      );

      gsap.utils.toArray<HTMLElement>(".craft-step").forEach((step) => {
        gsap.fromTo(
          step,
          { opacity: 0, y: 90 },
          {
            opacity: 1,
            y: 0,
            duration: 1.05,
            ease: "power3.out",
            scrollTrigger: { trigger: step, start: "top 84%" },
          }
        );
        // progress line fills as each step enters (the closing quote has none)
        const progress = step.querySelector<HTMLElement>(".craft-progress");
        if (progress) {
          gsap.fromTo(
            progress,
            { scaleY: 0 },
            {
              scaleY: 1,
              duration: 1.1,
              ease: "power2.out",
              scrollTrigger: { trigger: step, start: "top 80%" },
            }
          );
        }
      });

      // Faint texture drifts slower than content
      gsap.to(".craft-texture", {
        yPercent: 12,
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

  return (
    <section
      ref={rootRef}
      id="craft"
      className="relative overflow-hidden bg-pearl py-28 md:py-36"
      aria-label="روشِ کار — فرایندِ طراحی"
    >
      {/* Silk — barely-there warmth */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="craft-texture absolute -inset-y-[14%] inset-x-0 bg-cover bg-center opacity-[0.05]"
          style={{ backgroundImage: `url(${asset("/mood/satin.jpg")})` }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, #F5F6F8 0%, rgba(245,246,248,0.82) 22%, rgba(245,246,248,0.86) 78%, #F5F6F8 100%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[1600px] px-6 md:px-12">
        {/* Head */}
        <div className="craft-head mb-20 md:mb-28">
          <div className="flex items-center gap-5">
            <span className="label-fa text-ocean-deep">۰۵ — روشِ کار</span>
            <span className="h-px flex-1 bg-ink/15" />
          </div>
          <h2 className="display-fa mt-8 font-black leading-[1.12] tracking-tight">
            <span className="block overflow-hidden pb-[0.3em] -mb-[0.3em]">
              <span className="craft-title-line block text-[10vw] text-ink md:text-[6vw]">
                چگونه مرواریدی
              </span>
            </span>
            <span className="block overflow-hidden pb-[0.4em] -mb-[0.2em]">
              <span className="craft-title-line editorial block text-[10vw] font-medium text-ocean-deep md:text-[6vw]">
                در صدف می‌روید
              </span>
            </span>
          </h2>
        </div>

        {/* Steps */}
        <div className="grid gap-14 md:grid-cols-2 md:gap-x-20 md:gap-y-20 lg:grid-cols-4">
          {STEPS.map((s) => (
            <article key={s.n} className="craft-step group relative pe-2 ps-4 lg:ps-5">
              {/* progress spine */}
              <div className="absolute start-0 top-1 hidden h-full w-px bg-ink/10 lg:block">
                <div className="craft-progress h-full w-px origin-top bg-gradient-to-b from-ocean-bright to-ocean-deep" />
              </div>

              <div className="flex items-baseline gap-4">
                <span className="display-fa text-5xl font-black text-stroke-ocean transition-all duration-500 group-hover:text-ocean group-hover:[-webkit-text-stroke:0px]">
                  {s.n}
                </span>
                <span className="h-px flex-1 bg-ink/15 transition-all duration-500 group-hover:bg-ocean/50" />
              </div>

              <h3 className="display-fa mt-6 text-3xl font-extrabold text-ink">
                {s.title}
              </h3>

              <p className="mt-5 text-[0.9rem] font-light leading-loose text-ink-soft">
                {s.body}
              </p>
            </article>
          ))}
        </div>

        {/* Quote */}
        <blockquote className="craft-step mx-auto mt-24 max-w-3xl text-center md:mt-32">
          <p className="nastaliq px-4 py-2 text-2xl font-medium leading-[2.1] text-ink md:text-[1.8rem]">
            نشان باید روی کارت‌ویزیت بنشیند مثل جوهری روی مخمل —
            <span className="font-bold text-ocean-deep"> کوچک، آرام و غیرممکنِ نادیده‌گرفتن</span>.
          </p>
          <footer className="label-fa mt-6 text-ink-faint">— آتلیه صدف</footer>
        </blockquote>
      </div>
    </section>
  );
}
