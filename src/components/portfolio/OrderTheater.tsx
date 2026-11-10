"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useOrderStore } from "@/lib/order-store";

/**
 * OrderTheater — «تئاترِ سفارش» · the one-question-at-a-time brief.
 *
 * The conversion heart of the atelier, rebuilt as a single flowing
 * conversation: one question per stage, asked in the order a logo
 * artisan actually needs the answers (name → field → soul → practicals
 * → contact), then a review table the visitor can edit before sending.
 *
 * · one question at a time — big editorial typography, generous air
 * · single-choice chips auto-advance; text answers advance on Enter
 * · hairline progress bar + «پرسش n از N» counter
 * · review step with «ویرایش» jumps back to any question
 * · GSAP slide transitions (transform/opacity only), Lenis paused,
 *   Esc closes, keyboard-safe focus, mailto fallback
 */

/* ── Option sets ── */
const INDUSTRIES = ["عطر و لوکس", "کافه و رستوران", "آموزش و مربی‌گری", "چای و دمنش", "مد و پوشاک", "زیبایی و سلامت", "تکنولوژی", "صنایع دستی", "سایر"];
const PERSONALITIES = ["لوکس", "مینیمال", "صمیمی", "مدرن", "کلاسیک", "وینتیج", "پویا", "آرام", "سلطنتی", "جوان‌پسند"];
const VISUAL_STYLES = ["هندسی", "خوشنویسی و دست‌نویس", "انتزاعی", "مُهری و تاریخی", "حروف‌نگاری‌محور", "تصویری"];
const COLORS = ["طلایی", "سبزِ چای", "قهوه‌ایِ اسپرسو", "فیروزه‌ای", "سرمه‌ای", "لاکی", "مشکی", "کرم"];
const USAGES = ["وب و اپلیکیشن", "بسته‌بندی", "تابلو و ویترین", "چاپ و کارت‌ویزیت", "لیبلِ محصول"];
const TIMELINES = ["فوری", "حدودِ یک ماه", "حدودِ سه ماه", "منعطف"];
const BUDGETS = ["تا ۱۵ میلیون", "۱۵ تا ۳۰ میلیون", "۳۰ تا ۶۰ میلیون", "بالای ۶۰ میلیون"];

/* ── The brief ── */
type Brief = {
  brandName: string;
  industry: string;
  businessDesc: string;
  audience: string;
  personality: string[];
  visualStyle: string;
  colorsLove: string[];
  colorsAvoid: string;
  usage: string[];
  timeline: string;
  budget: string;
  contactName: string;
  contactMethod: string;
};

const EMPTY_BRIEF: Brief = {
  brandName: "",
  industry: "",
  businessDesc: "",
  audience: "",
  personality: [],
  visualStyle: "",
  colorsLove: [],
  colorsAvoid: "",
  usage: [],
  timeline: "",
  budget: "",
  contactName: "",
  contactMethod: "",
};

/* ── The questions — asked one by one, in the artisan's own order ── */
type QKind = "text" | "area" | "single" | "multi";

type Question = {
  key: keyof Brief;
  kind: QKind;
  title: string;
  sub: string;
  options?: string[];
  required?: boolean;
  placeholder?: string;
};

