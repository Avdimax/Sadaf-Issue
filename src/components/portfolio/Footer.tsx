"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { asset } from "@/lib/asset";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useOrderStore } from "@/lib/order-store";

/**
 * Footer — Module 07 · «سفارش» — the horizon of the whole UX.
 * Every mile of the journey points here: one magnetic act opens the
 * OrderTheater, where the five-act brief is gathered in under two minutes.
 */
export default function Footer() {
  const rootRef = useRef<HTMLElement>(null);
  const magnetRef = useRef<HTMLButtonElement>(null);
  const openOrder = useOrderStore((s) => s.openOrder);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".footer-line",
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: 1.3,
          ease: "power4.out",
          stagger: 0.12,
          scrollTrigger: { trigger: rootRef.current, start: "top 72%" },
        }
      );
      gsap.fromTo(
        ".footer-meta",
        { opacity: 0, y: 26 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: rootRef.current, start: "top 62%" },
        }
      );
      gsap.fromTo(
        ".footer-mark",
        { y: 90, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.4,
          ease: "power3.out",
          scrollTrigger: { trigger: rootRef.current, start: "top 65%" },
        }
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  // Magnetic pull — transform-only, no state churn
  useEffect(() => {
    const el = magnetRef.current;
    if (!el || window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

    const xTo = gsap.quickTo(el, "x", { duration: 0.55, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.55, ease: "power3.out" });

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const pull = 26;
      xTo(gsap.utils.clamp(-pull, pull, dx * 0.32));
      yTo(gsap.utils.clamp(-pull, pull, dy * 0.32));
    };
    const onLeave = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <footer
      ref={rootRef}
      id="contact"
      className="relative overflow-hidden bg-paper-2 pt-28 md:pt-36"
      aria-label="سفارش و تماس"
    >
      {/* Quiet horizon atmosphere */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(100% 70% at 50% 0%, rgba(201,161,91,0.12), rgba(238,233,221,0) 70%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1600px] px-6 md:px-12">
        <div className="flex items-center gap-5">
          <span className="label-fa text-brass-deep">۰۷ — سفارش</span>
          <span className="h-px flex-1 bg-ink/15" />
        </div>

        <h2 className="display-fa mt-10 font-black leading-[1.14] tracking-tight">
          <span className="block overflow-hidden pb-[0.3em] -mb-[0.3em]">
            <span className="footer-line block text-[12vw] text-ink md:text-[7vw]">
              بیایید
            </span>
          </span>
          <span className="block overflow-hidden pb-[0.36em] -mb-[0.26em]">
            <span className="footer-line editorial block text-[12vw] font-medium text-brass-deep md:text-[7vw]">
              نشانِ شما را بسازیم
            </span>
          </span>
        </h2>

        <div className="mt-12 grid items-end gap-14 lg:grid-cols-12">
          {/* ── The act of ordering ── */}
          <div className="lg:col-span-6">
            <p className="footer-meta max-w-md text-[0.95rem] font-light leading-loose text-ink-soft">
              در هر لحظه فقط یک هویت. سفارش‌های ۱۴۰۵ پذیرفته می‌شود —
              زمینِ برندتان را بیاورید تا نشانِ متعلق به آن را پیدا کنیم.
            </p>

            {/* The theatrical CTA — opens the five-act brief */}
            <button
              ref={magnetRef}
              data-cursor="link"
              onClick={openOrder}
              className="footer-meta group relative mt-10 inline-flex items-center gap-5 border border-brass bg-brass px-10 py-5 text-paper transition-colors duration-500 hover:bg-brass-deep hover:border-brass-deep"
              aria-label="شروعِ سفارش طراحی — گفت‌وگوی پرسش‌به‌پرسش"
            >
              <span className="label-fa text-[0.85rem]">شروعِ سفارش</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-paper/40 transition-all duration-500 group-hover:bg-paper/10">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M1 13L13 1M13 1H4M13 1v9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>

            <p className="footer-meta label-fa mt-5 text-[0.62rem] leading-relaxed text-ink-faint">
              سیزده پرسشِ کوتاه، یکی‌یکی — کمتر از دو دقیقه؛ از نامِ برند تا روحِ نشان و بودجه.
            </p>

            <div className="footer-meta mt-10 flex flex-wrap items-center gap-x-10 gap-y-4">
              {["اینستاگرام", "بیهنس", "دریبل", "پینترست"].map((s) => (
                <a
                  key={s}
                  href="#contact"
                  data-cursor="link"
                  onClick={(e) => e.preventDefault()}
                  className="label-fa group relative text-[0.76rem] text-ink-soft transition-colors duration-300 hover:text-ink"
                >
                  {s}
                  <span className="absolute -bottom-1 start-0 h-px w-0 bg-brass transition-all duration-500 group-hover:w-full" />
                </a>
              ))}
            </div>
          </div>

          {/* The sign-off mark + Nastaliq signature */}
          <div className="footer-mark flex flex-col items-center gap-10 lg:col-span-6 lg:items-end">
            <div className="relative">
              <div className="spin-slow absolute -inset-7 rounded-full border border-dashed border-brass/30 md:-inset-10" />
              <div className="logo-bob relative">
                <Image
                  src={asset("/work/oxin-gradient.png")}
                  alt="نشانِ طلاییِ عطر اکسین — امضای پایانیِ آتلیه"
                  width={1049}
                  height={672}
                  className="w-[min(60vw,360px)]"
                />
              </div>
            </div>
            <p className="nastaliq text-5xl font-bold leading-none text-ink/85">
              صدف
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-24 border-t border-ink/10 py-8 md:mt-32">
          <div className="flex flex-col items-center justify-between gap-5 md:flex-row">
            <p className="footer-meta label-fa text-ink-faint">
              آتلیه صدف — نشان‌هایی برای برندهایی که آرام حرف می‌زنند
            </p>
            <a
              href="mailto:hello@sadaf.design"
              data-cursor="link"
              className="footer-meta label-fa text-ink-faint transition-colors hover:text-brass-deep"
            >
              hello@sadaf.design
            </a>
            <p className="footer-meta label-fa text-ink-faint">
              © ۱۴۰۵ — همه‌ی نشان‌ها متعلق به برندهای خودشان است
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
