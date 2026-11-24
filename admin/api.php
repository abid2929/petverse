<?php
/* PetVerse admin API. Products live in ../data/products.json; uploaded photos go to ../img/p/ */
declare(strict_types=1);
session_name('pvadmin');
session_set_cookie_params(['httponly' => true, 'samesite' => 'Strict', 'secure' => !empty($_SERVER['HTTPS'])]);
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$ROOT = dirname(__DIR__);
$DATA = $ROOT . '/data/products.json';
$PASS = $ROOT . '/data/admin-pass.php';   // password hash, created on first login
$IMG  = $ROOT . '/img/p';

function out($a, int $code = 200): void { http_response_code($code); echo json_encode($a, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); exit; }
function body(): array { $j = json_decode((string)file_get_contents('php://input'), true); return is_array($j) ? $j : []; }
function authed(): bool { return !empty($_SESSION['ok']); }
function need_auth(): void { if (!authed()) out(['error' => 'login'], 401); }
function csrf_ok(): bool { return isset($_SERVER['HTTP_X_PV']) && hash_equals($_SESSION['csrf'] ?? '', $_SERVER['HTTP_X_PV']); }
function pass_hash(string $f): ?string { if (!is_file($f)) return null; $h = include $f; return is_string($h) ? $h : null; }

$a = $_GET['a'] ?? '';

if ($a === 'state') {
  out(['setup' => pass_hash($PASS) === null, 'in' => authed(), 'csrf' => authed() ? $_SESSION['csrf'] : null]);
}

if ($a === 'login') {
  $b = body(); $p = (string)($b['pass'] ?? '');
  $h = pass_hash($PASS);
  $_SESSION['tries'] = ($_SESSION['tries'] ?? 0);
  if ($_SESSION['tries'] > 8) out(['error' => 'Too many tries. Close the browser and try later.'], 429);
  if ($h === null) {                       // first run: set the password
    if (strlen($p) < 6) out(['error' => 'Password must be at least 6 characters.'], 400);
    file_put_contents($PASS, "<?php return " . var_export(password_hash($p, PASSWORD_DEFAULT), true) . ";\n");
  } elseif (!password_verify($p, $h)) { $_SESSION['tries']++; usleep(600000); out(['error' => 'Wrong password.'], 403); }
  session_regenerate_id(true);
  $_SESSION['ok'] = 1; $_SESSION['tries'] = 0; $_SESSION['csrf'] = bin2hex(random_bytes(16));
  out(['ok' => 1, 'csrf' => $_SESSION['csrf']]);
}

if ($a === 'logout') { $_SESSION = []; session_destroy(); out(['ok' => 1]); }

need_auth();
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !csrf_ok()) out(['error' => 'Session expired, log in again.'], 403);

if ($a === 'load') {
  out(['data' => is_file($DATA) ? json_decode((string)file_get_contents($DATA), true) : null]);
}

if ($a === 'save') {
  $d = body()['data'] ?? null;
  if (!is_array($d)) out(['error' => 'Bad data'], 400);
  $clean = [];
  foreach ($d as $k => $list) {
    if (!preg_match('/^[a-z]{2,12}$/', (string)$k) || !is_array($list)) continue;
    foreach ($list as $x) {
      if (!is_array($x) || trim((string)($x['n'] ?? '')) === '') continue;
      $it = ['n' => mb_substr(trim((string)$x['n']), 0, 140), 'b' => mb_substr(trim((string)($x['b'] ?? '')), 0, 60)];
      foreach (['i', 'r', 't'] as $f) if (!empty($x[$f])) $it[$f] = mb_substr((string)$x[$f], 0, 400);
      if (isset($it['r']) && !preg_match('~^https://~', $it['r'])) unset($it['r']);
      if (isset($it['i']) && !preg_match('~^[a-z0-9_\-/]+\.(jpe?g|png|webp)$~i', $it['i'])) unset($it['i']);
      foreach (['p', 'o'] as $f) if (!empty($x[$f]) && is_numeric($x[$f])) $it[$f] = (int)$x[$f];
      foreach (['nw', 'ph', 'off'] as $f) if (!empty($x[$f])) $it[$f] = 1;
      $clean[$k][] = $it;
    }
  }
  if (is_file($DATA)) @copy($DATA, $DATA . '.bak');
  file_put_contents($DATA, json_encode($clean, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT), LOCK_EX);
  out(['ok' => 1]);
}

if ($a === 'upload') {
  $f = $_FILES['photo'] ?? null;
  if (!$f || $f['error'] !== UPLOAD_ERR_OK || $f['size'] > 6000000) out(['error' => 'Upload failed (max 6 MB).'], 400);
  $info = @getimagesize($f['tmp_name']);
  $ext = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_WEBP => 'webp'][$info[2] ?? 0] ?? null;
  if (!$ext) out(['error' => 'Only JPG, PNG or WEBP photos.'], 400);
  if (!is_dir($IMG)) mkdir($IMG, 0755, true);
  $name = 'up-' . date('ymd-His') . '-' . bin2hex(random_bytes(3)) . '.' . $ext;
  if (!move_uploaded_file($f['tmp_name'], "$IMG/$name")) out(['error' => 'Could not save photo.'], 500);
  out(['ok' => 1, 'i' => "p/$name"]);
}

if ($a === 'pull') {   // copy online product photos (r) to our own server (i)
  @set_time_limit(300);
  $d = is_file($DATA) ? json_decode((string)file_get_contents($DATA), true) : [];
  if (!is_dir($IMG)) mkdir($IMG, 0755, true);
  $ok = 0; $fail = 0; $have = 0;
  foreach ($d as $k => $list) foreach ($list as $x) {
    if (empty($x['r']) || empty($x['i']) || strpos($x['i'], 'p/') !== 0) continue;
    $file = $ROOT . '/img/' . $x['i'];
    if (is_file($file) && filesize($file) > 2000) { $have++; continue; }
    $ch = curl_init($x['r']);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_TIMEOUT => 25, CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
      CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36']);
    $bin = curl_exec($ch); $type = (string)curl_getinfo($ch, CURLINFO_CONTENT_TYPE); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
    if ($code == 200 && $bin && strlen($bin) < 8000000 && stripos($type, 'image/') === 0) { file_put_contents($file, $bin); $ok++; } else $fail++;
  }
  out(['ok' => 1, 'new' => $ok, 'have' => $have, 'fail' => $fail]);
}

if ($a === 'pass') {
  $p = (string)(body()['pass'] ?? '');
  if (strlen($p) < 6) out(['error' => 'Password must be at least 6 characters.'], 400);
  file_put_contents($PASS, "<?php return " . var_export(password_hash($p, PASSWORD_DEFAULT), true) . ";\n");
  out(['ok' => 1]);
}

out(['error' => 'Unknown action'], 404);
