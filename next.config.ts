import type { NextConfig } from "next";

/**
 * Two builds, one repo:
 *  · bun run dev / start  — full Next host (standalone server + /api/order)
 *  · STATIC_EXPORT=1      — GitHub Pages export (`bun run build:static`)
 *
 * STATIC_EXPORT parks the API route (scripts/build-static.sh), exports
 * pure static files to ./out, and turns off next/image optimization
 * (Pages has no image optimizer).
 */
const isStaticExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  ...(isStaticExport
    ? { output: "export" as const }
    : { output: "standalone" as const }),
  ...(basePath ? { basePath } : {}),
  poweredByHeader: false,
  images: isStaticExport
    ? { unoptimized: true } // Pages has no image optimizer — ship files as-is
    : {
        qualities: [75, 80, 85],
        // negotiate the smallest modern format first
        formats: ["image/avif", "image/webp"],
        minimumCacheTTL: 60 * 60 * 24 * 30,
      },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
