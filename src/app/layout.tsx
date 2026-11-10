import type { Metadata, Viewport } from "next";
import { asset } from "@/lib/asset";
import { Vazirmatn, Markazi_Text, Noto_Nastaliq_Urdu, Manrope } from "next/font/google";
import "./globals.css";

/* ── The Farsi typographic system (slim: 7 font files instead of ~30) ──
   Vazirmatn  — variable geometric sans: one file covers every weight
   Markazi    — editorial Farsi serif for elegant sub-lines (400 + 500)
   Nastaliq   — calligraphy for signature moments (400 + 700)
   Manrope    — variable Latin sans for tracked-cap labels                  */
const vazir = Vazirmatn({
  variable: "--font-vazir",
  subsets: ["arabic", "latin"],
  display: "swap",
});

const markazi = Markazi_Text({
  variable: "--font-markazi",
  subsets: ["arabic", "latin"],
  weight: ["400", "500"],
  display: "swap",
});

const nastaliq = Noto_Nastaliq_Urdu({
  variable: "--font-nastaliq",
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "آتلیه صدف — طراح لوگو و هویت بصری",
  description:
    "پرتفولیوی شخصیِ صدف — طراح لوگو و صنعتگر هویت. چهار برند، چهار صدف: عطر اکسین، کافه هور، آکادمی نورث‌پیک و چای سُها. نشان‌هایی برای برندهایی که آرام حرف می‌زنند.",
  keywords: ["طراحی لوگو", "هویت بصری", "طراحی گرافیک", "پرتفولیو", "برندینگ"],
  authors: [{ name: "صدف" }],
  icons: { icon: asset("/work/oxin-gold.png") },
  openGraph: {
    title: "آتلیه صدف — طراح لوگو و هویت بصری",
    description: "صدف‌های نشان‌ها — صنعتگریِ هویت برای برندهایی که آرام حرف می‌زنند.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#F5F6F8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      suppressHydrationWarning
      style={{ "--grain": `url(${asset("/grain.png")})` } as React.CSSProperties}
    >
      <body
        className={`${vazir.variable} ${markazi.variable} ${nastaliq.variable} ${manrope.variable} antialiased bg-pearl text-ink`}
      >
        {children}
      </body>
    </html>
  );
}
