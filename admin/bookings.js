/* PetVerse Admin — Service Bookings (grooming, vaccine, vet, home service). Bookings from the website's booking form land here. */
"use strict";
I.cal = '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="m9 15 2 2 4-4"/>';
const BKS = { new: "New", confirmed: "Confirmed", done: "Done", cancelled: "Cancelled" };
const BKC = { new: "#f59e0b", confirmed: "#2563eb", done: "#16a34a", cancelled: "#e23b3b" };
const BK_SERVICES = ["Vaccination", "Grooming", "Deworming", "Assistant Vet Support", "Injection (as per doctor’s prescription)", "Blood Test & FPV/FIP Test", "Medicated Bathing", "Nail Cutting", "Ear Cleaning", "Home Vet Service", "Pet Food & Accessories", "Pet Medicine Delivery"];
const BK_PETS = ["Cat", "Dog", "Bird", "Rabbit", "Small pet"];
const BK_TIMES = ["Morning (9am - 12pm)", "Afternoon (12pm - 4pm)", "Evening (4pm - 8pm)"];
NAV.splice(NAV.findIndex(n => n[0] === "orders") + 1, 0, ["bookings", "Service Bookings", "cal", "bookings"]);
const bkNew = () => (DB.bookings || []).filter(k => k.status === "new");
const bkToday = () => new Date(Date.now() + 6 * 3600e3).toISOString().slice(0, 10);   // Dhaka date
const bkDate = d => { if (!d) return "—"; const x = new Date(d + "T00:00:00"); return isNaN(x) ? esc(d) : x.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) };
function bkPill(s) { return `<span class="pill" style="background:${BKC[s]}1f;color:${BKC[s]}">${BKS[s] || esc(s)}</span>` }

/* demo mode: sample bookings in the browser */
const _mockCall = Mock.call.bind(Mock);
Mock.call = async function (a, b, q, form) {
  if (a === "get" && /c=bookings/.test(q)) {
    let L = this.get("bookings", null);
    if (L == null) {
      const n = ["Nusrat Jahan", "Arif Rahman", "Sadia Islam", "Tanvir Hasan", "Lamia Haque", "Rakib Hossain", "Farzana Akter"], ar = ["Mirpur 10", "Bashundhara R/A", "Uttara Sector 7", "Dhanmondi 27", "Gulshan 2", "Badda"];
      const st = ["new", "new", "confirmed", "confirmed", "done", "done", "cancelled"]; L = [];
      for (let i = 0; i < 9; i++) { const t = Math.floor(Date.now() / 1000) - i * 26000; const d = new Date(Date.now() + (i % 4 - 1) * 864e5).toISOString().slice(0, 10);
        L.push({ no: "BK-" + Math.random().toString(16).slice(2, 7).toUpperCase(), t, name: n[i % n.length], phone: "017" + String(11223344 + i * 1234567), pet: BK_PETS[i % 3], service: BK_SERVICES[i % 9], date: d, time: BK_TIMES[i % 3], area: ar[i % ar.length], note: i % 3 ? "" : "Pet is 8 months old.", status: st[i % st.length], src: "website" }) }
      this.set("bookings", L);
    }
    return { data: L };
  }
  if (a === "booking_add") { const L = this.get("bookings", []); L.unshift({ ...b, no: "BK-" + Math.random().toString(16).slice(2, 7).toUpperCase(), t: Math.floor(Date.now() / 1000), status: "confirmed", src: "admin" }); this.set("bookings", L); return { ok: 1 } }
  if (a === "booking_update") { const L = this.get("bookings", []); const k = L.find(k => k.no === b.no); if (!k) return { error: "Not found" }; for (const f of ["status", "admin_note", "fee", "date", "time"]) if (b[f] !== undefined) k[f] = b[f]; this.set("bookings", L); return { ok: 1 } }
  if (a === "booking_del") { this.set("bookings", this.get("bookings", []).filter(k => k.no !== b.no)); return { ok: 1 } }
  return _mockCall(a, b, q, form);
};

