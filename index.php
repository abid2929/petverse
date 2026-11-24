<?php
/* PetVerse homepage: serves index.html with the SEO, Facebook Pixel and Google Analytics settings from the admin panel. */
$html = (string)@file_get_contents(__DIR__ . '/index.html');
$site = json_decode((string)@file_get_contents(__DIR__ . '/data/site.json'), true);
if (!is_array($site)) { echo $html; exit; }
$h = fn($v) => htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8');
$seo = $site['seo'] ?? []; $px = trim((string)($site['pixel']['id'] ?? '')); $ga = trim((string)($seo['ga'] ?? ''));
if (!empty($seo['title'])) $html = preg_replace('~<title>.*?</title>~s', '<title>' . $h($seo['title']) . '</title>', $html, 1);
if (!empty($seo['desc'])) $html = preg_replace('~<meta name="description" content="[^"]*">~', '<meta name="description" content="' . $h($seo['desc']) . '">', $html, 1);
$add = '<script>window.PV_SSR=1</script>';
if (!empty($seo['keys'])) $add .= '<meta name="keywords" content="' . $h($seo['keys']) . '">';
if (!empty($seo['gsv'])) $add .= '<meta name="google-site-verification" content="' . $h(preg_replace('/[^A-Za-z0-9_\-]/', '', (string)$seo['gsv'])) . '">';
if (preg_match('/^\d{6,20}$/', $px)) $add .= "<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','$px');fbq('track','PageView');</script>";
if (preg_match('/^G-[A-Z0-9]{4,15}$/i', $ga)) $add .= "<script async src=\"https://www.googletagmanager.com/gtag/js?id=$ga\"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','$ga');</script>";
$pos = stripos($html, '</head>');
echo $pos === false ? $html : substr($html, 0, $pos) . $add . substr($html, $pos);
