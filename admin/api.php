<?php
/* PetVerse admin API (JSON). Storage helpers: ../inc/store.php */
declare(strict_types=1);
require dirname(__DIR__) . '/inc/store.php';
// Forgot login: upload an empty reset-admin.txt to the site folder. The next /admin visit removes all admin logins and the file.
foreach (['reset-admin.txt', 'RESET-ADMIN'] as $rf) if (is_file(PV_ROOT . '/' . $rf)) {
  foreach (['users', 'rate'] as $c) @unlink(pv_path($c));
  @unlink(PV_ROOT . '/' . $rf);
}
session_name('pvadmin');
session_set_cookie_params(['httponly' => true, 'samesite' => 'Strict', 'secure' => !empty($_SERVER['HTTPS'])]);
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Frame-Options: DENY');

function out($a, int $code = 200): void { http_response_code($code); echo json_encode($a, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); exit; }
function body(): array { static $b = null; if ($b === null) { $j = json_decode((string)file_get_contents('php://input'), true); $b = is_array($j) ? $j : []; } return $b; }
function me(): ?array { return $_SESSION['u'] ?? null; }
const ROLES = [
  'super'   => ['*'],
  'manager' => ['dashboard', 'products', 'inventory', 'categories', 'collections', 'orders', 'bookings', 'courier', 'customers', 'reviews', 'banners', 'cms', 'reports', 'settings'],
  'staff'   => ['dashboard', 'products', 'inventory', 'orders', 'bookings', 'courier', 'customers'],
];
function can(string $perm): bool { $u = me(); if (!$u) return false; $p = ROLES[$u['role']] ?? []; return in_array('*', $p, true) || in_array($perm, $p, true); }
function need(string $perm): void { if (!me()) out(['error' => 'login'], 401); if (!can($perm)) out(['error' => 'You do not have permission for this.'], 403); }
function audit(string $what): void { $u = me()['u'] ?? '?'; pv_update('log', function ($l) use ($u, $what) { $l['audit'][] = ['t' => time(), 'u' => $u, 'w' => $what]; $l['audit'] = array_slice($l['audit'], -300); return $l; }); }
function clean_str($v, int $n = 300): string { return trim(mb_substr((string)$v, 0, $n)); }

$a = $_GET['a'] ?? '';
$users = pv_read('users');

if ($a === 'state') out(['setup' => !$users, 'me' => me(), 'csrf' => me() ? $_SESSION['csrf'] : null, 'roles' => array_keys(ROLES)]);

if ($a === 'login') {
  $b = body(); $un = strtolower(clean_str($b['user'] ?? '', 40)); $pw = (string)($b['pass'] ?? '');
  if (!$users && $un === '') $un = 'admin';           // password-only sign in: first admin is "admin"
  $_SESSION['tries'] = (int)($_SESSION['tries'] ?? 0);
  if ($_SESSION['tries'] >= 8) out(['error' => 'Too many tries. Close the browser and try again later.'], 429);
  if (!$users) {                                   // first run: create the super admin
    if (!preg_match('/^[a-z0-9_.]{3,30}$/', $un) || strlen($pw) < 8) out(['error' => 'Password must be 8+ characters.'], 400);
    $users = [['u' => $un, 'name' => clean_str($b['name'] ?? 'Super Admin', 60) ?: 'Super Admin', 'role' => 'super', 'hash' => password_hash($pw, PASSWORD_DEFAULT), 'on' => 1]];
    pv_write('users', $users);
  }
  $found = null;
  if ($un === '') { foreach ($users as $u) if (!empty($u['on']) && password_verify($pw, $u['hash'])) { $found = $u; break; } }   // password only
  else foreach ($users as $u) if ($u['u'] === $un && !empty($u['on']) && password_verify($pw, $u['hash'])) $found = $u;
  if (!$found) { $_SESSION['tries']++; usleep(700000); out(['error' => 'Wrong password.'], 403); }
  $un = $found['u'];
  session_regenerate_id(true);
  $_SESSION['u'] = ['u' => $found['u'], 'name' => $found['name'], 'role' => $found['role']]; $_SESSION['tries'] = 0; $_SESSION['csrf'] = bin2hex(random_bytes(16));
  pv_update('users', function ($us) use ($un) { foreach ($us as &$x) if ($x['u'] === $un) $x['last'] = time(); return $us; });
  out(['ok' => 1, 'me' => $_SESSION['u'], 'csrf' => $_SESSION['csrf']]);
}
if ($a === 'logout') { $_SESSION = []; session_destroy(); out(['ok' => 1]); }

