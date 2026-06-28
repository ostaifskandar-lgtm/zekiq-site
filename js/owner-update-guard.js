(function () {
  "use strict";

  if (typeof window === "undefined") return;

  var EXT_VERSION = window.__ZEKIQ_OWNER_EXT_VERSION__ || "1.0.53";
  var EXT_BUILD = parseInt(String(EXT_VERSION).split(".").pop(), 10) || 53;
  var NATIVE_BUILD = 99999;
  var DISMISS_KEY = "tonino-owner-update-dismissed";
  var UI_BUILD_KEY = "tonino-owner-ui-build";
  var BUNDLED_BUILD_KEY = "tonino-owner-bundled-ui-build";
  var BLOCK_UPDATES_KEY = "tonino-owner-updates-blocked";

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
  window.__TONINO_OWNER_UI_BUILD__ = "blocked-" + EXT_BUILD;

  function lsSet(k, v) {
    try { localStorage.setItem(k, v); } catch (e) {}
  }

  function blockUpdatesPermanently() {
    lsSet(BLOCK_UPDATES_KEY, "1");
    lsSet(DISMISS_KEY, "apk:" + NATIVE_BUILD);
    lsSet(DISMISS_KEY + "-at", String(Date.now()));
    lsSet(UI_BUILD_KEY, "blocked-" + EXT_BUILD);
    lsSet(BUNDLED_BUILD_KEY, "blocked-" + EXT_BUILD);
    lsSet(UI_BUILD_KEY + ":dismiss", "ui:blocked-" + EXT_BUILD);
    ["apk:30", "apk:36", "apk:41", "apk:45", "apk:50", "apk:51", "apk:52", "apk:53"].forEach(function (k) {
      lsSet(DISMISS_KEY, k);
    });
  }

  function patchConfigJson(j) {
    if (!j || typeof j !== "object") return j;
    if (j.apk && typeof j.apk === "object") {
      j.apk.versionCode = NATIVE_BUILD;
      j.apk.versionName = EXT_VERSION;
      j.apk.available = false;
      j.apk.downloadPath = "";
    }
    if (j.buildVersion) j.buildVersion = "blocked-" + EXT_BUILD;
    return j;
  }

  function ownerDlPayload() {
    return {
      fileName: "ToninoOwner.apk",
      versionCode: NATIVE_BUILD,
      versionName: EXT_VERSION,
      setupUrl: "https://ostaifskandar-lgtm.github.io/zekiq-site/downloads/ToninoOwner.apk?v=" + EXT_BUILD,
      updatedAt: new Date().toISOString()
    };
  }

  function patchAppGetInfo() {
    try {
      var cap = window.Capacitor;
      var app = cap && cap.Plugins && cap.Plugins.App;
      if (app && !app.__zekiqPatched) {
        app.getInfo = function () {
          return Promise.resolve({
            build: String(NATIVE_BUILD),
            version: EXT_VERSION,
            name: "Owner",
            id: "com.tonino.owner"
          });
        };
        app.__zekiqPatched = true;
      }
      var updater = cap && cap.Plugins && cap.Plugins.ToninoUpdater;
      if (updater && !updater.__zekiqBlocked) {
        if (updater.installApk) updater.installApk = function () { return Promise.resolve(false); };
        updater.__zekiqBlocked = true;
      }
    } catch (e) {}
  }

  function injectNoUpdateCss() {
    if (document.getElementById("zekiq-no-update-css")) return;
    var s = document.createElement("style");
    s.id = "zekiq-no-update-css";
    s.textContent =
      ".owner-update-sheet,.owner-update-sheet-backdrop,.owner-update-badge,.owner-update-banner," +
      ".owner-update-bar,.owner-update-bar-btn,[class*='owner-update']{" +
      "display:none!important;visibility:hidden!important;opacity:0!important;" +
      "pointer-events:none!important;height:0!important;overflow:hidden!important;" +
      "position:fixed!important;left:-99999px!important;top:-99999px!important}";
    (document.head || document.documentElement).appendChild(s);
  }

  function looksLikeUpdateNode(el) {
    if (!el || el.nodeType !== 1) return false;
    var cls = (el.className && String(el.className)) || "";
    if (/owner-update|update-sheet|update-bar/i.test(cls)) return true;
    var t = (el.textContent || "").trim();
    if (t.length > 400) return false;
    return t.indexOf("تثبيت التحديث") >= 0 ||
      (t.indexOf("تحديث تطبيق المالك") >= 0 && t.indexOf("لاحق") >= 0);
  }

  function removeUpdateModal() {
    injectNoUpdateCss();
    document.querySelectorAll(
      ".owner-update-sheet,.owner-update-sheet-backdrop,.owner-update-badge,.owner-update-banner," +
      ".owner-update-bar,.owner-update-bar-btn,[class*='owner-update']"
    ).forEach(function (el) { el.remove(); });
    document.querySelectorAll("div, section, aside, dialog, button").forEach(function (el) {
      if (looksLikeUpdateNode(el)) el.remove();
    });
  }

  function patchFetch() {
    if (window.__zekiqFetchPatched) return;
    window.__zekiqFetchPatched = true;
    var orig = window.fetch.bind(window);
    window.fetch = function (input, init) {
      var url = typeof input === "string" ? input : (input && input.url) || "";
      if (url.indexOf("owner-dl.json") >= 0) {
        blockUpdatesPermanently();
        return Promise.resolve(new Response(JSON.stringify(ownerDlPayload()), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }));
      }
      return orig(input, init).then(function (res) {
        if (url.indexOf("/api/owner/config") < 0 && url.indexOf("/api/garson/apk-version") < 0) return res;
        return res.clone().json().then(function (j) {
          patchConfigJson(j);
          blockUpdatesPermanently();
          return new Response(JSON.stringify(j), {
            status: res.status,
            headers: { "Content-Type": "application/json" }
          });
        }).catch(function () { return res; });
      });
    };
  }

  function patchXhr() {
    if (window.__zekiqXhrPatched || !window.XMLHttpRequest) return;
    window.__zekiqXhrPatched = true;
    var Orig = window.XMLHttpRequest;
    window.XMLHttpRequest = function () {
      var xhr = new Orig();
      var _url = "";
      xhr.open = (function (origOpen) {
        return function (method, url) {
          _url = String(url || "");
          return origOpen.apply(xhr, arguments);
        };
      })(xhr.open);
      xhr.send = (function (origSend) {
        return function () {
          if (_url.indexOf("owner-dl.json") >= 0) {
            blockUpdatesPermanently();
            setTimeout(function () {
              Object.defineProperty(xhr, "readyState", { configurable: true, get: function () { return 4; } });
              Object.defineProperty(xhr, "status", { configurable: true, get: function () { return 200; } });
              Object.defineProperty(xhr, "responseText", { configurable: true, get: function () { return JSON.stringify(ownerDlPayload()); } });
              if (xhr.onreadystatechange) xhr.onreadystatechange();
              if (xhr.onload) xhr.onload();
            }, 0);
            return;
          }
          if (_url.indexOf("/api/owner/config") >= 0 || _url.indexOf("/api/garson/apk-version") >= 0) {
            origSend.apply(xhr, arguments);
            xhr.addEventListener("load", function () {
              try {
                var j = JSON.parse(xhr.responseText);
                patchConfigJson(j);
                blockUpdatesPermanently();
                Object.defineProperty(xhr, "responseText", { configurable: true, get: function () { return JSON.stringify(j); } });
              } catch (e) {}
            });
            return;
          }
          return origSend.apply(xhr, arguments);
        };
      })(xhr.send);
      return xhr;
    };
  }

  function boot() {
    blockUpdatesPermanently();
    patchFetch();
    patchXhr();
    patchAppGetInfo();
    removeUpdateModal();
    injectNoUpdateCss();
  }

  boot();
  setInterval(function () {
    blockUpdatesPermanently();
    patchAppGetInfo();
    removeUpdateModal();
  }, 400);

  if (typeof MutationObserver !== "undefined") {
    new MutationObserver(removeUpdateModal).observe(document.documentElement, { childList: true, subtree: true });
  }
})();
