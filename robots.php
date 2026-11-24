<?php
header('Content-Type: text/plain; charset=utf-8');
$base = (((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https') ? 'https' : 'http') . '://' . preg_replace('/[^a-z0-9.\-:]/i', '', $_SERVER['HTTP_HOST'] ?? 'localhost') . rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/') . '/';
echo "User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /inc/\nDisallow: /data/private/\n\nSitemap: {$base}sitemap.xml\n";