const QUESTIONS: Question[] = [
  {
    key: "brandName",
    kind: "text",
    title: "نامِ برند شما چیست؟",
    sub: "همان نامی که روی نشان می‌نشیند",
    required: true,
    placeholder: "مثلاً: اکسین",
  },
  {
    key: "industry",
    kind: "single",
    title: "زمینه‌ی فعالیتتان چیست؟",
    sub: "حوزه‌ای که برند در آن نفس می‌کشد",
    options: INDUSTRIES,
  },
  {
    key: "businessDesc",
    kind: "area",
    title: "برندتان چه می‌کند — و چه حسی دارد؟",
    sub: "یک جمله کافی است؛ رد کردن هم می‌شود",
    placeholder: "یک جمله درباره‌ی کسب‌وکارتان…",
  },
  {
    key: "audience",
    kind: "text",
    title: "مخاطبِ اصلی چه کسی است؟",
    sub: "نشان باید برای کسی که می‌خرد، سخن بگوید",
    placeholder: "سن، سلیقه، شهر، سبکِ زندگی…",
  },
  {
    key: "personality",
    kind: "multi",
    title: "شخصیتِ برند را برگزینید",
    sub: "چند مورد می‌شود — همان‌هایی که واقعاً هستند",
    options: PERSONALITIES,
  },
  {
    key: "visualStyle",
    kind: "single",
    title: "سبکِ بصری به کدام سمت متمایل است؟",
    sub: "لحنِ خطوط و فرم‌ها",
    options: VISUAL_STYLES,
  },
  {
    key: "colorsLove",
    kind: "multi",
    title: "کدام رنگ‌ها را دوست دارید؟",
    sub: "چند مورد می‌شود",
    options: COLORS,
  },
  {
    key: "colorsAvoid",
    kind: "text",
    title: "رنگ‌هایی که نباید باشند؟",
    sub: "اختیاری — موانع را از پیش کنار می‌گذاریم",
    placeholder: "مثلاً: بنفش و نارنجی",
  },
  {
    key: "usage",
    kind: "multi",
    title: "نشان کجا زندگی می‌کند؟",
    sub: "کاربردهای اصلی — چند مورد",
    options: USAGES,
  },
  {
    key: "timeline",
    kind: "single",
    title: "بازه‌ی زمان چقدر است؟",
    sub: "برنامه‌ی آتلیه را هم‌زمان می‌کنیم",
    options: TIMELINES,
  },
  {
    key: "budget",
    kind: "single",
    title: "بودجه در کدام بازه است؟",
    sub: "تومان — صادقانه، بدون قضاوت",
    options: BUDGETS,
  },
  {
    key: "contactName",
    kind: "text",
    title: "نامِ شما؟",
    sub: "پرده‌ی آخر — پاسخ به همین نام می‌رود",
    required: true,
    placeholder: "نام و نام‌خانوادگی",
  },
  {
    key: "contactMethod",
    kind: "text",
    title: "ایمیل یا موبایل شما؟",
    sub: "ظرفِ ۴۸ ساعت خبر می‌دهیم",
    required: true,
    placeholder: "example@mail.com — ۰۹۱۲…",
  },
];

const TOTAL = QUESTIONS.length;
const REVIEW = TOTAL; // step index of the review table

const faNum = (n: number) =>
  String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

/* ── Minimal atoms ── */
function Field({
  label, hint, big, onEnter, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  big?: boolean;
  onEnter?: () => void;
}) {
  return (
    <label className="block">
      {label ? <span className="label-fa mb-3 block text-[0.72rem] text-ink-soft">{label}</span> : null}
      <input
        {...props}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onEnter?.();
          }
        }}
        className={`w-full border-b border-ink/25 bg-transparent pb-3 pt-1 text-ink outline-none transition-colors duration-300 placeholder:text-ink-faint/70 focus:border-ocean ${
          big ? "text-[1.25rem] md:text-[1.45rem] font-medium" : "text-[0.95rem]"
        }`}
      />
      {hint ? <span className="label-fa mt-2.5 block text-[0.66rem] text-abalone/90">{hint}</span> : null}
    </label>
  );
}

function Area({
  label, hint, onEnter, ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  onEnter?: () => void;
}) {
  return (
    <label className="block">
      {label ? <span className="label-fa mb-3 block text-[0.72rem] text-ink-soft">{label}</span> : null}
      <textarea
        {...props}
        rows={props.rows ?? 2}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onEnter?.();
          }
        }}
        className="w-full resize-none border-b border-ink/25 bg-transparent pb-3 pt-1 text-[1.15rem] leading-relaxed text-ink outline-none transition-colors duration-300 placeholder:text-ink-faint/70 focus:border-ocean"
      />
      {hint ? <span className="label-fa mt-2.5 block text-[0.66rem] text-abalone/90">{hint}</span> : null}
    </label>
  );
}

