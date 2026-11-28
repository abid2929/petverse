/* PetVerse Admin — own layout for this shop: menu on top (English + বাংলা), only what the shop needs.
   Removed here: Courier Hub, SMS, Ask AI, Reports page, language switch. */
"use strict";
I.home = '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>';
I.dl = '<path d="M12 3v12M7 10l5 5 5-5M4 19h16"/>';
// [route, English, icon, permission, বাংলা]
NAV.length = 0;
NAV.push(
  ["dashboard", "Dashboard", "home", "dashboard", "ড্যাশবোর্ড"],
  ["orders", "Orders", "cart", "orders", "অর্ডার"],
  ["bookings", "Bookings", "cal", "bookings", "সার্ভিস বুকিং"],
  ["products", "Products", "box", "products", "প্রোডাক্ট"],
  ["inventory", "Stock", "stock", "inventory", "স্টক"],
  ["categories", "Categories", "layers", "categories", "ক্যাটাগরি"],
  ["banners", "Banners", "image", "banners", "ব্যানার"],
  ["cms", "Homepage", "cms", "cms", "হোমপেজ"],
  ["collections", "Best Sellers", "book", "collections", "বেস্ট সেলার"],
  ["reviews", "Reviews", "star", "reviews", "রিভিউ"],
  ["customers", "Customers", "users", "customers", "কাস্টমার"],
  ["settings", "Settings", "gear", "settings", "সেটিং"],
  ["backup", "Backup", "dl", "backup", "সব ডাটা ডাউনলোড"]
);
// settings without courier / SMS
for (const k of ["courier", "sms"]) { const i = SETTINGS.findIndex(s => s[0] === k); if (i > -1) SETTINGS.splice(i, 1) }
const SET_BN = { store: "দোকানের তথ্য", delivery: "ডেলিভারি চার্জ", payment: "পেমেন্ট", pixel: "ফেসবুক পিক্সেল", seo: "গুগল SEO", security: "পাসওয়ার্ড" };
const HEAD_BN = { "All orders": "সব অর্ডার", "Customers": "কাস্টমার", "Admins & roles": "অ্যাডমিন", "All products & catalogue": "সব প্রোডাক্ট", "Catalog collections": "বেস্ট সেলার / কালেকশন",
  "Category list": "ক্যাটাগরি", "Customer reviews": "কাস্টমার রিভিউ", "Hero banners": "ব্যানার", "Homepage content": "হোমপেজের লেখা", "Inventory & stock": "স্টক", "Service bookings": "সার্ভিস বুকিং" };

drawNav = function () {
  const pend = (DB.orders || []).filter(o => o.status === "pending").length, bk = typeof bkNew === "function" ? bkNew().length : 0;
  const route = location.hash.slice(1) || "dashboard", top = route.split("/")[0];
  const on = r => top === r || (r === "products" && top === "product") || (r === "settings" && top === "admins");
  $("#nav").innerHTML = NAV.filter(n => n[0] === "settings" ? true : can(n[3])).map(n => {
    const href = n[0] === "settings" ? (can("settings") ? "#settings/store" : "#settings/security") : "#" + n[0];
    const b = n[0] === "orders" ? pend : n[0] === "bookings" ? bk : 0;
    return `<a class="tn${on(n[0]) ? " on" : ""}" href="${href}">${ic(n[2])}<span><b>${n[1]}</b><small>${n[4]}</small></span>${b ? `<em>${b}</em>` : ""}</a>`;
  }).join("");
  const a = $("#nav .tn.on"); if (a && a.scrollIntoView && innerWidth < 960) a.scrollIntoView({ block: "nearest", inline: "center" });
  $$("#tabbar a[data-r]").forEach(t => t.classList.toggle("on", top === t.dataset.r || (t.dataset.r === "product" && top === "product" && route.endsWith("new"))));
  const tb = $("#tbN"); if (tb) { tb.hidden = !pend; tb.textContent = pend }
  const tk2 = $("#tbB"); if (tk2) { tk2.hidden = !bk; tk2.textContent = bk }
  if (!can("orders")) { const o = $('#tabbar a[data-r="orders"]'); if (o) o.hidden = true }
};
title = function (t) { document.title = String(t).replace(/^Site Settings · /, "Settings · ") + " · PetVerse Admin" };
const _head = head;
head = function (t, sub, right = "", crumb = "") { return _head(HEAD_BN[t] ? `${t} <span class="bn">${HEAD_BN[t]}</span>` : t, sub, right, crumb) };