async function Bookings(V, no) {
  title("Service Bookings"); const L = await load("bookings", true);
  let f = "", q = ""; try { f = sessionStorage.getItem("bf") || "" } catch (e) { }
  const today = bkToday();
  const tabs = [["", "Upcoming"], ["new", "New"], ["today", "Today"], ["confirmed", "Confirmed"], ["done", "Done"], ["cancelled", "Cancelled"], ["all", "All"]];
  const pick = (k, t) => t === "all" ? true : t === "" ? ["new", "confirmed"].includes(k.status) : t === "today" ? k.date === today && k.status !== "cancelled" : k.status === t;
  const draw = () => {
    let R = L.filter(k => pick(k, f) && (!q || (k.no + k.name + k.phone + k.service + k.pet + k.area).toLowerCase().includes(q)));
    if (f === "" || f === "today") R = R.slice().sort((a, b) => (a.date || "9").localeCompare(b.date || "9") || b.t - a.t);
    $("#bkl").innerHTML = R.length ? R.map(bkCard).join("") : '<div class="empty">No bookings here.</div>';
    $$("#bktabs button").forEach(b => b.classList.toggle("on", b.dataset.s === f));
  };
  const cnt = t => L.filter(k => pick(k, t)).length;
  V.innerHTML = head("Service bookings", "Grooming, vaccine, vet visits and home service booked from the website. Confirm by phone, then mark Done.",
    `<input id="bkq" placeholder="Search name, phone, service"><button class="btn s" onclick="bkAdd()">${ic("plus")} Add booking</button>`) +
    `<div class="grid g4 bk-stats" style="margin-bottom:14px">
      ${bkStat("New (call them)", L.filter(k => k.status === "new").length, "#f59e0b", "clock")}
      ${bkStat("Today", L.filter(k => k.date === today && k.status !== "cancelled").length, "#7c3aed", "cal")}
      ${bkStat("Confirmed", L.filter(k => k.status === "confirmed").length, "#2563eb", "check")}
      ${bkStat("Done this month", L.filter(k => k.status === "done" && (k.date || "").slice(0, 7) === today.slice(0, 7)).length, "#16a34a", "paw")}
    </div>
    <div class="tabs" id="bktabs" style="margin-bottom:14px">${tabs.map(t => `<button data-s="${t[0]}">${t[1]}<small>${cnt(t[0])}</small></button>`).join("")}</div>
    <div class="bk-list" id="bkl"></div>`;
  $$("#bktabs button").forEach(b => b.onclick = () => { f = b.dataset.s; try { sessionStorage.setItem("bf", f) } catch (e) { } draw() });
  $("#bkq").oninput = e => { q = e.target.value.toLowerCase().trim(); draw() }; draw();
  if (no) bkView(no);
}
function bkStat(l, v, c, i) { return `<div class="card mini"><div><small>${l}</small><b style="color:${c}">${v}</b></div>${ic(i, `color:${c};width:24px;height:24px`)}</div>` }
function bkWa(k) {
  const m = `Assalamu alaikum ${k.name}, PetVerse theke bolchi. Apnar ${k.service} booking (${k.pet}) ${k.date ? bkDate(k.date) : ""}${k.time ? ", " + k.time : ""} confirm kora holo. Kono proshno thakle 01880972500 e call korun.`;
  return "https://wa.me/88" + encodeURIComponent(k.phone || "") + "?text=" + encodeURIComponent(m);
}
function bkCard(k) {
  const past = k.date && k.date < bkToday() && ["new", "confirmed"].includes(k.status);
  return `<div class="card bk" style="--c:${BKC[k.status] || "#999"}">
   <div class="bk-top"><div><b class="bk-n">${esc(k.name)}</b> ${bkPill(k.status)}${past ? ' <span class="pill" style="background:#fde8e8;color:#c81e1e">Date passed</span>' : ""}<div class="mu sm">${esc(k.no)} · ${k.src === "admin" ? "Added by admin" : "From website"} · ${dt(k.t)}</div></div>
    <div class="bk-when"><b>${bkDate(k.date)}</b><small>${esc(k.time || "")}</small></div></div>
   <div class="bk-info"><span>${ic("paw", "width:15px;height:15px")} <b>${esc(k.service)}</b> · ${esc(k.pet || "")}</span><span>${ic("phone", "width:15px;height:15px")} ${esc(k.phone)}</span>${k.area ? `<span>📍 ${esc(k.area)}</span>` : ""}${k.fee ? `<span>${ic("coins", "width:15px;height:15px")} ${tk(k.fee)}</span>` : ""}</div>
   ${k.note ? `<p class="bk-note">“${esc(k.note)}”</p>` : ""}${k.admin_note ? `<p class="bk-note adm">${ic("edit", "width:13px;height:13px")} ${esc(k.admin_note)}</p>` : ""}
   <div class="bk-act"><a class="btn w s" href="tel:${esc(k.phone)}">${ic("phone")} Call</a><a class="btn w s" target="_blank" rel="noopener" href="${bkWa(k)}">${ic("wa")} WhatsApp</a>
    ${k.status === "new" ? `<button class="btn s" onclick="bkSet('${esc(k.no)}','confirmed')">${ic("check")} Confirm</button>` : ""}
    ${k.status === "confirmed" ? `<button class="btn s gr" onclick="bkSet('${esc(k.no)}','done')">${ic("check")} Mark done</button>` : ""}
    <button class="btn w s" onclick="bkView('${esc(k.no)}')">${ic("edit")} Details</button></div></div>`;
}
async function bkSet(no, status) { const j = await api("booking_update", { no, status }); if (j.error) return toast(j.error); toast(BKS[status] + " ✓"); await load("bookings", true); bell(); route() }
function bkView(no) {
  const k = (DB.bookings || []).find(k => k.no === no); if (!k) return toast("Booking not found");
  modal(`<div class="mh"><h3>Booking ${esc(k.no)} ${bkPill(k.status)}</h3><button class="ic" onclick="closeModal()">✕</button></div><div class="mb">
   <div class="kv"><span>Customer</span><b>${esc(k.name)}</b><span>Phone</span><span style="color:var(--ink)">${esc(k.phone)} · <a href="tel:${esc(k.phone)}">Call</a> · <a target="_blank" rel="noopener" href="${bkWa(k)}">WhatsApp</a></span>
   <span>Pet</span><span style="color:var(--ink)">${esc(k.pet || "")}</span><span>Service</span><span style="color:var(--ink)">${esc(k.service)}</span><span>Area</span><span style="color:var(--ink)">${esc(k.area || "—")}</span>${k.note ? `<span>Customer note</span><span style="color:var(--ink)">${esc(k.note)}</span>` : ""}</div>
   <div class="row r3" style="margin-top:14px"><div class="fld"><label>Status</label><select id="bst">${Object.keys(BKS).map(s => `<option value="${s}" ${s === k.status ? "selected" : ""}>${BKS[s]}</option>`).join("")}</select></div>
    <div class="fld"><label>Date</label><input id="bdt" type="date" value="${esc(k.date || "")}"></div>
    <div class="fld"><label>Time</label><select id="btm">${[...new Set([...BK_TIMES, k.time].filter(Boolean))].map(t => `<option ${t === k.time ? "selected" : ""}>${esc(t)}</option>`).join("")}</select></div></div>
   <div class="row r2"><div class="fld"><label>Fee (Tk)</label><input id="bfee" type="number" min="0" value="${esc(k.fee || "")}" placeholder="e.g. 500"></div>
    <div class="fld"><label>Internal note</label><input id="bnote" value="${esc(k.admin_note || "")}" placeholder="Only admins see this"></div></div>
  </div><div class="mf">${can("settings") ? `<button class="btn rd" onclick="bkDel('${esc(k.no)}')">${ic("trash")} Delete</button>` : ""}<span style="flex:1"></span><button class="btn" onclick="bkSave('${esc(k.no)}')">Save changes</button></div>`, true);
}
async function bkSave(no) {
  const j = await api("booking_update", { no, status: $("#bst").value, date: $("#bdt").value, time: $("#btm").value, fee: +$("#bfee").value || 0, admin_note: $("#bnote").value });
  if (j.error) return toast(j.error); toast("Booking updated ✓"); closeModal(); await load("bookings", true); bell(); route();
}
async function bkDel(no) { if (!confirm("Delete booking " + no + "? This cannot be undone.")) return; const j = await api("booking_del", { no }); if (j.error) return toast(j.error); closeModal(); await load("bookings", true); bell(); route() }
function bkAdd() {
  const opt = a => a.map(x => `<option>${esc(x)}</option>`).join("");
  modal(`<div class="mh"><h3>Add booking</h3><button class="ic" onclick="closeModal()">✕</button></div><div class="mb"><p class="mu sm" style="margin:0 0 12px">For bookings taken by phone or Facebook.</p>
   <div class="row r2"><div class="fld"><label>Customer name</label><input id="ban" placeholder="e.g. Rahim"></div><div class="fld"><label>Phone number</label><input id="bap" inputmode="tel" placeholder="01XXXXXXXXX"></div></div>
   <div class="row r2"><div class="fld"><label>Pet</label><select id="bapet">${opt(BK_PETS)}</select></div><div class="fld"><label>Service</label><select id="basv">${opt(BK_SERVICES)}</select></div></div>
   <div class="row r2"><div class="fld"><label>Date</label><input id="bad" type="date" value="${bkToday()}"></div><div class="fld"><label>Time</label><select id="bat">${opt(BK_TIMES)}</select></div></div>
   <div class="fld"><label>Area / address</label><input id="baa" placeholder="e.g. Mirpur 10"></div><div class="fld"><label>Note</label><input id="ban2" placeholder="Pet age, problem..."></div>
  </div><div class="mf"><span style="flex:1"></span><button class="btn" onclick="bkAddSave(this)">Save booking</button></div>`);
}
async function bkAddSave(b) {
  const d = { name: $("#ban").value, phone: $("#bap").value, pet: $("#bapet").value, service: $("#basv").value, date: $("#bad").value, time: $("#bat").value, area: $("#baa").value, note: $("#ban2").value };
  if (!d.name.trim()) return toast("Write the customer name"); b.disabled = true;
  const j = await api("booking_add", d); b.disabled = false; if (j.error) return toast(j.error);
  toast("Booking saved ✓"); closeModal(); await load("bookings", true); bell(); route();
}