if (!me()) out(['error' => 'login'], 401);
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !hash_equals($_SESSION['csrf'] ?? '', (string)($_SERVER['HTTP_X_PV'] ?? ''))) out(['error' => 'Session expired. Please log in again.'], 403);

$READ = ['products' => 'products', 'categories' => 'products', 'collections' => 'products', 'reviews' => 'reviews', 'banners' => 'banners', 'site' => 'dashboard', 'orders' => 'orders', 'bookings' => 'bookings'];
$WRITE = ['products' => 'products', 'categories' => 'categories', 'collections' => 'collections', 'reviews' => 'reviews', 'banners' => 'banners', 'site' => 'settings'];

if ($a === 'get') {
  $c = (string)($_GET['c'] ?? '');
  if (!isset($READ[$c])) out(['error' => 'Unknown data'], 404);
  need($READ[$c]);
  out(['data' => pv_read($c, null)]);
}
if ($a === 'put') {
  $c = (string)($_GET['c'] ?? ''); $d = body()['data'] ?? null;
  if (!isset($WRITE[$c]) || !is_array($d)) out(['error' => 'Bad data'], 400);
  need($WRITE[$c]);
  if ($c === 'site' && !can('settings')) out(['error' => 'No permission'], 403);
  $json = json_encode($d); if (strlen((string)$json) > 3000000) out(['error' => 'Too big'], 413);
  if ($c === 'products') {   // keep only known fields, safe image paths, https links
    $clean = [];
    foreach ($d as $k => $list) { if (!preg_match('/^[a-z0-9]{2,20}$/', (string)$k) || !is_array($list)) continue; $clean[$k] = [];
      foreach ($list as $x) { if (!is_array($x) || clean_str($x['n'] ?? '') === '') continue;
        $it = ['id' => preg_replace('/[^a-z0-9\-]/i', '', (string)($x['id'] ?? '')) ?: 'p' . bin2hex(random_bytes(4)), 'n' => clean_str($x['n'], 160), 'b' => clean_str($x['b'] ?? '', 60)];
        foreach (['t' => 40, 'sz' => 200, 'cl' => 200, 'sd' => 600, 'd' => 6000] as $f => $n) if (!empty($x[$f])) $it[$f] = clean_str($x[$f], $n);
        if (!empty($x['i']) && preg_match('~^[a-z0-9_\-/]+\.(jpe?g|png|webp|gif)$~i', (string)$x['i'])) $it['i'] = (string)$x['i'];
        if (!empty($x['r']) && preg_match('~^https://~', (string)$x['r'])) $it['r'] = clean_str($x['r'], 600);
        if (!empty($x['g']) && is_array($x['g'])) foreach (array_slice($x['g'], 0, 12) as $g) { $s = (string)($g['s'] ?? ''); if (preg_match('~^(https://|[a-z0-9_\-/]+\.(jpe?g|png|webp|gif)$)~i', $s)) $it['g'][] = ['s' => clean_str($s, 600), 'c' => clean_str($g['c'] ?? '', 60)]; }
        foreach (['p', 'o'] as $f) if (!empty($x[$f]) && is_numeric($x[$f])) $it[$f] = (int)$x[$f];
        if (isset($x['st']) && $x['st'] !== '' && is_numeric($x['st'])) $it['st'] = (int)$x['st'];
        foreach (['nw', 'off', 'ft', 'fs', 'bs', 'ph'] as $f) if (!empty($x[$f])) $it[$f] = 1;
        $clean[$k][] = $it; } }
    $d = $clean;
  }
  if (is_file(pv_path($c))) @copy(pv_path($c), PV_ROOT . "/data/private/$c-backup.json.php");
  pv_write($c, $d); audit("saved $c");
  out(['ok' => 1]);
}

if ($a === 'upload') {
  need('products');
  $f = $_FILES['photo'] ?? null;
  if (!$f || $f['error'] !== UPLOAD_ERR_OK || $f['size'] > 6000000) out(['error' => 'Upload failed (max 6 MB).'], 400);
  $info = @getimagesize($f['tmp_name']);
  $ext = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_WEBP => 'webp', IMAGETYPE_GIF => 'gif'][$info[2] ?? 0] ?? null;
  if (!$ext) out(['error' => 'Only JPG, PNG, WEBP or GIF images.'], 400);
  $dir = PV_ROOT . '/img/p'; if (!is_dir($dir)) mkdir($dir, 0755, true);
  $name = 'up-' . date('ymd-His') . '-' . bin2hex(random_bytes(3)) . '.' . $ext;
  if (!move_uploaded_file($f['tmp_name'], "$dir/$name")) out(['error' => 'Could not save the image.'], 500);
  out(['ok' => 1, 'i' => "p/$name"]);
}