function setTabs(tab) {
  const L = SETTINGS.filter(s => s[0] === "security" || can("settings")).map(s => [`#settings/${s[0]}`, s[1].replace("Meta Pixel & CAPI", "Facebook Pixel").replace("Google SEO Meta", "Google SEO").replace("Password & Security", "Password").replace("General Store", "Store info").replace("Delivery & Shipping", "Delivery").replace("Payment Settings", "Payment"), SET_BN[s[0]] || "", s[0] === tab]);
  if (ME && ME.role === "super") L.push(["#admins", "Admins", "অ্যাডমিন", tab === "admins"], ["#backup", "Backup", "ব্যাকআপ", tab === "backup"]);
  return `<div class="stabs">${L.map(x => `<a href="${x[0]}" class="${x[3] ? "on" : ""}"><b>${x[1]}</b><small>${x[2]}</small></a>`).join("")}</div>`;
}
const _Settings = Settings;
Settings = async function (V, tab = "store") {
  if (!SETTINGS.some(s => s[0] === tab)) tab = can("settings") ? "store" : "security";
  if (!can("settings") && tab !== "security") tab = "security";
  await _Settings(V, tab);
  $$("#view .crumb").forEach(c => c.remove());
  $$("#view .ph .filters").forEach(f => { if (/Quick go/.test(f.textContent)) f.innerHTML = "" });
  V.insertAdjacentHTML("afterbegin", setTabs(tab));
};
const _Admins = Admins;
Admins = async function (V) { await _Admins(V); V.insertAdjacentHTML("afterbegin", setTabs("admins")) };
// pages that no longer exist go to the dashboard
const _route = route;
route = function () {
  const p = (location.hash.slice(1) || "").split("/")[0];
  if (["courier", "reports"].includes(p)) { location.hash = "dashboard"; return }
  if (p === "backup") { document.body.classList.remove("nav-open"); $("#bellPop").hidden = true; drawNav(); window.scrollTo(0, 0); return Backup($("#view")) }
  return _route();
};
askAI = function () { };

function Backup(V) {
  title("Backup");
  if (!ME || ME.role !== "super") { V.innerHTML = '<div class="empty">Only the main admin can download a backup. শুধু মেইন অ্যাডমিন ব্যাকআপ নিতে পারবে।</div>'; return }
  const dl = t => DEMO ? `href="#backup" onclick="toast('Demo: backup download works on the real site');return false"` : `href="api.php?a=backup&t=${t}"`;
  V.innerHTML = setTabs("backup") + head("Backup · Download all data", "পুরো ওয়েবসাইট আর সব তথ্য একটা zip ফাইলে ডাউনলোড করুন। মাঝে মাঝে (সপ্তাহে ১ বার) নিয়ে রাখুন।") + `
  <div class="grid g2 bkp">
   <div class="card"><div class="card-b"><div class="bkp-i" style="background:#f3e8ff;color:#6d28d9">${ic("dl")}</div><h3>Download all data <small>পুরো zip</small></h3>
    <p class="mu">The whole website in one zip: all pages, products, orders, bookings, customers, settings, admin passwords and uploaded photos.<br><span class="bnl">পুরো সাইট + সব ডাটা + আপলোড করা ছবি। কিছু হারিয়ে গেলে এই zip আবার আপলোড করে Extract দিলেই আগের মতো হয়ে যাবে।</span></p>
    <a class="btn" ${dl("full")}>${ic("dl")} Download full zip</a></div></div>
   <div class="card"><div class="card-b"><div class="bkp-i" style="background:#e8f8ee;color:#16a34a">${ic("box")}</div><h3>Data only <small>শুধু ডাটা</small></h3>
    <p class="mu">Small zip with only the data folder: products, orders, bookings, reviews, settings and admins (no website files, no photos).<br><span class="bnl">ছোট ফাইল, শুধু তথ্য (প্রোডাক্ট, অর্ডার, বুকিং, সেটিং)। দ্রুত ডাউনলোড হয়।</span></p>
    <a class="btn w" ${dl("data")}>${ic("dl")} Download data zip</a></div></div>
  </div>
  <div class="card" style="margin-top:16px"><div class="card-b"><b>How to restore · কিভাবে ফেরত আনবেন</b><ol class="mu" style="margin:8px 0 0;padding-left:20px;line-height:1.8"><li>cPanel → File Manager → website folder (public_html)</li><li>Upload the zip → right click → <b>Extract</b> (replace files)</li><li>Open the site and /admin. Everything is back. সব আগের মতো ফিরে আসবে।</li></ol></div></div>`;
}
