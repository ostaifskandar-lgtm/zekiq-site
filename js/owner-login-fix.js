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

  function trimUrl(u) {
    return String(u || "").trim().replace(/\/+$/, "");
  }

  function lsGet(k) {
    try { return localStorage.getItem(k) || ""; } catch (e) { return ""; }
  }

  function isPrivateLanUrl(u) {
    try {
      var h = new URL(u).hostname;
      return /^(192\.168\.|10\.|127\.|localhost$|172\.(1[6-9]|2\d|3[01])\.)/.test(h);
    } catch (e) { return false; }
  }

  function getTunnelUrl() {
    var order = ["tonino-owner-remote-base", "tonino-owner-working-api", "tonino-owner-active-api", "tonino-owner-server"];
    for (var i = 0; i < order.length; i++) {
      var v = trimUrl(lsGet(order[i]));
      if (v.startsWith("https://")) return v;
    }
    return "";
  }

  function shouldRewriteToTunnel() {
    var mode = lsGet("tonino-owner-link-mode");
    if (mode === "wifi" || mode === "lan") return false;
    return mode === "remote" || lsGet("tonino-owner-manual-target") === "1";
  }

  function rewriteApiUrl(url) {
    var u = String(url || "");
    if (!u.startsWith("http")) return u;
    if (!shouldRewriteToTunnel()) return u;
    if (u.indexOf("/api/owner/login") < 0 &&
        u.indexOf("/api/owner/config") < 0 &&
        u.indexOf("/api/trpc/") < 0 &&
        u.indexOf("/api/health") < 0) {
      return u;
    }
    if (!isPrivateLanUrl(u)) return u;
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

  function patchFetch() {
    if (window.__zekiqLoginFetchPatched) return;
    window.__zekiqLoginFetchPatched = true;
    var orig = window.fetch.bind(window);
    window.fetch = function (input, init) {
      var url = typeof input === "string" ? input : (input && input.url) || "";
      var fixed = rewriteApiUrl(url);
      if (fixed !== url) {
        if (typeof input === "string") input = fixed;
        else input = new Request(fixed, input);
      }
      return orig(input, init).then(function (res) {
        if (String(url).indexOf("/api/owner/login") >= 0 && res && res.ok) {
          res.clone().json().then(function (j) {
            if (j && j.sessionToken) {
              try { localStorage.setItem("tonino-owner-session-token", j.sessionToken); } catch (e) {}
            }
          }).catch(function () {});
        }
        return res;
      });
    };
  }

  function patchXhr() {
    if (window.__zekiqLoginXhrPatched || !window.XMLHttpRequest) return;
    window.__zekiqLoginXhrPatched = true;
    var Orig = window.XMLHttpRequest;
    window.XMLHttpRequest = function () {
      var xhr = new Orig();
      var _method = "GET";
      xhr.open = (function (open) {
        return function (method, url) {
          _method = method;
          url = rewriteApiUrl(String(url || ""));
          return open.call(xhr, _method, url);
        };
      })(xhr.open);
      return xhr;
    };
  }

  patchFetch();
  patchXhr();
  if (window.__zekiqRepairOwnerWifi) window.__zekiqRepairOwnerWifi();
})();