function pv_shrink(string $file, int $max = 700): void {   // keep copied photos small and fast
  if (!function_exists('imagecreatefromstring')) return; $im = @imagecreatefromstring((string)file_get_contents($file)); if (!$im) return;
  $w = imagesx($im); $h = imagesy($im); if (max($w, $h) <= $max) return; $s = $max / max($w, $h);
  $o = imagecreatetruecolor((int)round($w * $s), (int)round($h * $s)); imagefill($o, 0, 0, imagecolorallocate($o, 255, 255, 255));
  imagecopyresampled($o, $im, 0, 0, 0, 0, imagesx($o), imagesy($o), $w, $h);
  if (preg_match('/\.png$/i', $file)) @imagepng($o, $file, 8); elseif (preg_match('/\.webp$/i', $file) && function_exists('imagewebp')) @imagewebp($o, $file, 80); else @imagejpeg($o, $file, 82);
}
if ($a === 'pull') {   // copy online product photos to this server
  need('products'); @set_time_limit(300);
  $ok = 0; $fail = 0; $have = 0;
  foreach (pv_read('products') as $list) foreach ((array)$list as $x) {
    if (empty($x['r']) || empty($x['i']) || strpos($x['i'], 'p/') !== 0) continue;
    $file = PV_ROOT . '/img/' . $x['i'];
    if (is_file($file) && filesize($file) > 2000) { $have++; continue; }
    $r = pv_http($x['r'], ['timeout' => 25, 'headers' => ['User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36']]);
    if ($r['code'] === 200 && strlen($r['body']) > 1000 && strlen($r['body']) < 8000000 && @getimagesizefromstring($r['body'])) { @mkdir(dirname($file), 0755, true); file_put_contents($file, $r['body']); pv_shrink($file); $ok++; } else $fail++;
  }
  out(['ok' => 1, 'new' => $ok, 'have' => $have, 'fail' => $fail]);
}

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
const BK_STATUSES = ['new', 'confirmed', 'done', 'cancelled'];
if ($a === 'booking_add') {   // booking taken by phone / Facebook
  need('bookings'); $k = pv_booking_clean(body());
  if ($k['name'] === '' || $k['service'] === '') out(['error' => 'Name and service are needed.'], 400);
  $k = ['no' => 'BK-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 5)), 't' => time()] + $k + ['status' => 'confirmed', 'src' => 'admin'];
  pv_update('bookings', function ($l) use ($k) { array_unshift($l, $k); return $l; }); audit("booking {$k['no']} added"); out(['ok' => 1, 'no' => $k['no']]);
}
if ($a === 'booking_update') {
  need('bookings'); $b = body(); $no = (string)($b['no'] ?? ''); $found = false;
  pv_update('bookings', function ($l) use ($b, $no, &$found) {
    foreach ($l as &$k) if (($k['no'] ?? '') === $no) { $found = true;
      if (isset($b['status']) && in_array($b['status'], BK_STATUSES, true)) $k['status'] = $b['status'];
      if (isset($b['admin_note'])) $k['admin_note'] = clean_str($b['admin_note'], 500);
      if (isset($b['fee'])) $k['fee'] = max(0, (int)$b['fee']);
      if (isset($b['date']) && preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)$b['date'])) $k['date'] = (string)$b['date'];
      if (isset($b['time'])) $k['time'] = clean_str($b['time'], 40);
    }
    return $l;
  });
  if (!$found) out(['error' => 'Booking not found'], 404);
  audit("booking $no updated"); out(['ok' => 1]);
}
if ($a === 'booking_del') {
  need('bookings'); $no = (string)(body()['no'] ?? '');
  pv_update('bookings', fn($l) => array_values(array_filter($l, fn($k) => ($k['no'] ?? '') !== $no))); audit("deleted booking $no"); out(['ok' => 1]);
}
if ($a === 'order_add') {   // manual order (phone / Facebook)
  need('orders'); $b = body()['order'] ?? [];
  $phone = pv_phone((string)($b['phone'] ?? ''));
  if (clean_str($b['name'] ?? '') === '' || !pv_valid_phone($phone)) out(['error' => 'Name and an 11-digit phone are needed.'], 400);
  $items = []; $sub = 0; foreach ((array)($b['items'] ?? []) as $it) { $q = max(1, (int)($it['q'] ?? 1)); $p = max(0, (int)($it['p'] ?? 0)); $items[] = ['id' => clean_str($it['id'] ?? '', 40), 'n' => clean_str($it['n'] ?? '', 160), 'q' => $q, 'p' => $p]; $sub += $q * $p; }
  $ship = max(0, (int)($b['ship'] ?? 0));
  $o = ['no' => 'PV-' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 6)), 't' => time(), 'name' => clean_str($b['name'], 80), 'phone' => $phone, 'address' => clean_str($b['address'] ?? ''), 'area' => ($b['area'] ?? '') === 'out' ? 'out' : 'in',
    'note' => clean_str($b['note'] ?? ''), 'pay' => in_array($b['pay'] ?? '', ['cod', 'bkash', 'nagad'], true) ? $b['pay'] : 'cod', 'items' => $items, 'sub' => $sub, 'ship' => $ship, 'total' => $sub + $ship, 'status' => 'pending', 'src' => clean_str($b['src'] ?? 'manual', 20)];
  pv_update('orders', function ($os) use ($o) { array_unshift($os, $o); return $os; }); audit("added order {$o['no']}");
  out(['ok' => 1, 'no' => $o['no']]);
}
if ($a === 'order_update') {
  need('orders'); $b = body(); $no = (string)($b['no'] ?? ''); $found = false;
  pv_update('orders', function ($os) use ($b, $no, &$found) {
    foreach ($os as &$o) if ($o['no'] === $no) { $found = true;
      if (isset($b['status']) && in_array($b['status'], STATUSES, true) && $b['status'] !== $o['status']) { $o['hist'][] = ['t' => time(), 's' => $b['status'], 'u' => me()['u']]; $o['status'] = $b['status']; }
      if (isset($b['admin_note'])) $o['admin_note'] = clean_str($b['admin_note'], 500);
      if (isset($b['paid'])) $o['paid'] = $b['paid'] ? 1 : 0;
    }
    return $os;
  });
  if (!$found) out(['error' => 'Order not found'], 404);
  if (isset($b['status'])) { $sec = pv_read('secrets'); if (!empty($sec['sms_on_status'])) foreach (pv_read('orders') as $o) if ($o['no'] === $no) pv_sms($o['phone'], "Your PetVerse order $no is now " . strtoupper($b['status']) . '.'); }
  audit("order $no updated"); out(['ok' => 1]);
}
if ($a === 'order_del') {
  need('settings'); $no = (string)(body()['no'] ?? '');
  pv_update('orders', fn($os) => array_values(array_filter($os, fn($o) => $o['no'] !== $no))); audit("deleted order $no"); out(['ok' => 1]);
}

