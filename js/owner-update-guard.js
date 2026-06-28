(function () {
  "use strict";

  if (typeof window === "undefined") return;

  var EXT_VERSION = window.__ZEKIQ_OWNER_EXT_VERSION__ || "1.0.42";
  var EXT_BUILD = parseInt(String(EXT_VERSION).split(".").pop(), 10) || 42;
  var DISMISS_KEY = "tonino-owner-update-dismissed";
  var UI_BUILD_KEY = "tonino-owner-ui-build";
  var BUNDLED_BUILD_KEY = "tonino-owner-bundled-ui-build";

  function isOwnerApp() {
    try {
      if (window.__TONINO_APP_TARGET__ === "owner") return true;
      if (localStorage.getItem("tonino-owner-native-apk") === "1") return true;
      if (window.Capacitor && window.Capacitor.config && window.Capacitor.config.appId === "com.tonino.owner") return true;
    } catch (e) {}
    return false;
  }

  if (!isOwnerApp()) return;

  function syncUiBuild(buildVersion) {
    if (!buildVersion) return;
    try {
      localStorage.setItem(UI_BUILD_KEY, buildVersion);
      localStorage.setItem(BUNDLED_BUILD_KEY, buildVersion);
    } catch (e) {}
    try {
      window.__TONINO_OWNER_UI_BUILD__ = buildVersion;
    } catch (e) {}
  }

  function dismissUpdateKeys() {
    try {
      localStorage.setItem(DISMISS_KEY, "apk:" + EXT_BUILD);
      localStorage.setItem(UI_BUILD_KEY + ":dismiss", "ui:synced-" + EXT_BUILD);
    } catch (e) {}
  }

  function patchAppGetInfo() {
    try {
      var cap = window.Capacitor;
      var app = cap && cap.Plugins && cap.Plugins.App;
      if (!app || app.__zekiqPatched) return;
      var orig = app.getInfo && app.getInfo.bind(app);
      if (!orig) return;
      app.getInfo = function () {
        return Promise.resolve(orig()).then(function (info) {
          info = info || {};
          info.build = String(EXT_BUILD);
          info.version = EXT_VERSION;
          return info;
        });
      };
      app.__zekiqPatched = true;
    } catch (e) {}
  }

  function hideUpdateSheet() {
    document.querySelectorAll(".owner-update-sheet-backdrop, .owner-update-sheet").forEach(function (el) {
      el.style.display = "none";
    });
    document.querySelectorAll(".owner-update-badge").forEach(function (el) {
      el.style.display = "none";
    });
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

  function syncFromServer() {
    fetch(baseUrl() + "/api/owner/config", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (cfg) {
        if (!cfg) return;
        if (cfg.buildVersion) syncUiBuild(String(cfg.buildVersion).trim());
        dismissUpdateKeys();
        hideUpdateSheet();
      })
      .catch(function () {});
  }

  patchAppGetInfo();
  dismissUpdateKeys();
  syncFromServer();
  setInterval(function () {
    patchAppGetInfo();
    dismissUpdateKeys();
  }, 5000);
  setInterval(hideUpdateSheet, 2000);
})();
