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
    activeApi: "tonino-owner-active-api",
    profiles: "tonino-owner-server-profiles",
    linkMode: "tonino-owner-link-mode",
    workingApi: "tonino-owner-working-api",
    workingVia: "tonino-owner-working-via",
    manualTarget: "tonino-owner-manual-target"
  };

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

  function trimUrl(u) {
    return String(u || "").trim().replace(/\/+$/, "");
  }

  function getStored(key) {
    try { return localStorage.getItem(key) || ""; } catch (e) { return ""; }
  }

  function hasUserConfig() {
    return getStored(KEYS.manualTarget) === "1" && !!currentApiUrl();
  }

  function currentApiUrl() {
    var keys = [KEYS.workingApi, KEYS.server, KEYS.remoteBase];
    for (var i = 0; i < keys.length; i++) {
      var v = trimUrl(getStored(keys[i]));
      if (v.startsWith("http")) return v;
    }
    return "";
  }

  function defaultCfg() {
    return {
      shopName: "Shop",
      tunnelUrl: "",
      lanHost: "",
      lanPort: "3000",
      lanUrl: ""
    };
  }

  function normalizeLanInput(raw, cfg) {
    var v = String(raw || "").trim();
    if (!v) return trimUrl(cfg.lanUrl || "");
    if (/^https?:\/\//i.test(v)) return trimUrl(v);
    if (/^\d{1,3}(\.\d{1,3}){3}(:\d+)?$/.test(v)) return trimUrl("http://" + v);
    return trimUrl("http://" + v);
  }

  function normalizeTunnelInput(raw) {
    var v = String(raw || "").trim();
    if (!v) return "";
    if (/^https?:\/\//i.test(v)) return trimUrl(v);
    return trimUrl("https://" + v.replace(/^\/+/, ""));
  }

  function lanHostFromUrl(lanUrl) {
    try { return new URL(lanUrl).hostname; } catch (e) { return ""; }
  }

  function unlockNetwork() {
    try {
      localStorage.removeItem("tonino-owner-network-locked");
      localStorage.removeItem("tonino-owner-locked-host");
    } catch (e) {}
  }

  function syncProfileFromServer(apiBase, shopLabel) {
    var base = trimUrl(apiBase);
    if (!base.startsWith("http")) return Promise.resolve();
    return fetch(base + "/api/owner/config", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (cfg) {
        if (!cfg || cfg.ok === false) return;
        var ip = typeof cfg.ip === "string" ? cfg.ip.trim() : "";
        var port = cfg.port || 3000;
        var lan = ip ? "http://" + ip + ":" + port : "";
        var linkMode = getStored(KEYS.linkMode);
        var tunnel = trimUrl(getStored(KEYS.remoteBase) || cfg.tunnelUrl || "");
        var useRemote = linkMode === "remote";
        var profileServer = lan && isPrivateLanUrl(lan) ? lan : (useRemote && tunnel ? tunnel : base);
        if (useRemote && lan) profileServer = lan;
        var profile = {
          id: "cashier",
          label: cfg.shopName || shopLabel || "Shop",
          server: profileServer,
          savedAt: Date.now()
        };
        try {
          if (ip) localStorage.setItem(KEYS.remoteForIp, ip);
          if (cfg.shopName) localStorage.setItem("tonino-owner-shop-name", cfg.shopName);
          if (cfg.tunnelUrl || (tunnel && tunnel.startsWith("https://"))) {
            localStorage.setItem(KEYS.remoteBase, trimUrl(cfg.tunnelUrl || tunnel));
          }
          localStorage.setItem(KEYS.profiles, JSON.stringify([profile]));
          if (useRemote && tunnel.startsWith("https://")) {
            localStorage.setItem(KEYS.server, tunnel);
            localStorage.setItem(KEYS.workingApi, tunnel);
            localStorage.setItem(KEYS.activeApi, tunnel);
            localStorage.setItem(KEYS.linkMode, "remote");
            localStorage.setItem(KEYS.workingVia, "remote");
          } else if (lan) {
            localStorage.setItem(KEYS.server, lan);
            localStorage.setItem(KEYS.workingApi, lan);
            localStorage.setItem(KEYS.activeApi, lan);
            localStorage.setItem(KEYS.linkMode, "wifi");
            localStorage.setItem(KEYS.workingVia, "lan");
          }
        } catch (e) {}
      })
      .catch(function () {});
  }

  function saveDualConfig(mode, tunnelRaw, lanRaw) {
    var tunnel = normalizeTunnelInput(tunnelRaw);
    var lan = normalizeLanInput(lanRaw, defaultCfg());
    unlockNetwork();

    try {
      if (tunnel) localStorage.setItem(KEYS.remoteBase, tunnel);
      if (mode === "remote" && tunnel) {
        localStorage.setItem(KEYS.profiles, JSON.stringify([{
          id: "cashier",
          label: "Shop",
          server: lan || ("http://" + (getStored(KEYS.remoteForIp) || "192.168.1.25") + ":3000"),
          savedAt: Date.now()
        }]));
        if (lan) localStorage.setItem(KEYS.remoteForIp, lanHostFromUrl(lan));
        localStorage.setItem(KEYS.server, tunnel);
        localStorage.setItem(KEYS.linkMode, "remote");
        localStorage.setItem(KEYS.workingApi, tunnel);
        localStorage.setItem(KEYS.activeApi, tunnel);
        localStorage.setItem(KEYS.workingVia, "remote");
      } else if (lan) {
        localStorage.setItem(KEYS.remoteForIp, lanHostFromUrl(lan));
        localStorage.setItem(KEYS.profiles, JSON.stringify([{
          id: "cashier",
          label: "Shop",
          server: lan,
          savedAt: Date.now()
        }]));
        localStorage.setItem(KEYS.server, lan);
        localStorage.setItem(KEYS.linkMode, "wifi");
        localStorage.setItem(KEYS.workingApi, lan);
        localStorage.setItem(KEYS.activeApi, lan);
        localStorage.setItem(KEYS.workingVia, "lan");
      }
      localStorage.setItem(KEYS.manualTarget, "1");
      window.dispatchEvent(new CustomEvent("tonino-owner-link-changed"));
    } catch (e) {}

    var probe = mode === "remote" ? tunnel : lan;
    return syncProfileFromServer(probe, "");
  }

  function fetchConfig() {
    var i = 0;
    function next() {
      if (i >= CONFIG_URLS.length) return Promise.resolve(defaultCfg());
      return fetch(CONFIG_URLS[i++] + "?_=" + Date.now(), { cache: "no-store" })
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
      "#zekiq-owner-conn-banner{position:fixed;left:12px;right:12px;top:calc(8px + env(safe-area-inset-top));z-index:2147483001;" +
      "padding:8px 12px;border-radius:12px;font-size:11px;font-weight:700;line-height:1.45;font-family:system-ui,sans-serif;" +
      "background:rgba(34,197,94,.12);color:#166534;border:1px solid rgba(34,197,94,.3)}" +
      "#zekiq-owner-conn-banner.warn{background:rgba(245,158,11,.12);color:#92400e;border-color:rgba(245,158,11,.35)}" +
      "#zekiq-owner-conn-banner .host{font-family:ui-monospace,monospace;font-size:10px;opacity:.85;word-break:break-all}" +
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

  var bannerLastCheck = 0;

  function renderConnBanner() {
    if (!document.querySelector(".owner-login-compact")) return;
    var now = Date.now();
    if (now - bannerLastCheck < 10000 && document.getElementById("zekiq-conn-shop")) return;
    bannerLastCheck = now;
    injectStyles();
    var el = document.getElementById("zekiq-owner-conn-banner");
    if (!el) {
      el = document.createElement("div");
      el.id = "zekiq-owner-conn-banner";
      document.body.appendChild(el);
    }
    var api = currentApiUrl();
    el.className = api ? "" : "warn";
    el.innerHTML =
      (api ? "<b>✓ جاهز</b> — أي كاشير / أي نفق" : "<b>⚙️</b> أدخل النفق أو IP ثم احفظ") +
      '<div class="host" dir="ltr">' + (api || "لم يُحفظ بعد") + '</div>' +
      '<div id="zekiq-conn-shop" style="margin-top:3px">…</div>';

    if (!api) return;
    fetch(api + "/api/owner/config", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var shopEl = document.getElementById("zekiq-conn-shop");
        if (!shopEl) return;
        if (!j) {
          shopEl.textContent = "✗ تعذّر الوصول — تحقق من النفق أو IP";
          el.className = "warn";
          return;
        }
        shopEl.textContent = "المحل: " + (j.shopName || "?") + " · المالك: " + (j.ownerName || "?");
      })
      .catch(function () {
        var shopEl = document.getElementById("zekiq-conn-shop");
        if (shopEl) shopEl.textContent = "✗ لا اتصال — جرّب 4G أو WiFi";
        el.className = "warn";
      });
  }

  function renderPanel() {
    if (document.getElementById("zekiq-owner-dual-settings")) return;
    injectStyles();
    var wrap = document.createElement("div");
    wrap.id = "zekiq-owner-dual-settings";
    wrap.innerHTML =
      '<div class="z-title">⚙️ إعدادات الاتصال — أي محل</div>' +
      '<label>🌐 النفق (4G) — مثال: tonino.zekiqmenu.com أو zekiq-dev.zekiqmenu.com</label>' +
      '<input id="zekiq-tunnel" dir="ltr" autocomplete="off" spellcheck="false" placeholder="shop.zekiqmenu.com" />' +
      '<label>📶 IP الكاشير (WiFi)</label>' +
      '<input id="zekiq-lan" dir="ltr" autocomplete="off" spellcheck="false" placeholder="192.168.1.25:3000" />' +
      '<div class="z-btns">' +
      '<button type="button" class="z-remote" id="zekiq-save-remote">حفظ + 4G</button>' +
      '<button type="button" class="z-wifi" id="zekiq-save-wifi">حفظ + WiFi</button>' +
      '<button type="button" class="z-wifi" id="zekiq-restore-wifi" style="grid-column:1/-1;background:#166534;color:#fff;margin-top:4px">🔧 استعادة WiFi / كابل</button>' +
      '</div>' +
      '<div class="z-status" id="zekiq-dual-status">احفظ ثم أدخل PIN — يعمل مع أي كاشير</div>';

    document.body.appendChild(wrap);

    var tunnelEl = document.getElementById("zekiq-tunnel");
    var lanEl = document.getElementById("zekiq-lan");
    var statusEl = document.getElementById("zekiq-dual-status");

    tunnelEl.value = getStored(KEYS.remoteBase).replace(/^https:\/\//, "");
    try {
      var profiles = JSON.parse(getStored(KEYS.profiles) || "[]");
      if (profiles[0] && profiles[0].server) {
        lanEl.value = profiles[0].server.replace(/^https?:\/\//, "");
      }
    } catch (e) {}

    document.getElementById("zekiq-save-remote").onclick = function () {
      if (!tunnelEl.value.trim()) {
        statusEl.textContent = "✗ أدخل عنوان النفق أولاً";
        return;
      }
      statusEl.textContent = "جاري الحفظ والمزامنة…";
      saveDualConfig("remote", tunnelEl.value, lanEl.value).then(function () {
        statusEl.textContent = "✓ تم — 4G / النفق · أدخل PIN الآن";
        renderConnBanner();
      });
    };
    document.getElementById("zekiq-save-wifi").onclick = function () {
      if (!lanEl.value.trim()) {
        statusEl.textContent = "✗ أدخل IP الكاشير أولاً";
        return;
      }
      statusEl.textContent = "جاري الحفظ…";
      saveDualConfig("wifi", tunnelEl.value, lanEl.value).then(function () {
        statusEl.textContent = "✓ تم — WiFi · أدخل PIN الآن";
        renderConnBanner();
      });
    };
    document.getElementById("zekiq-restore-wifi").onclick = function () {
      var lan = lanEl.value.trim() || profileLanFromStorage() || "192.168.1.25:3000";
      statusEl.textContent = "جاري استعادة WiFi…";
      saveDualConfig("wifi", tunnelEl.value, lan).then(function () {
        if (window.__zekiqPersistOwnerLan) window.__zekiqPersistOwnerLan(normalizeLanInput(lan, defaultCfg()));
        statusEl.textContent = "✓ تم استعادة WiFi — أعد فتح التطبيق";
        renderConnBanner();
      });
    };
  }

  function ensureStandalone() {
    try {
      localStorage.setItem("tonino-owner-standalone-v1", "1");
      localStorage.setItem("tonino-owner-native-apk", "1");
      localStorage.removeItem("tonino-owner-remote-shell");
    } catch (e) {}
  }

  function isPrivateLanUrl(u) {
    try {
      var h = new URL(u).hostname;
      return /^(192\.168\.|10\.|127\.|localhost$|172\.(1[6-9]|2\d|3[01])\.)/.test(h);
    } catch (e) { return false; }
  }

  function getNetworkType() {
    return new Promise(function (resolve) {
      try {
        var net = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Network;
        if (net && net.getStatus) {
          net.getStatus().then(function (s) { resolve((s && s.connectionType) || "unknown"); }).catch(function () { resolve("unknown"); });
          return;
        }
      } catch (e) {}
      resolve("unknown");
    });
  }

  function probeApi(base, ms) {
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, ms || 2000);
    return fetch(base + "/api/health", { cache: "no-store", signal: ctrl && ctrl.signal })
      .then(function (r) { clearTimeout(timer); return r.ok; })
      .catch(function () { clearTimeout(timer); return false; });
  }

  function switchToTunnel(tunnel, reason) {
    tunnel = trimUrl(tunnel);
    if (!tunnel.startsWith("http")) return false;
    try {
      localStorage.setItem(KEYS.workingApi, tunnel);
      localStorage.setItem(KEYS.server, tunnel);
      localStorage.setItem(KEYS.activeApi, tunnel);
      localStorage.setItem(KEYS.linkMode, "remote");
      localStorage.setItem(KEYS.workingVia, "remote");
      localStorage.setItem(KEYS.manualTarget, "1");
      localStorage.setItem("tonino-owner-last-switch-reason", reason || "auto");
      window.dispatchEvent(new CustomEvent("tonino-owner-link-changed"));
    } catch (e) { return false; }
    return true;
  }

  function smartConnectOnBoot() {
    var mode = getStored(KEYS.linkMode);
    if (mode === "wifi" || mode === "lan") {
      if (window.__zekiqRepairOwnerWifi) window.__zekiqRepairOwnerWifi();
      if (window.__zekiqPersistOwnerLan && profileLanFromStorage()) {
        window.__zekiqPersistOwnerLan(profileLanFromStorage());
      }
      return Promise.resolve(false);
    }

    var api = trimUrl(getStored(KEYS.workingApi) || getStored(KEYS.server));
    var tunnel = trimUrl(getStored(KEYS.remoteBase));
    if (!api || !isPrivateLanUrl(api)) return Promise.resolve(false);
    if (!tunnel) return Promise.resolve(false);

    return getNetworkType().then(function (net) {
      if (net === "cellular" || net === "none") {
        return switchToTunnel(tunnel, "cellular");
      }
      return probeApi(api, 3500).then(function (ok) {
        if (ok) {
          if (window.__zekiqPersistOwnerLan) window.__zekiqPersistOwnerLan(api);
          return false;
        }
        if (net === "wifi" || net === "unknown" || net === "ethernet") {
          return false;
        }
        return switchToTunnel(tunnel, "lan-unreachable");
      });
    }).then(function (switched) {
      if (switched) {
        try { window.location.reload(); } catch (e) {}
      }
      return switched;
    });
  }

  function profileLanFromStorage() {
    try {
      var profiles = JSON.parse(getStored(KEYS.profiles) || "[]");
      var s = profiles[0] && profiles[0].server ? trimUrl(profiles[0].server) : "";
      if (s.startsWith("http://") && isPrivateLanUrl(s)) return s;
    } catch (e) {}
    var rip = getStored(KEYS.remoteForIp);
    if (rip) return "http://" + rip + ":3000";
    return "";
  }

  function watchConnectionError() {
    if (typeof MutationObserver === "undefined") return;
    var done = false;
    function tryFix() {
      if (done) return;
      var body = document.body && document.body.innerText || "";
      if (body.indexOf("تعذر الاتصال") < 0 && body.indexOf("Connection failed") < 0) return;
      var mode = getStored(KEYS.linkMode);
      var lan = profileLanFromStorage();
      var tunnel = trimUrl(getStored(KEYS.remoteBase));
      if (mode === "wifi" || mode === "lan") {
        if (lan && window.__zekiqPersistOwnerLan) {
          window.__zekiqPersistOwnerLan(lan);
          done = true;
          setTimeout(function () { try { window.location.reload(); } catch (e) {} }, 400);
        }
        return;
      }
      if (!tunnel) {
        renderPanel();
        return;
      }
      done = true;
      if (switchToTunnel(tunnel, "error-screen")) {
        setTimeout(function () { try { window.location.reload(); } catch (e) {} }, 400);
      }
    }
    new MutationObserver(tryFix).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    setInterval(tryFix, 3000);
  }

  function boot() {
    ensureStandalone();
    unlockNetwork();
    smartConnectOnBoot().then(function () {
      if (!hasUserConfig()) {
        fetchConfig().then(function (cfg) {
          if (cfg.tunnelUrl || cfg.lanUrl) {
            saveDualConfig("remote", cfg.tunnelUrl || "", cfg.lanUrl || "");
          }
        });
      }
      if (document.querySelector(".owner-login-compact")) {
        renderPanel();
        renderConnBanner();
      }
    });
    watchConnectionError();
  }

  function syncLoginPanel() {
    var panel = document.getElementById("zekiq-owner-dual-settings");
    var banner = document.getElementById("zekiq-owner-conn-banner");
    var onLogin = !!document.querySelector(".owner-login-compact");
    var inApp = !!document.querySelector(".owner-app-layout");
    if (panel) panel.style.display = onLogin && !inApp ? "block" : "none";
    if (banner) banner.style.display = onLogin && !inApp ? "block" : "none";
  }

  setInterval(syncLoginPanel, 1500);
  syncLoginPanel();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
