<?php
/* PetVerse image speed-up: downloads a product photo from another website once, makes it small (WebP),
   keeps it in img/c/ and serves it fast with a 1-year browser cache. Only photos already used in this shop are allowed. */
declare(strict_types=1);
$u = (string)($_GET['u'] ?? '');
$w = (int)($_GET['w'] ?? 480); $w = $w <= 300 ? 300 : ($w <= 480 ? 480 : 800);
function go_original(string $u): void { header('Location: ' . $u, true, 302); header('Cache-Control: public, max-age=3600'); exit; }
if (!preg_match('~^https://[a-z0-9.\-]+/~i', $u) || strlen($u) > 600) { http_response_code(400); exit; }

$dir = __DIR__ . '/img/c'; $key = sha1($u) . '-' . $w;
foreach (['webp' => 'image/webp', 'jpg' => 'image/jpeg'] as $ext => $type) {
  $f = "$dir/$key.$ext";
  if (is_file($f)) {
    header('Content-Type: ' . $type); header('Cache-Control: public, max-age=31536000, immutable');
    header('Content-Length: ' . filesize($f)); readfile($f); exit;
  }
}

// only photos that the shop really uses (products, banners, categories, collections, homepage)
$ok = false; $esc = str_replace('/', '\/', $u);
foreach (['data/products.json', 'data/banners.json', 'data/categories.json', 'data/collections.json', 'index.html'] as $src) {
  $t = (string)@file_get_contents(__DIR__ . '/' . $src);
  if ($t !== '' && (strpos($t, $u) !== false || strpos($t, $esc) !== false || strpos($t, htmlspecialchars($u, ENT_QUOTES)) !== false)) { $ok = true; break; }
}
if (!$ok || !function_exists('imagecreatefromstring') || !function_exists('curl_init')) go_original($u);

$ch = curl_init($u);
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_MAXREDIRS => 3, CURLOPT_TIMEOUT => 12, CURLOPT_CONNECTTIMEOUT => 6,
  CURLOPT_PROTOCOLS => CURLPROTO_HTTPS, CURLOPT_USERAGENT => 'Mozilla/5.0 (PetVerse image cache)', CURLOPT_MAXFILESIZE => 12000000]);
$raw = curl_exec($ch); $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
if (!is_string($raw) || $code !== 200 || strlen($raw) < 200) go_original($u);
$im = @imagecreatefromstring($raw); if (!$im) go_original($u);

$sw = imagesx($im); $sh = imagesy($im); $s = min(1, $w / max($sw, $sh));
$nw = max(1, (int)round($sw * $s)); $nh = max(1, (int)round($sh * $s));
$out = imagecreatetruecolor($nw, $nh);
imagealphablending($out, false); imagesavealpha($out, true);
imagefill($out, 0, 0, imagecolorallocatealpha($out, 255, 255, 255, 127));
imagecopyresampled($out, $im, 0, 0, 0, 0, $nw, $nh, $sw, $sh);
if (!is_dir($dir)) @mkdir($dir, 0755, true);
$webp = function_exists('imagewebp');
$f = "$dir/$key." . ($webp ? 'webp' : 'jpg'); $tmp = $f . '.' . bin2hex(random_bytes(3));
if ($webp) $saved = @imagewebp($out, $tmp, 80);
else { $bg = imagecreatetruecolor($nw, $nh); imagefill($bg, 0, 0, imagecolorallocate($bg, 255, 255, 255)); imagecopy($bg, $out, 0, 0, 0, 0, $nw, $nh); $saved = @imagejpeg($bg, $tmp, 82); }
if (!$saved || !@rename($tmp, $f)) { @unlink($tmp); go_original($u); }
header('Content-Type: ' . ($webp ? 'image/webp' : 'image/jpeg')); header('Cache-Control: public, max-age=31536000, immutable');
header('Content-Length: ' . filesize($f)); readfile($f);
