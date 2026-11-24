/* Eye button on every password box: tap to show or hide the password. Works for boxes added later too. */
(function () {
  var EYE = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  var OFF = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
  var bn = function () { try { return (localStorage.getItem("pv_lang") || "bn") === "bn" } catch (e) { return true } };
  var st = document.createElement("style");
  st.textContent = ".pw-wrap{position:relative;display:block;width:100%}.pw-wrap>input{padding-right:46px!important;width:100%}.pw-eye{position:absolute;right:4px;top:50%;transform:translateY(-50%);width:38px;height:38px;border:0;background:none;border-radius:10px;cursor:pointer;color:#6f6a68;display:grid;place-items:center;padding:0}.pw-eye:hover{background:#0000000d;color:#111}.pw-eye:focus-visible{outline:2px solid currentColor}";
  document.head.appendChild(st);
  function add(inp) {
    if (inp.dataset.eye || !inp.parentNode) return; inp.dataset.eye = "1";
    var w = document.createElement("span"); w.className = "pw-wrap"; inp.parentNode.insertBefore(w, inp); w.appendChild(inp);
    var b = document.createElement("button"); b.type = "button"; b.className = "pw-eye notr"; b.innerHTML = EYE;
    var lab = function (on) { var t = on ? (bn() ? "পাসওয়ার্ড লুকান" : "Hide password") : (bn() ? "পাসওয়ার্ড দেখুন" : "Show password"); b.setAttribute("aria-label", t); b.title = t };
    lab(false);
    b.onclick = function () { var show = inp.type === "password"; inp.type = show ? "text" : "password"; b.innerHTML = show ? OFF : EYE; lab(show); inp.focus() };
    w.appendChild(b);
  }
  function scan(root) { (root.querySelectorAll ? root : document).querySelectorAll('input[type=password]').forEach(add); if (root.matches && root.matches('input[type=password]')) add(root) }
  scan(document);
  new MutationObserver(function (ms) { ms.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1) scan(n) }) }) }).observe(document.body, { childList: true, subtree: true });
})();