function Chips({
  options, value, onChange, multi = false,
}: {
  options: string[];
  value: string | string[];
  onChange: (v: string | string[]) => void;
  multi?: boolean;
}) {
  const arr = Array.isArray(value) ? value : value ? [value] : [];
  const toggle = (opt: string) => {
    if (multi) {
      const next = arr.includes(opt) ? arr.filter((a) => a !== opt) : [...arr, opt];
      onChange(next);
    } else {
      onChange(arr.includes(opt) ? "" : opt);
    }
  };
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((opt) => {
        const on = arr.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            data-cursor="link"
            onClick={() => toggle(opt)}
            aria-pressed={on}
            className={`label-fa rounded-full border px-5 py-2.5 text-[0.8rem] transition-all duration-300 ${
              on
                ? "border-ocean bg-ocean text-pearl shadow-[0_6px_18px_rgba(46,92,143,0.28)]"
                : "border-ink/20 text-ink-soft hover:border-ocean/60 hover:text-ink"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/* ── The theater ── */
export default function OrderTheater() {
  const open = useOrderStore((s) => s.open);
  const closeOrder = useOrderStore((s) => s.closeOrder);

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [brief, setBrief] = useState<Brief>(EMPTY_BRIEF);
  const [nudge, setNudge] = useState(false);
  const [phase, setPhase] = useState<"form" | "sending" | "done" | "error">("form");
  const [refCode, setRefCode] = useState("");

  const scrimRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const honeyRef = useRef<HTMLInputElement>(null); // spam trap — humans never see it

  const set = <K extends keyof Brief>(key: K, value: Brief[K]) => {
    setBrief((b) => ({ ...b, [key]: value }));
    setNudge(false);
  };

  /* Curtain up / down */
  useEffect(() => {
    if (open) {
      setStep(0);
      setDir(1);
      setBrief(EMPTY_BRIEF);
      setNudge(false);
      setPhase("form");
      setRefCode("");
      setMounted(true);
    } else if (mounted) {
      const scrim = scrimRef.current;
      const panel = panelRef.current;
      if (scrim && panel) {
        gsap.to(panel, { y: 46, opacity: 0, scale: 0.97, duration: 0.32, ease: "power3.in" });
        gsap.to(scrim, {
          opacity: 0, duration: 0.32, ease: "power2.in",
          onComplete: () => setMounted(false),
        });
      } else {
        setMounted(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* Entrance + scroll lock while the curtain is up */
  useEffect(() => {
    if (!mounted || !open) return;
    const scrim = scrimRef.current;
    const panel = panelRef.current;
    if (scrim && panel) {
      gsap.fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out" });
      gsap.fromTo(
        panel,
        { y: 64, opacity: 0, scale: 0.965 },
        { y: 0, opacity: 1, scale: 1, duration: 0.65, ease: "power4.out", delay: 0.06 }
      );
    }
    const lenis = (window as unknown as { __lenis?: { stop(): void; start(): void } }).__lenis;
    lenis?.stop();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      lenis?.start();
      document.body.style.overflow = prevOverflow;
    };
  }, [mounted, open]);

  /* Esc closes the theater */
  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeOrder();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted, closeOrder]);

  /* Slide transitions — the new question glides in from the direction of travel */
  useEffect(() => {
    if (!mounted || phase !== "form") return;
    const content = contentRef.current;
    if (content) {
      gsap.fromTo(
        content,
        { x: dir * -30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, ease: "power3.out" }
      );
      const first = content.querySelector<HTMLElement>("input, textarea");
      if (first && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        first.focus({ preventScroll: true });
      }
    }
    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, [step, mounted, phase, dir]);

  const stepComplete = (i: number): boolean => {
    const q = QUESTIONS[i];
    if (!q?.required) return true;
    const v = brief[q.key];
    return Array.isArray(v) ? v.length > 0 : String(v).trim().length > 0;
  };

  const goNext = () => {
    if (!stepComplete(step)) {
      setNudge(true);
      const content = contentRef.current;
      if (content) {
        gsap.fromTo(content, { x: 0 }, { x: 8, duration: 0.07, repeat: 3, yoyo: true, ease: "power1.inOut", clearProps: "x" });
      }
      return;
    }
    setNudge(false);
    setDir(1);
    setStep((s) => Math.min(REVIEW, s + 1));
  };

  const goBack = () => {
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    setNudge(false);
    setDir(-1);
    setStep((s) => Math.max(0, s - 1));
  };

  const jumpTo = (i: number) => {
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    setNudge(false);
    setDir(-1);
    setStep(i);
  };

  /* Single-choice answers advance on their own — the conversation
     keeps moving without a click on «ادامه». */
  const answer = (q: Question, value: string | string[]) => {
    set(q.key, value as Brief[typeof q.key]);
    if (q.kind === "single" && value) {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
      autoTimerRef.current = setTimeout(() => {
        setNudge(false);
        setDir(1);
        setStep((s) => Math.min(REVIEW, s + 1));
      }, 460);
    }
  };

  const submit = async () => {
    if (!stepComplete(0) || !stepComplete(TOTAL - 1) || !stepComplete(TOTAL - 2)) {
      setNudge(true);
      return;
    }
    setPhase("sending");
    /* The theater travels: on a full Next host it posts to our own API
       route; on a static export (GitHub Pages) it posts to whichever
       endpoint the atelier wired — a Worker, Formspree, or a PHP drop.
       Same JSON everywhere; only the URL changes. */
    const endpoint = process.env.NEXT_PUBLIC_ORDER_ENDPOINT || "/api/order";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          ...brief,
          company: honeyRef.current?.value ?? "", // honeypot — stays empty for humans
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; ref?: string };
      if (res.ok && json.ok !== false) {
        setRefCode(typeof json.ref === "string" ? json.ref : "");
        setPhase("done");
      } else {
        setPhase("error");
      }
    } catch {
      setPhase("error");
    }
  };

  if (!mounted) return null;

  const onReview = step === REVIEW && phase === "form";
  const progress = phase === "form" ? Math.min(1, (step + 1) / (TOTAL + 1)) : 1;

  return (
    <div
      className="fixed inset-0 z-[290] flex items-center justify-center p-4 md:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="تئاترِ سفارش — پرسش‌های طراحی لوگو"
    >
      {/* Scrim — solid dim, no backdrop-blur: the animated grain layer sits
          beneath it, so a blurred scrim would re-filter every grain step */}
      <div
        ref={scrimRef}
        className="absolute inset-0 bg-[rgba(15,26,44,0.62)]"
        onClick={() => phase === "form" && closeOrder()}
      />

      {/* Finial above the arch */}
      <div aria-hidden="true" className="pointer-events-none relative z-10 hidden h-8 flex-col items-center justify-end md:flex">
        <span className="h-1.5 w-1.5 rounded-full bg-ocean" />
        <span className="h-6 w-px bg-ocean/50" />
      </div>

      {/* The stage panel — a Persian arch */}
      <div
        ref={panelRef}
        className="relative z-10 flex max-h-[88svh] w-full max-w-[600px] flex-col overflow-hidden rounded-t-[7rem] border border-ocean/25 bg-pearl shadow-[0_60px_140px_-30px_rgba(15,26,44,0.55)] md:rounded-t-[9rem]"
      >
        {/* Arch ornament */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-l from-ocean-bright/0 via-ocean-bright/70 to-ocean-bright/0" />
          <div className="dotgrid absolute inset-0 opacity-60" />
        </div>

        {/* Honeypot — positioned far off-stage; only bots ever fill it */}
        <input
          ref={honeyRef}
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="pointer-events-none absolute -left-[9999px] top-0 h-0 w-0 opacity-0"
        />

        {/* Hairline progress — the conversation's pulse */}
        {phase === "form" && (
          <div className="relative z-10 px-7 pt-9 md:px-12 md:pt-11">
            <div className="h-[3px] w-full overflow-hidden rounded-full bg-ink/10">
              <div
                className="h-full origin-right bg-gradient-to-l from-ocean-bright via-ocean to-ocean-deep transition-all duration-500 ease-out"
                style={{ transform: `scaleX(${progress})` }}
              />
            </div>
          </div>
        )}

        {/* Header — the counter read-out */}
        <div className="relative z-10 shrink-0 px-7 pb-2 pt-5 md:px-12">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="label-fa text-[0.62rem] text-ocean-deep">تئاترِ سفارش</span>
              <span className="h-1 w-1 rounded-full bg-ocean/60" />
              <span className="label-fa text-[0.62rem] text-ink-faint">
                {onReview
                  ? "پرده‌ی آخر — مرورِ بریف"
                  : `پرسش ${faNum(step + 1)} از ${faNum(TOTAL)}`}
              </span>
            </div>
            <button
              data-cursor="link"
              onClick={closeOrder}
              aria-label="بستنِ پنجره‌ی سفارش"
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/15 transition-colors duration-300 hover:border-ocean hover:bg-ocean/10"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M1 1l10 10M11 1L1 11" stroke="#1D4066" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body — one question at a time */}
        <div
          ref={contentRef}
          data-lenis-prevent
          className="relative z-10 min-h-[260px] flex-1 overflow-y-auto overscroll-contain px-7 pb-4 md:min-h-[300px] md:px-12"
        >
          {phase === "form" && !onReview && (
            <div className="flex min-h-[240px] flex-col justify-center pb-5 md:min-h-[280px]">
              {(() => {
                const q = QUESTIONS[step];
                const value = brief[q.key];
                const missing = nudge && q.required && (Array.isArray(value) ? value.length === 0 : !String(value).trim());
                return (
                  <>
                    <p className="editorial text-lg text-ocean-deep md:text-xl">{q.sub}</p>
                    <h3 className="display-fa mt-2 text-[1.55rem] font-extrabold leading-[1.35] text-ink md:text-[2rem]">
                      {q.title}
                    </h3>

                    <div className="mt-8 md:mt-9">
                      {q.kind === "text" && (
                        <Field
                          big
                          value={value as string}
                          placeholder={q.placeholder}
                          onChange={(e) => set(q.key, e.target.value)}
                          onEnter={goNext}
                          hint={missing ? "برای ادامه لازم است" : undefined}
                        />
                      )}
                      {q.kind === "area" && (
                        <Area
                          value={value as string}
                          placeholder={q.placeholder}
                          onChange={(e) => set(q.key, e.target.value)}
                          onEnter={goNext}
                        />
                      )}
                      {(q.kind === "single" || q.kind === "multi") && (
                        <Chips
                          options={q.options ?? []}
                          value={value}
                          multi={q.kind === "multi"}
                          onChange={(v) => answer(q, v)}
                        />
                      )}
                    </div>

                    {q.kind === "single" && (
                      <p className="label-fa mt-6 text-[0.62rem] text-ink-faint">
                        با انتخاب، خودکار به پرسشِ بعد می‌رویم
                      </p>
                    )}
                    {q.kind === "multi" && (
                      <p className="label-fa mt-6 text-[0.62rem] text-ink-faint">
                        چند مورد می‌شود — بعد «ادامه» را بزنید
                      </p>
                    )}
                    {!q.required && q.kind !== "single" && (
                      <p className="label-fa mt-2 text-[0.62rem] text-ink-faint">
                        این پرسش اختیاری است
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* The review — the whole brief, editable */}
          {phase === "form" && onReview && (
            <div className="pb-5">
              <p className="editorial text-lg text-ocean-deep md:text-xl">
                همه‌چیز یک‌جا — هر پاسخی را می‌شود ویرایش
              </p>
              <h3 className="display-fa mt-2 text-[1.55rem] font-extrabold leading-[1.35] text-ink md:text-[2rem]">
                مرورِ بریف
              </h3>

              <div className="mt-7 divide-y divide-ink/10 border-y border-ink/10">
                {QUESTIONS.map((q, i) => {
                  const v = brief[q.key];
                  const shown = Array.isArray(v)
                    ? v.length
                      ? v.join("، ")
                      : "—"
                    : String(v ?? "").trim() || "—";
                  return (
                    <div key={q.key} className="flex items-start justify-between gap-5 py-3.5">
                      <div className="min-w-0">
                        <p className="label-fa text-[0.62rem] text-ink-faint">
                          {faNum(i + 1).padStart(2, "۰")}. {q.title}
                        </p>
                        <p
                          className={`mt-1 truncate text-[0.9rem] leading-relaxed ${
                            shown === "—" ? "text-ink-faint" : "text-ink"
                          }`}
                        >
                          {shown}
                        </p>
                      </div>
                      <button
                        data-cursor="link"
                        onClick={() => jumpTo(i)}
                        className="label-fa shrink-0 border-b border-ocean/50 pb-0.5 text-[0.66rem] text-ocean-deep transition-colors duration-300 hover:border-ocean hover:text-ink"
                      >
                        ویرایش
                      </button>
                    </div>
                  );
                })}
              </div>

              <p className="label-fa mt-6 text-[0.62rem] leading-relaxed text-ink-faint">
                بریفِ شما نزدِ آتلیه می‌ماند و فقط برایِ قیمت‌گذاری و پاسخ استفاده می‌شود.
              </p>
            </div>
          )}

          {phase === "sending" && (
            <div className="flex flex-col items-center gap-6 py-16">
              <span className="spin-slow flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-ocean/50" />
              <p className="editorial text-2xl font-medium text-ink-soft">بریف به آتلیه می‌رود…</p>
            </div>
          )}

          {phase === "done" && (
            <div className="flex flex-col items-center gap-6 py-12 text-center">
              <div className="relative flex h-32 w-32 items-center justify-center">
                <div className="spin-slow absolute inset-0 rounded-full border border-dashed border-ocean/45" />
                <svg viewBox="0 0 200 200" className="absolute inset-3 h-auto w-[84%] opacity-[0.18]" fill="none" aria-hidden="true">
                  <g stroke="#1D4066" strokeWidth="0.8">
                    <rect x="46" y="46" width="108" height="108" />
                    <rect x="46" y="46" width="108" height="108" transform="rotate(45 100 100)" />
                  </g>
                </svg>
                <span className="nastaliq select-none px-2 pb-2 text-5xl font-bold leading-none text-ocean-deep">ص</span>
              </div>
              <h4 className="display-fa text-3xl font-extrabold text-ink">بریفِ شما رسید</h4>
              <p className="editorial max-w-sm text-xl leading-relaxed text-ink-soft">
                نشانِ شما، پرده‌ی بعدیِ تئاتر است — ظرفِ ۴۸ ساعت پاسخ می‌گیرید.
              </p>
              {refCode && (
                <span className="label-fa border border-ocean/40 px-5 py-2.5 text-[0.74rem] text-ocean-deep">
                  کدِ پیگیری: <span className="tracking-widest">{refCode}</span>
                </span>
              )}
            </div>
          )}

          {phase === "error" && (
            <div className="flex flex-col items-center gap-6 py-12 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#A94F35]/40">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M9 1v10m0 3.5v.5" stroke="#A94F35" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </span>
              <h4 className="display-fa text-2xl font-extrabold text-ink">پرده موقتاً بسته شد</h4>
              <p className="editorial max-w-sm text-lg leading-relaxed text-ink-soft">
                ارسال انجام نشد. می‌توانید دوباره تلاش کنید یا مستقیم ایمیل بزنید:
              </p>
              <div className="flex items-center gap-4">
                <button
                  data-cursor="link"
                  onClick={submit}
                  className="label-fa border border-ocean/40 px-6 py-3 text-[0.74rem] text-ocean-deep transition-colors duration-300 hover:border-ocean hover:bg-ocean hover:text-pearl"
                >
                  تلاشِ دوباره
                </button>
                <a
                  data-cursor="link"
                  href="mailto:hello@sadaf.design?subject=%D8%B3%D9%81%D8%A7%D8%B1%D8%B4%20%D8%B7%D8%B1%D8%A7%D8%AD%DB%8C%20%D9%84%D9%88%DA%AF%D9%88"
                  className="label-fa text-[0.74rem] text-ink-soft underline decoration-ocean/50 underline-offset-4 transition-colors hover:text-ink"
                >
                  hello@sadaf.design
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer — the conversation controls */}
        <div className="relative z-10 shrink-0 border-t border-ink/10 bg-pearl-2/40 px-7 py-5 md:px-12">
          {phase === "form" && (
            <div className="flex items-center justify-between gap-4">
              {step > 0 ? (
                <button
                  data-cursor="link"
                  onClick={goBack}
                  className="label-fa group flex items-center gap-3 text-[0.74rem] text-ink-soft transition-colors hover:text-ink"
                >
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-x-1">
                    <path d="M1 7h12m0 0L8.5 2.5M13 7l-4.5 4.5" stroke="#1D4066" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  بازگشت
                </button>
              ) : (
                <span className="label-fa text-[0.62rem] text-ink-faint">کمتر از دو دقیقه — ۱۳ پرسش</span>
              )}

              {onReview ? (
                <button
                  data-cursor="link"
                  onClick={submit}
                  className="label-fa group flex items-center gap-3 border border-ocean bg-ocean px-8 py-3 text-[0.78rem] text-pearl transition-all duration-400 hover:bg-ocean-deep hover:border-ocean-deep"
                >
                  ارسالِ بریف
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1">
                    <path d="M1 13L13 1M13 1H4M13 1v9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ) : (
                <button
                  data-cursor="link"
                  onClick={goNext}
                  className="label-fa group flex items-center gap-3 border border-ocean/50 px-7 py-3 text-[0.78rem] text-ocean-deep transition-all duration-400 hover:border-ocean hover:bg-ocean hover:text-pearl"
                >
                  {step === TOTAL - 1 ? "مرورِ بریف" : "ادامه"}
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1">
                    <path d="M1 7h12m0 0L8.5 2.5M13 7l-4.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {(phase === "done" || phase === "error") && (
            <div className="flex justify-center">
              <button
                data-cursor="link"
                onClick={closeOrder}
                className="label-fa border border-ink/20 px-8 py-3 text-[0.74rem] text-ink-soft transition-colors duration-300 hover:border-ocean hover:text-ocean-deep"
              >
                {phase === "done" ? "بستنِ پرده" : "بستن"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
