/**
 * order-worker.ts — the atelier's single endpoint, deployed as a
 * Cloudflare Worker (free tier: 100k req/day). Companion to the static
 * GitHub Pages build: Pages serves the site, this Worker receives the
 * brief, files a reference code and delivers email (+ Telegram).
 *
 *   deploy:  cd worker && bunx wrangler deploy
 *   secrets: wrangler secret put RESEND_API_KEY OWNER_EMAIL \
 *            TELEGRAM_BOT_TOKEN TELEGRAM_CHAT_ID
 *
 * The email/Telegram templates are shared with the local Next API route
 * by importing the same library — one look, everywhere.
 */

import {
  orderEmailHtml,
  orderEmailText,
  orderSubject,
  orderTelegramMessage,
} from "../src/lib/order-email";

const json = (data: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });

const cors = (env: Record<string, string | undefined>): Record<string, string> => ({
  "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  Vary: "Origin",
});

/* Best-effort rate limit — per isolate (Workers spawn many). For strict
   limits add a Durable Object or Turnstile; for a portfolio this is plenty. */
const WINDOW = 10 * 60 * 1000;
const MAX_HITS = 5;
const hits = new Map<string, number[]>();

const limited = (ip: string): boolean => {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW);
  if (recent.length >= MAX_HITS) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 500) hits.clear(); // crude GC — good enough here
  return false;
};

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

const fetchJson = async (url: string, init: RequestInit) => {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(10_000) });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, body };
};

type FiledOrder = Parameters<typeof orderSubject>[0];

const sendEmail = async (
  o: FiledOrder,
  env: Record<string, string | undefined>
): Promise<boolean> => {
  if (!env.RESEND_API_KEY || !env.OWNER_EMAIL) return false;
  const from = env.RESEND_FROM?.trim() || "Atelier Orders <onboarding@resend.dev>";
  const replyTo = /@[^\s@]+\.[^\s@]+/.test(o.contactMethod) ? o.contactMethod : undefined;

  const { ok, body } = await fetchJson("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [env.OWNER_EMAIL],
      subject: orderSubject(o),
      html: orderEmailHtml(o),
      text: orderEmailText(o),
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  if (!ok) console.error("[order] email failed:", JSON.stringify(body).slice(0, 300));
  return ok;
};

const sendTelegram = async (
  o: FiledOrder,
  env: Record<string, string | undefined>
): Promise<boolean> => {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return false;
  const { ok, body } = await fetchJson(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text: orderTelegramMessage(o),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    }
  );
  if (!ok) console.error("[order] telegram failed:", JSON.stringify(body).slice(0, 300));
  return ok;
};

type Env = Record<string, string | undefined>;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    /* Preflight for the static site's POST */
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(env) });
    }
    if (request.method !== "POST") {
      return json({ ok: false, error: "method" }, 405, cors(env));
    }

    /* If the atelier pinned an origin, hold the door. */
    if (env.ALLOWED_ORIGIN) {
      const origin = request.headers.get("origin");
      if (origin && origin !== env.ALLOWED_ORIGIN) {
        return json({ ok: false, error: "origin" }, 403, cors(env));
      }
    }

    const ip =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      "local";

    try {
      const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

      /* Honeypot — bots get a polite success and silence. */
      if (str(body?.company, 200)) {
        return json(
          { ok: true, ref: "SD-" + Math.random().toString(36).slice(2, 7).toUpperCase() },
          200,
          cors(env)
        );
      }

      if (limited(ip)) {
        return json(
          { ok: false, error: "درخواست‌های زیاد — کمی بعد دوباره تلاش کنید" },
          429,
          cors(env)
        );
      }

      const brandName = str(body?.brandName, 120);
      const contactName = str(body?.contactName, 120);
      const contactMethod = str(body?.contactMethod, 160);
      if (!brandName || !contactName || !contactMethod) {
        return json({ ok: false, error: "نام برند و راه تماس لازم است" }, 400, cors(env));
      }

      const order = {
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

      const [emailOk, telegramOk] = await Promise.all([
        sendEmail(order, env),
        sendTelegram(order, env),
      ]);

      const landed = [...(emailOk ? ["email"] : []), ...(telegramOk ? ["telegram"] : [])];
      if (!landed.length) {
        console.error(`[order] ${order.ref}: no channel delivered — check Worker secrets`);
        return json({ ok: false, error: "no channel" }, 500, cors(env));
      }

      return json({ ok: true, ref: order.ref, landed }, 200, cors(env));
    } catch {
      return json({ ok: false, error: "خطای سرور" }, 500, cors(env));
    }
  },
};
