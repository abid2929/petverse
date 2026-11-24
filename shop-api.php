<?php
/* PetVerse public API: place order, track order, visit counter. */
declare(strict_types=1);
require __DIR__ . '/inc/store.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
function out($a, int $c = 200): void { http_response_code($c); echo json_encode($a, JSON_UNESCAPED_UNICODE); exit; }
function body(): array { $j = json_decode((string)file_get_contents('php://input'), true); return is_array($j) ? $j : []; }
function limited(string $key, int $max, int $win): bool {
  $hit = false; $k = $key . ':' . hash('sha256', pv_ip() . 'pv');
  pv_update('rate', function ($r) use ($k, $max, $win, &$hit) {
    $now = time(); foreach ($r as $kk => $ts) { $r[$kk] = array_values(array_filter((array)$ts, fn($t) => $t > $now - 3600)); if (!$r[$kk]) unset($r[$kk]); }
    $recent = array_filter($r[$k] ?? [], fn($t) => $t > $now - $win);
    if (count($recent) >= $max) { $hit = true; return $r; }
    $r[$k][] = $now; return $r;
  });
  return $hit;
}
$a = $_GET['a'] ?? '';

if ($a === 'order' && $_SERVER['REQUEST_METHOD'] === 'POST') {
  $b = body();
  if (!empty($b['website'])) out(['ok' => 1, 'no' => 'PV-OK']);                 // honeypot: bots fill it
  if (limited('order', 5, 600)) out(['error' => 'Too many orders. Please call us.'], 429);
  $name = trim(mb_substr((string)($b['name'] ?? ''), 0, 80));
  $phone = pv_phone((string)($b['phone'] ?? ''));
  $addr = trim(mb_substr((string)($b['address'] ?? ''), 0, 300));
  $area = ($b['area'] ?? '') === 'out' ? 'out' : 'in';
  $pay = in_array($b['pay'] ?? '', ['cod', 'bkash', 'nagad'], true) ? $b['pay'] : 'cod';
  if ($name === '' || $addr === '' || !pv_valid_phone($phone)) out(['error' => 'Please give your name, a valid 11-digit phone number and address.'], 400);
  $prods = pv_all_products(); $items = []; $sub = 0;
  foreach ((array)($b['items'] ?? []) as $it) {
    $id = (string)($it['id'] ?? ''); $q = max(1, min(50, (int)($it['q'] ?? 1)));
    if (!isset($prods[$id]) || !empty($prods[$id]['off']) || empty($prods[$id]['p'])) continue;
    $x = $prods[$id];
    $items[] = ['id' => $id, 'n' => $x['n'], 'b' => $x['b'] ?? '', 'q' => $q, 'p' => (int)$x['p'], 'i' => $x['i'] ?? '', 'v' => mb_substr((string)($it['v'] ?? ''), 0, 40)];
    $sub += $q * (int)$x['p'];
  }
  if (!$items) out(['error' => 'Your cart is empty.'], 400);
  $site = pv_read('site'); $d = $site['delivery'] ?? [];
  $ship = $area === 'out' ? (int)($d['outside'] ?? 130) : (int)($d['inside'] ?? 70);
  if (!empty($d['free_over']) && $sub >= (int)$d['free_over']) $ship = 0;
  $order = ['no' => 'PV-' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 6)), 't' => time(), 'name' => $name, 'phone' => $phone, 'address' => $addr, 'area' => $area,
    'note' => trim(mb_substr((string)($b['note'] ?? ''), 0, 300)), 'pay' => $pay, 'trx' => trim(mb_substr((string)($b['trx'] ?? ''), 0, 40)),
    'items' => $items, 'sub' => $sub, 'ship' => $ship, 'total' => $sub + $ship, 'status' => 'pending', 'src' => 'website'];
  pv_update('orders', function ($o) use ($order) { array_unshift($o, $order); return $o; });
  // stock
  $need = []; foreach ($items as $it) $need[$it['id']] = ($need[$it['id']] ?? 0) + $it['q'];
  pv_update('products', function ($P) use ($need) {
    foreach ($P as $k => $list) foreach ($list as $j => $x) {
      $id = (string)($x['id'] ?? $k . $j);
      if (isset($need[$id]) && isset($x['st']) && $x['st'] !== '') $P[$k][$j]['st'] = max(0, (int)$x['st'] - $need[$id]);
    }
    return $P;
  });
  $sec = pv_read('secrets'); $store = $site['store']['name'] ?? 'PetVerse';
  if (!empty($sec['sms_on_order'])) {
    pv_sms($phone, "Thank you! Your $store order {$order['no']} (Tk {$order['total']}) is received. We will call you soon.");
    if (!empty($sec['sms_admin'])) pv_sms((string)$sec['sms_admin'], "New order {$order['no']}: Tk {$order['total']}, $name $phone");
  }
  pv_capi('Purchase', $order);
  out(['ok' => 1, 'no' => $order['no'], 'total' => $order['total'], 'ship' => $ship]);
}

if ($a === 'track') {
  if (limited('track', 20, 600)) out(['error' => 'Too many tries.'], 429);
  $no = strtoupper(trim((string)($_GET['no'] ?? ''))); $ph = pv_phone((string)($_GET['phone'] ?? ''));
  foreach (pv_read('orders') as $o) if ($o['no'] === $no && $o['phone'] === $ph)
    out(['ok' => 1, 'no' => $o['no'], 'status' => $o['status'], 't' => $o['t'], 'total' => $o['total'], 'items' => count($o['items']), 'track' => $o['courier']['code'] ?? null]);
  out(['error' => 'No order found with this number and phone.'], 404);
}

if ($a === 'hit') {   // privacy-friendly visit counter (no cookies, hashed IP)
  $v = substr(hash('sha256', pv_ip() . ($_SERVER['HTTP_USER_AGENT'] ?? '') . date('Ymd')), 0, 12);
  $page = substr(preg_replace('/[^a-z0-9#\-_\/]/i', '', (string)($_GET['p'] ?? '/')), 0, 40);
  pv_update('visits', function ($s) use ($v, $page) {
    $d = date('Y-m-d'); $s['days'][$d][$v] = 1; $s['live'][$v] = time();
    $s['days'] = array_slice($s['days'] ?? [], -60, null, true);
    foreach ($s['live'] as $k => $t) if ($t < time() - 300) unset($s['live'][$k]);
    $s['pages'][$page] = ($s['pages'][$page] ?? 0) + 1;
    return $s;
  });
  out(['ok' => 1]);
}
out(['error' => 'Unknown'], 404);
