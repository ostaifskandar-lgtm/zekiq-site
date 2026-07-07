(function () {
  "use strict";
  if (window.__ZEKIQ_REMOTE_BOOT__) return;
  window.__ZEKIQ_REMOTE_BOOT__ = true;

  var CDN = "https://cdn.jsdelivr.net/gh/ostaifskandar-lgtm/zekiq-site@main/js/";
  var SCRIPTS = [
    "owner-update-guard.js",
    "owner-lan-defaults.js",
    "owner-api-lan-force.js",
    "owner-tablet-clone.js",
    "owner-login-fix.js",
    "owner-connection-flex.js",
    "owner-bootstrap.js",
    "owner-tables-pro.js"
  ];
  var i = 0;

  function next() {
    if (i >= SCRIPTS.length) return;
    var s = document.createElement("script");
    s.src = CDN + SCRIPTS[i] + "?v=225";
    s.async = false;
    s.onload = s.onerror = function () {
      i += 1;
      next();
    };
    (document.head || document.documentElement).appendChild(s);
  }

  window.__ZEKIQ_OWNER_EXT_VERSION__ = "2.2.4";

  var LAN = (window.__zekiqToninoLan && window.__zekiqToninoLan()) || "http://192.168.1.25:3000";
  var TUNNEL = window.__ZEKIQ_TONINO_TUNNEL__ || "https://tonino.zekiqmenu.com";
  var LAN_HOST = window.__ZEKIQ_TONINO_LAN_HOST__ || "192.168.1.25";

  function applyToninoTabletNow() {
    try {
      localStorage.setItem("tonino-owner-native-apk", "1");
      localStorage.setItem("zekiq-manager-native", "1");
      localStorage.setItem("tonino-owner-lan-lock", "1");
      localStorage.setItem("tonino-owner-tablet-clone", "1");
      localStorage.setItem("tonino-owner-link-mode", "wifi");
      localStorage.setItem("tonino-owner-working-via", "lan");
      localStorage.setItem("tonino-owner-manual-target", "1");
      localStorage.setItem("tonino-owner-server", LAN);
      localStorage.setItem("tonino-owner-working-api", LAN);
      localStorage.setItem("tonino-owner-active-api", LAN);
      localStorage.setItem("tonino-owner-remote-base", TUNNEL);
      localStorage.setItem("tonino-owner-remote-for-ip", LAN_HOST);
      localStorage.setItem("tonino-owner-shop-name", "Tonino");
      var prev = (localStorage.getItem("tonino-owner-working-api") || "").trim();
      if (prev.startsWith("https://")) {
        localStorage.removeItem("tonino-owner-session-token");
      }
      localStorage.setItem("tonino-owner-server-profiles", JSON.stringify([{
        id: "cashier", label: "Tonino", server: LAN, savedAt: Date.now()
      }]));
      localStorage.removeItem("tonino-owner-network-locked");
      localStorage.removeItem("tonino-owner-locked-host");
      localStorage.removeItem("tonino-owner-remote-shell");
    } catch (e) {}
  }

  applyToninoTabletNow();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", next);
  } else {
    next();
  }
})();
