import { NextResponse } from "next/server";
import {
  orderEmailHtml,
  orderEmailText,
  orderSubject,
  orderTelegramMessage,
  type FiledOrder,
} from "@/lib/order-email";

/**
 * POST /api/order — the atelier's single serverless function.
 *
 * Receives the five-act brief from the OrderTheater, files it as an
 * order (reference code SD-XXXXX) and delivers it to the owner through
 * whichever channels are configured:
 *
 *   · drawer  — SQLite via Prisma (local dev; skipped silently if absent)
 *   · email   — Resend HTTP API (primary; fetch only, zero dependencies)
 *   · telegram— Bot API push (optional; instant, free)
 *
 * No channel configured + no drawer → honest 500 so the visitor is told
 * to retry / use the mailto fallback, instead of a silent black hole.
 *
 * Spam care: hidden honeypot field + in-memory per-IP rate limit.
 */

export const runtime = "nodejs";

const str = (v: unknown, max = 2000): string | null => {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length ? s.slice(0, max) : null;
};

const list = (v: unknown): string[] => {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.trim().slice(0, 60))
    .filter(Boolean);
};

/* ── rate limit: 5 orders / 10 min / IP (per instance) ── */
const WINDOW = 10 * 60 * 1000;
const MAX_HITS = 5;
const hits = new Map<string, number[]>();

const ipOf = (req: Request): string => {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "local";
};

const limited = (ip: string): boolean => {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW);
  if (recent.length >= MAX_HITS) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 500) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= WINDOW)) hits.delete(k);
    }
  }
  return false;
};

/* ── channel helpers ── */

const fetchJson = async (url: string, init: RequestInit) => {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(10_000) });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, body };
};

const sendEmail = async (o: FiledOrder): Promise<boolean> => {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.OWNER_EMAIL;
  if (!key || !to) return false;

  const from =
    process.env.RESEND_FROM?.trim() || "Atelier Orders <onboarding@resend.dev>";

  // If the client left an email address, let the owner hit «Reply» straight to them.
  const replyTo = /@[^\s@]+\.[^\s@]+/.test(o.contactMethod) ? o.contactMethod : undefined;

  const { ok, body } = await fetchJson("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: orderSubject(o),
      html: orderEmailHtml(o),
      text: orderEmailText(o),
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  if (!ok) console.error("[order] email failed:", JSON.stringify(body).slice(0, 300));
  return ok;
};

const sendTelegram = async (o: FiledOrder): Promise<boolean> => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;

  const { ok, body } = await fetchJson(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: orderTelegramMessage(o),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    }
  );
  if (!ok) console.error("[order] telegram failed:", JSON.stringify(body).slice(0, 300));
  return ok;
};

const fileInDrawer = async (o: FiledOrder): Promise<boolean> => {
  try {
    const { db } = await import("@/lib/db");
    await db.orderBrief.create({
      data: {
        ref: o.ref,
        brandName: o.brandName,
        industry: o.industry,
        businessDesc: o.businessDesc,
        audience: o.audience,
        personality: o.personality.length ? JSON.stringify(o.personality) : null,
        visualStyle: o.visualStyle,
        colorsLove: o.colorsLove.length ? JSON.stringify(o.colorsLove) : null,
        colorsAvoid: o.colorsAvoid,
        usageAreas: o.usageAreas.length ? JSON.stringify(o.usageAreas) : null,
        timeline: o.timeline,
        budget: o.budget,
        contactName: o.contactName,
        contactMethod: o.contactMethod,
        links: o.links,
      },
    });
    return true;
  } catch {
    return false; // drawer unavailable (e.g. static/serverless deploy) — fine
  }
};

/* ── the handler ── */

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;

    /* Honeypot — real visitors never see the «company» field.
       Bots that fill it get a polite success and silence. */
    if (str(body?.company, 200)) {
      return NextResponse.json({ ok: true, ref: "SD-" + Math.random().toString(36).slice(2, 7).toUpperCase() });
    }

    const ip = ipOf(req);
    if (limited(ip)) {
      return NextResponse.json(
        { ok: false, error: "درخواست‌های زیاد — کمی بعد دوباره تلاش کنید" },
        { status: 429 }
      );
    }

    const brandName = str(body?.brandName, 120);
    const contactName = str(body?.contactName, 120);
    const contactMethod = str(body?.contactMethod, 160);

    if (!brandName || !contactName || !contactMethod) {
      return NextResponse.json(
        { ok: false, error: "نام برند و راه تماس لازم است" },
        { status: 400 }
      );
    }

    const order: FiledOrder = {
      ref: "SD-" + Math.random().toString(36).slice(2, 7).toUpperCase(),
      brandName,
      industry: str(body?.industry, 80),
      businessDesc: str(body?.businessDesc),
      audience: str(body?.audience),
      personality: list(body?.personality),
      visualStyle: str(body?.visualStyle, 80),
      colorsLove: list(body?.colorsLove),
      colorsAvoid: str(body?.colorsAvoid, 200),
      usageAreas: list(body?.usage),
      timeline: str(body?.timeline, 60),
      budget: str(body?.budget, 60),
      contactName,
      contactMethod,
      links: str(body?.links),
      createdAt: new Date().toISOString(),
    };

    /* Deliver through every configured channel, in parallel. */
    const emailConfigured = Boolean(process.env.RESEND_API_KEY && process.env.OWNER_EMAIL);
    const telegramConfigured = Boolean(
      process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID
    );

    const [drawerOk, emailOk, telegramOk] = await Promise.all([
      fileInDrawer(order),
      sendEmail(order),
      sendTelegram(order),
    ]);

    const landed = [
      ...(drawerOk ? ["drawer"] : []),
      ...(emailOk ? ["email"] : []),
      ...(telegramOk ? ["telegram"] : []),
    ];

    /* Dev visibility: nothing real configured → show what would have been sent. */
    if (!emailConfigured && !telegramConfigured && process.env.NODE_ENV !== "production") {
      console.log(
        `[order dry-run] ${order.ref} · ${order.brandName} · ${order.contactName} · ${order.contactMethod} · landed=${landed.join("+") || "none"}`
      );
    }

    if (!landed.length) {
      return NextResponse.json(
        { ok: false, error: "هیچ مسیرِ تحویلی فعال نیست — OWNER_EMAIL را تنظیم کنید" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, ref: order.ref, landed });
  } catch {
    return NextResponse.json({ ok: false, error: "خطای سرور" }, { status: 500 });
  }
}
