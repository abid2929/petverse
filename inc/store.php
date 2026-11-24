<?php
/* PetVerse storage helpers. Public data: data/*.json. Private data: data/private/*.php (JSON behind a PHP exit line, so it can never be read from the web). */
declare(strict_types=1);
if (!defined('PV_ROOT')) define('PV_ROOT', dirname(__DIR__));
const PV_PUBLIC = ['products', 'categories', 'collections', 'reviews', 'banners', 'site'];
const PV_PRIVATE = ['orders', 'users', 'secrets', 'rate', 'log', 'visits'];
const PV_GUARD = "<?php http_response_code(404); exit; ?>\n";

function pv_path(string $name): string {
  if (in_array($name, PV_PUBLIC, true)) return PV_ROOT . "/data/$name.json";
  if (in_array($name, PV_PRIVATE, true)) return PV_ROOT . "/data/private/$name.php";
  throw new RuntimeException('bad store');
}
function pv_read(string $name, $default = []) {
  $f = pv_path($name);
  if (!is_file($f)) return $default;
  $s = (string)file_get_contents($f);
  if (strpos($s, PV_GUARD) === 0) $s = substr($s, strlen(PV_GUARD));
  $d = json_decode($s, true);
  return $d === null ? $default : $d;
}
function pv_write(string $name, $data): void {
  $f = pv_path($name);
  if (!is_dir(dirname($f))) mkdir(dirname($f), 0755, true);
  $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | (in_array($name, PV_PUBLIC, true) ? JSON_PRETTY_PRINT : 0));
  if ($json === false) throw new RuntimeException('encode');
  $body = in_array($name, PV_PRIVATE, true) ? PV_GUARD . $json : $json;
  $tmp = $f . '.tmp' . bin2hex(random_bytes(3));
  file_put_contents($tmp, $body, LOCK_EX);
  rename($tmp, $f);
}
/* run fn(data) under an exclusive lock and save what it returns */
function pv_update(string $name, callable $fn, $default = []) {
  $lock = fopen(PV_ROOT . '/data/private/.lock-' . $name, 'c');
  flock($lock, LOCK_EX);
  try { $d = $fn(pv_read($name, $default)); pv_write($name, $d); return $d; }
  finally { flock($lock, LOCK_UN); fclose($lock); }
}
function pv_ip(): string { return (string)($_SERVER['REMOTE_ADDR'] ?? ''); }
function pv_phone(string $p): string { $d = preg_replace('/\D+/', '', $p); if (strpos($d, '880') === 0) $d = substr($d, 2); return $d; }
function pv_valid_phone(string $p): bool { return (bool)preg_match('/^01[3-9]\d{8}$/', $p); }
function pv_all_products(): array {
  $out = [];
  foreach (pv_read('products') as $k => $list) if (is_array($list)) foreach ($list as $j => $x) {
    $id = (string)($x['id'] ?? ($k . $j)); $x['id'] = $id; $x['_k'] = $k; $out[$id] = $x;
  }
  return $out;
}
function pv_http(string $url, array $opt = []): array {
  $ch = curl_init($url);
  $h = $opt['headers'] ?? [];
  curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => $opt['timeout'] ?? 15, CURLOPT_FOLLOWLOCATION => true, CURLOPT_HTTPHEADER => $h]);
  if (isset($opt['post'])) { curl_setopt($ch, CURLOPT_POST, true); curl_setopt($ch, CURLOPT_POSTFIELDS, $opt['post']); }
  $body = curl_exec($ch); $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); $err = curl_error($ch); curl_close($ch);
  return ['code' => $code, 'body' => (string)$body, 'err' => $err];
}
/* SMS through any Bangladesh SMS gateway: the URL template uses {number} and {message} */
function pv_sms(string $number, string $msg): array {
  $sec = pv_read('secrets'); $tpl = (string)($sec['sms_url'] ?? '');
  if ($tpl === '' || !preg_match('~^https?://~', $tpl)) return ['ok' => false, 'msg' => 'SMS gateway not set'];
  $num = pv_phone($number); if (strlen($num) === 11) $num = '88' . $num;
  $url = str_replace(['{number}', '{message}'], [rawurlencode($num), rawurlencode($msg)], $tpl);
  $r = pv_http($url, ['timeout' => 12]);
  return ['ok' => $r['code'] >= 200 && $r['code'] < 300, 'msg' => substr($r['body'] ?: $r['err'], 0, 200)];
}
/* Meta Conversions API (server side) */
function pv_capi(string $event, array $order): void {
  $site = pv_read('site'); $sec = pv_read('secrets');
  $pid = preg_replace('/\D/', '', (string)($site['pixel']['id'] ?? '')); $tok = (string)($sec['capi_token'] ?? '');
  if ($pid === '' || $tok === '') return;
  $ph = pv_phone((string)($order['phone'] ?? '')); if (strlen($ph) === 11) $ph = '88' . $ph;
  $ev = ['event_name' => $event, 'event_time' => time(), 'action_source' => 'website', 'event_id' => (string)($order['no'] ?? uniqid()),
    'event_source_url' => (isset($_SERVER['HTTP_HOST']) ? 'https://' . $_SERVER['HTTP_HOST'] . '/' : ''),
    'user_data' => array_filter(['ph' => [hash('sha256', $ph)], 'client_ip_address' => pv_ip(), 'client_user_agent' => (string)($_SERVER['HTTP_USER_AGENT'] ?? ''),
      'fbp' => $_COOKIE['_fbp'] ?? null, 'fbc' => $_COOKIE['_fbc'] ?? null, 'fn' => [hash('sha256', mb_strtolower(trim(explode(' ', (string)($order['name'] ?? ''))[0])))], 'country' => [hash('sha256', 'bd')]]),
    'custom_data' => ['currency' => 'BDT', 'value' => (float)($order['total'] ?? 0), 'content_type' => 'product',
      'contents' => array_map(fn($i) => ['id' => (string)$i['id'], 'quantity' => (int)$i['q'], 'item_price' => (float)$i['p']], $order['items'] ?? [])]];
  $payload = ['data' => [$ev], 'access_token' => $tok];
  if (!empty($sec['capi_test'])) $payload['test_event_code'] = (string)$sec['capi_test'];
  $r = pv_http("https://graph.facebook.com/v19.0/$pid/events", ['post' => json_encode($payload), 'headers' => ['Content-Type: application/json'], 'timeout' => 8]);
  pv_update('log', function ($l) use ($event, $r) { $l['capi'][] = ['t' => time(), 'e' => $event, 'code' => $r['code']]; $l['capi'] = array_slice($l['capi'], -200); return $l; });
}
