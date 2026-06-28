(function () {
  "use strict";

  var TONINO_TUNNEL = "https://tonino.zekiqmenu.com";
  var DEV_HOSTS = ["zekiq-dev.zekiqmenu.com", "192.168.1.84"];
  var CONFIG_URLS = [
    "https://ostaifskandar-lgtm.github.io/zekiq-site/owner-config.json",
    "https://cdn.jsdelivr.net/gh/ostaifskandar-lgtm/zekiq-site@main/owner-config.json"
  ];

  var KEYS = {
    remoteBase: "tonino-owner-remote-base",
    remoteForIp: "tonino-owner-remote-for-ip",
    server: "tonino-owner-server",
    profiles: "tonino-owner-server-profiles",
    linkMode: "tonino-owner-link-mode",
    workingApi: "tonino-owner-working-api",
    workingVia: "tonino-owner-working-via"
  };

  function isOwnerApp() {
    try {
      if (window.__TONINO_APP_TARGET__ === "owner") return true;
      if (localStorage.getItem("tonino-owner-native-apk") === "1") return true;
      if (window.Capacitor && window.Capacitor.config && window.Capacitor.config.appId === "com.tonino.owner") return true;
    } catch (e) {}
    return false;
  }

  if (!isOwnerApp()) return;

  function isDevHost(url) {
    var u = String(url || "").toLowerCase();
    for (var i = 0; i < DEV_HOSTS.length; i++) {
      if (u.indexOf(DEV_HOSTS[i]) >= 0) return true;
    }
    return u.indexOf("zekiq-dev") >= 0;
  }

  function getStored(key) {
    try { return localStorage.getItem(key) || ""; } catch (e) { return ""; }
  }

  function forceTonino(cfg, mode) {
    saveDualConfig(cfg || {
      shopName: "Tonino",
      tunnelUrl: TONINO_TUNNEL,
      lanHost: "192.168.1.25",
      lanPort: "3000",
      lanUrl: "http://192.168.1.25:3000"
    }, mode || "remote", TONINO_TUNNEL, (cfg && cfg.lanUrl) || "http://192.168.1.25:3000");
    try {
      localStorage.setItem("tonino-owner-shop-name", "Tonino");
      localStorage.setItem("tonino-owner-network-locked", "1");
      localStorage.setItem("tonino-owner-network-locked-host", "tonino.zekiqmenu.com");
    } catch (e) {}
  }

  function currentApiUrl() {
    var keys = [KEYS.workingApi, KEYS.server, KEYS.remoteBase];
    for (var i = 0; i < keys.length; i++) {
      var v = trimUrl(getStored(keys[i]));
      if (v.startsWith("http")) return v;
    }
    return "";
  }

  function injectConnStyles() {
    if (document.getElementById("zekiq-owner-conn-css")) return;
    var s = document.createElement("style");
    s.id = "zekiq-owner-conn-css";
    s.textContent =
      "#zekiq-owner-conn-banner{position:fixed;left:12px;right:12px;top:calc(8px + env(safe-area-inset-top));z-index:2147483001;" +
      "padding:10px 12px;border-radius:12px;font-size:11px;font-weight:700;line-height:1.5;font-family:system-ui,sans-serif}" +
      "#zekiq-owner-conn-banner.ok{background:rgba(34,197,94,.15);color:#166534;border:1px solid rgba(34,197,94,.35)}" +
      "#zekiq-owner-conn-banner.bad{background:rgba(239,68,68,.12);color:#991b1b;border:1px solid rgba(239,68,68,.35)}" +
      "#zekiq-owner-conn-banner .host{font-family:ui-monospace,monospace;font-size:10px;opacity:.9;word-break:break-all}" +
      "#zekiq-owner-conn-banner button{margin-top:8px;width:100%;padding:9px;border:none;border-radius:10px;font-size:12px;font-weight:800;" +
      "background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#1a1714}";
    document.head.appendChild(s);
  }

  function renderConnBanner(cfg) {
    if (!document.querySelector(".owner-login-compact")) return;
    injectConnStyles();
    var id = "zekiq-owner-conn-banner";
    var el = document.getElementById(id);
    if (!el) {
      el = document.createElement("div");
      el.id = id;
      document.body.appendChild(el);
    }
    var api = currentApiUrl();
    var badDev = isDevHost(api);
    el.className = badDev ? "bad" : "ok";
    el.innerHTML =
      (badDev
        ? "<b>⚠️ متصل بنفق المطور — ليس Tonino!</b><br>الرمز لن يعمل هنا. استخدم <b>tonino.zekiqmenu.com</b>"
        : "<b>✓ الاتصال</b> — تأكد أن الاسم <b>Tonino</b> وليس ZEKiQ Dev") +
      '<div class="host" dir="ltr">' + (api || "…") + '</div>' +
      '<div id="zekiq-conn-shop" style="margin-top:4px">جاري التحقق…</div>' +
      (badDev ? '<button type="button" id="zekiq-fix-tonino">🔧 إصلاح → Tonino</button>' : "");

    var fixBtn = document.getElementById("zekiq-fix-tonino");
    if (fixBtn) {
      fixBtn.onclick = function () {
        forceTonino(cfg, "remote");
        renderConnBanner(cfg);
        window.dispatchEvent(new CustomEvent("tonino-owner-link-changed"));
        setTimeout(function () { location.reload(); }, 400);
      };
    }

    var probe = badDev ? TONINO_TUNNEL : (api || TONINO_TUNNEL);
    fetch(probe + "/api/owner/config", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var shopEl = document.getElementById("zekiq-conn-shop");
        if (!shopEl || !j) return;
        shopEl.textContent = "المحل: " + (j.shopName || "?") + " · المالك: " + (j.ownerName || "?");
        if (j.shopName && j.shopName !== "Tonino" && !badDev) {
          el.className = "bad";
          el.innerHTML =
            "<b>⚠️ متصل بـ " + j.shopName + " — ليس Tonino!</b>" +
            '<div class="host" dir="ltr">' + probe + "</div>" +
            '<div id="zekiq-conn-shop">' + shopEl.textContent + "</div>" +
            '<button type="button" id="zekiq-fix-tonino">🔧 إصلاح → Tonino</button>';
          document.getElementById("zekiq-fix-tonino").onclick = fixBtn ? fixBtn.onclick : function () {
            forceTonino(cfg, "remote");
            location.reload();
          };
        }
      })
      .catch(function () {
        var shopEl = document.getElementById("zekiq-conn-shop");
        if (shopEl) shopEl.textContent = "✗ لا يمكن الوصول للكاشير — تحقق من 4G أو النفق";
      });
  }

  function guardWrongServer(cfg) {
    var api = currentApiUrl();
    if (isDevHost(api)) {
      forceTonino(cfg, "remote");
      return true;
    }
    return false;
  }

  function trimUrl(u) {
    return String(u || "").trim().replace(/\/+$/, "");
  }

  function normalizeLanInput(raw, cfg) {
    var v = String(raw || "").trim();
    if (!v) return cfg.lanUrl || ("http://" + cfg.lanHost + ":" + (cfg.lanPort || "3000"));
    if (/^https?:\/\//i.test(v)) return trimUrl(v);
    if (/^\d{1,3}(\.\d{1,3}){3}(:\d+)?$/.test(v)) return trimUrl("http://" + v);
    return trimUrl("http://" + v);
  }

  function normalizeTunnelInput(raw, cfg) {
    var v = String(raw || "").trim();
    if (!v) return trimUrl(cfg.tunnelUrl);
    if (/^https?:\/\//i.test(v)) return trimUrl(v);
    return trimUrl("https://" + v.replace(/^\/+/, ""));
  }

  function lanHostFromUrl(lanUrl) {
    try {
      return new URL(lanUrl).hostname;
    } catch (e) {
      return "";
    }
  }

  function saveDualConfig(cfg, mode, tunnelRaw, lanRaw) {
    var tunnel = normalizeTunnelInput(tunnelRaw, cfg);
    var lan = normalizeLanInput(lanRaw, cfg);
    var host = lanHostFromUrl(lan) || cfg.lanHost || "192.168.1.25";
    var profile = {
      id: "cashier",
      label: cfg.shopName || "Tonino",
      server: lan,
      savedAt: Date.now()
    };

    try {
      localStorage.setItem(KEYS.remoteBase, tunnel);
      localStorage.setItem(KEYS.remoteForIp, host);
      localStorage.setItem(KEYS.profiles, JSON.stringify([profile]));
      if (mode === "remote") {
        localStorage.setItem(KEYS.server, tunnel);
        localStorage.setItem(KEYS.linkMode, "remote");
        localStorage.setItem(KEYS.workingApi, tunnel);
        localStorage.setItem(KEYS.workingVia, "remote");
      } else {
        localStorage.setItem(KEYS.server, lan);
        localStorage.setItem(KEYS.linkMode, "wifi");
        localStorage.setItem(KEYS.workingApi, lan);
        localStorage.setItem(KEYS.workingVia, "lan");
      }
      localStorage.setItem("tonino-owner-manual-target", "1");
      window.dispatchEvent(new CustomEvent("tonino-owner-link-changed"));
    } catch (e) {}
  }

  function fetchConfig() {
    var i = 0;
    function next() {
      if (i >= CONFIG_URLS.length) {
        return Promise.resolve({
          shopName: "Tonino",
          tunnelUrl: "https://tonino.zekiqmenu.com",
          lanHost: "192.168.1.25",
          lanPort: "3000",
          lanUrl: "http://192.168.1.25:3000"
        });
      }
      var url = CONFIG_URLS[i++] + "?_=" + Date.now();
      return fetch(url, { cache: "no-store" })
        .then(function (r) { return r.ok ? r.json() : next(); })
        .catch(next);
    }
    return next();
  }

  function injectStyles() {
    if (document.getElementById("zekiq-owner-dual-css")) return;
    var s = document.createElement("style");
    s.id = "zekiq-owner-dual-css";
    s.textContent =
      "#zekiq-owner-dual-settings{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;" +
      "background:rgba(251,246,236,.98);border-top:2px solid #e2d2b3;padding:12px 14px calc(12px + env(safe-area-inset-bottom));" +
      "font-family:system-ui,-apple-system,sans-serif;box-shadow:0 -8px 28px rgba(0,0,0,.12)}" +
      "#zekiq-owner-dual-settings .z-title{font-size:13px;font-weight:800;color:#8f6218;margin-bottom:8px;text-align:center}" +
      "#zekiq-owner-dual-settings label{display:block;font-size:11px;font-weight:700;color:#5c4a2a;margin:6px 0 4px}" +
      "#zekiq-owner-dual-settings input{width:100%;box-sizing:border-box;padding:10px 12px;border-radius:10px;border:1px solid #d8c6a0;" +
      "font-size:14px;background:#fff;color:#1a1714;margin-bottom:4px}" +
      "#zekiq-owner-dual-settings .z-btns{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}" +
      "#zekiq-owner-dual-settings button{padding:11px 8px;border:none;border-radius:10px;font-size:12px;font-weight:800}" +
      "#zekiq-owner-dual-settings .z-remote{background:linear-gradient(135deg,#38bdf8,#0284c7);color:#fff}" +
      "#zekiq-owner-dual-settings .z-wifi{background:linear-gradient(135deg,#4ade80,#16a34a);color:#052e16}" +
      "#zekiq-owner-dual-settings .z-status{font-size:10px;text-align:center;color:#78716c;margin-top:6px}";
    document.head.appendChild(s);
  }

  function renderPanel(cfg) {
    if (document.getElementById("zekiq-owner-dual-settings")) return;
    injectStyles();

    var wrap = document.createElement("div");
    wrap.id = "zekiq-owner-dual-settings";
    wrap.innerHTML =
      '<div class="z-title">⚙️ إعدادات الاتصال — Tonino</div>' +
      '<label>🌐 عنوان النفق (4G)</label>' +
      '<input id="zekiq-tunnel" dir="ltr" autocomplete="off" spellcheck="false" placeholder="tonino.zekiqmenu.com" />' +
      '<label>📶 IP الكاشير (WiFi المحل)</label>' +
      '<input id="zekiq-lan" dir="ltr" autocomplete="off" spellcheck="false" placeholder="192.168.1.25:3000" />' +
      '<div class="z-btns">' +
      '<button type="button" class="z-remote" id="zekiq-save-remote">حفظ + 4G</button>' +
      '<button type="button" class="z-wifi" id="zekiq-save-wifi">حفظ + WiFi</button>' +
      '</div>' +
      '<div class="z-status" id="zekiq-dual-status">4G = tonino.zekiqmenu.com · ليس zekiq-dev (نفق المطور)</div>';

    document.body.appendChild(wrap);

    var tunnelEl = document.getElementById("zekiq-tunnel");
    var lanEl = document.getElementById("zekiq-lan");
    var statusEl = document.getElementById("zekiq-dual-status");

    tunnelEl.value = normalizeTunnelInput(localStorage.getItem(KEYS.remoteBase) || cfg.tunnelUrl, cfg).replace(/^https:\/\//, "");
    lanEl.value = (function () {
      try {
        var profiles = JSON.parse(localStorage.getItem(KEYS.profiles) || "[]");
        if (profiles[0] && profiles[0].server) return profiles[0].server.replace(/^https?:\/\//, "");
      } catch (e) {}
      return (cfg.lanHost || "192.168.1.25") + ":" + (cfg.lanPort || "3000");
    })();

    document.getElementById("zekiq-save-remote").onclick = function () {
      saveDualConfig(cfg, "remote", tunnelEl.value, lanEl.value);
      statusEl.textContent = "✓ تم الحفظ — وضع 4G / النفق";
    };
    document.getElementById("zekiq-save-wifi").onclick = function () {
      saveDualConfig(cfg, "wifi", tunnelEl.value, lanEl.value);
      statusEl.textContent = "✓ تم الحفظ — وضع WiFi / IP المحل";
    };
  }

  function boot() {
    fetchConfig().then(function (cfg) {
      var mode = "remote";
      try {
        if (localStorage.getItem(KEYS.linkMode) === "wifi") mode = "wifi";
      } catch (e) {}
      if (guardWrongServer(cfg)) mode = "remote";
      saveDualConfig(cfg, mode, cfg.tunnelUrl, cfg.lanUrl);
      if (document.querySelector(".owner-login-compact")) {
        renderPanel(cfg);
        renderConnBanner(cfg);
      }
    });
  }

  function syncLoginPanel() {
    var panel = document.getElementById("zekiq-owner-dual-settings");
    var banner = document.getElementById("zekiq-owner-conn-banner");
    var onLogin = !!document.querySelector(".owner-login-compact");
    var inApp = !!document.querySelector(".owner-app-layout");
    if (panel) panel.style.display = onLogin && !inApp ? "block" : "none";
    if (banner) banner.style.display = onLogin && !inApp ? "block" : "none";
    if (onLogin && !inApp) {
      fetchConfig().then(function (cfg) {
        guardWrongServer(cfg);
        renderConnBanner(cfg);
      });
    }
  }

  setInterval(syncLoginPanel, 1500);
  syncLoginPanel();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
