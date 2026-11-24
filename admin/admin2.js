/* PetVerse Admin — catalogue, content and settings pages */
"use strict";
const disc = x => x.o && x.p && x.o > x.p ? Math.round((x.o - x.p) / x.o * 100) : 0;
const stockCell = x => x.st === undefined || x.st === "" ? '<span class="mu">—</span>' : `<b style="color:${x.st < 10 ? "var(--rd)" : "var(--gr)"}">${x.st}</b>`;
const badges = x => [x.ft && '<span class="tag o">Featured</span>', x.fs && '<span class="tag r">Flash sale</span>', x.nw && '<span class="tag v">New</span>', x.bs && '<span class="tag g">Best seller</span>', x.off && '<span class="tag">Hidden</span>'].filter(Boolean).join(" ");
function cats() { return (DB.categories || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0)) }
function findProd(id) { const P = DB.products; for (const k in P) { const j = (P[k] || []).findIndex((x, jj) => (x.id || k + jj) === id); if (j > -1) return { k, j, x: P[k][j] } } return null }
function newId() { return "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5) }
async function upFile(file) { const fd = new FormData(); fd.append("photo", file); toast("Uploading…"); const j = await api("upload", null, "", fd); if (j.error) { toast(j.error); return null } toast("Image uploaded ✓"); return j.i }
async function pullPhotos(b) { b.disabled = true; toast("Copying photos to your server…"); const j = await api("pull", {}); b.disabled = false; toast(j.error || `Done: ${j.new} new, ${j.have} already there, ${j.fail} failed`) }

/* ---------- products ---------- */
async function Products(V) {
  title("Product Management"); await load("products", true); await load("categories");
  let q = "", fc = "", fs = "", fb = "";
  V.innerHTML = head("All products & catalogue", "Prices, stock, badges and photos", `<button class="btn w s" onclick="pullPhotos(this)" title="Copy online product photos to your own server">${ic("image")} Copy photos to server</button><a class="btn" href="#product/new">${ic("plus")} Add new product</a>`) +
    `<div class="card"><div class="card-h"><div><h3 id="pcount">Products</h3><p>Use the action buttons to edit or delete</p></div><div class="filters"><input id="pq" placeholder="Search name or brand"><select id="pc"><option value="">All categories</option>${cats().map(c => `<option value="${c.k}">${esc(c.name)}</option>`).join("")}</select><select id="ps"><option value="">All stock</option><option value="in">In stock</option><option value="low">Low stock (&lt;10)</option><option value="out">Out of stock</option></select><select id="pb"><option value="">All badges</option><option value="ft">Featured</option><option value="fs">Flash sale</option><option value="nw">New arrival</option><option value="bs">Best seller</option><option value="off">Hidden</option><option value="noprice">No price</option></select></div></div><div id="plist"></div></div>`;
  const draw = () => {
    const L = allProducts().filter(x => (!q || (x.n + " " + x.b).toLowerCase().includes(q)) && (!fc || x._k === fc) && (!fs || (fs === "in" ? (x.st === undefined || x.st === "" || x.st > 0) : fs === "low" ? (x.st !== undefined && x.st !== "" && x.st < 10) : x.st === 0)) && (!fb || (fb === "noprice" ? !x.p : x[fb])));
    $("#pcount").textContent = `Product list (${L.length})`;
    $("#plist").innerHTML = L.length ? `<div class="tw"><table class="tbl"><thead><tr><th>Photo</th><th>Name & brand</th><th>Category</th><th>Price (sale / regular)</th><th>Sizes / options</th><th>Stock</th><th>Badges</th><th>Action</th></tr></thead><tbody>${L.map(x => `<tr>
      <td>${thumb(x)}</td><td><b>${esc(x.n)}</b><br><span class="mu sm">${esc(x.b)}</span></td><td><span class="tag">${esc(catName(x._k))}</span></td>
      <td>${x.p ? `<b style="color:var(--ac)">${tk(x.p)}</b>${x.o ? ` <s class="mu sm">${tk(x.o)}</s><span class="disc">-${disc(x)}%</span>` : ""}` : '<span class="mu sm">Ask on WhatsApp</span>'}</td>
      <td class="sm">${esc(x.sz || "—")}</td><td>${stockCell(x)}</td><td>${badges(x)}</td>
      <td><div class="acts"><a href="#product/${esc(x.id)}" title="Edit">${ic("edit")}</a><button class="dl" title="Delete" onclick="delProd('${esc(x.id)}')">${ic("trash")}</button></div></td></tr>`).join("")}</tbody></table></div>` : '<div class="empty">No products match.</div>';
  };
  $("#pq").oninput = e => { q = e.target.value.toLowerCase().trim(); draw() }; $("#pc").onchange = e => { fc = e.target.value; draw() }; $("#ps").onchange = e => { fs = e.target.value; draw() }; $("#pb").onchange = e => { fb = e.target.value; draw() };
  draw();
}
async function delProd(id) { const f = findProd(id); if (!f || !confirm(`Delete "${f.x.n}"?`)) return; DB.products[f.k].splice(f.j, 1); if (await save("products")) { toast("Deleted ✓"); route() } }

const QUICK_COLORS = { Black: "#111", White: "#fff", Brown: "#7a4a24", Grey: "#888", Blue: "#2563eb", Red: "#e23b3b", Pink: "#ec4899", Green: "#16a34a", Yellow: "#facc15", Purple: "#7c3aed", Orange: "#f97316", Beige: "#e8d8b8" };
async function ProductEdit(V, id) {
  await load("products", true); await load("categories"); await load("collections");
  const isNew = !id || id === "new", f = isNew ? null : findProd(id); if (!isNew && !f) { V.innerHTML = '<div class="empty">Product not found.</div>'; return }
  const x = f ? JSON.parse(JSON.stringify(f.x)) : { id: newId(), n: "", b: "" }; const k0 = f ? f.k : (cats()[0] || {}).k;
  title(isNew ? "Add new product" : "Edit product");
  let colors = (x.cl || "").split(",").map(s => s.trim()).filter(Boolean);
  let gal = [{ s: x.i ? x.i : (x.r || ""), r: x.r || "", c: "", main: 1 }].concat((x.g || []).map(g => ({ s: g.s, c: g.c || "" })));
  const inCols = (DB.collections || []).filter(c => (c.ids || []).includes(x.id)).map(c => c.slug);
  V.innerHTML = head(isNew ? "Add new product" : "Edit product", "Details, photos, size options and price", `<a class="btn w" href="#products">← All products</a>`) + `<form class="card card-b form" id="pf" autocomplete="off">
   <div class="row r31"><div class="fld"><label>Product title *</label><input name="n" required maxlength="160" value="${esc(x.n)}" placeholder="e.g. Royal Canin Kitten Dry Food 2kg"></div><div class="fld"><label>Brand</label><input name="b" maxlength="60" value="${esc(x.b)}" placeholder="e.g. Royal Canin"></div></div>
   <div class="box"><div class="lbl" style="margin-bottom:8px">Where should this product show? *</div><div class="row r2"><div class="fld"><label>Category</label><select name="k">${cats().map(c => `<option value="${c.k}" ${c.k === k0 ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select><span class="hint">Shows on the homepage in this category.</span></div>
    <div class="fld"><label>Catalog collections <i>(optional)</i></label><div class="chips">${(DB.collections || []).map(c => `<label class="chip"><input type="checkbox" name="col" value="${esc(c.slug)}" ${inCols.includes(c.slug) ? "checked" : ""} style="width:14px;height:14px"> ${esc(c.name)}</label>`).join("") || '<span class="hint">No collections yet. Make them in Catalog Collections.</span>'}</div></div></div></div>
   <div class="row r4"><div class="fld"><label>Regular price (৳)</label><input name="reg" type="number" min="0" value="${x.o || x.p || ""}" placeholder="2200"></div><div class="fld"><label>Sale price (৳) <i>(optional)</i></label><input name="sale" type="number" min="0" value="${x.o ? x.p : ""}" placeholder="e.g. 1950 if discounted"></div><div class="fld"><label>Stock <i>(optional)</i></label><input name="st" type="number" min="0" value="${x.st ?? ""}" placeholder="e.g. 50 (empty = not tracked)"></div><div class="fld"><label>Label under name <i>(optional)</i></label><input name="t" value="${esc(x.t || "")}" placeholder="e.g. Dry Cat Food"></div></div>
   <span class="hint" style="margin-top:-8px">Leave both prices empty to show "Ask price on WhatsApp".</span>
   <div class="box row r2" style="background:#fff"><div class="fld"><label>Available sizes / weights</label><input name="sz" value="${esc(x.sz || "")}" placeholder="e.g. 400g, 1.2kg, 3kg, 7kg"><span class="hint">Separate with commas. Customers choose one when ordering.</span></div>
    <div class="fld"><label>Colours <i>(for toys, collars, beds)</i></label><div class="chips" id="clist"></div><div class="chips" style="margin-top:4px"><span class="hint">Quick add:</span>${Object.keys(QUICK_COLORS).map(c => `<button type="button" class="chip" onclick="addColor('${c}')"><i style="background:${QUICK_COLORS[c]}"></i>+ ${c}</button>`).join("")}</div><div class="filters" style="margin-top:6px"><input id="cnew" placeholder="Other colour" style="min-width:0;flex:1"><button type="button" class="btn s" onclick="addColor($('#cnew').value)">+ Add</button></div></div></div>
   <div class="box"><div class="ph" style="margin:0 0 10px"><div><h2 style="font-size:15px">Product images & colour gallery</h2><p>First image is the main photo. Add as many as you like; tag a colour to show the right photo.</p></div><span class="tag o">Image 1 required · unlimited gallery</span></div><div id="glist" class="grid" style="gap:12px"></div><button type="button" class="add-more" style="margin-top:12px" onclick="addGal()">+ Add more image</button></div>
   <div class="aibox"><div><b>✦ AI product copywriter</b><small>Writes the short and full description from the title, brand and category in one click</small></div><button type="button" class="btn vi s" onclick="aiWrite(this)">✦ Write with AI</button></div>
   <div class="fld"><label>Short description</label><textarea name="sd" maxlength="600" style="min-height:70px" placeholder="Main benefits in one or two lines">${esc(x.sd || "")}</textarea></div>
   <div class="fld"><label>Full description & specification</label><textarea name="d" maxlength="6000" style="min-height:150px" placeholder="Ingredients, feeding guide, size, age, how to use…">${esc(x.d || "")}</textarea></div>
   <div class="chk"><label><input type="checkbox" name="ft" ${x.ft ? "checked" : ""}> Featured</label><label><input type="checkbox" name="fs" ${x.fs ? "checked" : ""}> Flash sale offer</label><label><input type="checkbox" name="nw" ${x.nw ? "checked" : ""}> New arrival</label><label><input type="checkbox" name="bs" ${x.bs ? "checked" : ""}> Best seller</label><label><input type="checkbox" name="off" ${x.off ? "checked" : ""}> Hide from website</label></div>
   <div class="filters"><button class="btn">${ic("check")} ${isNew ? "Publish product" : "Save product"}</button><a class="btn w" href="#products">← Cancel and go back</a></div></form>`;
  const drawColors = () => { $("#clist").innerHTML = colors.length ? colors.map((c, i) => `<span class="chip on"><i style="background:${QUICK_COLORS[c] || "#ccc"}"></i>${esc(c)} <span class="x" onclick="rmColor(${i})">✕</span></span>`).join("") : '<span class="hint">No colours (fine for food and litter)</span>'; drawGal() };
  const drawGal = () => {
    $("#glist").innerHTML = gal.map((g, i) => `<div class="gal"><div class="pv">${g.s ? `<img src="${esc(imgSrc(g.s))}" data-r="${esc(g.r || "")}" onerror="if(this.dataset.r&&this.src!==this.dataset.r)this.src=this.dataset.r">` : "No image"}</div><div class="form" style="gap:8px">
      <div class="filters" style="justify-content:space-between"><b>${i ? "Gallery image #" + (i + 1) : "Main image"}</b>${i ? `<button type="button" class="btn rd s" onclick="rmGal(${i})">${ic("trash")} Remove</button>` : ""}</div>
      <div class="row r2"><input type="file" accept="image/*" onchange="galFile(${i},this)"><input placeholder="…or paste an image link (https://)" value="${esc(/^https?:/.test(g.s) ? g.s : "")}" onchange="galUrl(${i},this.value)"></div>
      ${colors.length ? `<div class="chips"><span class="hint">Colour:</span><button type="button" class="chip ${!g.c ? "on" : ""}" onclick="galColor(${i},'')">All colours</button>${colors.map(c => `<button type="button" class="chip ${g.c === c ? "on" : ""}" onclick="galColor(${i},'${esc(c)}')"><i style="background:${QUICK_COLORS[c] || "#ccc"}"></i>${esc(c)}</button>`).join("")}</div>` : ""}</div></div>`).join("");
  };
  window.addColor = c => { c = (c || "").trim(); if (c && !colors.includes(c)) colors.push(c); $("#cnew").value = ""; drawColors() };
  window.rmColor = i => { colors.splice(i, 1); drawColors() };
  window.addGal = () => { gal.push({ s: "", c: "" }); drawGal() };
  window.rmGal = i => { gal.splice(i, 1); drawGal() };
  window.galFile = async (i, inp) => { const f0 = inp.files[0]; if (!f0) return; const p = await upFile(f0); if (p) { gal[i].s = p; gal[i].r = ""; drawGal() } };
  window.galUrl = (i, v) => { v = v.trim(); if (v && !/^https:\/\//.test(v)) return toast("Use an https:// link"); gal[i].s = v; gal[i].r = ""; drawGal() };
  window.galColor = (i, c) => { gal[i].c = c; drawGal() };
  drawColors();
  $("#pf").onsubmit = async e => {
    e.preventDefault(); const F = new FormData(e.target), g = k => (F.get(k) || "").toString().trim();
    const reg = +g("reg") || 0, sale = +g("sale") || 0;
    const y = { id: x.id, n: g("n"), b: g("b") }; if (g("t")) y.t = g("t");
    if (sale && reg && sale < reg) { y.p = sale; y.o = reg } else if (reg || sale) y.p = sale || reg;
    if (g("st") !== "") y.st = +g("st"); if (g("sz")) y.sz = g("sz"); if (colors.length) y.cl = colors.join(", "); if (g("sd")) y.sd = g("sd"); if (g("d")) y.d = g("d");
    for (const b of ["ft", "fs", "nw", "bs", "off"]) if (F.get(b)) y[b] = 1;
    const main = gal[0] || {}; if (main.s) { if (/^https?:/.test(main.s)) y.r = main.s; else { y.i = main.s; if (main.r) y.r = main.r } }
    const more = gal.slice(1).filter(q => q.s).map(q => ({ s: q.s, c: q.c || "" })); if (more.length) y.g = more;
    const k = g("k"); DB.products[k] = DB.products[k] || [];
    if (f && f.k === k) DB.products[k][f.j] = y; else { if (f) DB.products[f.k].splice(f.j, 1); DB.products[k].unshift(y) }
    const cols = F.getAll("col"); let colChanged = false;
    for (const c of DB.collections || []) { const has = (c.ids || []).includes(y.id), want = cols.includes(c.slug); if (has !== want) { colChanged = true; c.ids = want ? [...(c.ids || []), y.id] : c.ids.filter(i => i !== y.id) } }
    if (!(await save("products"))) return; if (colChanged) await save("collections");
    toast(isNew ? "Product published ✓" : "Product saved ✓"); location.hash = "products";
  };
}
async function aiWrite(b) {
  const F = new FormData($("#pf")); const n = F.get("n"), br = F.get("b"), c = catName(F.get("k")), sz = F.get("sz");
  if (!n) return toast("Write the product title first");
  b.disabled = true; const j = await api("ai", { prompt: `Write product copy in simple English for a Bangladesh pet shop website called PetVerse. Product: "${n}", brand: "${br}", category: "${c}"${sz ? ", sizes: " + sz : ""}. Return two parts separated by a line with three dashes: first a short description (max 2 sentences), then a full description with 4-6 short bullet points (benefits, who it is for, how to use/feed, storage). No prices, no medical claims.` }); b.disabled = false;
  let sd, d;
  if (j.text) { [sd, d] = j.text.split(/\n-{3,}\n/); }
  else {   // built-in writer (no API key needed)
    const low = (n + " " + c).toLowerCase(), kind = /litter/.test(low) ? "litter" : /treat/.test(low) ? "treat" : /pouch|wet|can/.test(low) ? "wet" : /food|kibble|dry/.test(low) ? "food" : /shampoo/.test(low) ? "care" : "item";
    const pet = /dog|puppy/.test(low) ? "dog" : /bird|parrot|budgie/.test(low) ? "bird" : /rabbit/.test(low) ? "rabbit" : /fish|betta/.test(low) ? "fish" : "cat";
    const T = { food: [`${br || "This"} ${n.replace(br, "").trim()} gives your ${pet} complete, balanced daily nutrition with a taste they love.`, [`Complete and balanced food for everyday feeding`, `Protein for strong muscles and healthy growth`, `Helps keep skin and coat shiny`, `Feed as per the guide on the pack; keep fresh water nearby`, `Store in a cool, dry place and close the pack after use`]],
      wet: [`Tasty ${br} wet food your ${pet} will love, with extra moisture to help hydration.`, [`Soft, juicy and easy to eat`, `Adds water to your ${pet}'s diet`, `Serve alone or mix with dry food`, `Refrigerate after opening and use within 24 hours`]],
      treat: [`${br} treats are a delicious reward for training, bonding and playtime.`, [`Great for rewarding good behaviour`, `Easy to serve, loved by picky eaters`, `Give as a treat, not as a full meal`, `Keep sealed in a cool, dry place`]],
      litter: [`${br} litter keeps your home fresh with strong odour control and easy scooping.`, [`Quick clumping for easy cleaning`, `Locks in odour`, `Low dust and gentle on paws`, `Fill 5-7 cm deep; scoop daily and top up as needed`]],
      care: [`${br} care product to keep your ${pet} clean, fresh and comfortable.`, [`Gentle formula`, `Use as directed on the label`, `For external use only`, `Keep out of reach of children`]],
      item: [`${n} from PetVerse: quality you can trust for your ${pet}.`, [`Good quality and durable`, `Safe for everyday use`, `Easy to clean`, sz ? `Available: ${sz}` : `Ask us on WhatsApp for more details`]] }[kind];
    sd = T[0]; d = T[1].map(s => "• " + s).join("\n");
  }
  $("#pf [name=sd]").value = (sd || "").trim(); $("#pf [name=d]").value = (d || "").trim(); toast(j.text ? "Written by Gemini AI ✓" : "Description written ✓");
}

/* ---------- inventory ---------- */
async function Inventory(V, filter) {
  title("Inventory & Stock"); await load("products", true); let f = filter || "";
  const draw = () => {
    const L = allProducts().filter(x => !f || (f === "low" ? x.st !== undefined && x.st !== "" && x.st < 10 : f === "out" ? x.st === 0 : f === "untracked" ? x.st === undefined || x.st === "" : true));
    $("#ilist").innerHTML = L.length ? `<div class="tw"><table class="tbl"><thead><tr><th>Photo</th><th>Product</th><th>Category</th><th>Price</th><th>Stock now</th><th>Update stock</th></tr></thead><tbody>${L.map(x => `<tr><td>${thumb(x)}</td><td><b>${esc(x.n)}</b><br><span class="mu sm">${esc(x.b)}</span></td><td><span class="tag">${esc(catName(x._k))}</span></td><td>${x.p ? tk(x.p) : "—"}</td><td>${stockCell(x)}</td><td><div class="qn"><button type="button" onclick="stk('${esc(x.id)}',-1)">−</button><input type="number" min="0" value="${x.st ?? ""}" placeholder="—" onchange="stkSet('${esc(x.id)}',this.value)"><button type="button" onclick="stk('${esc(x.id)}',1)">+</button></div></td></tr>`).join("")}</tbody></table></div>` : '<div class="empty">Nothing here.</div>';
    $$("#itabs button").forEach(b => b.classList.toggle("on", b.dataset.f === f));
  };
  const all = allProducts(), n = c => all.filter(c).length;
  V.innerHTML = head("Inventory & stock", "Change stock quickly. Low-stock items (under 10) show in red and in the bell.", `<button class="btn gr" id="isave" onclick="stkSave()">${ic("check")} Save stock</button>`) +
    `<div class="tabs" id="itabs" style="margin-bottom:14px"><button data-f="">All<small>${all.length}</small></button><button data-f="low">Low stock<small>${n(x => x.st !== undefined && x.st !== "" && x.st < 10)}</small></button><button data-f="out">Out of stock<small>${n(x => x.st === 0)}</small></button><button data-f="untracked">Not tracked<small>${n(x => x.st === undefined || x.st === "")}</small></button></div><div class="card" id="ilist"></div>`;
  $$("#itabs button").forEach(b => b.onclick = () => { f = b.dataset.f; draw() });
  window.stk = (id, d) => { const p = findProd(id); p.x.st = Math.max(0, (+p.x.st || 0) + d); draw() };
  window.stkSet = (id, v) => { const p = findProd(id); if (v === "") delete p.x.st; else p.x.st = Math.max(0, +v) };
  window.stkSave = async () => { if (await save("products")) { toast("Stock saved ✓"); bell() } };
  draw();
}

/* ---------- categories ---------- */
async function Categories(V) {
  title("Categories"); await load("categories", true); await load("products", true);
  const C = cats();
  V.innerHTML = head("Category list", `${C.length} categories and their products`, `<button class="btn" onclick="editCat()">${ic("plus")} Add new category</button>`) +
    `<div class="card"><div class="card-h"><div><h3>Existing categories (${C.length})</h3><p>"Cat food tab" categories show as tabs inside Cat Food; others get their own section.</p></div></div><div class="tw"><table class="tbl"><thead><tr><th>Image</th><th>Category name</th><th>Slug (URL)</th><th>Shows as</th><th>Products</th><th>Order</th><th>Visible</th><th>Action</th></tr></thead><tbody>${C.map(c => `<tr><td>${c.img ? `<img class="th" src="${esc(imgSrc(c.img))}" onerror="this.style.visibility='hidden'">` : '<div class="ph0">—</div>'}</td><td><b>${esc(c.name)}</b></td><td><span class="tag">${esc(c.k)}</span></td><td>${c.group === "catfood" ? '<span class="tag o">Cat food tab</span>' : '<span class="tag v">Own section</span>'}</td><td><span class="tag o">${(DB.products[c.k] || []).length} products</span></td><td>${c.order || 0}</td><td>${c.on === 0 ? '<span class="tag">Hidden</span>' : '<span class="tag g">Yes</span>'}</td><td><div class="acts"><button onclick="editCat('${esc(c.k)}')">${ic("edit")}</button><button class="dl" onclick="delCat('${esc(c.k)}')">${ic("trash")}</button></div></td></tr>`).join("")}</tbody></table></div></div>`;
}
function editCat(k) {
  const c = (DB.categories || []).find(c => c.k === k) || { k: "", name: "", group: "main", img: "", order: (DB.categories || []).length + 1, on: 1 };
  modal(`<div class="mh"><h3>${k ? "Edit category" : "Add new category"}</h3><button class="ic" onclick="closeModal()">✕</button></div><form class="mb form" id="cf">
   <div class="row r2"><div class="fld"><label>Category name *</label><input name="name" required value="${esc(c.name)}" oninput="if(!${!!k})this.form.k.value=this.value.toLowerCase().replace(/[^a-z0-9]+/g,'').slice(0,20)"></div><div class="fld"><label>Slug (letters/numbers)</label><input name="k" required pattern="[a-z0-9]{2,20}" value="${esc(c.k)}" ${k ? "readonly" : ""}></div></div>
   <div class="row r3"><div class="fld"><label>Shows as</label><select name="group"><option value="main" ${c.group !== "catfood" ? "selected" : ""}>Own section on homepage</option><option value="catfood" ${c.group === "catfood" ? "selected" : ""}>Tab inside Cat Food</option></select></div><div class="fld"><label>Order</label><input name="order" type="number" value="${c.order || 0}"></div><div class="fld"><label>Visible</label><div style="padding-top:6px">${sw("on", c.on !== 0)}</div></div></div>
   <div class="fld"><label>Image</label><div class="row r2"><input type="file" accept="image/*" onchange="upFile(this.files[0]).then(p=>{if(p)this.form.img.value=p})"><input name="img" value="${esc(c.img || "")}" placeholder="or image link https://"></div></div>
  </form><div class="mf"><button class="btn w" onclick="closeModal()">Cancel</button><button class="btn" onclick="saveCat('${esc(k || "")}')">Save</button></div>`);
}
async function saveCat(k) {
  const F = new FormData($("#cf")); const c = { k: (F.get("k") || "").toString(), name: F.get("name").toString().trim(), group: F.get("group"), order: +F.get("order") || 0, on: F.get("on") ? 1 : 0, img: F.get("img").toString().trim() };
  if (!/^[a-z0-9]{2,20}$/.test(c.k) || !c.name) return toast("Name and a slug (2-20 letters/numbers) are needed");
  if (!k && (DB.categories || []).some(x => x.k === c.k)) return toast("That slug already exists");
  if (k) Object.assign(DB.categories.find(x => x.k === k), c); else DB.categories.push(c);
  DB.products[c.k] = DB.products[c.k] || [];
  if (await save("categories") && await save("products")) { toast("Category saved ✓"); closeModal(); route() }
}
async function delCat(k) { if ((DB.products[k] || []).length) return toast("Move or delete its products first"); if (!confirm("Delete this category?")) return; DB.categories = DB.categories.filter(c => c.k !== k); delete DB.products[k]; if (await save("categories") && await save("products")) route() }

/* ---------- catalog collections ---------- */
async function Collections(V) {
  title("Catalog Collections"); await load("collections", true); await load("products", true);
  const L = DB.collections || [];
  V.innerHTML = head("Catalog collections", "Hand-picked groups (Best Sellers, Eid Offer, Kitten Corner…) that show as their own section on the homepage", `<button class="btn" onclick="editCol(-1)">${ic("plus")} New collection</button>`) +
    `<div class="card">${L.length ? `<div class="tw"><table class="tbl"><thead><tr><th>Collection</th><th>Products</th><th>Visible</th><th>Action</th></tr></thead><tbody>${L.map((c, i) => `<tr><td><b>${esc(c.name)}</b><br><span class="mu sm">${esc(c.slug)}</span></td><td><span class="tag o">${(c.ids || []).length} products</span></td><td>${c.on ? '<span class="tag g">Yes</span>' : '<span class="tag">Hidden</span>'}</td><td><div class="acts"><button onclick="editCol(${i})">${ic("edit")}</button><button class="dl" onclick="delCol(${i})">${ic("trash")}</button></div></td></tr>`).join("")}</tbody></table></div>` : '<div class="empty">No collections yet.</div>'}</div>`;
}
function editCol(i) {
  const c = i > -1 ? DB.collections[i] : { name: "", slug: "", ids: [], on: 1 }; const P = allProducts();
  modal(`<div class="mh"><h3>${i > -1 ? "Edit" : "New"} collection</h3><button class="ic" onclick="closeModal()">✕</button></div><form class="mb form" id="colf"><div class="row r31"><div class="fld"><label>Name *</label><input name="name" required value="${esc(c.name)}"></div><div class="fld"><label>Visible</label><div style="padding-top:6px">${sw("on", c.on)}</div></div></div>
   <div class="fld"><label>Products (${(c.ids || []).length} chosen)</label><input placeholder="Search…" oninput="$$('#colp label').forEach(l=>l.hidden=!l.textContent.toLowerCase().includes(this.value.toLowerCase()))"><div class="pick" id="colp">${P.map(x => `<label><input type="checkbox" name="ids" value="${esc(x.id)}" ${(c.ids || []).includes(x.id) ? "checked" : ""}>${esc(x.n)} <span class="mu sm">· ${esc(catName(x._k))}</span></label>`).join("")}</div></div></form>
   <div class="mf"><button class="btn w" onclick="closeModal()">Cancel</button><button class="btn" onclick="saveCol(${i})">Save</button></div>`, true);
}
async function saveCol(i) { const F = new FormData($("#colf")); const name = F.get("name").toString().trim(); if (!name) return toast("Give it a name"); const c = { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), ids: F.getAll("ids"), on: F.get("on") ? 1 : 0 }; if (i > -1) DB.collections[i] = c; else DB.collections.push(c); if (await save("collections")) { toast("Collection saved ✓"); closeModal(); route() } }
async function delCol(i) { if (!confirm("Delete this collection? Products stay in the shop.")) return; DB.collections.splice(i, 1); if (await save("collections")) route() }

/* ---------- reviews ---------- */
async function Reviews(V) {
  title("Customer Reviews"); const R = await load("reviews", true);
  V.innerHTML = head("Customer reviews", "Reviews shown on the homepage", `<button class="btn" onclick="editRev(-1)">${ic("plus")} Add review</button>`) +
    `<div class="card">${R.length ? `<div class="tw"><table class="tbl"><thead><tr><th>Customer</th><th>Review</th><th>Rating</th><th>Visible</th><th>Action</th></tr></thead><tbody>${R.map((r, i) => `<tr><td><b>${esc(r.name)}</b><br><span class="mu sm">${esc(r.pet || "")}</span></td><td style="max-width:420px">${esc(r.text)}</td><td style="color:#f59e0b">${"★".repeat(r.stars || 5)}</td><td>${r.on ? '<span class="tag g">Yes</span>' : '<span class="tag">Hidden</span>'}</td><td><div class="acts"><button onclick="editRev(${i})">${ic("edit")}</button><button class="dl" onclick="delRev(${i})">${ic("trash")}</button></div></td></tr>`).join("")}</tbody></table></div>` : '<div class="empty">No reviews yet.</div>'}</div>`;
}
function editRev(i) {
  const r = i > -1 ? DB.reviews[i] : { name: "", pet: "", text: "", stars: 5, on: 1 };
  modal(`<div class="mh"><h3>${i > -1 ? "Edit" : "Add"} review</h3><button class="ic" onclick="closeModal()">✕</button></div><form class="mb form" id="rf"><div class="row r2"><div class="fld"><label>Customer name & area</label><input name="name" required value="${esc(r.name)}" placeholder="e.g. Nusrat, Bashundhara"></div><div class="fld"><label>Pet / note</label><input name="pet" value="${esc(r.pet || "")}" placeholder="e.g. Cat parent"></div></div><div class="fld"><label>Review</label><textarea name="text" required>${esc(r.text)}</textarea></div><div class="row r2"><div class="fld"><label>Rating</label><select name="stars">${[5, 4, 3, 2, 1].map(n => `<option ${n === r.stars ? "selected" : ""}>${n}</option>`).join("")}</select></div><div class="fld"><label>Visible</label><div style="padding-top:6px">${sw("on", r.on)}</div></div></div></form><div class="mf"><button class="btn w" onclick="closeModal()">Cancel</button><button class="btn" onclick="saveRev(${i})">Save</button></div>`);
}
async function saveRev(i) { const F = new FormData($("#rf")); const r = { name: F.get("name").trim(), pet: F.get("pet").trim(), text: F.get("text").trim(), stars: +F.get("stars"), on: F.get("on") ? 1 : 0 }; if (!r.name || !r.text) return toast("Name and review are needed"); if (i > -1) DB.reviews[i] = r; else DB.reviews.unshift(r); if (await save("reviews")) { closeModal(); route() } }
async function delRev(i) { if (!confirm("Delete review?")) return; DB.reviews.splice(i, 1); if (await save("reviews")) route() }

/* ---------- hero banners ---------- */
async function Banners(V) {
  title("Hero Banners"); const B = await load("banners", true);
  V.innerHTML = head("Hero banners", "Your own image banners slide first on the homepage. Best size: 1600 × 700 px (PC) — keep text in the middle for phones.", `<button class="btn" onclick="editBan(-1)">${ic("plus")} Add banner</button>`) +
    (B.length ? `<div class="ban">${B.map((b, i) => `<div class="card"><img src="${esc(imgSrc(b.img))}" alt="" onerror="this.style.opacity=.2"><div class="card-b"><b>${esc(b.title || "Banner " + (i + 1))}</b><p class="mu sm" style="margin:2px 0 10px">${esc(b.link || "No link")} · ${b.on ? "Visible" : "Hidden"}</p><div class="acts"><button onclick="moveBan(${i},-1)" title="Earlier">↑</button><button onclick="moveBan(${i},1)" title="Later">↓</button><button onclick="editBan(${i})">${ic("edit")}</button><button class="dl" onclick="delBan(${i})">${ic("trash")}</button></div></div></div>`).join("")}</div>` : `<div class="card empty">No custom banners. The homepage shows its 5 built-in slides. Add your own sale or product banners here.</div>`);
}
function editBan(i) {
  const b = i > -1 ? DB.banners[i] : { img: "", title: "", link: "#cat-food", on: 1 };
  modal(`<div class="mh"><h3>${i > -1 ? "Edit" : "Add"} banner</h3><button class="ic" onclick="closeModal()">✕</button></div><form class="mb form" id="bf"><div class="fld"><label>Banner image *</label><div class="row r2"><input type="file" accept="image/*" onchange="upFile(this.files[0]).then(p=>{if(p){this.form.img.value=p;$('#bpv').src=imgSrc(p)}})"><input name="img" value="${esc(b.img)}" placeholder="or image link https://" oninput="$('#bpv').src=imgSrc(this.value)"></div><img id="bpv" src="${esc(imgSrc(b.img))}" style="width:100%;aspect-ratio:16/7;object-fit:cover;border-radius:12px;background:#f3eefa;margin-top:8px" alt=""></div><div class="row r2"><div class="fld"><label>Title (for you)</label><input name="title" value="${esc(b.title)}"></div><div class="fld"><label>Link when clicked</label><input name="link" value="${esc(b.link)}" placeholder="#cat-food or https://…"></div></div><div class="fld"><label>Visible</label>${sw("on", b.on)}</div></form><div class="mf"><button class="btn w" onclick="closeModal()">Cancel</button><button class="btn" onclick="saveBan(${i})">Save</button></div>`);
}
async function saveBan(i) { const F = new FormData($("#bf")); const b = { img: F.get("img").trim(), title: F.get("title").trim(), link: F.get("link").trim(), on: F.get("on") ? 1 : 0 }; if (!b.img) return toast("Add an image"); if (i > -1) DB.banners[i] = b; else DB.banners.push(b); if (await save("banners")) { closeModal(); route() } }
async function delBan(i) { if (!confirm("Delete banner?")) return; DB.banners.splice(i, 1); if (await save("banners")) route() }
async function moveBan(i, d) { const B = DB.banners, k = i + d; if (k < 0 || k >= B.length) return;[B[i], B[k]] = [B[k], B[i]]; if (await save("banners")) route() }

/* ---------- homepage CMS ---------- */
async function CMS(V) {
  title("Homepage CMS"); const S = await load("site", true); const c = S.cms = S.cms || {}; const P = allProducts().filter(x => x.p);
  V.innerHTML = head("Homepage content", "Edit the words and offers on your homepage") + `<form class="form" id="cmsf">
   <div class="card"><div class="card-h"><h3>Top bar messages</h3></div><div class="card-b form"><div class="fld"><label>Rotating messages (one per line)</label><textarea name="ticker">${esc((c.ticker || []).join("\n"))}</textarea></div><div class="fld"><label>Announcement bar <i>(optional, shows above the header)</i></label><input name="announce" value="${esc(c.announce || "")}" placeholder="e.g. Free delivery on orders over ৳2000 this week!"></div></div></div>
   <div class="card"><div class="card-h"><h3>Deal of the Day</h3></div><div class="card-b row r2"><div class="fld"><label>Product</label><select name="deal">${P.map(x => `<option value="${esc(x.id)}" ${c.deal?.id === x.id ? "selected" : ""}>${esc(x.n)} — ${tk(x.p)}</option>`).join("")}</select></div><div class="fld"><label>Offer ends <i>(empty = midnight every day)</i></label><input type="datetime-local" name="ends" value="${esc(c.deal?.ends || "")}"></div></div></div>
   <div class="card"><div class="card-h"><h3>About us</h3></div><div class="card-b"><div class="fld"><label>About text <i>(empty = keep the current text)</i></label><textarea name="about" style="min-height:130px">${esc(c.about || "")}</textarea></div></div></div>
   <div><button class="btn">${ic("check")} Save homepage</button></div></form>`;
  $("#cmsf").onsubmit = async e => { e.preventDefault(); const F = new FormData(e.target); c.ticker = F.get("ticker").split("\n").map(s => s.trim()).filter(Boolean); c.announce = F.get("announce").trim(); c.deal = { id: F.get("deal"), ends: F.get("ends") }; c.about = F.get("about").trim(); if (await save("site")) toast("Homepage saved ✓") };
}

/* ---------- admins & roles ---------- */
async function Admins(V) {
  title("Admin & Roles"); const j = await api("users"); const U = j.data || [];
  V.innerHTML = head("Admins & roles", "Give staff their own login with limited access", `<button class="btn" onclick="editUser()">${ic("plus")} Add admin</button>`) +
    `<div class="grid g3" style="margin-bottom:16px">${[["super", "Super Admin", "Everything, including admins, keys and passwords"], ["manager", "Manager", "Products, orders, banners, homepage, reports and settings (not admins or API keys)"], ["staff", "Staff", "Orders, courier, customers, products and stock only"]].map(r => `<div class="card card-b"><b>${r[1]}</b><p class="mu sm" style="margin:4px 0 0">${r[2]}</p></div>`).join("")}</div>
    <div class="card"><div class="tw"><table class="tbl"><thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Status</th><th>Last login</th><th>Action</th></tr></thead><tbody>${U.map(u => `<tr><td><b>${esc(u.name || u.u)}</b>${u.u === ME.u ? ' <span class="tag o">You</span>' : ""}</td><td>${esc(u.u)}</td><td><span class="tag v">${ROLE_NAME[u.role] || u.role}</span></td><td>${u.on ? '<span class="tag g">Active</span>' : '<span class="tag r">Blocked</span>'}</td><td class="mu sm">${u.last ? dt(u.last) : "—"}</td><td><div class="acts"><button onclick='editUser(${JSON.stringify(u).replace(/'/g, "&#39;")})'>${ic("edit")}</button>${u.u !== ME.u ? `<button class="dl" onclick="delUser('${esc(u.u)}')">${ic("trash")}</button>` : ""}</div></td></tr>`).join("")}</tbody></table></div></div>`;
}
function editUser(u) {
  const e = !!u; u = u || { u: "", name: "", role: "staff", on: 1 };
  modal(`<div class="mh"><h3>${e ? "Edit admin" : "Add admin"}</h3><button class="ic" onclick="closeModal()">✕</button></div><form class="mb form" id="uf"><div class="row r2"><div class="fld"><label>Name</label><input name="name" value="${esc(u.name)}"></div><div class="fld"><label>Username</label><input name="u" required value="${esc(u.u)}" ${e ? "readonly" : ""} pattern="[a-z0-9_.]{3,30}"></div></div><div class="row r3"><div class="fld"><label>Role</label><select name="role" ${u.u === ME.u ? "disabled" : ""}>${Object.keys(ROLE_NAME).map(r => `<option value="${r}" ${r === u.role ? "selected" : ""}>${ROLE_NAME[r]}</option>`).join("")}</select></div><div class="fld"><label>${e ? "New password <i>(empty = no change)</i>" : "Password (8+)"}</label><input name="pass" type="password" autocomplete="new-password" ${e ? "" : "required minlength=8"}></div><div class="fld"><label>Active</label><div style="padding-top:6px">${sw("on", u.on)}</div></div></div></form><div class="mf"><button class="btn w" onclick="closeModal()">Cancel</button><button class="btn" onclick="saveUser()">Save</button></div>`);
}
async function saveUser() { const F = new FormData($("#uf")); const j = await api("user_save", { u: F.get("u"), name: F.get("name"), role: F.get("role") || ME.role, pass: F.get("pass"), on: !!F.get("on") }); if (j.error) return toast(j.error); toast("Admin saved ✓"); closeModal(); route() }
async function delUser(u) { if (!confirm("Remove admin " + u + "?")) return; const j = await api("user_del", { u }); if (j.error) return toast(j.error); route() }

