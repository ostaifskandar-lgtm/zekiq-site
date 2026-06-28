(function () {
  "use strict";

  if (typeof window === "undefined") return;

  window.__ZEKIQ_OWNER_EXT_VERSION__ = "1.0.39";

  function isOwnerApp() {
    try {
      if (window.__TONINO_APP_TARGET__ === "owner") return true;
      if (localStorage.getItem("tonino-owner-native-apk") === "1") return true;
      if (window.Capacitor && window.Capacitor.config && window.Capacitor.config.appId === "com.tonino.owner") return true;
    } catch (e) {}
    return false;
  }

  if (!isOwnerApp()) return;

  function isInApp() {
    return !!(document.querySelector(".owner-app-layout") || document.querySelector(".owner-header-compact") || document.querySelector(".owner-header"));
  }

  var SESSION_KEY = "tonino-owner-session-token";
  var PAY_LABELS = {
    Nakit: "نقد",
    "Kredi Kartı": "بطاقة",
    Setcard: "Setcard",
    Sodexo: "Sodexo",
    Multinet: "Multinet",
    Metropol: "Metropol",
    Edenred: "Edenred",
    Havale: "تحويل",
    Yemek: "بطاقة طعام"
  };

  function token() {
    try { return localStorage.getItem(SESSION_KEY) || ""; } catch (e) { return ""; }
  }

  function baseUrl() {
    var keys = ["tonino-owner-working-api", "tonino-owner-remote-base", "tonino-owner-server"];
    for (var i = 0; i < keys.length; i++) {
      try {
        var v = (localStorage.getItem(keys[i]) || "").trim().replace(/\/+$/, "");
        if (v.startsWith("http")) return v;
      } catch (e) {}
    }
    return "https://tonino.zekiqmenu.com";
  }

  function money(n) {
    return Number(n || 0).toLocaleString("tr-TR") + " ₺";
  }

  function esc(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  }

  function todayIso() {
    return new Date().toISOString().slice(0, 10);
  }

  async function trpc(proc, input) {
    var q = encodeURIComponent(JSON.stringify({ "0": { json: input || {} } }));
    var r = await fetch(baseUrl() + "/api/trpc/" + proc + "?batch=1&input=" + q, {
      cache: "no-store",
      headers: token() ? { Authorization: "Bearer " + token() } : {}
    });
    if (!r.ok) throw new Error("network");
    var j = await r.json();
    if (j[0] && j[0].error) throw new Error(j[0].error.json?.message || "api");
    return j[0].result.data.json;
  }

  function paymentsFromClosed(row) {
    var out = [];
    var map = [
      ["cashAmount", "Nakit"], ["cardAmount", "Kredi Kartı"], ["setcardAmount", "Setcard"],
      ["sodexoAmount", "Sodexo"], ["multinetAmount", "Multinet"], ["metropolAmount", "Metropol"],
      ["edenredAmount", "Edenred"], ["havaleAmount", "Havale"], ["yemekAmount", "Yemek"]
    ];
    map.forEach(function (pair) {
      var amt = Number(row[pair[0]] || 0);
      if (amt > 0) out.push({ method: pair[1], amount: amt });
    });
    return out;
  }

  function paymentsFromOpen(detail) {
    var out = [];
    (detail.payments || []).forEach(function (p) {
      out.push({ method: p.method || p.paymentMethod || "دفع", amount: Number(p.amount || 0) });
    });
    return out;
  }

  function injectStyles() {
    if (document.getElementById("zekiq-owner-tables-css")) return;
    var s = document.createElement("style");
    s.id = "zekiq-owner-tables-css";
    s.textContent =
      "#zekiq-tables-header-btn{margin-inline-start:8px;padding:7px 12px;border:none;border-radius:10px;" +
      "background:linear-gradient(135deg,#8f6218,#cfa73e);color:#fff;font-size:12px;font-weight:800;white-space:nowrap}" +
      "#zekiq-tables-fab{position:fixed;right:16px;bottom:calc(78px + env(safe-area-inset-bottom));z-index:2147483640;" +
      "min-width:120px;height:48px;padding:0 14px;border-radius:14px;border:none;" +
      "background:linear-gradient(135deg,#8f6218,#cfa73e);color:#fff;font-size:13px;font-weight:800;" +
      "box-shadow:0 8px 28px rgba(0,0,0,.28)}" +
      "#zekiq-tables-overlay{position:fixed;inset:0;z-index:2147483644;background:rgba(0,0,0,.45);display:none}" +
      "#zekiq-tables-overlay.open{display:flex;flex-direction:column;justify-content:flex-end}" +
      "#zekiq-tables-sheet{max-height:92dvh;background:#f3ebe0;border-radius:20px 20px 0 0;display:flex;flex-direction:column;" +
      "font-family:system-ui,-apple-system,sans-serif;color:#2a2418;overflow:hidden}" +
      "#zekiq-tables-sheet .head{padding:14px 16px 10px;border-bottom:1px solid #e2d2b3;display:flex;align-items:center;gap:10px}" +
      "#zekiq-tables-sheet .head h2{margin:0;font-size:16px;font-weight:800;flex:1}" +
      "#zekiq-tables-sheet .close{border:none;background:#e8dcc8;width:36px;height:36px;border-radius:10px;font-size:18px}" +
      "#zekiq-tables-tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:10px 16px 0}" +
      "#zekiq-tables-tabs button{border:1px solid #dcc9a8;background:#fff;border-radius:12px;padding:10px;font-weight:800;font-size:13px}" +
      "#zekiq-tables-tabs button.active{background:#8f6218;color:#fff;border-color:#8f6218}" +
      "#zekiq-tables-list{overflow:auto;padding:12px 16px calc(16px + env(safe-area-inset-bottom));flex:1}" +
      ".z-table-card{width:100%;text-align:right;border:1px solid #e2d2b3;background:#fff;border-radius:14px;padding:12px;margin-bottom:10px}" +
      ".z-table-card.open{border-right:4px solid #22c55e}.z-table-card.closed{border-right:4px solid #64748b}" +
      ".z-table-card .top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}" +
      ".z-table-card .name{font-weight:800;font-size:14px}.z-table-card .amt{font-weight:900;font-size:15px;color:#8f6218;white-space:nowrap}" +
      ".z-table-card .meta{font-size:11px;color:#78716c;margin-top:4px}" +
      ".z-table-card .tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:8px}" +
      ".z-tag{font-size:10px;font-weight:800;padding:3px 7px;border-radius:999px}" +
      ".z-tag.items{background:#dbeafe;color:#1d4ed8}.z-tag.partial{background:#fce7f3;color:#be185d}" +
      ".z-tag.closed{background:#e2e8f0;color:#475569}" +
      "#zekiq-table-detail{position:fixed;inset:0;z-index:2147483645;background:#f3ebe0;display:none;flex-direction:column}" +
      "#zekiq-table-detail.open{display:flex}" +
      "#zekiq-table-detail .d-head{padding:14px 16px;border-bottom:1px solid #e2d2b3;display:flex;align-items:center;gap:10px;background:#fbf6ec}" +
      "#zekiq-table-detail .d-head h3{margin:0;flex:1;font-size:15px;font-weight:800}" +
      "#zekiq-table-detail .d-body{overflow:auto;padding:12px 16px calc(20px + env(safe-area-inset-bottom));flex:1}" +
      ".z-panel{border:1px solid #e2d2b3;border-radius:14px;background:#fff;margin-bottom:12px;overflow:hidden}" +
      ".z-panel-h{padding:10px 12px;font-size:12px;font-weight:800;background:#f8f1e4;border-bottom:1px solid #ece0cc}" +
      ".z-row{display:flex;justify-content:space-between;gap:10px;padding:10px 12px;border-bottom:1px solid #f1ead8;font-size:13px}" +
      ".z-row:last-child{border-bottom:none}.z-row .n{font-weight:600;flex:1}.z-row .p{font-weight:800;white-space:nowrap}" +
      ".z-row.struck .n,.z-row.struck .p{text-decoration:line-through;color:#a8a29e}" +
      ".z-row .sub{font-size:10px;color:#78716c;margin-top:2px}.z-empty{padding:12px;font-size:12px;color:#78716c;text-align:center}" +
      ".z-summary{padding:12px;background:#fff7e8;border:1px solid #edd9b5;border-radius:14px}" +
      ".z-summary .line{display:flex;justify-content:space-between;padding:4px 0;font-size:13px}" +
      ".z-summary .line.total{font-size:16px;font-weight:900;color:#8f6218;margin-top:6px;padding-top:8px;border-top:1px dashed #dcc9a8}";
    document.head.appendChild(s);
  }

  function renderItems(items, cancelled, ikram) {
    var html = "";
    if (items && items.length) {
      html += '<div class="z-panel"><div class="z-panel-h">الأصناف (' + items.length + ')</div>';
      items.forEach(function (it) {
        var lineTotal = Number(it.lineGross || 0) || Number(it.price || 0) * Number(it.qty || 1);
        html += '<div class="z-row"><div><div class="n">' + esc(it.name) + " ×" + esc(it.qty || 1) + '</div>' +
          (it.notes ? '<div class="sub">' + esc(it.notes) + "</div>" : "") +
          (it.category ? '<div class="sub">' + esc(it.category) + "</div>" : "") +
          '</div><div class="p">' + money(lineTotal) + "</div></div>";
      });
      html += "</div>";
    }
    if (ikram && ikram.length) {
      html += '<div class="z-panel"><div class="z-panel-h" style="color:#15803d">إكرام (' + ikram.length + ')</div>';
      ikram.forEach(function (it) {
        html += '<div class="z-row"><div><div class="n">' + esc(it.name) + " ×" + esc(it.qty || 1) + '</div></div><div class="p">' + money(Number(it.price) * Number(it.qty || 1)) + "</div></div>";
      });
      html += "</div>";
    }
    if (cancelled && cancelled.length) {
      html += '<div class="z-panel"><div class="z-panel-h" style="color:#b91c1c">ملغى / مابطول (' + cancelled.length + ')</div>';
      cancelled.forEach(function (it) {
        html += '<div class="z-row struck"><div><div class="n">' + esc(it.name) + " ×" + esc(it.qty || 1) + '</div>' +
          (it.reason ? '<div class="sub">' + esc(it.reason) + "</div>" : "") +
          (it.cancelledBy ? '<div class="sub">' + esc(it.cancelledBy) + "</div>" : "") +
          '</div><div class="p">' + money(Number(it.price) * Number(it.qty || 1)) + "</div></div>";
      });
      html += "</div>";
    }
    if (!html) html = '<div class="z-empty">لا توجد أصناف</div>';
    return html;
  }

  function renderPayments(payments, cashier) {
    if (!payments.length && !cashier) return "";
    var html = '<div class="z-panel"><div class="z-panel-h">طريقة الدفع</div>';
    if (payments.length) {
      payments.forEach(function (p) {
        html += '<div class="z-row"><div class="n">' + esc(PAY_LABELS[p.method] || p.method) + '</div><div class="p">' + money(p.amount) + "</div></div>";
      });
    } else {
      html += '<div class="z-empty">لا توجد بيانات دفع</div>';
    }
    if (cashier) html += '<div class="z-row"><div class="n">المحاسب</div><div class="p" style="font-size:12px">' + esc(cashier) + "</div></div>";
    return html + "</div>";
  }

  function renderSummary(total, paid, remaining, discount) {
    return '<div class="z-summary">' +
      (discount > 0 ? '<div class="line"><span>خصم</span><span>-' + money(discount) + "</span></div>" : "") +
      '<div class="line"><span>المجموع</span><span>' + money(total) + "</span></div>" +
      '<div class="line"><span>مدفوع</span><span>' + money(paid) + "</span></div>" +
      '<div class="line total"><span>المتبقي</span><span>' + money(remaining) + "</span></div></div>";
  }

  var state = { tab: "open", openRows: [], closedRows: [] };

  function ensureUi() {
    injectStyles();
    if (!document.getElementById("zekiq-tables-fab")) {
      var fab = document.createElement("button");
      fab.id = "zekiq-tables-fab";
      fab.type = "button";
      fab.textContent = "🪑 الطاولات";
      fab.onclick = openSheet;
      document.body.appendChild(fab);
    }
    if (!document.getElementById("zekiq-tables-overlay")) {
      var overlay = document.createElement("div");
      overlay.id = "zekiq-tables-overlay";
      overlay.innerHTML =
        '<div id="zekiq-tables-sheet">' +
        '<div class="head"><h2>تفاصيل الطاولات</h2><button type="button" class="close" id="zekiq-tables-close">×</button></div>' +
        '<div id="zekiq-tables-tabs">' +
        '<button type="button" data-tab="open" class="active">مفتوحة</button>' +
        '<button type="button" data-tab="closed">مقفلة اليوم</button>' +
        "</div><div id=\"zekiq-tables-list\"></div></div>";
      document.body.appendChild(overlay);
      document.getElementById("zekiq-tables-close").onclick = closeSheet;
      overlay.onclick = function (e) { if (e.target === overlay) closeSheet(); };
      overlay.querySelectorAll("#zekiq-tables-tabs button").forEach(function (btn) {
        btn.onclick = function () {
          state.tab = btn.getAttribute("data-tab");
          overlay.querySelectorAll("#zekiq-tables-tabs button").forEach(function (b) {
            b.classList.toggle("active", b.getAttribute("data-tab") === state.tab);
          });
          renderList();
        };
      });
    }
    if (!document.getElementById("zekiq-table-detail")) {
      var detail = document.createElement("div");
      detail.id = "zekiq-table-detail";
      detail.innerHTML =
        '<div class="d-head"><button type="button" class="close" id="zekiq-detail-back">←</button>' +
        '<h3 id="zekiq-detail-title">—</h3><button type="button" class="close" id="zekiq-detail-close">×</button></div>' +
        '<div class="d-body" id="zekiq-detail-body"></div>';
      document.body.appendChild(detail);
      document.getElementById("zekiq-detail-back").onclick = closeDetail;
      document.getElementById("zekiq-detail-close").onclick = function () { closeDetail(); closeSheet(); };
    }
  }

  function injectHeaderButton() {
    var header = document.querySelector(".owner-header");
    if (!header || document.getElementById("zekiq-tables-header-btn")) return;
    var btn = document.createElement("button");
    btn.id = "zekiq-tables-header-btn";
    btn.type = "button";
    btn.textContent = "🪑 الطاولات";
    btn.onclick = openSheet;
    header.appendChild(btn);
  }

  function openSheet() {
    ensureUi();
    document.getElementById("zekiq-tables-overlay").classList.add("open");
    loadData();
  }

  function closeSheet() {
    var o = document.getElementById("zekiq-tables-overlay");
    if (o) o.classList.remove("open");
    closeDetail();
  }

  function openDetail(title, bodyHtml) {
    document.getElementById("zekiq-detail-title").textContent = title;
    document.getElementById("zekiq-detail-body").innerHTML = bodyHtml;
    document.getElementById("zekiq-table-detail").classList.add("open");
  }

  function closeDetail() {
    var d = document.getElementById("zekiq-table-detail");
    if (d) d.classList.remove("open");
  }

  async function loadData() {
    var list = document.getElementById("zekiq-tables-list");
    if (!list) return;
    list.innerHTML = '<div class="z-empty">جاري التحميل…</div>';
    try {
      var live = await trpc("owner.live", {});
      state.openRows = live.tables && live.tables.open ? live.tables.open.rows || [] : [];
      state.closedRows = await trpc("pos.closedOrders", { date: todayIso() });
      renderList();
    } catch (e) {
      list.innerHTML = '<div class="z-empty">' + (token() ? "تعذّر التحميل — تحقق من الاتصال" : "سجّل الدخول أولاً") + "</div>";
    }
  }

  function renderList() {
    var list = document.getElementById("zekiq-tables-list");
    if (!list) return;
    var rows = state.tab === "open" ? state.openRows : state.closedRows;
    if (!rows.length) {
      list.innerHTML = '<div class="z-empty">' + (state.tab === "open" ? "لا طاولات مفتوحة" : "لا طاولات مقفلة اليوم") + "</div>";
      return;
    }
    list.innerHTML = "";
    rows.forEach(function (row) {
      var card = document.createElement("button");
      card.type = "button";
      card.className = "z-table-card " + (state.tab === "open" ? "open" : "closed");
      var title = (row.section || "?") + " · " + (row.tableNum || "?");
      var amt = state.tab === "open" ? Number(row.remaining || row.total || 0) : Number(row.total || 0);
      var meta = state.tab === "open"
        ? (row.itemCount || 0) + " صنف" + (row.isPartial ? " · دفع جزئي" : "")
        : (row.cashierName || "Kasa") + " · #" + (row.orderId || row.id || "");
      card.innerHTML =
        '<div class="top"><div><div class="name">' + esc(title) + '</div><div class="meta">' + esc(meta) + '</div></div>' +
        '<div class="amt">' + money(amt) + "</div></div>";
      card.onclick = function () {
        if (state.tab === "open") showOpenDetail(row);
        else showClosedDetail(row);
      };
      list.appendChild(card);
    });
  }

  async function showOpenDetail(row) {
    openDetail(row.section + " · " + row.tableNum, '<div class="z-empty">جاري التحميل…</div>');
    try {
      var d = await trpc("pos.openTableDetail", { section: row.section, tableNum: row.tableNum });
      var order = d.order || {};
      var total = Number(order.total || row.total || 0);
      var paid = Number(order.paidAmount || row.paid || 0);
      var remaining = Number(row.remaining != null ? row.remaining : total - paid);
      var html = renderItems(d.items, d.cancelledItems, d.ikramItems);
      html += renderPayments(paymentsFromOpen(d), order.cashierName);
      html += renderSummary(total, paid, remaining, Number(order.discount || 0));
      document.getElementById("zekiq-detail-body").innerHTML = html;
    } catch (e) {
      document.getElementById("zekiq-detail-body").innerHTML = '<div class="z-empty">تعذّر تحميل التفاصيل</div>';
    }
  }

  async function showClosedDetail(row) {
    openDetail(row.section + " · " + row.tableNum + " (مقفلة)", '<div class="z-empty">جاري التحميل…</div>');
    try {
      var oid = row.orderId || row.id;
      var d = await trpc("pos.getOrder", { id: oid });
      var payments = paymentsFromClosed(row);
      if (!payments.length && d.paymentMethod) payments.push({ method: d.paymentMethod, amount: Number(d.total || 0) });
      var html = renderItems(d.items, d.cancelledItems, d.ikramItems);
      html += renderPayments(payments, row.cashierName || d.cashierName);
      html += renderSummary(Number(row.total || d.total || 0), Number(row.total || d.total || 0), 0, Number(row.discount || d.discount || 0));
      document.getElementById("zekiq-detail-body").innerHTML = html;
    } catch (e) {
      document.getElementById("zekiq-detail-body").innerHTML = '<div class="z-empty">تعذّر تحميل التفاصيل</div>';
    }
  }

  function enhanceExistingRows() {
    document.querySelectorAll(".owner-table-row.is-compact").forEach(function (li) {
      if (li.dataset.zekiqEnhanced) return;
      li.dataset.zekiqEnhanced = "1";
      li.style.cursor = "pointer";
      li.onclick = openSheet;
    });
  }

  function tick() {
    if (!isInApp()) {
      var fab = document.getElementById("zekiq-tables-fab");
      var hdr = document.getElementById("zekiq-tables-header-btn");
      if (fab) fab.style.display = "none";
      if (hdr) hdr.style.display = "none";
      return;
    }
    ensureUi();
    injectHeaderButton();
    var fab = document.getElementById("zekiq-tables-fab");
    var hdr = document.getElementById("zekiq-tables-header-btn");
    if (fab) fab.style.display = "block";
    if (hdr) hdr.style.display = "inline-block";
    enhanceExistingRows();
  }

  window.zekiqOpenTables = openSheet;
  setInterval(tick, 1200);
  tick();
})();
