<?php
/**
 * order.php — the atelier's single endpoint for shared cPanel hosting.
 *
 * Upload this ONE file anywhere on your host (e.g. https://your-host.ir/order/order.php),
 * fill the config block below, and set the static site's
 * NEXT_PUBLIC_ORDER_ENDPOINT to its URL. No framework, no database —
 * the mail() of your cPanel delivers the order, optionally pushed to Telegram.
 *
 * Same JSON contract as the Next API route and the Cloudflare Worker:
 *   POST { brandName, contactName, contactMethod, ... , company: "" }
 *   → { ok: true, ref: "SD-XXXXX" }
 */

/* ── config ─────────────────────────────────────────────── */
const CFG = [
    'owner_email'   => 'hello@sadaf.design',            // ← where orders land
    'from_email'    => 'orders@your-host.ir',           // ← a mailbox on THIS host
    'from_name'     => 'Atelier Orders',
    // Telegram (optional — instant, free, works everywhere)
    'telegram_bot_token' => '',                          // from @BotFather
    'telegram_chat_id'   => '',                          // your chat id
    // Lock the endpoint to your GitHub Pages origin (empty = allow all)
    'allowed_origin'     => 'https://yourname.github.io',
];
/* ───────────────────────────────────────────────────────── */

header('Content-Type: application/json; charset=utf-8');

if (CFG['allowed_origin']) {
    header('Access-Control-Allow-Origin: ' . CFG['allowed_origin']);
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Vary: Origin');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method']); exit;
}

/* Honeypot — bots get a polite success and silence. */
$in = json_decode(file_get_contents('php://input'), true) ?: [];
if (!empty(trim((string)($in['company'] ?? '')))) {
    echo json_encode(['ok' => true, 'ref' => 'SD-' . strtoupper(bin2hex(random_bytes(3)))]); exit;
}

/* Rate limit — 5 orders / 10 min / IP via a temp-file counter. */
$ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? ($_SERVER['REMOTE_ADDR'] ?? 'x');
$rlFile = sys_get_temp_dir() . '/order_rl_' . preg_replace('/[^a-f0-9]/i', '', $ip) . '.json';
$now = time();
$rl = json_decode((string)@file_get_contents($rlFile), true) ?: [];
$rl = array_values(array_filter($rl, static fn($t) => ($now - (int)$t) < 600));
if (count($rl) >= 5) {
    http_response_code(429);
    echo json_encode(['ok' => false, 'error' => 'درخواست‌های زیاد — کمی بعد دوباره تلاش کنید']); exit;
}
$rl[] = $now;
@file_put_contents($rlFile, json_encode($rl));

/* Validation — same three essentials as the other endpoints. */
$brand   = trim((string)($in['brandName'] ?? ''));
$name    = trim((string)($in['contactName'] ?? ''));
$contact = trim((string)($in['contactMethod'] ?? ''));
if (!$brand || !$name || !$contact) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'نام برند و راه تماس لازم است']); exit;
}

$ref = 'SD-' . strtoupper(bin2hex(random_bytes(3)));

/* Build the plain-text order (shared hosts' mail() is happiest plain). */
$row = static fn(string $l, ?string $v): string => ($v && trim($v) !== '' ? ($l . ': ' . trim($v) . "\n") : '');
$join = static fn($v): string => (is_array($v) ? implode('، ', array_map('trim', $v)) : (string)$v);

$body = "سفارشِ نشانِ جدید — {$ref}\n"
      . "تاریخ: " . date('Y/m/d H:i') . "\n\n"
      . "— برند —\n"
      . $row('نامِ برند', $brand)
      . $row('حوزه‌ی فعالیت', $in['industry'] ?? '')
      . $row('روایتِ برند', $in['businessDesc'] ?? '')
      . $row('مخاطبِ اصلی', $in['audience'] ?? '')
      . "\n— هویتِ بصری —\n"
      . $row('شخصیتِ برند', $join($in['personality'] ?? ''))
      . $row('سبکِ بصری', $in['visualStyle'] ?? '')
      . $row('رنگ‌های محبوب', $join($in['colorsLove'] ?? ''))
      . $row('رنگ‌های ممنوع', $in['colorsAvoid'] ?? '')
      . "\n— کاربرد و شرایط —\n"
      . $row('کاربردها', $join($in['usage'] ?? ''))
      . $row('بازه‌ی زمانی', $in['timeline'] ?? '')
      . $row('بودجه', $in['budget'] ?? '')
      . "\n— تماس —\n"
      . $row('نام', $name)
      . $row('ایمیل / موبایل', $contact)
      . $row('پیوندها', $in['links'] ?? '');

$subject = '=?UTF-8?B?' . base64_encode("سفارشِ جدید · {$brand} · {$ref}") . '?=';
$headers = 'From: =?UTF-8?B?' . base64_encode(CFG['from_name']) . "?= <" . CFG['from_email'] . ">\r\n"
         . "Content-Type: text/plain; charset=UTF-8\r\n"
         . "Reply-To: " . (filter_var($contact, FILTER_VALIDATE_EMAIL) ? $contact : CFG['from_email']) . "\r\n"
         . "X-Mailer: atelier-order";

$emailOk = @mail(CFG['owner_email'], $subject, $body, $headers);

/* Optional Telegram push — failure never blocks the response. */
$tgOk = false;
if (CFG['telegram_bot_token'] && CFG['telegram_chat_id']) {
    $tg = "🎭 سفارشِ جدید — {$ref}\n"
        . "برند: {$brand}\n"
        . "حوزه: " . ($in['industry'] ?? '—') . "\n"
        . "شخصیت: " . $join($in['personality'] ?? []) . "\n"
        . "سبک: " . ($in['visualStyle'] ?? '—') . "\n"
        . "بودجه: " . ($in['budget'] ?? '—') . "\n\n"
        . "👤 {$name}\n📞 {$contact}";
    $ch = curl_init('https://api.telegram.org/bot' . CFG['telegram_bot_token'] . '/sendMessage');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query([
            'chat_id' => CFG['telegram_chat_id'],
            'text' => $tg,
            'disable_web_page_preview' => '1',
        ]),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 5,
    ]);
    $res = curl_exec($ch);
    $tgOk = is_string($res) && str_contains($res, '"ok":true');
    curl_close($ch);
}

if (!$emailOk && !$tgOk) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'ارسال انجام نشد']); exit;
}

echo json_encode(['ok' => true, 'ref' => $ref]);
