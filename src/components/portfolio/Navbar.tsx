"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollToId } from "./SmoothScroll";
import { useOrderStore } from "@/lib/order-store";

const links = [
  { label: "آثار", href: "#archipelago" },
  { label: "مجموعه", href: "#variations" },
  { label: "روش", href: "#craft" },
  { label: "طراح", href: "#designer" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const openOrder = useOrderStore((s) => s.openOrder);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // 1 — "scrolled" state via a sentinel (no scroll listener, no per-frame renders)
    const sentinel = sentinelRef.current;
    let io: IntersectionObserver | null = null;
    if (sentinel) {
      io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting));
      io.observe(sentinel);
    }

    // 2 — active section tracking
    const targets = links
      .map((l) => document.querySelector(l.href))
      .filter((el): el is Element => Boolean(el));
    const io2 = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(`#${(e.target as HTMLElement).id}`);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    targets.forEach((t) => io2.observe(t));

    // 3 — scroll progress hairline (style-only — never re-renders React)
    const progress = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        if (progressRef.current) {
          progressRef.current.style.transform = `scaleX(${self.progress})`;
        }
      },
    });

    return () => {
      io?.disconnect();
      io2.disconnect();
      progress.kill();
    };
  }, []);

  return (
    <>
      {/* Scroll progress — a brass hairline growing from the right (RTL) */}
      <div
        aria-hidden="true"
        ref={progressRef}
        className="fixed inset-x-0 top-0 z-[130] h-[2px] origin-right bg-gradient-to-l from-brass-bright via-brass to-brass-deep/70"
        style={{ transform: "scaleX(0)" }}
      />

      {/* Sentinel for the scrolled state */}
      <div ref={sentinelRef} aria-hidden="true" className="absolute start-0 top-0 h-20 w-full" />

      <header
        className={`fixed inset-x-0 top-0 z-[100] transition-all duration-700 ${
          // solid paper instead of backdrop-blur: a blurred fixed header
          // re-rasterizes its backdrop on every scroll frame
          scrolled ? "border-b border-ink/10 bg-paper/95" : ""
        }`}
      >
        <nav className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-5 md:px-12">
          <button
            data-cursor="link"
            onClick={() => scrollToId("#top")}
            className="group flex items-center gap-3"
            aria-label="بازگشت به بالا"
          >
            <span className="relative flex h-8 w-8 items-center justify-center">
              <span className="spin-slow absolute inset-0 rounded-full border border-dashed border-brass/50" />
              <span className="h-1.5 w-1.5 rounded-full bg-brass transition-all duration-500 group-hover:scale-150 group-hover:shadow-[0_0_12px_rgba(201,161,91,0.9)]" />
            </span>
            <span className="display-fa text-xl font-extrabold text-ink">
              صدف<span className="text-brass">.</span>
            </span>
          </button>

          <ul className="hidden items-center gap-9 md:flex">
            {links.map((l) => {
              const isActive = active === l.href;
              return (
                <li key={l.href}>
                  <button
                    data-cursor="link"
                    onClick={() => scrollToId(l.href)}
                    aria-current={isActive ? "true" : undefined}
                    className={`label-fa group relative text-[0.8rem] transition-colors duration-300 ${
                      isActive ? "text-brass-deep" : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    {l.label}
                    <span
                      className={`absolute -bottom-1.5 start-0 h-px bg-brass transition-all duration-500 ${
                        isActive ? "w-full" : "w-0 group-hover:w-full"
                      }`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>

          <button
            data-cursor="link"
            onClick={openOrder}
            className="label-fa border border-brass/40 px-5 py-2.5 text-[0.78rem] text-brass-deep transition-all duration-500 hover:border-brass hover:bg-brass hover:text-paper hover:shadow-[0_10px_30px_rgba(168,124,63,0.3)]"
          >
            سفارش طراحی
          </button>
        </nav>
      </header>
    </>
  );
}