/* ---------- site settings ---------- */
async function Settings(V, tab = "store") {
  const S = await load("site", true); const T = SETTINGS.find(s => s[0] === tab) || SETTINGS[0]; title("Site Settings · " + T[1]);
  const sec = ["courier", "sms", "pixel", "seo"].includes(tab) && can("settings") ? (await api("secrets_get")).data || {} : {};
  const set = (o, p) => (S[p] = S[p] || {}, S[p]);
  const quick = `<span class="mu sm">Quick go:</span><a class="btn w s" href="#settings/pixel">${ic("target")} Meta Pixel</a><a class="btn w s" href="#settings/delivery">${ic("truck")} Shipping</a><a class="btn w s" href="#settings/payment">${ic("pay")} Payment</a>`;
  const crumb = `Dashboard › Site settings › <b>${T[1]}</b>`;
  const keyNote = (k) => sec[k] === "__set__" ? '<span class="tag g">Saved</span> <span class="hint">Leave empty to keep the current one</span>' : "";
  let body = "";
  const st = set(S, "store"), dl = set(S, "delivery"), py = set(S, "payment"), seo = set(S, "seo"), px = set(S, "pixel");
  if (tab === "store") body = `<div class="card"><div class="card-h"><div><h3>General store information</h3><p>Shown in the header, footer, contact section and invoices</p></div></div><div class="card-b form">
    <div class="row r2"><div class="fld"><label>Store name</label><input name="store.name" value="${esc(st.name || "PetVerse")}"></div><div class="fld"><label>Tagline</label><input name="store.tagline" value="${esc(st.tagline || "")}"></div></div>
    <div class="row r3"><div class="fld"><label>Phone</label><input name="store.phone" value="${esc(st.phone || "")}"></div><div class="fld"><label>WhatsApp number <i>(with 880)</i></label><input name="store.whatsapp" value="${esc(st.whatsapp || "")}" placeholder="8801XXXXXXXXX"></div><div class="fld"><label>Email</label><input name="store.email" value="${esc(st.email || "")}"></div></div>
    <div class="row r2"><div class="fld"><label>Shop address</label><input name="store.address" value="${esc(st.address || "")}"></div><div class="fld"><label>Facebook page link</label><input name="store.facebook" value="${esc(st.facebook || "")}" placeholder="https://facebook.com/…"></div></div>
    <div class="row r2"><div class="fld"><label>Opening hours</label><input name="store.hours" value="${esc(st.hours || "")}"></div><div class="fld"><label>Google Map link <i>(optional)</i></label><input name="store.map" value="${esc(st.map || "")}"></div></div></div></div>`;
  if (tab === "delivery") body = `<div class="card"><div class="card-h"><div><h3>Delivery & shipping</h3><p>Charges are added at checkout automatically</p></div></div><div class="card-b form"><div class="row r3"><div class="fld"><label>Inside Dhaka (৳)</label><input type="number" name="delivery.inside" value="${dl.inside ?? 70}"></div><div class="fld"><label>Outside Dhaka (৳)</label><input type="number" name="delivery.outside" value="${dl.outside ?? 130}"></div><div class="fld"><label>Free delivery over (৳) <i>(0 = never)</i></label><input type="number" name="delivery.free_over" value="${dl.free_over ?? 0}"></div></div><div class="fld"><label>Delivery time note</label><input name="delivery.note" value="${esc(dl.note || "")}"></div></div></div>`;
  if (tab === "payment") body = `<div class="card"><div class="card-h"><div><h3>Payment settings</h3><p>Choices the customer sees at checkout</p></div></div><div class="card-b form"><div class="swrow"><div><b>Cash on delivery</b><small>Customer pays the rider</small></div>${sw("payment.cod", py.cod !== 0)}</div><div class="row r2"><div class="fld"><label>bKash number <i>(empty = hide bKash)</i></label><input name="payment.bkash" value="${esc(py.bkash || "")}" placeholder="01XXXXXXXXX (Personal / Merchant)"></div><div class="fld"><label>Nagad number <i>(empty = hide Nagad)</i></label><input name="payment.nagad" value="${esc(py.nagad || "")}"></div></div><div class="fld"><label>Instructions for mobile payment</label><input name="payment.note" value="${esc(py.note || "")}"></div></div></div>`;
  if (tab === "courier") body = `<div class="card"><div class="card-h"><div><h3>Courier automation (Steadfast)</h3><p>Send orders to Steadfast from Orders or Courier Hub</p></div><button type="button" class="btn w s" onclick="sfBal(this)">Test connection</button></div><div class="card-b form"><div class="note">Get your API key and secret from the Steadfast merchant panel (API section). Test with one order first.</div><div class="row r2"><div class="fld"><label>API key</label><input name="sec.sf_key" value="${esc(sec.sf_key || "")}" autocomplete="off"></div><div class="fld"><label>Secret key</label><input name="sec.sf_secret" type="password" autocomplete="new-password" placeholder="${sec.sf_secret ? "••••••••" : ""}">${keyNote("sf_secret")}</div></div><div class="fld"><label>API base URL <i>(change only if Steadfast tells you)</i></label><input name="sec.sf_base" value="${esc(sec.sf_base || "https://portal.packzy.com/api/v1")}"></div></div></div>`;
  if (tab === "sms") body = `<div class="card"><div class="card-h"><div><h3>SMS notifications</h3><p>Works with any Bangladeshi SMS gateway (BulkSMSBD, Alpha SMS, SSL Wireless…)</p></div></div><div class="card-b form"><div class="fld"><label>Gateway URL</label><input name="sec.sms_url" placeholder="${sec.sms_url ? "•••••• (saved)" : "https://gateway.example/api?api_key=KEY&number={number}&message={message}"}" autocomplete="off">${keyNote("sms_url")}<span class="hint">Paste your gateway's "send SMS" link. Put <b>{number}</b> where the phone goes and <b>{message}</b> where the text goes.</span></div><div class="fld"><label>Your number for new-order alerts</label><input name="sec.sms_admin" value="${esc(sec.sms_admin || "")}" placeholder="01XXXXXXXXX"></div><div class="swrow"><div><b>SMS customer when an order is placed</b><small>Also alerts your number above</small></div>${sw("sec.sms_on_order", +sec.sms_on_order)}</div><div class="swrow"><div><b>SMS customer when the order status changes</b></div>${sw("sec.sms_on_status", +sec.sms_on_status)}</div><div class="filters"><input id="smsto" placeholder="Test number 01XXXXXXXXX"><button type="button" class="btn w s" onclick="api('sms_test',{to:$('#smsto').value}).then(j=>toast(j.error||(j.ok?'Test SMS sent ✓':'Failed: '+j.msg)))">Send test SMS</button></div></div></div>`;
  if (tab === "pixel") { const ps = can("dashboard") ? await api("stats") : {}; body = `<div class="card"><div class="card-b form"><div class="note g" style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><div><b>● Server-side tracking ${sec.capi_token === "__set__" && px.id ? "active" : "not set up yet"}</b><br><span class="sm">Last 30 days: <b>${ps.capi?.events || 0}</b> events, ${ps.capi?.ok || 0} accepted by Meta</span></div></div>
    <div class="fld"><label>FACEBOOK PIXEL ID</label><input name="pixel.id" value="${esc(px.id || "")}" placeholder="15-16 digit number"><span class="hint">Enter your Meta Pixel ID to enable tracking on the website.</span></div>
    <div class="fld"><label>CONVERSIONS API ACCESS TOKEN</label><input name="sec.capi_token" type="password" autocomplete="new-password" placeholder="EAAxxxxxxxx…"><span class="hint">Needed for server-side tracking (works even with ad blockers). Make it in Meta Events Manager → Settings → Conversions API.</span>${keyNote("capi_token")}</div>
    <div class="fld"><label>TEST EVENT CODE <span class="tag">OPTIONAL</span></label><input name="sec.capi_test" value="${esc(sec.capi_test || "")}"><span class="hint">From Events Manager → Test events. Remove after testing.</span></div>
    <div class="box sm"><b>Tracked events:</b> PageView, ViewContent, Search, AddToCart, InitiateCheckout, Contact (WhatsApp/Call), Purchase.<br><b>Deduplication:</b> browser and server Purchase share the order number as event ID.<br><b>User matching:</b> phone (hashed, BD format), IP, browser, fbp/fbc cookies.</div></div></div>` }
  if (tab === "seo") body = `<div class="card"><div class="card-h"><div><h3>Google SEO & meta tags</h3><p>For Google search and social media previews</p></div></div><div class="card-b form"><div class="fld"><label>Default meta title (SEO title)</label><input name="seo.title" value="${esc(seo.title || "")}" maxlength="70"><span class="hint">Best under 60 characters.</span></div><div class="fld"><label>Default meta description</label><textarea name="seo.desc" maxlength="170" style="min-height:70px">${esc(seo.desc || "")}</textarea></div><div class="fld"><label>Meta keywords</label><input name="seo.keys" value="${esc(seo.keys || "")}"></div><div class="row r2"><div class="fld"><label>Google Analytics 4 ID <i>(G-XXXXXXX)</i></label><input name="seo.ga" value="${esc(seo.ga || "")}"></div><div class="fld"><label>Google Search Console verification code</label><input name="seo.gsv" value="${esc(seo.gsv || "")}" placeholder="the content=\"…\" value"></div></div></div></div>
    <div class="card" style="margin-top:16px"><div class="card-h"><div><h3>✦ AI copilot & copywriter</h3><p>Product descriptions and SEO text</p></div></div><div class="card-b form"><div class="note" style="background:#f6efff;color:#4c1d95">The built-in writer always works without a key. Add a free Google Gemini API key (from Google AI Studio) for smarter AI writing.</div><div class="fld"><label>Google Gemini API key <i>(optional)</i></label><input name="sec.gemini_key" type="password" autocomplete="new-password" placeholder="AIza…">${keyNote("gemini_key")}</div></div></div>`;
  if (tab === "security") { const a = can("settings") ? await api("stats") : {}; body = `<div class="card"><div class="card-h"><h3>Change my password</h3></div><div class="card-b form"><div class="row r3"><div class="fld"><label>Current password</label><input type="password" id="op" autocomplete="current-password"></div><div class="fld"><label>New password (8+)</label><input type="password" id="np" autocomplete="new-password"></div><div class="fld"><label>&nbsp;</label><button type="button" class="btn" onclick="api('pass',{old:$('#op').value,new:$('#np').value}).then(j=>toast(j.error||'Password changed ✓'))">Change password</button></div></div><div class="note y">Security built in: passwords are stored encrypted (bcrypt), login is locked after 8 wrong tries, every change needs a session token, and order data cannot be opened from the web. Forgot the super admin password? Delete <b>data/private/users.php</b> in cPanel and set up again.</div></div></div>
    ${(a.audit || []).length ? `<div class="card" style="margin-top:16px"><div class="card-h"><h3>Recent admin activity</h3></div><div class="tw"><table class="tbl"><tbody>${a.audit.map(x => `<tr><td class="mu sm">${dt(x.t)}</td><td><b>${esc(x.u)}</b></td><td>${esc(x.w)}</td></tr>`).join("")}</tbody></table></div></div>` : ""}` }
  V.innerHTML = head(T[1], "", quick, crumb) + `<form id="sf" class="form">${body}${tab !== "security" ? `<div><button class="btn dk">${ic("check")} Save ${T[1]}</button></div>` : ""}</form>`;
  $("#sf").onsubmit = async e => {
    e.preventDefault(); const F = new FormData(e.target), secOut = {}; let touchSite = false;
    for (const el of e.target.elements) { if (!el.name) continue; const [grp, key] = el.name.split("."); let v = el.type === "checkbox" ? (el.checked ? 1 : 0) : el.value.trim(); if (el.type === "number") v = +v || 0;
      if (grp === "sec") { if (el.type === "password" && v === "") continue; secOut[key] = v } else { (S[grp] = S[grp] || {})[key] = v; touchSite = true } }
    if (touchSite && !(await save("site"))) return;
    if (Object.keys(secOut).length) { const j = await api("secrets_put", { data: secOut }); if (j.error) return toast(j.error) }
    toast("Saved ✓"); route();
  };
}

