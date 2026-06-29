(function () {
  "use strict";

  if (typeof window === "undefined") return;

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

  var KEYS = {
    server: "tonino-owner-server",
    workingApi: "tonino-owner-working-api",
    activeApi: "tonino-owner-active-api",
    remoteBase: "tonino-owner-remote-base",
    linkMode: "tonino-owner-link-mode",
    workingVia: "tonino-owner-working-via"
  };

  function trimUrl(u) {
    return String(u || "").trim().replace(/\/+$/, "");
  }

  function lsGet(k) {
    try { return localStorage.getItem(k) || ""; } catch (e) { return ""; }
  }

  function lsSet(k, v) {
    try { localStorage.setItem(k, String(v).trim()); } catch (e) {}
  }

  function isPrivateLanUrl(u) {
    try {
      var h = new URL(u).hostname;
      return /^(192\.168\.|10\.|127\.|localhost$|172\.(1[6-9]|2\d|3[01])\.)/.test(h);
    } catch (e) { return false; }
  }

  function getTunnelUrl() {
    if (window.__zekiqGetOwnerTunnelUrl) return window.__zekiqGetOwnerTunnelUrl();
    var order = [KEYS.remoteBase, KEYS.workingApi, KEYS.activeApi, KEYS.server];
    for (var i = 0; i < order.length; i++) {
      var v = trimUrl(lsGet(order[i]));
      if (v.startsWith("https://")) return v;
    }
    return "";
  }

  function rewriteApiUrl(url) {
    var u = String(url || "");
    if (!u.startsWith("http") || !isPrivateLanUrl(u)) return u;
    var tunnel = getTunnelUrl();
    if (!tunnel.startsWith("https://")) return u;
    try {
      var parsed = new URL(u);
      var t = new URL(tunnel);
      parsed.protocol = t.protocol;
      parsed.hostname = t.hostname;
      parsed.port = t.port;
      return parsed.toString();
    } catch (e) {
      return u;
    }
  }

  function forceRemoteMode() {
    var tunnel = getTunnelUrl();
    if (!tunnel.startsWith("https://")) return;
    var server = trimUrl(lsGet(KEYS.server));
    var mode = lsGet(KEYS.linkMode);
    if (isPrivateLanUrl(server) || mode !== "remote") {
      lsSet(KEYS.server, tunnel);
      lsSet(KEYS.workingApi, tunnel);
      lsSet(KEYS.activeApi, tunnel);
      lsSet(KEYS.remoteBase, tunnel);
      lsSet(KEYS.linkMode, "remote");
      lsSet(KEYS.workingVia, "remote");
    }
    if (window.__zekiqRepairOwnerStorageIfNeeded) {
      window.__zekiqRepairOwnerStorageIfNeeded();
    }
  }

  function patchFetch() {
    if (window.__zekiqRuntimeFetchPatched) return;
    window.__zekiqRuntimeFetchPatched = true;
    var orig = window.fetch.bind(window);
    window.fetch = function (input, init) {
      forceRemoteMode();
      var url = typeof input === "string" ? input : (input && input.url) || "";
      var fixed = rewriteApiUrl(url);
      if (fixed !== url) {
        if (typeof input === "string") input = fixed;
        else input = new Request(fixed, input);
      }
      return orig(input, init);
    };
  }

  function patchXhr() {
    if (window.__zekiqRuntimeXhrPatched || !window.XMLHttpRequest) return;
    window.__zekiqRuntimeXhrPatched = true;
    var Orig = window.XMLHttpRequest;
    window.XMLHttpRequest = function () {
      var xhr = new Orig();
      var _method = "GET";
      xhr.open = (function (open) {
        return function (method, url) {
          _method = method;
          forceRemoteMode();
          url = rewriteApiUrl(String(url || ""));
          return open.call(xhr, _method, url);
        };
      })(xhr.open);
      return xhr;
    };
  }

  function fixMonitorErrorScreen() {
    var body = document.body && document.body.innerText || "";
    if (body.indexOf("تعذ") < 0 && body.indexOf("192.168.") < 0) return;
    if (body.indexOf("إعادة ربط") < 0 && body.indexOf("portalReconnect") < 0 &&
        body.indexOf("اختبار الاتصال") < 0) return;
    var tunnel = getTunnelUrl();
    if (!tunnel.startsWith("https://")) return;
    forceRemoteMode();
    if (window.__zekiqApplyRemoteOwnerStorage) {
      fetch(tunnel + "/api/owner/config", { cache: "no-store" })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (cfg) {
          if (!cfg || !cfg.ip) return;
          var lan = "http://" + cfg.ip.trim() + ":" + (cfg.port || 3000);
          window.__zekiqApplyRemoteOwnerStorage(tunnel, lan, cfg.shopName);
          setTimeout(function () {
            try { window.location.reload(); } catch (e) {}
          }, 400);
        })
        .catch(function () {});
    }
  }

  patchFetch();
  patchXhr();
  forceRemoteMode();
  setInterval(forceRemoteMode, 600);
  setInterval(fixMonitorErrorScreen, 1500);
})();
