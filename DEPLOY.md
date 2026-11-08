# Deploying the Atelier — GitHub Pages + one tiny endpoint

The site is 99% static; the only server-side moment is the سفارش (order)
brief turning into an email in the owner's inbox. **No backend framework
is needed — you need one endpoint, not an application.**

```
GitHub Pages ── static site (out/)
      │
      └─ POST brief JSON ──► ONE endpoint ──► email to owner (+ Telegram)
```

The front-end posts the exact same JSON everywhere; only the URL differs:

```
NEXT_PUBLIC_ORDER_ENDPOINT = https://…   # set at build time
# unset → falls back to /api/order (local dev / full Next host)
```

## Pick your endpoint

| | Setup | Cost | Maintenance | Notes |
|---|---|---|---|---|
| **Cloudflare Worker** *(recommended)* | `cd worker && bunx wrangler deploy` | free (100k/day) | none | Full control: keeps the beautiful RTL email, ref codes, Telegram push, honeypot, rate limit. Code already in `worker/`. |
| **Formspree** | formspree.io → new form → copy endpoint | free (50/mo) | none | Zero code. They email a field dump (less pretty). Good stopgap. |
| **PHP on cPanel** | upload `php/order.php`, fill config | ~hosting | none | If you already have Iranian shared hosting: uses its `mail()` + optional Telegram. No sanctions/platform risk. |
| **Laravel** | VPS + deploy + updates + SSL | ~VPS | real | Only if you *want* a server app: build one route accepting this JSON → `Mail::send`. Overkill for one form, but the contract above is all it needs. |

> Honest take: Laravel means running, patching and securing a whole second
> application so one form can send mail. The Worker (or the PHP file) does
> the same job in ~200 lines with nothing to keep alive.

## Deploy the static site

1. Push the repo to GitHub.
2. **Settings → Pages → Source: GitHub Actions** (once).
3. Push to `main` — `.github/workflows/deploy.yml` builds `out/` and deploys.
4. Set repository **variables** (Settings → Secrets and variables → Actions
   → *Variables* — not secrets, the URL isn't sensitive):
   - `ORDER_ENDPOINT` — your endpoint URL from the table above.
   - `BASE_PATH` — `none` if you attach a custom domain (empty base path);
     otherwise the workflow auto-derives `/repo-name` for project sites.

The workflow uses Bun, uploads `out/`, and `public/.nojekyll` is in place
so GitHub Pages doesn't swallow the `_next/` assets.

### Option A — Cloudflare Worker (recommended)

```bash
cd worker
bunx wrangler login
bunx wrangler secret put RESEND_API_KEY     # resend.com API key
bunx wrangler secret put OWNER_EMAIL        # where orders land
bunx wrangler secret put TELEGRAM_BOT_TOKEN # optional — @BotFather
bunx wrangler secret put TELEGRAM_CHAT_ID   # optional — @userinfobot
bunx wrangler deploy                        # → https://sadaf-order.<account>.workers.dev
```

Then set `wrangler.toml` → `ALLOWED_ORIGIN` to your Pages URL, redeploy,
and put the worker URL into the `ORDER_ENDPOINT` variable.

Resend note: `RESEND_FROM` needs a domain you verify at resend.com
(until then the sandbox `onboarding@resend.dev` works, owner-only).
Telegram needs no signup beyond BotFather — and it's the channel that
works from Iran without any friction.

### Option B — Formspree

1. formspree.io → New form → it gives you `https://formspree.io/f/xxxxx`.
2. That URL becomes `ORDER_ENDPOINT`. Done — they email every field.

### Option C — PHP (cPanel / shared hosting)

1. Upload `php/order.php` to e.g. `https://your-host.ir/order/order.php`.
2. Edit the `CFG` block: `owner_email`, `from_email`, Telegram keys,
   `allowed_origin` (your Pages URL).
3. That URL becomes `ORDER_ENDPOINT`.

## Local development stays unchanged

- `bun dev` — full site + `/api/order`; orders land in SQLite (`db/custom.db`).
  Add `RESEND_API_KEY`/`OWNER_EMAIL` in `.env` to also get real emails locally.
- `bun run build:static` — exports `out/` (parks the API route automatically,
  restores it after). Test anywhere: `bunx npx serve out` or push to Pages.
- `bun run start` — the standalone full server (if you ever drop Pages and
  host the whole Next app on a Node platform, the current API route just works).

## Troubleshooting: "the site shows plain text / no images"

That symptom = **asset paths 404-ing** — the page loads, but its CSS, JS
and images don't. On GitHub Pages it's almost always a **base-path
mismatch**:

- A *project site* is served at `username.github.io/repo-name/` — a
  sub-path. If the build assumed the site root, every `/_next/...`
  URL misses by `/repo-name` → text-only page.
- All asset references now go through a build-time `asset()` helper
  (`src/lib/asset.ts`), and `scripts/build-static.sh` **auto-derives the
  base path from your git remote**, so this can't happen silently anymore.

Fixes, pick one:

1. **Recommended:** let the workflow deploy (Pages → Source: *GitHub
   Actions*). It derives the base path itself. Push to `main`, done.
2. Manual: `bun run deploy:pages` — builds with the auto-derived base
   path and force-pushes `out/` to the `gh-pages` branch. Pages must be
   set to "Deploy from a branch → gh-pages / (root)".
3. Custom domain or user site (`username.github.io` repo): build with
   `BASE_PATH=none` — the site lives at the root, so no prefix.

Verify before pushing: open DevTools → Network tab on the live page; every
CSS/JS/image request must be 200, and the URLs must start with
`/repo-name/` on a project site.

## The JSON contract (all endpoints)

```jsonc
POST / (Content-Type: application/json)
{
  "brandName": "اکسین",            // required
  "contactName": "…",              // required
  "contactMethod": "…",            // required (email or phone)
  "industry": "", "businessDesc": "", "audience": "",
  "personality": ["لوکس", "مینیمال"],
  "visualStyle": "", "colorsLove": ["طلایی"], "colorsAvoid": "",
  "usage": ["بسته‌بندی"], "timeline": "", "budget": "",
  "company": ""                    // honeypot — bots fill it, humans never
}
→ 200 { "ok": true, "ref": "SD-XXXXX" }
→ 400 { "ok": false, "error": "…" }   // validation
→ 429                                    // rate limited (5 / 10 min / IP)
```
