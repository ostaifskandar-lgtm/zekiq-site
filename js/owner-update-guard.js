(function () {
  "use strict";

  if (typeof window === "undefined") return;

  var EXT_VERSION = window.__ZEKIQ_OWNER_EXT_VERSION__ || "1.0.52";
  var EXT_BUILD = parseInt(String(EXT_VERSION).split(".").pop(), 10) || 52;
  var DISMISS_KEY = "tonino-owner-update-dismissed";
  var UI_BUILD_KEY = "tonino-owner-ui-build";
  var BUNDLED_BUILD_KEY = "tonino-owner-bundled-ui-build";
  var APK_KEY = "apk:" + EXT_BUILD;

  function isOwnerApp() {
    try {
      if (window.__TONINO_APP_TARGET__ === "owner") return true;
      if (localStorage.getItem("tonino-owner-native-apk") === "1") return true;
      if (window.Capacitor && window.Capacitor.config && window.Capacitor.config.appId === "com.tonino.owner") return true;
    } catch (e) {}
    return false;
  }

  if (!isOwnerApp()) return;

  window.__ZEKIQ_NO_INAPP_UPDATE__ = true;

  function lsSet(k, v) {
    try { localStorage.setItem(k, v); } catch (e) {}
  }

  function syncUiBuild(v) {
    if (!v) return;
    lsSet(UI_BUILD_KEY, v);
    lsSet(BUNDLED_BUILD_KEY, v);
    try { window.__TONINO_OWNER_UI_BUILD__ = v; } catch (e) {}
  }

  function markUpToDate() {
    lsSet(DISMISS_KEY, APK_KEY);
    lsSet("tonino-owner-update-dismissed-at", String(Date.now()));
    lsSet(UI_BUILD_KEY + ":dismiss", "ui:" + EXT_BUILD);
  }

  function patchConfigJson(j) {
    if (!j || typeof j !== "object") return j;
    if (j.apk && typeof j.apk === "object") {
      j.apk.versionCode = EXT_BUILD;
      j.apk.versionName = EXT_VERSION;
      j.apk.available = false;
    }
    if (j.buildVersion) syncUiBuild(String(j.buildVersion).trim());
    return j;
  }

  function ownerDlPayload() {
    return {
      fileName: "ToninoOwner.apk",
      versionCode: EXT_BUILD,
      versionName: EXT_VERSION,
      setupUrl: "https://ostaifskandar-lgtm.github.io/zekiq-site/downloads/ToninoOwner.apk?v=" + EXT_BUILD,
      updatedAt: new Date().toISOString()
    };
  }

  function patchAppGetInfo() {
    try {
      var cap = window.Capacitor;
      var app = cap && cap.Plugins && cap.Plugins.App;
      if (!app || app.__zekiqPatched) return;
      var orig = app.getInfo && app.getInfo.bind(app);
      if (!orig) {
        app.getInfo = function () {
          return Promise.resolve({ build: String(EXT_BUILD), version: EXT_VERSION, name: "Owner", id: "com.tonino.owner" });
        };
      } else {
        app.getInfo = function () {
          return Promise.resolve(orig()).then(function (info) {
            info = info || {};
            info.build = String(EXT_BUILD);
            info.version = EXT_VERSION;
            return info;
          });
        };
      }
      app.__zekiqPatched = true;
    } catch (e) {}
  }

  function injectNoUpdateCss() {
    if (document.getElementById("zekiq-no-update-css")) return;
    var s = document.createElement("style");
    s.id = "zekiq-no-update-css";
    s.textContent =
      ".owner-update-sheet,.owner-update-sheet-backdrop,.owner-update-badge," +
      "[class*='owner-update-sheet'],.owner-update-banner{display:none!important;visibility:hidden!important;" +
      "pointer-events:none!important;height:0!important;overflow:hidden!important}";
    (document.head || document.documentElement).appendChild(s);
  }

  function hideUpdateUi() {
    injectNoUpdateCss();
    document.querySelectorAll(
      ".owner-update-sheet,.owner-update-sheet-backdrop,.owner-update-badge,.owner-update-banner"
    ).forEach(function (el) {
      el.style.display = "none";
      el.style.visibility = "hidden";
      el.setAttribute("aria-hidden", "true");
    });
  }

  function removeUpdateModal() {
    hideUpdateUi();
    document.querySelectorAll(
      ".owner-update-sheet,.owner-update-sheet-backdrop,.owner-update-badge,.owner-update-banner,[class*='owner-update']"
    ).forEach(function (el) { el.remove(); });
    document.querySelectorAll("div, section, aside, dialog").forEach(function (el) {
      var t = (el.textContent || "").trim();
      if (t.indexOf("تثبيت التحديث") >= 0 || (t.indexOf("تحديث تطبيق المالك") >= 0 && t.indexOf("لاحق") >= 0)) {
        el.remove();
      }
    });
  }

  function patchXhr() {
    if (window.__zekiqXhrPatched || !window.XMLHttpRequest) return;
    window.__zekiqXhrPatched = true;
    var Orig = window.XMLHttpRequest;
    window.XMLHttpRequest = function () {
      var xhr = new Orig();
      var _url = "";
      var origOpen = xhr.open;
      xhr.open = function (method, url) {
        _url = String(url || "");
        return origOpen.apply(xhr, arguments);
      };
      var origSend = xhr.send;
      xhr.send = function () {
        if (_url.indexOf("owner-dl.json") >= 0) {
          markUpToDate();
          setTimeout(function () {
            Object.defineProperty(xhr, "readyState", { configurable: true, get: function () { return 4; } });
            Object.defineProperty(xhr, "status", { configurable: true, get: function () { return 200; } });
            Object.defineProperty(xhr, "responseText", { configurable: true, get: function () { return JSON.stringify(ownerDlPayload()); } });
            if (xhr.onreadystatechange) xhr.onreadystatechange();
            if (xhr.onload) xhr.onload();
          }, 0);
          return;
        }
        if (_url.indexOf("/api/owner/config") >= 0) {
          origSend.apply(xhr, arguments);
          xhr.addEventListener("load", function () {
            try {
              var j = JSON.parse(xhr.responseText);
              patchConfigJson(j);
              markUpToDate();
              Object.defineProperty(xhr, "responseText", { configurable: true, get: function () { return JSON.stringify(j); } });
            } catch (e) {}
          });
          return;
        }
        return origSend.apply(xhr, arguments);
      };
      return xhr;
    };
  }

  function patchFetch() {
    if (window.__zekiqFetchPatched) return;
    window.__zekiqFetchPatched = true;
    var orig = window.fetch.bind(window);
    window.fetch = function (input, init) {
      var url = typeof input === "string" ? input : (input && input.url) || "";
      if (url.indexOf("owner-dl.json") >= 0) {
        markUpToDate();
        return Promise.resolve(new Response(JSON.stringify(ownerDlPayload()), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }));
      }
      return orig(input, init).then(function (res) {
        if (url.indexOf("/api/owner/config") < 0) return res;
        return res.clone().json().then(function (j) {
          patchConfigJson(j);
          markUpToDate();
          return new Response(JSON.stringify(j), {
            status: res.status,
            headers: { "Content-Type": "application/json" }
          });
        }).catch(function () { return res; });
      });
    };
  }

  function boot() {
    patchFetch();
    patchXhr();
    patchAppGetInfo();
    markUpToDate();
    removeUpdateModal();
    injectNoUpdateCss();
  }

  boot();
  setInterval(function () {
    patchAppGetInfo();
    markUpToDate();
    removeUpdateModal();
  }, 800);

  if (typeof MutationObserver !== "undefined") {
    new MutationObserver(removeUpdateModal).observe(document.documentElement, { childList: true, subtree: true });
  }
})();