/* Steadfast courier */
function sf(string $path, ?array $post = null): array {
  $s = pv_read('secrets'); $base = rtrim((string)($s['sf_base'] ?? 'https://portal.packzy.com/api/v1'), '/');
  if (empty($s['sf_key']) || empty($s['sf_secret'])) return ['error' => 'Add your Steadfast API key and secret in Site Settings > Courier.'];
  $r = pv_http($base . $path, ['headers' => ['Api-Key: ' . $s['sf_key'], 'Secret-Key: ' . $s['sf_secret'], 'Content-Type: application/json'], 'post' => $post ? json_encode($post) : null, 'timeout' => 20] + ($post ? [] : []));
  $j = json_decode($r['body'], true);
  return is_array($j) ? $j : ['error' => 'Courier did not answer (' . ($r['code'] ?: $r['err']) . ')'];
}
if ($a === 'courier_send') {
  need('courier'); $no = (string)(body()['no'] ?? ''); $ord = null;
  foreach (pv_read('orders') as $o) if ($o['no'] === $no) $ord = $o;
  if (!$ord) out(['error' => 'Order not found'], 404);
  if (!empty($ord['courier']['cid'])) out(['error' => 'Already sent to courier.'], 400);
  $cod = !empty($ord['paid']) ? 0 : (int)$ord['total'];
  $r = sf('/create_order', ['invoice' => $ord['no'], 'recipient_name' => $ord['name'], 'recipient_phone' => $ord['phone'], 'recipient_address' => $ord['address'], 'cod_amount' => $cod, 'note' => $ord['note'] ?? '']);
  $c = $r['consignment'] ?? null;
  if (!$c) out(['error' => $r['error'] ?? ($r['message'] ?? 'Courier error'), 'raw' => $r], 400);
  pv_update('orders', function ($os) use ($no, $c) { foreach ($os as &$o) if ($o['no'] === $no) { $o['courier'] = ['by' => 'steadfast', 'cid' => $c['consignment_id'] ?? '', 'code' => $c['tracking_code'] ?? '', 'st' => $c['status'] ?? 'in_review', 't' => time()]; if ($o['status'] === 'pending' || $o['status'] === 'processing') $o['status'] = 'shipped'; } return $os; });
  audit("sent $no to courier"); out(['ok' => 1, 'courier' => $c]);
}
if ($a === 'courier_status') {
  need('courier'); $no = (string)(body()['no'] ?? '');
  $r = sf('/status_by_invoice/' . rawurlencode($no)); $st = $r['delivery_status'] ?? null;
  if (!$st) out(['error' => $r['error'] ?? 'No status yet', 'raw' => $r], 400);
  pv_update('orders', function ($os) use ($no, $st) { foreach ($os as &$o) if ($o['no'] === $no) { $o['courier']['st'] = $st; if ($st === 'delivered') $o['status'] = 'delivered'; if ($st === 'cancelled') $o['status'] = 'returned'; } return $os; });
  out(['ok' => 1, 'status' => $st]);
}
if ($a === 'courier_balance') { need('courier'); $r = sf('/get_balance'); out(isset($r['current_balance']) ? ['ok' => 1, 'balance' => $r['current_balance']] : ['error' => $r['error'] ?? 'Could not read balance']); }

