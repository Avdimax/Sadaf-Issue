"use client";

import { useEffect, useRef } from "react";

/**
 * Cursor v2 — an ink dot with an inertial ocean ring.
 *
 *  · pointerover delegation — no DOM walking on every mousemove
 *  · the rAF loop sleeps when the cursor settles (zero idle cost)
 *  · the ring stretches with velocity and leans into its direction
 *  · press, view («دیدن») and link states
 *  · ignores touch input so hybrid devices behave correctly
 */
export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return;

    const dot = dotRef.current!;
    const ring = ringRef.current!;
    const label = labelRef.current!;

    let mx = -100, my = -100;   // mouse
    let rx = -100, ry = -100;   // ring (lerped)
    let px = -100, py = -100;   // previous ring position (velocity)
    let scale = 1;
    let targetScale = 1;
    let stretch = 0;
    let angle = 0;
    let visible = false;
    let pressed = false;
    let running = false;
    let raf = 0;
    let lastMove = 0;

    const wake = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      mx = e.clientX;
      my = e.clientY;
      lastMove = performance.now();
      if (!visible) {
        visible = true;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
      }
      wake();
    };

    // State changes ride along on pointerover (event delegation — cheap)
    const onOver = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const t = (e.target as HTMLElement).closest?.("[data-cursor]") as HTMLElement | null;
      const mode = t?.dataset.cursor ?? null;
      if (mode === "view") {
        targetScale = 3.4;
        label.textContent = "دیدن";
        label.classList.add("is-on");
        dot.style.opacity = "0.35";
      } else if (mode === "link") {
        targetScale = 2.2;
        label.classList.remove("is-on");
        dot.style.opacity = "0.35";
      } else {
        targetScale = 1;
        label.classList.remove("is-on");
        dot.style.opacity = "1";
      }
      wake();
    };

    const onLeave = () => {
      visible = false;
      dot.style.opacity = "0";
      ring.style.opacity = "0";
      label.classList.remove("is-on");
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pressed = true;
      wake();
    };
    const onUp = () => {
      pressed = false;
      wake();
    };

    const tick = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      scale += (targetScale - scale) * 0.16;

      // velocity → stretch, direction → lean
      const vx = rx - px;
      const vy = ry - py;
      px = rx;
      py = ry;
      const v = Math.hypot(vx, vy);
      const targetStretch = Math.min(v / 26, 0.32);
      stretch += (targetStretch - stretch) * 0.22;
      if (v > 0.6) angle = (Math.atan2(vy, vx) * 180) / Math.PI;

      const press = pressed ? 0.74 : 1;
      const sx = scale * press * (1 + stretch);
      const sy = scale * press * (1 - stretch * 0.55);

      dot.style.transform = `translate3d(${mx}px,${my}px,0) translate(-50%,-50%) scale(${pressed ? 2.3 : 1})`;
      ring.style.transform = `translate3d(${rx}px,${ry}px,0) translate(-50%,-50%) rotate(${angle}deg) scale(${sx},${sy})`;
      label.style.transform = `translate3d(${rx}px,${ry}px,0) translate(-50%,-50%)`;

      // sleep only when everything has settled and the mouse is quiet
      const settled =
        Math.abs(mx - rx) < 0.4 &&
        Math.abs(my - ry) < 0.4 &&
        Math.abs(targetScale - scale) < 0.01 &&
        Math.abs(targetStretch - stretch) < 0.01 &&
        !pressed;
      if (settled && performance.now() - lastMove > 160) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[300] hidden md:block">
      <div
        ref={ringRef}
        className="absolute left-0 top-0 h-9 w-9 rounded-full border border-ocean/70 bg-pearl/40 opacity-0 transition-opacity duration-300"
        style={{ willChange: "transform" }}
      />
      <div
        ref={dotRef}
        className="absolute left-0 top-0 h-1.5 w-1.5 rounded-full bg-ocean-deep opacity-0 transition-opacity duration-300"
        style={{ willChange: "transform" }}
      />
      <span
        ref={labelRef}
        className="cursor-label label-fa absolute left-0 top-0 text-[0.6rem] font-semibold text-ink [text-shadow:0_1px_6px_rgba(245,246,248,0.95)]"
        style={{ willChange: "transform" }}
      />
    </div>
  );
}
