/**
 * order-email.ts — turns a filed brief into the two things the atelier
 * actually receives: a Gmail-safe RTL email and a Telegram message.
 *
 * Zero dependencies (plain string templates) so the serverless function
 * stays tiny and cold-starts fast. All styling is inline — Gmail and
 * most clients strip <style> blocks, so every rule lives on its element.
 */

export type FiledOrder = {
  ref: string;
  brandName: string;
  industry: string | null;
  businessDesc: string | null;
  audience: string | null;
  personality: string[];
  visualStyle: string | null;
  colorsLove: string[];
  colorsAvoid: string | null;
  usageAreas: string[];
  timeline: string | null;
  budget: string | null;
  contactName: string;
  contactMethod: string;
  links: string | null;
  createdAt: string; // ISO
};

/* ── palette (matches the site: pearl / ink / ocean / silver) ── */
const PEARL = "#F5F6F8";
const CARD = "#FFFFFF";
const INK = "#16233A";
const INK_SOFT = "#4D5C72";
const INK_FAINT = "#707E92";
const OCEAN = "#1D4066";
const HAIRLINE = "#DDE3EA";

const FONT = "Tahoma, 'Segoe UI', Arial, sans-serif";

const esc = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const faDate = (iso: string): string => {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Asia/Tehran",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

type Row = { label: string; value: string };

/** Groups shown in the email — empties are dropped whole. */
const groups = (o: FiledOrder): { title: string; rows: Row[] }[] => {
  const j = (xs: string[]) => (xs.length ? xs.join("، ") : "");
  return [
    {
      title: "برند",
      rows: [
        { label: "نامِ برند", value: o.brandName },
        { label: "حوزه‌ی فعالیت", value: o.industry ?? "" },
        { label: "روایتِ برند", value: o.businessDesc ?? "" },
        { label: "مخاطبِ اصلی", value: o.audience ?? "" },
      ],
    },
    {
      title: "هویتِ بصری",
      rows: [
        { label: "شخصیتِ برند", value: j(o.personality) },
        { label: "سبکِ بصری", value: o.visualStyle ?? "" },
        { label: "رنگ‌های محبوب", value: j(o.colorsLove) },
        { label: "رنگ‌های ممنوع", value: o.colorsAvoid ?? "" },
      ],
    },
    {
      title: "کاربرد و شرایط",
      rows: [
        { label: "کاربردها", value: j(o.usageAreas) },
        { label: "بازه‌ی زمانی", value: o.timeline ?? "" },
        { label: "بودجه", value: o.budget ?? "" },
      ],
    },
    {
      title: "تماس",
      rows: [
        { label: "نام", value: o.contactName },
        { label: "ایمیل / موبایل", value: o.contactMethod },
        { label: "پیوندها", value: o.links ?? "" },
      ],
    },
  ]
    .map((g) => ({ ...g, rows: g.rows.filter((r) => r.value.trim()) }))
    .filter((g) => g.rows.length);
};

/* ── The email ─────────────────────────────────────────────── */

export const orderSubject = (o: FiledOrder): string =>
  `سفارشِ جدید · ${o.brandName} · ${o.ref}`;

export const orderEmailHtml = (o: FiledOrder): string => {
  const sections = groups(o)
    .map((g) => {
      const rows = g.rows
        .map((r, i) => {
          const last = i === g.rows.length - 1 ? "" : `border-bottom:1px solid #E9EDF2;`;
          return `
            <tr>
              <td style="${last}padding:12px 20px;">
                <div style="font-family:${FONT};font-size:11px;color:${INK_FAINT};margin:0 0 4px 0;">${esc(r.label)}</div>
                <div style="font-family:${FONT};font-size:14px;line-height:1.9;color:${INK};margin:0;">${esc(r.value)}</div>
              </td>
            </tr>`;
        })
        .join("");
      return `
      <tr>
        <td style="padding:0 28px 22px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CARD};border:1px solid ${HAIRLINE};border-radius:10px;">
            <tr>
              <td style="padding:14px 20px 6px 20px;border-bottom:1px solid ${HAIRLINE};">
                <span style="font-family:${FONT};font-size:12px;font-weight:bold;color:${OCEAN};letter-spacing:1px;">${esc(g.title)}</span>
              </td>
            </tr>
            ${rows}
          </table>
        </td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(orderSubject(o))}</title></head>
<body style="margin:0;padding:0;background:${PEARL};">
  <div dir="rtl" style="background:${PEARL};padding:28px 8px;font-family:${FONT};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;">

          <!-- Masthead -->
          <tr>
            <td style="padding:0 28px 18px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${INK};border-radius:12px;">
                <tr>
                  <td style="padding:22px 24px;color:${PEARL};">
                    <div style="font-family:${FONT};font-size:11px;letter-spacing:2px;color:#A8C4DE;margin:0 0 8px 0;">آتلیه‌ی صدف · نشان‌سازی</div>
                    <div style="font-family:${FONT};font-size:22px;font-weight:bold;color:#FFFFFF;margin:0 0 10px 0;">سفارشِ نشانِ جدید</div>
                    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                      <td style="background:#24354F;border-radius:6px;padding:6px 14px;font-family:${FONT};font-size:13px;color:#DDE3EA;letter-spacing:2px;">${esc(o.ref)}</td>
                    </tr></table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${sections}

          <!-- Footer -->
          <tr>
            <td style="padding:2px 28px 10px 28px;">
              <div style="font-family:${FONT};font-size:11px;line-height:1.9;color:${INK_FAINT};text-align:center;">
                ثبت‌شده در ${esc(faDate(o.createdAt))} — از فرمِ سفارشِ سایت<br>
                پاسخ به مشتری ظرف ۴۸ ساعت
              </div>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </div>
</body>
</html>`;
};

export const orderEmailText = (o: FiledOrder): string => {
  const lines: string[] = [
    `سفارشِ جدید · ${o.brandName} · ${o.ref}`,
    `ثبت: ${faDate(o.createdAt)}`,
    "",
  ];
  for (const g of groups(o)) {
    lines.push(`— ${g.title} —`);
    for (const r of g.rows) lines.push(`${r.label}: ${r.value}`);
    lines.push("");
  }
  return lines.join("\n");
};

/* ── Telegram (HTML parse mode) ────────────────────────────── */

export const orderTelegramMessage = (o: FiledOrder): string => {
  const b = (s: string) => `<b>${esc(s)}</b>`;
  const j = (xs: string[]) => xs.join("، ");
  const parts: string[] = [
    `🎭 ${b("سفارشِ جدید")} — <code>${esc(o.ref)}</code>`,
    "",
    `${b("برند:")} ${esc(o.brandName)}`,
  ];
  if (o.industry) parts.push(`${b("حوزه:")} ${esc(o.industry)}`);
  if (o.personality.length) parts.push(`${b("شخصیت:")} ${esc(j(o.personality))}`);
  if (o.visualStyle) parts.push(`${b("سبک:")} ${esc(o.visualStyle)}`);
  if (o.colorsLove.length) parts.push(`${b("رنگ‌ها:")} ${esc(j(o.colorsLove))}`);
  if (o.usageAreas.length) parts.push(`${b("کاربرد:")} ${esc(j(o.usageAreas))}`);
  if (o.timeline) parts.push(`${b("زمان:")} ${esc(o.timeline)}`);
  if (o.budget) parts.push(`${b("بودجه:")} ${esc(o.budget)}`);
  if (o.businessDesc) parts.push(`\n<i>${esc(o.businessDesc.slice(0, 220))}</i>`);
  parts.push("", `👤 ${esc(o.contactName)}`, `📞 ${esc(o.contactMethod)}`);
  if (o.links) parts.push(`🔗 ${esc(o.links.slice(0, 300))}`);
  parts.push("", `<i>${esc(faDate(o.createdAt))}</i>`);
  return parts.join("\n");
};
