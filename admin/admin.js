/* PetVerse Admin — core: data layer (server or demo), navigation, dashboard, orders, courier, customers, reports */
"use strict";
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const tk = n => "৳" + Math.round(Number(n) || 0).toLocaleString("en-IN");
const dt = t => new Date(t * 1000).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const day = t => new Date(t * 1000).toISOString().slice(0, 10);
const I = {
  dash: '<rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>', layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>', book: '<path d="M4 5a2 2 0 0 1 2-2h6v18H6a2 2 0 0 1-2-2zM12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/>',
  stock: '<path d="M3 21V9l9-6 9 6v12"/><path d="M7 21v-8h10v8M7 17h10"/>', cart: '<path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6"/><circle cx="10" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/>',
  truck: '<path d="M2 6h11v10H2zM13 9h5l3 3v4h-8"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>', users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>', image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
  cms: '<path d="M4 4h16v6H4zM4 14h7v6H4zM15 14h5v6h-5z"/>', chart: '<path d="M3 20h18M6 16l4-5 4 3 5-7"/>', shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>', store: '<path d="M4 9h16l-1-5H5zM5 9v11h14V9M9 20v-6h6v6"/>', pay: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M16 15h2"/>',
  sms: '<path d="M4 5h16v11H8l-4 4z"/>', target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>', globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', print: '<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6z"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m14 6 4 4"/>', trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', plus: '<path d="M12 5v14M5 12h14"/>', down: '<path d="m6 9 6 6 6-6"/>', bag: '<path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>', coins: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.5"/>', paw: '<circle cx="7" cy="9" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="17" cy="9" r="2"/><path d="M12 12c-3 0-5 3-5 5s2 3 5 3 5-1 5-3-2-5-5-5z"/>', refresh: '<path d="M20 11a8 8 0 1 0-2 5.3M20 4v7h-7"/>', wa: '<path d="M4 20l1.4-4A8 8 0 1 1 8 18.6z"/>', phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>', send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>'
};
const ic = (n, s) => `<svg viewBox="0 0 24 24"${s ? ` style="${s}"` : ""}>${I[n] || ""}</svg>`;
const STATUS = { pending: "Pending", processing: "Processing", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled", returned: "Returned" };
const STC = { pending: "#f59e0b", processing: "#7c3aed", shipped: "#2563eb", delivered: "#16a34a", cancelled: "#e23b3b", returned: "#9f1239" };
const ROLE_NAME = { super: "Super Admin", manager: "Manager", staff: "Staff" };
let DEMO = false, CSRF = null, ME = null;
const DB = {};   // cache: products, categories, collections, reviews, banners, site, orders

function toast(t) { const e = $("#toast"); e.textContent = t; e.classList.add("on"); clearTimeout(e._t); e._t = setTimeout(() => e.classList.remove("on"), 2600) }

/* ---------- data layer ---------- */
async function api(a, body, q = "", form) {
  if (DEMO) return Mock.call(a, body, q, form);
  const o = { method: body || form ? "POST" : "GET", headers: {}, credentials: "same-origin" };
  if (CSRF) o.headers["X-PV"] = CSRF;
  if (form) o.body = form; else if (body) { o.headers["Content-Type"] = "application/json"; o.body = JSON.stringify(body) }
  let r; try { r = await fetch("api.php?a=" + a + q, o) } catch (e) { return { error: "Network error" } }
  const j = await r.json().catch(() => ({ error: "Server error " + r.status }));
  if (r.status === 401 && a !== "state") { location.reload() }
  return j;
}
async function load(c, force) { if (DB[c] && !force) return DB[c]; const j = await api("get", null, "&c=" + c); DB[c] = j.data ?? (c === "site" ? {} : (c === "products" ? {} : [])); return DB[c] }
async function save(c) { const j = await api("put", { data: DB[c] }, "&c=" + c); if (j.error) { toast(j.error); return false } return true }
const imgSrc = s => !s ? "" : (/^(https?:|data:)/.test(s) ? s : "../img/" + s.replace(/^img\//, ""));
const GHP = /github\.io$/.test(location.hostname);
function thumb(x, cls = "th") { const s = x.i && !(GHP && x.r && /^p\//.test(x.i)) ? imgSrc(x.i) : (x.r || (x.g && x.g[0] && imgSrc(x.g[0].s)) || ""); return s ? `<img class="${cls}" src="${esc(s)}" data-r="${esc(x.r || "")}" onerror="if(this.dataset.r&&this.src!==this.dataset.r){this.src=this.dataset.r}else{this.outerHTML='<div class=ph0>${esc((x.b || "").slice(0, 14))}</div>'}" alt="">` : `<div class="ph0">${esc((x.b || "No photo").slice(0, 14))}</div>` }
function allProducts() { const out = []; const P = DB.products || {}; for (const k in P) (P[k] || []).forEach((x, j) => { if (!x.id) x.id = k + j; out.push({ ...x, _k: k, _j: j }) }); return out }
function catName(k) { const c = (DB.categories || []).find(c => c.k === k); return c ? c.name : k }

/* ---------- demo (GitHub Pages / preview): everything in localStorage with sample orders ---------- */
const Mock = {
  key: k => (window.PV_PREFIX || "pvd") + "_" + k,
  get(k, d) { try { const v = localStorage.getItem(this.key(k)); return v ? JSON.parse(v) : d } catch (e) { return d } },
  set(k, v) { try { localStorage.setItem(this.key(k), JSON.stringify(v)) } catch (e) { toast("Browser storage is full") } },
  async seed() {
    for (const c of ["products", "categories", "collections", "reviews", "banners", "site"]) if (this.get(c) == null) {
      let d = null; try { d = await (await fetch("../data/" + c + ".json", { cache: "no-store" })).json() } catch (e) { }
      this.set(c, d ?? (c === "site" || c === "products" ? {} : []));
    }
    if (this.get("orders") == null) this.set("orders", this.fakeOrders());
    if (this.get("users") == null) this.set("users", [{ u: "admin", name: "Demo Admin", role: "super", on: 1, last: Date.now() / 1000 }, { u: "rafi", name: "Rafi (Shop)", role: "staff", on: 1 }]);
    if (this.get("secrets") == null) this.set("secrets", { sf_base: "https://portal.packzy.com/api/v1" });
    if (this.get("visits") == null) { const d = {}; for (let i = 0; i < 14; i++) { const t = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); d[t] = 60 + Math.round(Math.random() * 140) } this.set("visits", d) }
  },
  fakeOrders() {
    const names = ["Tanvir Hasan", "Nusrat Jahan", "Arif Rahman", "Sadia Islam", "Mehedi Hasan", "Farzana Akter", "Rakib Hossain", "Tasnim Ahmed", "Imran Kabir", "Sharmin Sultana", "Fahim Chowdhury", "Lamia Haque"];
    const areas = ["Bashundhara R/A, Block C", "Gulshan 2, Road 45", "Mirpur 10", "Uttara Sector 7", "Dhanmondi 27", "Banani Road 11", "Badda, Merul", "Chattogram, Khulshi", "Sylhet, Zindabazar", "Mohammadpur, Tajmahal Road"];
    const P = allProductsFrom(this.get("products", {})).filter(x => x.p);
    const st = ["delivered", "delivered", "delivered", "shipped", "processing", "pending", "pending", "cancelled"]; const out = [];
    for (let i = 0; i < 46; i++) {
      const t = Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 13 * 86400) - 600; const n = 1 + Math.floor(Math.random() * 3); const items = [];
      for (let k = 0; k < n; k++) { const x = P[Math.floor(Math.random() * P.length)]; if (!x) continue; items.push({ id: x.id, n: x.n, b: x.b, q: 1 + Math.floor(Math.random() * 2), p: x.p, i: x.i || "" }) }
      const sub = items.reduce((a, b) => a + b.q * b.p, 0), area = areas[i % areas.length], out_ = /Chattogram|Sylhet/.test(area);
      const s = i < 3 ? "pending" : st[Math.floor(Math.random() * st.length)];
      out.push({ no: "PV-" + Math.random().toString(16).slice(2, 8).toUpperCase(), t, name: names[i % names.length], phone: "017" + String(11223344 + (i % names.length) * 1234567), address: area, area: out_ ? "out" : "in", note: "", pay: ["cod", "cod", "bkash"][i % 3], items, sub, ship: out_ ? 130 : 70, total: sub + (out_ ? 130 : 70), status: s, src: "website" });
    }
    return out.sort((a, b) => b.t - a.t);
  },
  async call(a, b, q, form) {
    const p = new URLSearchParams(q.replace(/^&/, ""));
    await new Promise(r => setTimeout(r, 120));
    if (a === "state") return { setup: false, me: { u: "admin", name: "Demo Admin", role: "super" }, csrf: "demo" };
    if (a === "get") return { data: this.get(p.get("c"), null) };
    if (a === "put") { this.set(p.get("c"), b.data); return { ok: 1 } }
    if (a === "upload") { const f = form.get("photo"); if (f.size > 500000) return { error: "Demo: please use an image under 500 KB" }; const url = await new Promise(r => { const rd = new FileReader(); rd.onload = () => r(rd.result); rd.readAsDataURL(f) }); return { ok: 1, i: url } }
    if (a === "order_update") { const os = this.get("orders", []); const o = os.find(o => o.no === b.no); if (!o) return { error: "Not found" }; if (b.status && b.status !== o.status) { (o.hist = o.hist || []).push({ t: Date.now() / 1000, s: b.status, u: "admin" }); o.status = b.status } if ("admin_note" in b) o.admin_note = b.admin_note; if ("paid" in b) o.paid = b.paid ? 1 : 0; this.set("orders", os); return { ok: 1 } }
    if (a === "order_add") { const os = this.get("orders", []); const o = b.order; const sub = o.items.reduce((s, i) => s + i.q * i.p, 0); os.unshift({ ...o, no: "PV-" + Math.random().toString(16).slice(2, 8).toUpperCase(), t: Date.now() / 1000, sub, total: sub + (+o.ship || 0), status: "pending" }); this.set("orders", os); return { ok: 1 } }
    if (a === "order_del") { this.set("orders", this.get("orders", []).filter(o => o.no !== b.no)); return { ok: 1 } }
    if (a === "courier_send") { const os = this.get("orders", []); const o = os.find(o => o.no === b.no); o.courier = { by: "steadfast", cid: String(Date.now()).slice(-8), code: "SF" + Math.random().toString(36).slice(2, 9).toUpperCase(), st: "in_review", t: Date.now() / 1000 }; o.status = "shipped"; this.set("orders", os); return { ok: 1, courier: o.courier } }
    if (a === "courier_status") return { ok: 1, status: "in_review" };
    if (a === "courier_balance") return { ok: 1, balance: 2450 };
    if (a === "stats") { const v = this.get("visits", {}); return { days: v, live: 3 + Math.floor(Math.random() * 9), capi: { events: 0, ok: 0 }, audit: [] } }
    if (a === "secrets_get") { const s = this.get("secrets", {}); const o = {}; for (const k of ["capi_token", "capi_test", "sf_key", "sf_secret", "sf_base", "sms_url", "sms_admin", "sms_on_order", "sms_on_status", "gemini_key"]) o[k] = ["capi_token", "sf_secret", "gemini_key", "sms_url"].includes(k) ? (s[k] ? "__set__" : "") : (s[k] ?? ""); return { data: o } }
    if (a === "secrets_put") { const s = this.get("secrets", {}); for (const k in b.data) { const v = b.data[k]; if (v === "__set__" || (v === "" && ["capi_token", "sf_secret", "gemini_key", "sms_url"].includes(k))) continue; s[k] = v } this.set("secrets", s); return { ok: 1 } }
    if (a === "sms_test") return { ok: true, msg: "Demo: SMS is not really sent." };
    if (a === "users") return { data: this.get("users", []) };
    if (a === "user_save") { const us = this.get("users", []); let u = us.find(x => x.u === b.u); if (!u) { u = { u: b.u }; us.push(u) } Object.assign(u, { name: b.name, role: b.role, on: b.on ? 1 : 0 }); this.set("users", us); return { ok: 1 } }
    if (a === "user_del") { this.set("users", this.get("users", []).filter(x => x.u !== b.u)); return { ok: 1 } }
    if (a === "pass") return { ok: 1 };
    if (a === "pull") return { ok: 1, new: 0, have: 0, fail: 0 };
    if (a === "ai") return { error: "nokey" };
    if (a === "logout") { localStorage.removeItem(Mock.key("orders")); return { ok: 1 } }
    return { error: "Not available in demo" };
  }
};
function allProductsFrom(P) { const o = []; for (const k in P) (P[k] || []).forEach((x, j) => o.push({ ...x, id: x.id || k + j })); return o }

/* ---------- auth & boot ---------- */
async function boot() {
  $("#yr").textContent = new Date().getFullYear();
  let s = null;
  try { const r = await fetch("api.php?a=state", { cache: "no-store", credentials: "same-origin" }); if (r.ok && (r.headers.get("content-type") || "").includes("json")) s = await r.json() } catch (e) { }
  if (!s) { DEMO = true; document.body.classList.add("is-demo"); await Mock.seed(); s = await Mock.call("state", null, "") }
  if (s.me) { ME = s.me; CSRF = s.csrf; return start() }
  $("#login").hidden = false;
  if (s.setup) { $("#loginHint").textContent = "First time: set the admin password (8+ characters)."; $("#loginForm button.btn").textContent = "Save password & sign in" }
  $("#loginForm").onsubmit = async e => {
    e.preventDefault(); const f = new FormData(e.target); $("#loginErr").textContent = "";
    const j = await api("login", { user: "", pass: f.get("pass"), name: "Admin" });
    if (j.error) return $("#loginErr").textContent = j.error;
    ME = j.me; CSRF = j.csrf; $("#login").hidden = true; start();
  };
}
async function logout() { await api("logout", {}); location.hash = ""; location.reload() }
function can(p) { if (!ME) return false; if (ME.role === "super") return true; const R = { manager: ["dashboard", "products", "inventory", "categories", "collections", "orders", "bookings", "courier", "customers", "reviews", "banners", "cms", "reports", "settings"], staff: ["dashboard", "products", "inventory", "orders", "bookings", "courier", "customers"] }; return (R[ME.role] || []).includes(p) }

/* ---------- navigation ---------- */
const NAV = [
  ["dashboard", "Dashboard Overview", "dash", "dashboard"], ["products", "Product Management", "box", "products"], ["categories", "Categories", "layers", "categories"], ["collections", "Catalog Collections", "book", "collections"],
  ["inventory", "Inventory & Stock", "stock", "inventory"], ["orders", "Orders", "cart", "orders"], ["courier", "Courier Hub", "truck", "courier"], ["customers", "Customers", "users", "customers"],
  ["reviews", "Customer Reviews", "star", "reviews"], ["banners", "Hero Banners", "image", "banners"], ["cms", "Homepage CMS", "cms", "cms"], ["reports", "Reports & Analytics", "chart", "reports"], ["admins", "Admin & Roles", "shield", "users"]
];
const SETTINGS = [["store", "General Store", "store"], ["delivery", "Delivery & Shipping", "truck"], ["payment", "Payment Settings", "pay"], ["courier", "Courier Automation", "box"], ["sms", "SMS Notifications", "sms"], ["pixel", "Meta Pixel & CAPI", "target"], ["seo", "Google SEO Meta", "globe"], ["security", "Password & Security", "lock"]];
function drawNav() {
  const pend = (DB.orders || []).filter(o => o.status === "pending").length;
  const route = location.hash.slice(1) || "dashboard";
  let h = NAV.filter(n => can(n[3])).map(n => `<a class="nv${route.split("/")[0] === n[0] || (n[0] === "products" && route.startsWith("product")) ? " on" : ""}" href="#${n[0]}">${ic(n[2])}${n[1]}${n[0] === "orders" && pend ? `<span class="bd">${pend}</span>` : ""}${n[0] === "bookings" && typeof bkNew === "function" && bkNew().length ? `<span class="bd">${bkNew().length}</span>` : ""}${n[0] === "courier" ? '<span class="live">LIVE</span>' : ""}</a>`).join("");
  if (can("settings") || true) {
    const open = route.startsWith("settings");
    h += `<div class="grp${open ? " open" : ""}"><button class="nv${open ? " on" : ""}" onclick="this.parentNode.classList.toggle('open')">${ic("gear")}Site Settings<span class="chev">${ic("down", "width:15px;height:15px")}</span></button><div class="sub">${SETTINGS.filter(s => s[0] === "security" || can("settings")).map(s => `<a class="nv${route === "settings/" + s[0] ? " on" : ""}" href="#settings/${s[0]}">${ic(s[2], "width:16px;height:16px")}${s[1]}${s[0] === "pixel" ? '<span class="live" style="background:#14532d">CAPI</span>' : ""}</a>`).join("")}</div></div>`;
  }
  h += `<a class="nv store" href="../" target="_blank">${ic("ext")}View Live Store</a>`;
  $("#nav").innerHTML = h;
  $$("#tabbar a[data-r]").forEach(t => t.classList.toggle("on", route.split("/")[0] === t.dataset.r));
  const tb = $("#tbN"); if (tb) { tb.hidden = !pend; tb.textContent = pend }
  if (!can("orders")) { const o = $('#tabbar a[data-r="orders"]'); if (o) o.hidden = true }
}
async function start() {
  $("#app").hidden = false; $("#meName").textContent = ME.name || ME.u; $("#meRole").textContent = ROLE_NAME[ME.role] || ME.role;
  await Promise.all(["products", "categories", "site"].map(c => load(c)));
  if (can("orders")) await load("orders");
  if (can("bookings")) await load("bookings");
  window.onhashchange = route; route(); bell();
}
async function route() {
  document.body.classList.remove("nav-open"); $("#bellPop").hidden = true;
  const [p, a, b] = (location.hash.slice(1) || "dashboard").split("/");
  drawNav(); window.scrollTo(0, 0);
  const V = $("#view"); V.innerHTML = '<div class="empty">Loading…</div>';
  const map = { dashboard: Dash, products: Products, product: ProductEdit, categories: Categories, collections: Collections, inventory: Inventory, orders: Orders, bookings: Bookings, courier: Courier, customers: Customers, reviews: Reviews, banners: Banners, cms: CMS, reports: Reports, admins: Admins, settings: Settings };
  const fn = map[p] || Dash; try { await fn(V, a, b) } catch (e) { console.error(e); V.innerHTML = `<div class="card card-b">Something went wrong: ${esc(e.message)}</div>` }
}
function title(t) { $("#pageTitle").textContent = t; document.title = t + " · PetVerse Admin" }
function head(t, sub, right = "", crumb = "") { return `${crumb ? `<div class="crumb">${crumb}</div>` : ""}<div class="ph"><div><h2>${t}</h2>${sub ? `<p>${sub}</p>` : ""}</div><div class="filters">${right}</div></div>` }
function modal(html, wide) { $("#modalBox").className = "modal-box" + (wide ? " wide" : ""); $("#modalBox").innerHTML = html; $("#modal").hidden = false }
function closeModal() { $("#modal").hidden = true }
function sw(name, on, extra = "") { return `<label class="sw"><input type="checkbox" name="${name}" ${on ? "checked" : ""} ${extra}><span></span></label>` }

/* ---------- notifications ---------- */
function bell() {
  const pend = (DB.orders || []).filter(o => o.status === "pending"), low = allProducts().filter(x => x.st !== undefined && x.st !== "" && x.st < 10);
  const bkn = typeof bkNew === "function" ? bkNew() : [];
  const n = pend.length + bkn.length + (low.length ? 1 : 0); $("#bellN").hidden = !n; $("#bellN").textContent = n;
  $("#bellPop").innerHTML = (pend.slice(0, 8).map(o => `<a href="#orders/${o.no}">${ic("cart", "color:#f0642a")}<span><b>New order ${esc(o.no)}</b><small>${esc(o.name)} · ${tk(o.total)} · ${dt(o.t)}</small></span></a>`).join("") + bkn.slice(0, 6).map(k => `<a href="#bookings/${esc(k.no)}">${ic("cal", "color:#7c3aed")}<span><b>New booking: ${esc(k.service)}</b><small>${esc(k.name)} · ${esc(k.pet || "")} · ${esc(k.date || "")}</small></span></a>`).join("") + (low.length ? `<a href="#inventory/low">${ic("alert", "color:#e23b3b")}<span><b>${low.length} products low in stock</b><small>Less than 10 left</small></span></a>` : "")) || '<div class="empty" style="padding:20px">No new notifications</div>';
}
function toggleBell() { $("#bellPop").hidden = !$("#bellPop").hidden }

/* ---------- dashboard ---------- */
function statusPill(s) { return `<span class="pill st-${s}">${STATUS[s] || s}</span>` }
function quick(k) {
  if (k === "neworder") return newOrder();
  if (k === "pending") { try { sessionStorage.setItem("of", "pending") } catch (e) { } location.hash = "orders"; return }
  if (k === "store") return window.open("../", "_blank");
  location.hash = k;
}
async function Dash(V) {
  title("Dashboard Overview");
  const O = DB.orders || [], P = allProducts(), now = Date.now() / 1000, today = day(now);
  const valid = O.filter(o => !["cancelled", "returned"].includes(o.status));
  const sales = valid.reduce((a, o) => a + o.total, 0), todaySales = valid.filter(o => day(o.t) === today).reduce((a, o) => a + o.total, 0);
  const cnt = s => O.filter(o => o.status === s).length, todayOrders = O.filter(o => day(o.t) === today).length;
  const custs = new Set(O.map(o => o.phone)).size, inStock = P.filter(x => !x.off && (x.st === undefined || x.st === "" || x.st > 0)).length, low = P.filter(x => x.st !== undefined && x.st !== "" && x.st < 10).length;
  const repeat = Object.values(O.reduce((m, o) => (m[o.phone] = (m[o.phone] || 0) + 1, m), {})).filter(n => n > 1).length;
  let st = { days: {}, live: 0 }; if (can("dashboard")) st = await api("stats");
  const todayVis = typeof st.days?.[today] === "number" ? st.days[today] : 0;
  const days = [...Array(7)].map((_, i) => { const d = new Date(Date.now() - (6 - i) * 864e5); return d.toISOString().slice(0, 10) });
  const series = days.map(d => valid.filter(o => day(o.t) === d).reduce((a, o) => a + o.total, 0));
  const last = O[0];
  const hr = new Date().getHours(), greet = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : hr < 21 ? "Good evening" : "Good night";
  const qa = [["product/new", "plus", "New product", "#f0642a", can("products")], ["neworder", "cart", "Manual order", "#7c3aed", can("orders")], ["pending", "clock", "Pending orders", "#f59e0b", can("orders"), cnt("pending")], ["bookings", "cal", "Service bookings", "#0e7490", can("bookings"), (DB.bookings || []).filter(k => k.status === "new").length || ""], ["inventory", "stock", "Update stock", "#16a34a", can("inventory"), low || ""], ["banners", "image", "Banners & offers", "#2563eb", can("banners")], ["store", "ext", "View shop", "#c2185b", true]].filter(x => x[4]);
  V.innerHTML = `
  <div class="hello"><div><h2><span>${greet}</span>, ${esc(ME.name || ME.u || "")} 👋</h2><p><span>Today</span>: <b>${todayOrders}</b> <span class="tl">new orders</span> · <b>${tk(todaySales)}</b> <span class="tl">sales</span> · <b>${cnt("pending")}</b> <span class="tl">waiting</span></p></div></div>
  <div class="qa">${qa.map(x => `<button class="qa-b" onclick="quick('${x[0]}')" style="--c:${x[3]}"><i>${ic(x[1])}</i><span>${x[2]}</span>${x[5] ? `<em>${x[5]}</em>` : ""}</button>`).join("")}</div>
  <div class="card card-b" style="margin-bottom:16px"><div class="vis">
   <div style="background:#eef5ff"><div><b style="color:#2563eb">${todayVis.toLocaleString()}</b><small style="color:#2563eb">Unique visitors today</small></div>${ic("users", "color:#2563eb;width:26px;height:26px")}</div>
   <div style="background:#eafaf0"><div><b style="color:#16a34a">${st.live || 0}</b><small style="color:#16a34a">Browsing right now</small></div>${ic("eye", "color:#16a34a;width:26px;height:26px")}</div>
   <div style="background:#f6efff"><div><b style="color:#7c3aed">${repeat}</b><small style="color:#7c3aed">Repeat buyers</small></div>${ic("star", "color:#7c3aed;width:26px;height:26px")}</div></div>
   <div class="feed"><b style="color:#5b21b6">● SHOP ACTIVITY</b><span class="lv">LIVE</span><span>${last ? `Latest order <b>${esc(last.no)}</b> from ${esc(last.name)} (${tk(last.total)}) · ${dt(last.t)}` : "No orders yet. Orders placed on the website appear here."}</span></div></div>
  <div class="grid g4" style="margin-bottom:16px">
   ${statCard("coins", "#fff1e8", "#f0642a", tk(sales), "Total sales", `Today: <b>${tk(todaySales)}</b>`, "#16a34a")}
   ${statCard("bag", "#e9f0ff", "#2563eb", O.length, "Total orders", `Today: <b>${todayOrders}</b>`, "#f0642a")}
   ${statCard("clock", "#fff6e0", "#f59e0b", cnt("pending"), "Pending orders", `Processing: <b>${cnt("processing")}</b>`, "#7c3aed")}
   ${statCard("check", "#e8f8ee", "#16a34a", cnt("delivered"), "Delivered", `Cancelled: <b>${cnt("cancelled")}</b>`, "#e23b3b")}
  </div>
  <div class="grid g4" style="margin-bottom:16px">
   <a class="card mini" href="#products" style="text-decoration:none;color:inherit"><div><small>Total products</small><b>${P.length}</b></div>${ic("paw", "color:#f0642a;width:24px;height:24px")}</a>
   <a class="card mini" href="#inventory" style="text-decoration:none;color:inherit"><div><small>Active in stock</small><b style="color:#16a34a">${inStock}</b></div>${ic("check", "color:#16a34a;width:24px;height:24px")}</a>
   <a class="card mini" href="#inventory/low" style="text-decoration:none;color:inherit"><div><small>Low stock alert (&lt; 10)</small><b>${low}</b></div>${ic("alert", "color:#e23b3b;width:24px;height:24px")}</a>
   <a class="card mini" href="#customers" style="text-decoration:none;color:inherit"><div><small>Customers</small><b>${custs}</b></div>${ic("users", "color:#2563eb;width:24px;height:24px")}</a>
  </div>
  <div class="grid g21" style="margin-bottom:16px">
   <div class="card"><div class="card-h"><div><h3>Daily sales trend (last 7 days)</h3><p>From orders placed, in Taka</p></div><b style="color:var(--ac)">Total: ${tk(series.reduce((a, b) => a + b, 0))}</b></div><div class="card-b">${lineChart(days, series)}</div></div>
   <div class="card"><div class="card-h"><div><h3>Order status ratio</h3><p>All orders by status</p></div></div><div class="card-b">${donut(Object.keys(STATUS).map(s => [STATUS[s], cnt(s), STC[s]]))}</div></div>
  </div>
  <div class="card"><div class="card-h"><div><h3>Recent customer orders</h3><p>View an order, change status or print the invoice</p></div><a class="b" href="#orders" style="color:var(--ac);text-decoration:none">All orders (${O.length}) →</a></div>${orderTable(O.slice(0, 8))}</div>`;
}
function statCard(icn, bg, col, v, l, sub, subc) { return `<div class="card stat"><div class="ico" style="background:${bg};color:${col}">${ic(icn)}</div><div><b>${v}</b><small>${l}</small><em style="color:${subc}">${sub}</em></div></div>` }
function lineChart(labels, vals) {
  const W = 760, H = 280, L = 56, B = 30, T = 14, max = Math.max(1000, ...vals) * 1.15, n = vals.length;
  const x = i => L + i * (W - L - 16) / (n - 1), y = v => T + (H - T - B) * (1 - v / max);
  const pts = vals.map((v, i) => [x(i), y(v)]);
  const path = pts.map((p, i) => { if (!i) return `M${p[0]},${p[1]}`; const q = pts[i - 1], cx = (q[0] + p[0]) / 2; return `C${cx},${q[1]} ${cx},${p[1]} ${p[0]},${p[1]}` }).join(" ");
  let g = ""; for (let i = 0; i <= 5; i++) { const v = max / 5 * i, yy = y(v); g += `<line x1="${L}" x2="${W - 10}" y1="${yy}" y2="${yy}" stroke="#eee"/><text x="${L - 8}" y="${yy + 4}" text-anchor="end" font-size="11" fill="#888">৳${Math.round(v).toLocaleString("en-IN")}</text>` }
  const lab = labels.map((d, i) => `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="#777">${new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</text>`).join("");
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;stroke:none;fill:none">${g}<path d="${path} L${x(n - 1)},${H - B} L${L},${H - B}Z" fill="rgba(240,100,42,.12)"/><path d="${path}" stroke="#f0642a" stroke-width="3" fill="none"/>${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="#f0642a"><title>${labels[i]}: ৳${vals[i]}</title></circle>`).join("")}${lab}</svg>`;
}
function donut(parts) {
  const tot = parts.reduce((a, p) => a + p[1], 0) || 1; let a0 = -Math.PI / 2, s = "";
  const R = 90, r = 58, C = 110;
  parts.forEach(([l, v, c]) => { if (!v) return; const a1 = a0 + v / tot * Math.PI * 2 - 0.0001, big = a1 - a0 > Math.PI ? 1 : 0, p = (a, rr) => [C + rr * Math.cos(a), C + rr * Math.sin(a)];
    const [x1, y1] = p(a0, R), [x2, y2] = p(a1, R), [x3, y3] = p(a1, r), [x4, y4] = p(a0, r);
    s += `<path d="M${x1},${y1} A${R},${R} 0 ${big} 1 ${x2},${y2} L${x3},${y3} A${r},${r} 0 ${big} 0 ${x4},${y4}Z" fill="${c}"><title>${l}: ${v}</title></path>`; a0 = a1 + 0.0001 });
  return `<svg viewBox="0 0 220 220" style="width:100%;max-width:260px;height:auto;display:block;margin:0 auto;stroke:none">${s}<text x="110" y="106" text-anchor="middle" font-size="26" font-weight="700" fill="#1d1824">${tot === 1 && !parts.some(p => p[1]) ? 0 : tot}</text><text x="110" y="128" text-anchor="middle" font-size="12" fill="#888">orders</text></svg><div class="legend">${parts.map(p => `<span><i style="background:${p[2]}"></i>${p[0]} (${p[1]})</span>`).join("")}</div>`;
}

/* ---------- orders ---------- */
function orderTable(list, opts = {}) {
  if (!list.length) return '<div class="empty">No orders here yet.</div>';
  return `<div class="tw"><table class="tbl"><thead><tr>${opts.sel ? "<th></th>" : ""}<th>Order no</th><th>Customer</th><th>Delivery address</th><th>Amount & payment</th><th>Status</th><th>Order date</th><th>Action</th></tr></thead><tbody>${list.map(o => `<tr>
   ${opts.sel ? `<td><input type="checkbox" class="osel" value="${esc(o.no)}" style="width:16px;height:16px"></td>` : ""}
   <td><a class="on-no" href="#orders/${esc(o.no)}" style="text-decoration:none">${esc(o.no)}</a>${o.src && o.src !== "website" ? `<br><span class="tag">${esc(o.src)}</span>` : ""}</td>
   <td><b>${esc(o.name)}</b><br><span class="mu sm">${ic("phone", "width:12px;height:12px")} ${esc(o.phone)}</span></td>
   <td style="max-width:260px">${esc(o.address)}<br><span class="mu sm">${o.area === "out" ? "Outside Dhaka" : "Inside Dhaka"}</span></td>
   <td><b>${tk(o.total)}</b><br><span class="sm" style="color:var(--gr)">${o.pay === "cod" ? "Cash on delivery" : esc(o.pay)}${o.paid ? " · Paid" : ""}</span></td>
   <td>${statusPill(o.status)}${o.courier ? `<br><span class="tag v">${esc(o.courier.code || "Courier")}</span>` : ""}</td>
   <td class="mu sm">${dt(o.t)}</td>
   <td><div class="acts"><button title="View" onclick="viewOrder('${esc(o.no)}')">${ic("eye")}</button><button title="Print invoice" onclick="invoice('${esc(o.no)}')">${ic("print")}</button></div></td></tr>`).join("")}</tbody></table></div>`;
}
async function Orders(V, no) {
  title("Orders"); const O = await load("orders", true); let f = sessionStorage.getItem("of") || "all", q = "";
  const draw = () => {
    const L = O.filter(o => (f === "all" || o.status === f) && (!q || (o.no + o.name + o.phone + o.address).toLowerCase().includes(q)));
    $("#ol").innerHTML = orderTable(L); $$("#otabs button").forEach(b => b.classList.toggle("on", b.dataset.s === f));
  };
  V.innerHTML = head("All orders", "Orders from the website and manual orders (phone / Facebook)", `<input id="oq" placeholder="Search order, name, phone">${can("reports") ? `<a class="btn w s" href="${DEMO ? "#" : "api.php?a=export"}" ${DEMO ? "onclick=\"toast('Demo: CSV export works on the real site');return false\"" : ""}>Export CSV</a>` : ""}<button class="btn" onclick="newOrder()">${ic("plus")} Add manual order</button>`) +
    `<div class="tabs" id="otabs" style="margin-bottom:14px"><button data-s="all">All<small>${O.length}</small></button>${Object.keys(STATUS).map(s => `<button data-s="${s}">${STATUS[s]}<small>${O.filter(o => o.status === s).length}</small></button>`).join("")}</div><div class="card" id="ol"></div>`;
  $$("#otabs button").forEach(b => b.onclick = () => { f = b.dataset.s; sessionStorage.setItem("of", f); draw() });
  $("#oq").oninput = e => { q = e.target.value.toLowerCase().trim(); draw() }; draw();
  if (no) viewOrder(no);
}
function viewOrder(no) {
  const o = (DB.orders || []).find(o => o.no === no); if (!o) return toast("Order not found");
  const site = DB.site || {};
  modal(`<div class="mh"><h3>Order ${esc(o.no)} ${statusPill(o.status)}</h3><button class="ic" onclick="closeModal()">✕</button></div><div class="mb">
   <div class="grid g2" style="gap:18px"><div class="kv"><span>Customer</span><b>${esc(o.name)}</b><span>Phone</span><span style="color:var(--ink)">${esc(o.phone)} · <a href="tel:${esc(o.phone)}">Call</a> · <a target="_blank" rel="noopener" href="https://wa.me/88${esc(o.phone)}">WhatsApp</a></span><span>Address</span><span style="color:var(--ink)">${esc(o.address)} (${o.area === "out" ? "Outside Dhaka" : "Inside Dhaka"})</span><span>Note</span><span style="color:var(--ink)">${esc(o.note || "—")}</span></div>
   <div class="kv"><span>Date</span><span style="color:var(--ink)">${dt(o.t)}</span><span>Payment</span><span style="color:var(--ink)">${o.pay === "cod" ? "Cash on delivery" : esc(o.pay)}${o.trx ? " · TrxID " + esc(o.trx) : ""}</span><span>Source</span><span style="color:var(--ink)">${esc(o.src || "website")}</span>${o.courier ? `<span>Courier</span><span style="color:var(--ink)">Steadfast · ${esc(o.courier.code)} · ${esc(o.courier.st)}</span>` : ""}</div></div>
   <table class="tbl" style="margin:16px 0;border:1px solid var(--line);border-radius:12px"><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>${o.items.map(i => `<tr><td>${esc(i.n)}${i.v ? ` <span class="tag">${esc(i.v)}</span>` : ""}</td><td>${i.q}</td><td>${tk(i.p)}</td><td>${tk(i.q * i.p)}</td></tr>`).join("")}
   <tr><td colspan="3" style="text-align:right">Subtotal</td><td>${tk(o.sub)}</td></tr><tr><td colspan="3" style="text-align:right">Delivery</td><td>${tk(o.ship)}</td></tr><tr><td colspan="3" style="text-align:right"><b>Total</b></td><td><b>${tk(o.total)}</b></td></tr></tbody></table>
   <div class="row r3"><div class="fld"><label>Order status</label><select id="ost">${Object.keys(STATUS).map(s => `<option value="${s}" ${s === o.status ? "selected" : ""}>${STATUS[s]}</option>`).join("")}</select></div>
   <div class="fld"><label>Payment received</label><div style="padding-top:6px">${sw("paid", o.paid, 'id="opaid"')}</div></div><div class="fld"><label>Internal note</label><input id="onote" value="${esc(o.admin_note || "")}" placeholder="Only admins see this"></div></div>
   ${(o.hist || []).length ? `<p class="mu sm" style="margin:12px 0 0">History: ${o.hist.map(h => `${STATUS[h.s]} by ${esc(h.u)} (${dt(h.t)})`).join(" → ")}</p>` : ""}
  </div><div class="mf">${can("settings") ? `<button class="btn rd" onclick="delOrder('${esc(o.no)}')">${ic("trash")} Delete</button>` : ""}<span style="flex:1"></span>
   ${can("courier") && !o.courier && !["cancelled", "delivered"].includes(o.status) ? `<button class="btn w" onclick="sendCourier('${esc(o.no)}',this)">${ic("truck")} Send to Steadfast</button>` : ""}
   <button class="btn w" onclick="invoice('${esc(o.no)}')">${ic("print")} Invoice</button><button class="btn" onclick="saveOrder('${esc(o.no)}')">Save changes</button></div>`, true);
}
async function saveOrder(no) {
  const j = await api("order_update", { no, status: $("#ost").value, admin_note: $("#onote").value, paid: $("#opaid").checked });
  if (j.error) return toast(j.error); toast("Order updated ✓"); closeModal(); await load("orders", true); bell(); route();
}
async function delOrder(no) { if (!confirm("Delete order " + no + "? This cannot be undone.")) return; const j = await api("order_del", { no }); if (j.error) return toast(j.error); closeModal(); await load("orders", true); route() }
async function sendCourier(no, b) { if (b) b.disabled = true; const j = await api("courier_send", { no }); if (b) b.disabled = false; if (j.error) return toast(j.error); toast("Sent to Steadfast ✓ Tracking: " + (j.courier.tracking_code || j.courier.code || "")); closeModal(); await load("orders", true); route() }
function invoice(no) {
  const o = (DB.orders || []).find(o => o.no === no); if (!o) return; const s = (DB.site || {}).store || {};
  const w = window.open("", "_blank"); if (!w) return toast("Allow pop-ups to print the invoice");
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${esc(o.no)}</title><style>body{font:14px/1.5 Arial,sans-serif;color:#222;max-width:760px;margin:30px auto;padding:0 20px}.h{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #5b2a86;padding-bottom:14px}.h img{width:64px}h1{margin:0;color:#5b2a86}table{width:100%;border-collapse:collapse;margin:18px 0}th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f0fa}.r{text-align:right}.t{font-size:18px;font-weight:700}.g{display:flex;justify-content:space-between;gap:20px;margin-top:16px}.foot{margin-top:30px;color:#777;font-size:12px;text-align:center}</style></head><body>
   <div class="h"><div style="display:flex;gap:12px;align-items:center"><img src="${location.origin + location.pathname.replace(/admin\/.*$/, "")}img/logo-mark.png" alt=""><div><h1>${esc(s.name || "PetVerse")}</h1><div>${esc(s.tagline || "")}</div><div>${esc(s.phone || "")} ${s.email ? "· " + esc(s.email) : ""}</div><div>${esc(s.address || "")}</div></div></div><div class="r"><div class="t">INVOICE</div><div>${esc(o.no)}</div><div>${dt(o.t)}</div></div></div>
   <div class="g"><div><b>Bill to</b><br>${esc(o.name)}<br>${esc(o.phone)}<br>${esc(o.address)}</div><div class="r"><b>Payment</b><br>${o.pay === "cod" ? "Cash on delivery" : esc(o.pay)}${o.paid ? " (Paid)" : ""}<br><b>Status</b><br>${STATUS[o.status]}</div></div>
   <table><thead><tr><th>#</th><th>Product</th><th>Qty</th><th class="r">Price</th><th class="r">Total</th></tr></thead><tbody>${o.items.map((i, k) => `<tr><td>${k + 1}</td><td>${esc(i.n)}${i.v ? " (" + esc(i.v) + ")" : ""}</td><td>${i.q}</td><td class="r">${tk(i.p)}</td><td class="r">${tk(i.p * i.q)}</td></tr>`).join("")}</tbody></table>
   <table style="width:300px;margin-left:auto"><tr><td>Subtotal</td><td class="r">${tk(o.sub)}</td></tr><tr><td>Delivery</td><td class="r">${tk(o.ship)}</td></tr><tr><td class="t">Total</td><td class="r t">${tk(o.total)}</td></tr></table>
   <div class="foot">Thank you for shopping with ${esc(s.name || "PetVerse")}! ${esc(s.tagline || "")}</div><script>onload=()=>setTimeout(()=>print(),300)<\/script></body></html>`);
  w.document.close();
}
function newOrder() {
  const P = allProducts().filter(x => x.p && !x.off); const d = (DB.site || {}).delivery || {};
  modal(`<div class="mh"><h3>Add manual order</h3><button class="ic" onclick="closeModal()">✕</button></div><form class="mb form" id="nof">
   <div class="row r2"><div class="fld"><label>Customer name *</label><input name="name" required></div><div class="fld"><label>Phone *</label><input name="phone" required placeholder="01XXXXXXXXX"></div></div>
   <div class="fld"><label>Address *</label><input name="address" required></div>
   <div class="row r3"><div class="fld"><label>Area</label><select name="area"><option value="in">Inside Dhaka</option><option value="out">Outside Dhaka</option></select></div><div class="fld"><label>Payment</label><select name="pay"><option value="cod">Cash on delivery</option><option value="bkash">bKash</option><option value="nagad">Nagad</option></select></div><div class="fld"><label>Order from</label><select name="src"><option>phone</option><option>facebook</option><option>whatsapp</option><option>shop</option></select></div></div>
   <div class="fld"><label>Products</label><div id="noi"></div><button type="button" class="btn w s" style="justify-self:start" onclick="noRow()">${ic("plus")} Add product</button></div>
   <div class="row r2"><div class="fld"><label>Delivery charge (৳)</label><input name="ship" type="number" value="${d.inside ?? 70}"></div><div class="fld"><label>Note</label><input name="note"></div></div>
  </form><div class="mf"><button class="btn w" onclick="closeModal()">Cancel</button><button class="btn" onclick="saveNewOrder()">Create order</button></div>`, true);
  window._noP = P; noRow();
  $("#nof [name=area]").onchange = e => $("#nof [name=ship]").value = e.target.value === "out" ? (d.outside ?? 130) : (d.inside ?? 70);
}
function noRow() { const r = document.createElement("div"); r.className = "row r31"; r.style.marginBottom = "8px"; r.innerHTML = `<select class="nop">${window._noP.map(x => `<option value="${esc(x.id)}">${esc(x.n)} — ${tk(x.p)}</option>`).join("")}</select><input class="noq" type="number" min="1" value="1">`; $("#noi").append(r) }
async function saveNewOrder() {
  const f = new FormData($("#nof")); const items = $$("#noi .row").map(r => { const x = window._noP.find(p => p.id === r.querySelector(".nop").value); return { id: x.id, n: x.n, p: x.p, q: +r.querySelector(".noq").value || 1 } });
  const j = await api("order_add", { order: { ...Object.fromEntries(f), items, ship: +f.get("ship") } }); if (j.error) return toast(j.error);
  toast("Order created ✓"); closeModal(); await load("orders", true); bell(); route();
}

/* ---------- courier hub ---------- */
async function Courier(V) {
  title("Courier Hub"); const O = await load("orders", true);
  const ready = O.filter(o => !o.courier && ["pending", "processing"].includes(o.status)), sent = O.filter(o => o.courier);
  V.innerHTML = head("Courier Hub (Steadfast)", "Send orders to the courier in one click and follow their delivery status", `<button class="btn w" onclick="sfBal(this)">${ic("coins")} Check balance</button><a class="btn dk" href="#settings/courier">${ic("gear")} Courier settings</a>`) +
    `<div class="grid g3" style="margin-bottom:16px">${statCard("box", "#fff6e0", "#f59e0b", ready.length, "Ready to send", "Pending + processing", "#7c3aed")}${statCard("truck", "#e9f0ff", "#2563eb", sent.filter(o => o.status === "shipped").length, "On the way", "Sent to courier", "#2563eb")}${statCard("check", "#e8f8ee", "#16a34a", sent.filter(o => o.status === "delivered").length, "Delivered by courier", "", "#16a34a")}</div>
    <div class="card" style="margin-bottom:16px"><div class="card-h"><div><h3>Ready to send</h3><p>Tick orders and send them to Steadfast together</p></div><button class="btn" onclick="bulkSend(this)">${ic("send")} Send selected</button></div>${orderTable(ready, { sel: 1 })}</div>
    <div class="card"><div class="card-h"><div><h3>Sent to courier</h3><p>Tracking codes and live status</p></div></div>${sent.length ? `<div class="tw"><table class="tbl"><thead><tr><th>Order</th><th>Customer</th><th>COD</th><th>Tracking</th><th>Courier status</th><th>Sent</th><th></th></tr></thead><tbody>${sent.map(o => `<tr><td class="on-no">${esc(o.no)}</td><td>${esc(o.name)}<br><span class="mu sm">${esc(o.phone)}</span></td><td>${tk(o.paid ? 0 : o.total)}</td><td><span class="tag v">${esc(o.courier.code)}</span></td><td>${esc(o.courier.st)}</td><td class="mu sm">${dt(o.courier.t)}</td><td><button class="btn w s" onclick="sfStatus('${esc(o.no)}',this)">${ic("refresh")} Update</button></td></tr>`).join("")}</tbody></table></div>` : '<div class="empty">Nothing sent yet.</div>'}</div>`;
}
async function sfBal(b) { b.disabled = true; const j = await api("courier_balance", {}); b.disabled = false; toast(j.error || "Steadfast balance: " + tk(j.balance)) }
async function sfStatus(no, b) { b.disabled = true; const j = await api("courier_status", { no }); b.disabled = false; toast(j.error || "Status: " + j.status); await load("orders", true); route() }
async function bulkSend(b) { const ids = $$(".osel:checked").map(x => x.value); if (!ids.length) return toast("Tick at least one order"); b.disabled = true; let ok = 0; for (const no of ids) { const j = await api("courier_send", { no }); if (j.error) toast(no + ": " + j.error); else ok++ } b.disabled = false; toast(ok + " orders sent ✓"); await load("orders", true); route() }

/* ---------- customers ---------- */
async function Customers(V) {
  title("Customers"); const O = await load("orders", true); const m = {};
  O.forEach(o => { const c = m[o.phone] = m[o.phone] || { name: o.name, phone: o.phone, address: o.address, area: o.area, n: 0, sum: 0, last: 0, first: o.t }; c.n++; if (!["cancelled", "returned"].includes(o.status)) c.sum += o.total; if (o.t > c.last) { c.last = o.t; c.name = o.name; c.address = o.address } c.first = Math.min(c.first, o.t) });
  const L = Object.values(m).sort((a, b) => b.sum - a.sum); let q = "";
  V.innerHTML = head("Customers", `${L.length} customers from your orders`, `<input id="cq" placeholder="Search name or phone">`) + `<div class="card" id="cl"></div>`;
  const draw = () => { const R = L.filter(c => !q || (c.name + c.phone).toLowerCase().includes(q)); $("#cl").innerHTML = R.length ? `<div class="tw"><table class="tbl"><thead><tr><th>Customer</th><th>Address</th><th>Orders</th><th>Total spent</th><th>Type</th><th>Last order</th><th></th></tr></thead><tbody>${R.map(c => `<tr><td><b>${esc(c.name)}</b><br><span class="mu sm">${esc(c.phone)}</span></td><td style="max-width:260px">${esc(c.address)}</td><td>${c.n}</td><td><b>${tk(c.sum)}</b></td><td>${c.n > 2 ? '<span class="tag o">Loyal</span>' : c.n > 1 ? '<span class="tag v">Repeat</span>' : '<span class="tag">New</span>'}</td><td class="mu sm">${dt(c.last)}</td><td><div class="acts"><a href="tel:${esc(c.phone)}" title="Call">${ic("phone")}</a><a href="https://wa.me/88${esc(c.phone)}" target="_blank" rel="noopener" title="WhatsApp">${ic("wa")}</a></div></td></tr>`).join("")}</tbody></table></div>` : '<div class="empty">No customers yet. They appear when orders come in.</div>' };
  $("#cq").oninput = e => { q = e.target.value.toLowerCase(); draw() }; draw();
}

/* ---------- reports ---------- */
async function Reports(V, range) {
  title("Reports & Analytics"); const O = await load("orders", true); const N = +(range || 30), since = Date.now() / 1000 - N * 86400;
  const L = O.filter(o => o.t >= since), valid = L.filter(o => !["cancelled", "returned"].includes(o.status));
  const rev = valid.reduce((a, o) => a + o.total, 0), aov = valid.length ? rev / valid.length : 0, del = L.filter(o => o.status === "delivered").length;
  const days = [...Array(N)].map((_, i) => new Date(Date.now() - (N - 1 - i) * 864e5).toISOString().slice(0, 10)); const byDay = days.map(d => valid.filter(o => day(o.t) === d).reduce((a, o) => a + o.total, 0)); const mx = Math.max(1, ...byDay);
  const prod = {}, cat = {}; valid.forEach(o => o.items.forEach(i => { const p = prod[i.n] = prod[i.n] || { q: 0, s: 0 }; p.q += i.q; p.s += i.q * i.p; const x = allProducts().find(x => x.id === i.id); const c = x ? catName(x._k) : "Other"; cat[c] = (cat[c] || 0) + i.q * i.p }));
  const top = Object.entries(prod).sort((a, b) => b[1].s - a[1].s).slice(0, 10), cats = Object.entries(cat).sort((a, b) => b[1] - a[1]), cmx = Math.max(1, ...cats.map(c => c[1]));
  const inD = valid.filter(o => o.area !== "out").length;
  V.innerHTML = head("Reports & Analytics", "Sales, best sellers and categories", `<div class="tabs">${[7, 30, 90].map(n => `<button class="${n === N ? "on" : ""}" onclick="location.hash='reports/${n}'">Last ${n} days</button>`).join("")}</div>${can("reports") && !DEMO ? `<a class="btn w s" href="api.php?a=export">Export CSV</a>` : ""}`) +
    `<div class="grid g4" style="margin-bottom:16px">${statCard("coins", "#fff1e8", "#f0642a", tk(rev), "Revenue", `${valid.length} orders`, "#16a34a")}${statCard("bag", "#e9f0ff", "#2563eb", tk(aov), "Average order", "", "#2563eb")}${statCard("check", "#e8f8ee", "#16a34a", L.length ? Math.round(del / L.length * 100) + "%" : "0%", "Delivered rate", `${del} delivered`, "#16a34a")}${statCard("truck", "#f6efff", "#7c3aed", valid.length ? Math.round(inD / valid.length * 100) + "%" : "0%", "Inside Dhaka", `${valid.length - inD} outside Dhaka`, "#7c3aed")}</div>
    <div class="card" style="margin-bottom:16px"><div class="card-h"><h3>Sales by day</h3></div><div class="card-b"><div class="bars">${byDay.map((v, i) => `<div style="height:${v / mx * 100}%" data-t="${days[i]}: ৳${v.toLocaleString("en-IN")}"></div>`).join("")}</div></div></div>
    <div class="grid g2"><div class="card"><div class="card-h"><h3>Top products</h3></div>${top.length ? `<div class="tw"><table class="tbl"><thead><tr><th>Product</th><th>Sold</th><th>Sales</th></tr></thead><tbody>${top.map(([n, p]) => `<tr><td>${esc(n)}</td><td>${p.q}</td><td><b>${tk(p.s)}</b></td></tr>`).join("")}</tbody></table></div>` : '<div class="empty">No sales in this period.</div>'}</div>
    <div class="card"><div class="card-h"><h3>Sales by category</h3></div><div class="card-b">${cats.map(([c, v]) => `<div class="hbar"><span>${esc(c)}</span><i style="width:${v / cmx * 100}%"></i><b>${tk(v)}</b></div>`).join("") || '<div class="empty">No sales in this period.</div>'}</div></div></div>`;
}
