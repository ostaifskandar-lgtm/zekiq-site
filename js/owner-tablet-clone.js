(function () {
  "use strict";

  if (typeof window === "undefined") return;

  var LOCK_KEY = "tonino-owner-lan-lock";
  var CLONE_KEY = "tonino-owner-tablet-clone";
  var CONFIG_URLS = [
    "https://ostaifskandar-lgtm.github.io/zekiq-site/owner-config.json",
    "https://cdn.jsdelivr.net/gh/ostaifskandar-lgtm/zekiq-site@main/owner-config.json"
  ];

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

  function lsSet(k, v) {
    try { localStorage.setItem(k, String(v).trim()); } catch (e) {}
  }

  function applyLanProfile(cfg) {
    cfg = cfg || {};
    var lan = trimUrl(cfg.lanUrl || ("http://" + (cfg.lanHost || "192.168.1.25") + ":" + (cfg.lanPort || "3000")));
    var tunnel = trimUrl(cfg.tunnelUrl || "https://tonino.zekiqmenu.com");
    var host = "";
    try { host = new URL(lan).hostname; } catch (e) {}

    lsSet(LOCK_KEY, "1");
    lsSet(CLONE_KEY, "1");
    lsSet("tonino-owner-link-mode", "wifi");
    lsSet("tonino-owner-working-via", "lan");
    lsSet("tonino-owner-manual-target", "1");
    lsSet("tonino-owner-server", lan);
    lsSet("tonino-owner-working-api", lan);
    lsSet("tonino-owner-active-api", lan);
    if (tunnel.startsWith("https://")) lsSet("tonino-owner-remote-base", tunnel);
    if (host) lsSet("tonino-owner-remote-for-ip", host);
    if (cfg.shopName) lsSet("tonino-owner-shop-name", cfg.shopName);

    lsSet("tonino-owner-server-profiles", JSON.stringify([{
      id: "cashier",
      label: cfg.shopName || "Tonino",
      server: lan,
      savedAt: Date.now()
    }]));

    try {
      localStorage.removeItem("tonino-owner-network-locked");
      localStorage.removeItem("tonino-owner-locked-host");
      localStorage.removeItem("tonino-owner-remote-shell");
      var prevApi = (localStorage.getItem("tonino-owner-working-api") || "").trim();
      if (prevApi.startsWith("https://")) {
        localStorage.removeItem("tonino-owner-session-token");
      }
      localStorage.setItem("tonino-owner-native-apk", "1");
      localStorage.setItem("tonino-owner-standalone-v1", "1");
      localStorage.setItem("zekiq-manager-native", "1");
    } catch (e) {}

    window.dispatchEvent(new CustomEvent("tonino-owner-link-changed"));
    return lan;
  }

  function fetchConfig() {
    var i = 0;
    function next() {
      if (i >= CONFIG_URLS.length) return Promise.resolve(null);
      return fetch(CONFIG_URLS[i++] + "?_=" + Date.now(), { cache: "no-store" })
        .then(function (r) { return r.ok ? r.json() : next(); })
        .catch(next);
    }
    return next();
  }

  var TONINO_DEFAULT = {
    shopName: "Tonino",
    lanHost: "192.168.1.25",
    lanPort: "3000",
    lanUrl: "http://192.168.1.25:3000",
    tunnelUrl: "https://tonino.zekiqmenu.com"
  };

  function boot() {
    var locked = false;
    try {
      locked = localStorage.getItem(LOCK_KEY) === "1" || localStorage.getItem(CLONE_KEY) === "1";
    } catch (e) {}

    if (locked) {
      if (window.__zekiqPersistOwnerLan && window.__zekiqRepairOwnerWifi) {
        window.__zekiqRepairOwnerWifi();
        var lan = localStorage.getItem("tonino-owner-server");
        if (lan && lan.indexOf("192.168.") >= 0) window.__zekiqPersistOwnerLan(lan);
      }
      return;
    }

    applyLanProfile(TONINO_DEFAULT);

    fetchConfig().then(function (cfg) {
      if (cfg && cfg.lanUrl) applyLanProfile(cfg);
    });
  }

  window.__zekiqApplyTabletLanProfile = applyLanProfile;
  window.__zekiqIsLanLocked = function () {
    try {
      return localStorage.getItem(LOCK_KEY) === "1" || localStorage.getItem(CLONE_KEY) === "1";
    } catch (e) { return false; }
  };

  boot();
  setInterval(function () {
    if (!window.__zekiqIsLanLocked || !window.__zekiqIsLanLocked()) return;
    if (window.__zekiqRepairOwnerWifi) window.__zekiqRepairOwnerWifi();
    if (window.__zekiqPersistOwnerLan) {
      var lan = localStorage.getItem("tonino-owner-server");
      if (lan && /^http:\/\/192\.168\./.test(lan)) window.__zekiqPersistOwnerLan(lan);
    }
  }, 8000);
})();
