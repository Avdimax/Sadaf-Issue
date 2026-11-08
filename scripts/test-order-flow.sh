#!/usr/bin/env bash
# test-order-flow.sh — exercises the /api/order contract end-to-end.
set -uo pipefail
cd "$(dirname "$0")/.."

URL="http://localhost:3000/api/order"
BRIEF='{
  "brandName": "اکسین",
  "industry": "عطر و لوکس",
  "businessDesc": "برندی برای چای و دمنش‌های خاص",
  "audience": "خانم‌های ۲۵ تا ۴۰ سال، تهران",
  "personality": ["لوکس", "مینیمال"],
  "visualStyle": "هندسی",
  "colorsLove": ["طلایی", "سرمه‌ای"],
  "colorsAvoid": "بنفش",
  "usage": ["بسته‌بندی", "وب و اپلیکیشن"],
  "timeline": "حدودِ یک ماه",
  "budget": "۱۵ تا ۳۰ میلیون",
  "contactName": "صدف",
  "contactMethod": "hello@sadaf.design"
}'

say() { printf "\n── %s ──\n" "$1"; }

say "1) valid brief → expect ok:true + landed drawer"
curl -s -X POST "$URL" -H 'Content-Type: application/json' -d "$BRIEF"
echo

say "2) honeypot filled → expect instant ok:true (bot silenced)"
curl -s -X POST "$URL" -H 'Content-Type: application/json' -d '{"brandName":"x","contactName":"bot","contactMethod":"bot@x.com","company":"spammy spam"}'
echo

say "3) missing brandName → expect 400"
curl -s -o /tmp/r3 -w "HTTP %{http_code} " -X POST "$URL" -H 'Content-Type: application/json' -d '{"contactName":"x","contactMethod":"y"}'
cat /tmp/r3; echo

say "4) malformed JSON → expect 500 handled gracefully"
curl -s -o /tmp/r4 -w "HTTP %{http_code} " -X POST "$URL" -H 'Content-Type: application/json' -d '{not json'
cat /tmp/r4; echo

say "5) rate limit — 5 more rapid valid posts, 6th should 429"
for i in 1 2 3 4 5; do
  curl -s -o /dev/null -w "%{http_code} " -X POST "$URL" -H 'Content-Type: application/json' -d "$BRIEF"
done
echo "(6th:) $(curl -s -o /tmp/r5 -w '%{http_code}' -X POST "$URL" -H 'Content-Type: application/json' -d "$BRIEF")"
cat /tmp/r5; echo

say "6) drawer rows count (SQLite)"
python3 - <<'PY'
import sqlite3
con = sqlite3.connect("/home/z/my-project/db/custom.db")
n = con.execute("select count(*) from OrderBrief").fetchone()[0]
print(f"OrderBrief rows: {n}")
for r in con.execute("select ref, brandName, contactMethod, createdAt from OrderBrief order by createdAt desc limit 3"):
    print("  ", r)
PY
echo "done."
