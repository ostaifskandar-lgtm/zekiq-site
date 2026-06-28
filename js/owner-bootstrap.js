(function () {
  "use strict";

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
      '<div class="z-status" id="zekiq-dual-status">الوضعان محفوظان — اختر 4G خارج المحل أو WiFi داخل المحل</div>';

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
      saveDualConfig(cfg, mode, cfg.tunnelUrl, cfg.lanUrl);
      renderPanel(cfg);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