if ($a === 'stats') {
  need('dashboard'); $v = pv_read('visits'); $log = pv_read('log');
  $days = []; foreach ($v['days'] ?? [] as $d => $set) $days[$d] = count($set);
  $live = 0; foreach ($v['live'] ?? [] as $t) if ($t > time() - 300) $live++;
  $capi = array_filter($log['capi'] ?? [], fn($e) => $e['t'] > time() - 30 * 86400);
  out(['days' => $days, 'live' => $live, 'pages' => $v['pages'] ?? [], 'capi' => ['events' => count($capi), 'ok' => count(array_filter($capi, fn($e) => $e['code'] === 200))], 'audit' => array_slice(array_reverse($log['audit'] ?? []), 0, 30)]);
}

/* secrets: tokens and keys, never sent back in full */
const SECRET_KEYS = ['capi_token', 'capi_test', 'sf_key', 'sf_secret', 'sf_base', 'sms_url', 'sms_admin', 'sms_on_order', 'sms_on_status', 'gemini_key'];
const SECRET_HIDDEN = ['capi_token', 'sf_secret', 'gemini_key', 'sms_url'];
if ($a === 'secrets_get') {
  need('settings'); $s = pv_read('secrets'); $o = [];
  foreach (SECRET_KEYS as $k) $o[$k] = in_array($k, SECRET_HIDDEN, true) ? (empty($s[$k]) ? '' : '__set__') : ($s[$k] ?? '');
  out(['data' => $o]);
}
if ($a === 'secrets_put') {
  need('settings'); if (me()['role'] !== 'super') out(['error' => 'Only the super admin can change keys.'], 403);
  $in = body()['data'] ?? [];
  pv_update('secrets', function ($s) use ($in) { foreach (SECRET_KEYS as $k) if (array_key_exists($k, $in)) { $v = is_bool($in[$k]) ? ($in[$k] ? 1 : 0) : clean_str($in[$k], 600); if ($v === '__set__') continue; if (in_array($k, SECRET_HIDDEN, true) && $v === '') continue; $s[$k] = $v; } return $s; });
  audit('changed keys'); out(['ok' => 1]);
}
if ($a === 'sms_test') { need('settings'); $n = pv_phone((string)(body()['to'] ?? '')); if (!pv_valid_phone($n)) out(['error' => 'Give an 11-digit number'], 400); out(pv_sms($n, 'PetVerse test SMS. Your SMS settings work.')); }

