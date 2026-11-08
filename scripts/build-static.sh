#!/usr/bin/env bash
# build-static.sh — export the atelier as a pure static site for GitHub Pages.
#
#   bun run build:static
#
# The base path (GitHub Pages project sites live at /repo-name) is
# resolved in this order:
#   1. BASE_PATH env       — explicit: "/anything", or "none" for site root
#                            (user sites user.github.io, custom domains)
#   2. NEXT_PUBLIC_BASE_PATH — if you exported it yourself ("" = root)
#   3. auto — derived from the git origin (project repo → /repo-name,
#            owner.github.io repo → root)
#
# The API route can't ride along on Pages, so it is parked during the
# export and restored afterwards; local dev and `bun start` keep working.
set -euo pipefail
cd "$(dirname "$0")/.."

API="src/app/api"
PARKED=".api-parked"

# Recover from an interrupted previous run
if [ -d "$PARKED" ]; then
  rm -rf "$API"
  mv "$PARKED" "$API"
fi

if [ -d "$API" ]; then
  mv "$API" "$PARKED"
  trap 'mv "$PARKED" "$API" 2>/dev/null || true' EXIT
fi

# ── resolve the base path ──
resolve_base() {
  if [ -n "${BASE_PATH:-}" ]; then
    if [ "$BASE_PATH" = "none" ]; then
      export NEXT_PUBLIC_BASE_PATH=""
    else
      export NEXT_PUBLIC_BASE_PATH="$BASE_PATH"
    fi
    return
  fi
  if [ -n "${NEXT_PUBLIC_BASE_PATH:-}" ]; then
    return # caller already chose (may be empty = root)
  fi
  local remote owner repo
  remote="$(git remote get-url origin 2>/dev/null || true)"
  if [ -n "$remote" ]; then
    remote="${remote#ssh://git@github.com/}"
    remote="${remote#https://github.com/}"
    remote="${remote#git@github.com:}"
    remote="${remote#http://github.com/}"
    remote="${remote%/}"
    remote="${remote%.git}"
    if [[ "$remote" == */* ]]; then
      owner="$(dirname "$remote")"
      repo="$(basename "$remote")"
      if [ "$repo" = "$owner.github.io" ] || [ "$repo" = "gh-pages" ]; then
        export NEXT_PUBLIC_BASE_PATH=""
      else
        export NEXT_PUBLIC_BASE_PATH="/$repo"
      fi
    fi
  fi
}
resolve_base

echo "── base path: '${NEXT_PUBLIC_BASE_PATH:-}' (empty = site root) ──"

STATIC_EXPORT=1 bunx next build

echo ""
echo "✔ static site exported → out/"
echo "  · out/.nojekyll present (stops GitHub Pages eating _next/)"
echo "  · deploy via .github/workflows/deploy.yml (Pages → GitHub Actions),"
echo "    or scripts/deploy-gh-pages.sh (Pages → gh-pages branch, / (root))"