/* ---------- Ask AI (top bar) ---------- */
function askAI() {
  modal(`<div class="mh"><h3>✦ Ask AI</h3><button class="ic" onclick="closeModal()">✕</button></div><div class="mb form"><p class="mu" style="margin:0">Quick help for your shop. With a Gemini key (Site Settings › Google SEO) it uses Google AI; otherwise it gives built-in tips.</p>
   <div class="chips">${["Write a Facebook post for a cat food offer", "Ideas to sell more cat litter this month", "Write an SEO description for my pet shop", "Reply to a customer asking about delivery time"].map(s => `<button type="button" class="chip" onclick="$('#aiq').value=this.textContent">${s}</button>`).join("")}</div>
   <textarea id="aiq" placeholder="Ask anything about your shop…"></textarea><div><button class="btn vi" onclick="runAI(this)">✦ Ask</button></div><div id="aia" class="box" hidden style="white-space:pre-wrap"></div></div>`);
}
async function runAI(b) {
  const q = $("#aiq").value.trim(); if (!q) return; b.disabled = true; const j = await api("ai", { prompt: "You help a pet shop in Bangladesh called PetVerse (cat food, litter, dog and bird items, vet services, phone 01880972500). Answer briefly in simple English.\n\n" + q }); b.disabled = false;
  const S = (DB.site || {}).store || {};
  const fallback = /facebook|post/i.test(q) ? `🐱 Cat food offer at ${S.name || "PetVerse"}!\nTop brands (Whiskas, Me-O, Royal Canin, SmartHeart…) at the best price.\n🚚 Fast delivery in Dhaka · 💵 Cash on delivery\n📞 Order: ${S.phone || "01880972500"}\n#PetVerse #CatFood #Dhaka`
    : /seo/i.test(q) ? `${S.name || "PetVerse"} is an online pet shop in Dhaka, Bangladesh. Buy cat food, wet food, treats, cat litter, dog food and pet accessories from top brands with fast home delivery and cash on delivery.`
    : /delivery/i.test(q) ? `Thank you for your message! Inside Dhaka we deliver in 1-2 days and outside Dhaka in 2-4 days. Cash on delivery is available. – ${S.name || "PetVerse"}`
    : `Ideas:\n• Bundle litter with a scoop or a food pack (combo price)\n• Post customer cat photos on Facebook every week\n• Add a "Flash sale" badge to 3-4 products and pin them in a collection\n• Send an SMS to repeat buyers when their usual food is back in stock`;
  $("#aia").hidden = false; $("#aia").textContent = j.text || fallback;
}

boot();
