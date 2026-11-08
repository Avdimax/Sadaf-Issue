#!/usr/bin/env bash
# deploy-gh-pages.sh — build the static site and force-push it to the
# `gh-pages` branch of origin. Use when Pages is set to
# "Deploy from a branch → gh-pages / (root)".
#
#   bun run deploy:pages          # auto base path from the git remote
#   BASE_PATH=none bun run deploy:pages   # custom domain / user site
#
# (If Pages is set to "GitHub Actions" instead, just push to main —
# .github/workflows/deploy.yml handles everything.)
set -euo pipefail
cd "$(dirname "$0")/.."

ROOT="$(pwd)"
REMOTE_NAME="${REMOTE:-origin}"
REMOTE_URL="$(git remote get-url "$REMOTE_NAME" 2>/dev/null)" || {
  echo "✗ no git remote '$REMOTE_NAME' — push the repo to GitHub first"; exit 1; }

bash scripts/build-static.sh

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
cp -r out/. "$WORK"/
cd "$WORK"

git init -q
git checkout -q -b gh-pages
git add -A
git -c user.name="atelier-deploy" -c user.email="deploy@atelier.local" \
  commit -qm "atelier static build $(date -u +%FT%TZ) [skip ci]"

echo "── pushing gh-pages → $REMOTE_URL ──"
git push --force "$REMOTE_URL" gh-pages:gh-pages

echo ""
echo "✔ done — GitHub Pages serves the gh-pages branch at / (root)."
echo "  If images are still missing, check the Pages URL sub-path and rebuild"
echo "  with BASE_PATH=/repo-name (or BASE_PATH=none for a custom domain)."
