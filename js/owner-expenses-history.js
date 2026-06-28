(function () {
  "use strict";

  if (typeof window === "undefined") return;

  window.__ZEKIQ_OWNER_EXT_VERSION__ = window.__ZEKIQ_OWNER_EXT_VERSION__ || "2.2.0";

  function isOwnerApp() {
    try {
      if (window.__TONINO_APP_TARGET__ === "owner") return true;
      if (localStorage.getItem("tonino-owner-native-apk") === "1") return true;
      if (localStorage.getItem("zekiq-manager-native") === "1") return true;
      var id = window.Capacitor && window.Capacitor.config && window.Capacitor.config.appId;
      if (id === "com.tonino.owner" || id === "com.zekiq.manager") return true;
    } catch (e) {}
    return false;
  }

  if (!isOwnerApp()) return;

  var SESSION_KEY = "tonino-owner-session-token";
  var CAT_LABELS = {
    inventory: "مخزون",
    expense: "مصروف",
    mixed: "مختلط",
    daily: "يومي",
    operational: "تشغيلي",
    wholesale: "جملة"
  };

  function token() {
    try { return localStorage.getItem(SESSION_KEY) || ""; } catch (e) { return ""; }
  }

  function baseUrl() {
    if (window.__zekiqGetOwnerTunnelUrl) {
      var t = window.__zekiqGetOwnerTunnelUrl();
      if (t.startsWith("https://")) return t;
    }
    var keys = ["tonino-owner-remote-base", "tonino-owner-working-api", "tonino-owner-active-api", "tonino-owner-server"];
    for (var i = 0; i < keys.length; i++) {
      try {
        var v = (localStorage.getItem(keys[i]) || "").trim().replace(/\/+$/, "");
        if (v.startsWith("https://")) return v;
      } catch (e) {}
    }
    for (var j = 0; j < keys.length; j++) {
      try {
        var u = (localStorage.getItem(keys[j]) || "").trim().replace(/\/+$/, "");
        if (u.startsWith("http")) return u;
      } catch (e2) {}
    }
    return "";
  }

  function todayIso() {
    return new Date().toISOString().slice(0, 10);
  }

  function esc(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  }

  function money(n, cur) {
    return Number(n || 0).toLocaleString("tr-TR") + " " + (cur || "₺");
  }

  function shiftDate(iso, delta) {
    var d = new Date(iso + "T12:00:00");
    d.setDate(d.getDate() + delta);
    return d.toISOString().slice(0, 10);
  }

  function formatDayLabel(iso) {
    try {
      return new Date(iso + "T12:00:00").toLocaleDateString("ar", {
        weekday: "short",
        day: "numeric",
        month: "short"
      });
    } catch (e) {
      return iso;
    }
  }

  async function trpc(proc, input) {
    if (window.__zekiqRepairOwnerStorageIfNeeded) {
      await Promise.resolve(window.__zekiqRepairOwnerStorageIfNeeded());
    }
    var api = baseUrl();
    if (!api) throw new Error("no_server");
    var q = encodeURIComponent(JSON.stringify({ "0": { json: input || {} } }));
    var r = await fetch(api + "/api/trpc/" + proc + "?batch=1&input=" + q, {
      cache: "no-store",
      headers: token() ? { Authorization: "Bearer " + token() } : {}
    });
    if (!r.ok) throw new Error("network");
    var j = await r.json();
    if (j[0] && j[0].error) throw new Error("api");
    return j[0].result.data.json;
  }

  async function loadPhotoBlob(invoiceId) {
    var api = baseUrl();
    if (!api || !token()) return null;
    var r = await fetch(api + "/api/owner/invoices/" + invoiceId + "/photo", {
      cache: "no-store",
      headers: { Authorization: "Bearer " + token() }
    });
    if (!r.ok) return null;
    var blob = await r.blob();
    return blob.size ? URL.createObjectURL(blob) : null;
  }

  var state = {
    date: todayIso(),
    days: [],
    loadedAt: 0,
    loading: false
  };

  function isExpensesTab() {
    if (!document.querySelector(".owner-app-layout")) return false;
    var active = document.querySelector(".owner-nav-btn.is-active");
    if (!active) return false;
    var text = (active.textContent || "").trim();
    return /مصاريف|Gider|Expenses|مصروف/i.test(text);
  }

  function getScrollHost() {
    return document.querySelector(".owner-app-layout .overflow-y-auto")
      || document.querySelector(".owner-app-layout");
  }

  function injectStyles() {
    if (document.getElementById("zekiq-expenses-history-css")) return;
    var s = document.createElement("style");
    s.id = "zekiq-expenses-history-css";
    s.textContent =
      "#zekiq-expenses-history{margin:0 0 12px;border:1px solid #e2d2b3;border-radius:14px;background:#fff;overflow:hidden;font-family:system-ui,sans-serif}" +
      "#zekiq-expenses-history .head{padding:10px 12px;background:#f8f1e4;border-bottom:1px solid #ece0cc}" +
      "#zekiq-expenses-history .head h3{margin:0;font-size:13px;font-weight:800;color:#8f6218}" +
      "#zekiq-expenses-history .head p{margin:4px 0 0;font-size:10px;color:#78716c}" +
      "#zekiq-exp-history-nav{display:flex;align-items:center;gap:6px;padding:10px 12px;border-bottom:1px solid #f1ead8}" +
      "#zekiq-exp-history-nav button{border:1px solid #dcc9a8;background:#fff;border-radius:10px;width:36px;height:36px;font-size:18px;font-weight:800;color:#8f6218}" +
      "#zekiq-exp-history-nav input[type=date]{flex:1;border:1px solid #dcc9a8;border-radius:10px;padding:8px 10px;font-size:13px;font-weight:700;color:#2a2418}" +
      "#zekiq-exp-history-nav .today{min-width:52px;border:none;background:#8f6218;color:#fff;border-radius:10px;padding:8px 10px;font-size:11px;font-weight:800}" +
      "#zekiq-exp-history-summary{padding:8px 12px;font-size:11px;color:#57534e;background:#fff7e8;border-bottom:1px solid #edd9b5}" +
      "#zekiq-exp-history-list{max-height:42vh;overflow:auto;padding:8px 12px 12px}" +
      ".zekiq-exp-row{width:100%;display:flex;align-items:center;gap:10px;text-align:right;border:1px solid #e2d2b3;border-radius:12px;padding:10px;margin-bottom:8px;background:#fff;cursor:pointer}" +
      ".zekiq-exp-row:active{background:#f8f1e4}" +
      ".zekiq-exp-thumb{width:44px;height:44px;border-radius:10px;background:#f3ebe0;border:1px solid #e2d2b3;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}" +
      ".zekiq-exp-meta{flex:1;min-width:0}" +
      ".zekiq-exp-meta .v{font-size:12px;font-weight:800;color:#2a2418;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
      ".zekiq-exp-meta .s{font-size:10px;color:#78716c;margin-top:2px}" +
      ".zekiq-exp-amt{font-size:13px;font-weight:900;color:#b91c1c;white-space:nowrap}" +
      "#zekiq-exp-photo{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.94);display:none;flex-direction:column}" +
      "#zekiq-exp-photo.open{display:flex}" +
      "#zekiq-exp-photo .bar{padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.12);display:flex;align-items:center;gap:10px;color:#fff}" +
      "#zekiq-exp-photo .bar h4{margin:0;flex:1;font-size:14px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
      "#zekiq-exp-photo .bar button{border:none;background:rgba(255,255,255,.12);color:#fff;width:40px;height:40px;border-radius:999px;font-size:20px}" +
      "#zekiq-exp-photo .body{flex:1;overflow:auto;display:flex;align-items:center;justify-content:center;padding:12px}" +
      "#zekiq-exp-photo img{max-width:100%;max-height:100%;object-fit:contain;border-radius:8px}";
    document.head.appendChild(s);
  }

  function ensurePhotoViewer() {
    if (document.getElementById("zekiq-exp-photo")) return;
    var el = document.createElement("div");
    el.id = "zekiq-exp-photo";
    el.innerHTML =
      '<div class="bar"><h4 id="zekiq-exp-photo-title">—</h4><button type="button" id="zekiq-exp-photo-close">×</button></div>' +
      '<div class="body" id="zekiq-exp-photo-body"><p style="color:#94a3b8">جاري التحميل…</p></div>';
    document.body.appendChild(el);
    document.getElementById("zekiq-exp-photo-close").onclick = closePhoto;
    el.onclick = function (e) { if (e.target === el) closePhoto(); };
  }

  var photoObjectUrl = "";

  function closePhoto() {
    var el = document.getElementById("zekiq-exp-photo");
    if (el) el.classList.remove("open");
    if (photoObjectUrl) {
      try { URL.revokeObjectURL(photoObjectUrl); } catch (e) {}
      photoObjectUrl = "";
    }
  }

  async function openPhoto(invoiceId, title) {
    ensurePhotoViewer();
    if (photoObjectUrl) {
      try { URL.revokeObjectURL(photoObjectUrl); } catch (e) {}
      photoObjectUrl = "";
    }
    document.getElementById("zekiq-exp-photo-title").textContent = title || "فاتورة";
    document.getElementById("zekiq-exp-photo-body").innerHTML = '<p style="color:#94a3b8">جاري التحميل…</p>';
    document.getElementById("zekiq-exp-photo").classList.add("open");
    var body = document.getElementById("zekiq-exp-photo-body");
    try {
      var url = await loadPhotoBlob(invoiceId);
      if (!url) {
        body.innerHTML = '<p style="color:#fca5a5">لا توجد صورة لهذه الفاتورة</p>';
        return;
      }
      photoObjectUrl = url;
      body.innerHTML = '<img alt="فاتورة" src="' + url + '" />';
    } catch (e) {
      body.innerHTML = '<p style="color:#fca5a5">تعذّر تحميل الصورة</p>';
    }
  }

  function dayData(iso) {
    for (var i = 0; i < state.days.length; i++) {
      if (state.days[i].day === iso) return state.days[i];
    }
    return null;
  }

  function renderList() {
    var list = document.getElementById("zekiq-exp-history-list");
    var summary = document.getElementById("zekiq-exp-history-summary");
    var dateInput = document.getElementById("zekiq-exp-history-date");
    if (!list || !summary) return;
    if (dateInput) dateInput.value = state.date;

    if (state.loading) {
      summary.textContent = "جاري التحميل…";
      list.innerHTML = "";
      return;
    }

    if (!token()) {
      summary.textContent = "سجّل الدخول لعرض الفواتير";
      list.innerHTML = "";
      return;
    }

    var day = dayData(state.date);
    if (!day || !(day.invoices && day.invoices.length)) {
      summary.textContent = formatDayLabel(state.date) + " — لا فواتير في هذا اليوم";
      list.innerHTML = '<p style="text-align:center;color:#78716c;font-size:12px;padding:12px 0">جرّب يوماً آخر بالأسهم أو التقويم</p>';
      return;
    }

    summary.textContent =
      formatDayLabel(state.date) + " · " + day.count + " فاتورة · المجموع " + money(day.total, "₺");

    list.innerHTML = "";
    day.invoices.forEach(function (inv) {
      var row = document.createElement("button");
      row.type = "button";
      row.className = "zekiq-exp-row";
      var cat = inv.category || (inv.rawAiResponse && inv.rawAiResponse.expenseCategory) || "";
      var catLabel = CAT_LABELS[cat] || cat || "فاتورة";
      var title = (inv.vendorName || inv.description || "فاتورة") +
        (inv.invoiceNumber ? " · #" + inv.invoiceNumber : "");
      row.innerHTML =
        '<span class="zekiq-exp-thumb">🧾</span>' +
        '<span class="zekiq-exp-meta"><span class="v">' + esc(title) + '</span>' +
        '<span class="s">' + esc(catLabel) + (inv.buyerSender ? " · " + esc(inv.buyerSender) : "") + "</span></span>" +
        '<span class="zekiq-exp-amt">' + money(inv.amount != null ? inv.amount : inv.totalAmount, inv.currency || "₺") + "</span>";
      row.onclick = function () {
        openPhoto(inv.id, title);
      };
      list.appendChild(row);
    });
  }

  function ensurePanel() {
    injectStyles();
    ensurePhotoViewer();
    var host = getScrollHost();
    if (!host) return null;
    var panel = document.getElementById("zekiq-expenses-history");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "zekiq-expenses-history";
      panel.innerHTML =
        '<div class="head"><h3>📅 فواتير الأيام السابقة</h3><p>اختر التاريخ — اضغط الفاتورة لعرض الصورة</p></div>' +
        '<div id="zekiq-exp-history-nav">' +
        '<button type="button" id="zekiq-exp-prev" aria-label="اليوم السابق">‹</button>' +
        '<input type="date" id="zekiq-exp-history-date" />' +
        '<button type="button" id="zekiq-exp-next" aria-label="اليوم التالي">›</button>' +
        '<button type="button" class="today" id="zekiq-exp-today">اليوم</button>' +
        "</div>" +
        '<div id="zekiq-exp-history-summary"></div>' +
        '<div id="zekiq-exp-history-list"></div>';
      host.insertBefore(panel, host.firstChild);

      document.getElementById("zekiq-exp-prev").onclick = function () {
        state.date = shiftDate(state.date, -1);
        renderList();
      };
      document.getElementById("zekiq-exp-next").onclick = function () {
        var next = shiftDate(state.date, 1);
        if (next <= todayIso()) {
          state.date = next;
          renderList();
        }
      };
      document.getElementById("zekiq-exp-today").onclick = function () {
        state.date = todayIso();
        renderList();
      };
      document.getElementById("zekiq-exp-history-date").onchange = function (e) {
        var v = e.target.value;
        if (v && v <= todayIso()) {
          state.date = v;
          renderList();
        }
      };
    }
    panel.style.display = "block";
    return panel;
  }

  function hidePanel() {
    var panel = document.getElementById("zekiq-expenses-history");
    if (panel) panel.style.display = "none";
  }

  async function refreshData(force) {
    if (!token()) return;
    var now = Date.now();
    if (!force && state.loadedAt && now - state.loadedAt < 60000 && state.days.length) return;
    state.loading = true;
    renderList();
    try {
      var data = await trpc("invoice.daily", { days: 90 });
      state.days = data && data.days ? data.days : [];
      state.loadedAt = now;
    } catch (e) {
      state.days = [];
    }
    state.loading = false;
    renderList();
  }

  function tick() {
    if (!isExpensesTab() || !document.querySelector(".owner-app-layout")) {
      hidePanel();
      return;
    }
    ensurePanel();
    if (token()) refreshData(false);
    else renderList();
  }

  setInterval(tick, 1500);
  tick();
})();
