/**
 * asset.ts — build-time base-path prefix for public assets.
 *
 * GitHub Pages project sites live under a sub-path
 * (username.github.io/repo-name/), but Next's static export leaves
 * `next/image` srcs (unoptimized), inline `url(…)` styles and favicon
 * hrefs root-absolute. Baking the prefix in at build time makes the
 * same code work at any path — including the root.
 *
 * NEXT_PUBLIC_BASE_PATH is inlined by the compiler into both server
 * and client bundles, so this is a zero-runtime-cost string concat.
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const asset = (path: string): string => `${BASE}${path}`;
