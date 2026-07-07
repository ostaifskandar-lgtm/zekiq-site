(function () {
  "use strict";

  if (typeof window === "undefined") return;

  var LAN = "http://192.168.1.25:3000";

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

  function lsGet(k) {
    try { return localStorage.getItem(k) || ""; } catch (e) { return ""; }
  }

  function isLanLocked() {
    return lsGet("tonino-owner-lan-lock") === "1" || lsGet("tonino-owner-tablet-clone") === "1";
  }

  function isPrivateLanUrl(u) {
    try {
      var h = new URL(u).hostname;
      return /^(192\.168\.|10\.|127\.|localhost$|172\.(1[6-9]|2\d|3[01])\.)/.test(h);
    } catch (e) { return false; }
  }

  function resolveLan() {
    var order = [
      "tonino-owner-working-api",
      "tonino-owner-active-api",
      "tonino-owner-server"
    ];
    for (var i = 0; i < order.length; i++) {
      var v = trimUrl(lsGet(order[i]));
      if (v.startsWith("http://") && isPrivateLanUrl(v)) return v;
    }
    try {
      var profiles = JSON.parse(lsGet("tonino-owner-server-profiles") || "[]");
      var s = profiles[0] && profiles[0].server ? trimUrl(profiles[0].server) : "";
      if (s.startsWith("http://") && isPrivateLanUrl(s)) return s;
    } catch (e) {}
    var rip = lsGet("tonino-owner-remote-for-ip");
    if (rip) return "http://" + rip + ":3000";
    return LAN;
  }

  function isApiUrl(u) {
    return u.indexOf("/api/") >= 0;
  }

  function rewriteToLan(url) {
    var u = String(url || "");
    if (!u.startsWith("http") || !isApiUrl(u)) return u;
    if (!isLanLocked()) return u;
    var lan = resolveLan();
    if (!lan.startsWith("http://")) return u;
    try {
      var parsed = new URL(u);
      var base = new URL(lan);
      if (parsed.hostname === base.hostname && parsed.port === base.port) return u;
      parsed.protocol = base.protocol;
      parsed.hostname = base.hostname;
      parsed.port = base.port;
      return parsed.toString();
    } catch (e) {
      return u;
    }
  }

  function syncAllKeysToLan() {
    if (!isLanLocked()) return;
    var lan = resolveLan();
    if (!lan.startsWith("http://")) return;
    var prev = trimUrl(lsGet("tonino-owner-working-api"));
    try {
      localStorage.setItem("tonino-owner-server", lan);
      localStorage.setItem("tonino-owner-working-api", lan);
      localStorage.setItem("tonino-owner-active-api", lan);
      localStorage.setItem("tonino-owner-link-mode", "wifi");
      localStorage.setItem("tonino-owner-working-via", "lan");
      if (prev.startsWith("https://")) {
        localStorage.removeItem("tonino-owner-session-token");
      }
    } catch (e) {}
  }

  function patchFetch() {
    if (window.__zekiqLanForceFetch) return;
    window.__zekiqLanForceFetch = true;
    var orig = window.fetch.bind(window);
    window.fetch = function (input, init) {
      syncAllKeysToLan();
      var url = typeof input === "string" ? input : (input && input.url) || "";
      var fixed = rewriteToLan(url);
      if (fixed !== url) {
        if (typeof input === "string") input = fixed;
        else input = new Request(fixed, input);
      }
      return orig(input, init);
    };
  }

  function patchXhr() {
    if (window.__zekiqLanForceXhr || !window.XMLHttpRequest) return;
    window.__zekiqLanForceXhr = true;
    var Orig = window.XMLHttpRequest;
    window.XMLHttpRequest = function () {
      var xhr = new Orig();
      xhr.open = (function (open) {
        return function () {
          syncAllKeysToLan();
          var args = Array.prototype.slice.call(arguments);
          if (args.length > 1) args[1] = rewriteToLan(String(args[1] || ""));
          return open.apply(xhr, args);
        };
      })(xhr.open);
      return xhr;
    };
  }

  window.__zekiqResolveOwnerLan = resolveLan;
  window.__zekiqIsLanLocked = function () { return isLanLocked(); };

  syncAllKeysToLan();
  patchFetch();
  patchXhr();
  setInterval(syncAllKeysToLan, 3000);
})();