/* admins & roles */
if ($a === 'users') { need('users'); out(['data' => array_map(fn($u) => ['u' => $u['u'], 'name' => $u['name'], 'role' => $u['role'], 'on' => $u['on'] ?? 1, 'last' => $u['last'] ?? null], $users)]); }
if ($a === 'user_save') {
  need('users'); $b = body(); $un = strtolower(clean_str($b['u'] ?? '', 30)); $role = (string)($b['role'] ?? 'staff'); $pw = (string)($b['pass'] ?? '');
  if (!preg_match('/^[a-z0-9_.]{3,30}$/', $un) || !isset(ROLES[$role])) out(['error' => 'Username 3+ letters (a-z, 0-9) and a role.'], 400);
  $exists = false; foreach ($users as $u) if ($u['u'] === $un) $exists = true;
  if (!$exists && strlen($pw) < 8) out(['error' => 'New admin needs an 8+ character password.'], 400);
  if ($pw !== '' && strlen($pw) < 8) out(['error' => 'Password must be 8+ characters.'], 400);
  if ($pw !== '') foreach ($users as $u) if ($u['u'] !== $un && password_verify($pw, $u['hash'])) out(['error' => 'Another admin already uses this password. Please choose a different one.'], 400);
  pv_update('users', function ($us) use ($b, $un, $role, $pw, $exists) {
    if (!$exists) $us[] = ['u' => $un, 'name' => '', 'role' => $role, 'hash' => '', 'on' => 1];
    foreach ($us as &$u) if ($u['u'] === $un) { $u['name'] = clean_str($b['name'] ?? $un, 60); if ($u['u'] !== me()['u']) { $u['role'] = $role; $u['on'] = empty($b['on']) ? 0 : 1; } if ($pw !== '') $u['hash'] = password_hash($pw, PASSWORD_DEFAULT); }
    return $us;
  });
  audit("saved admin $un"); out(['ok' => 1]);
}
if ($a === 'user_del') { need('users'); $un = (string)(body()['u'] ?? ''); if ($un === me()['u']) out(['error' => 'You cannot delete yourself.'], 400); pv_update('users', fn($us) => array_values(array_filter($us, fn($u) => $u['u'] !== $un))); audit("deleted admin $un"); out(['ok' => 1]); }
if ($a === 'pass') {
  $b = body(); $old = (string)($b['old'] ?? ''); $new = (string)($b['new'] ?? ''); $mine = null;
  foreach ($users as $u) if ($u['u'] === me()['u']) $mine = $u;
  if (!$mine || !password_verify($old, $mine['hash'])) out(['error' => 'Current password is wrong.'], 403);
  if (strlen($new) < 8) out(['error' => 'New password must be 8+ characters.'], 400);
  foreach ($users as $u) if ($u['u'] !== me()['u'] && password_verify($new, $u['hash'])) out(['error' => 'Another admin already uses this password. Please choose a different one.'], 400);
  pv_update('users', function ($us) use ($new) { foreach ($us as &$u) if ($u['u'] === me()['u']) $u['hash'] = password_hash($new, PASSWORD_DEFAULT); return $us; });
  audit('changed own password'); out(['ok' => 1]);
}

/* AI writer: Google Gemini (free key) if set, otherwise the admin uses its built-in template writer */
if ($a === 'ai') {
  need('products'); $key = (string)(pv_read('secrets')['gemini_key'] ?? '');
  if ($key === '') out(['error' => 'nokey']);
  $prompt = clean_str(body()['prompt'] ?? '', 2000);
  $r = pv_http('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' . rawurlencode($key), ['post' => json_encode(['contents' => [['parts' => [['text' => $prompt]]]]]), 'headers' => ['Content-Type: application/json'], 'timeout' => 30]);
  $j = json_decode($r['body'], true); $t = $j['candidates'][0]['content']['parts'][0]['text'] ?? null;
  out($t ? ['ok' => 1, 'text' => $t] : ['error' => 'AI did not answer. Check the Gemini key.']);
}

if ($a === 'export') {
  need('reports'); header('Content-Type: text/csv; charset=utf-8'); header('Content-Disposition: attachment; filename="petverse-orders-' . date('Ymd') . '.csv"');
  $f = fopen('php://output', 'w'); fwrite($f, "\xEF\xBB\xBF");
  fputcsv($f, ['Order', 'Date', 'Name', 'Phone', 'Address', 'Area', 'Items', 'Subtotal', 'Delivery', 'Total', 'Payment', 'Status']);
  foreach (pv_read('orders') as $o) fputcsv($f, [$o['no'], date('Y-m-d H:i', $o['t']), $o['name'], $o['phone'], $o['address'], $o['area'], implode('; ', array_map(fn($i) => $i['n'] . ' x' . $i['q'], $o['items'])), $o['sub'], $o['ship'], $o['total'], $o['pay'], $o['status']]);
  exit;
}
out(['error' => 'Unknown action'], 404);
