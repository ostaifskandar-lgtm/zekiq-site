(function () {
  "use strict";

  if (typeof window === "undefined") return;

  var KEYS = {
    server: "tonino-owner-server",
    workingApi: "tonino-owner-working-api",
    activeApi: "tonino-owner-active-api",
    remoteBase: "tonino-owner-remote-base",
    linkMode: "tonino-owner-link-mode",
    workingVia: "tonino-owner-working-via",
    manualTarget: "tonino-owner-manual-target",
    standalone: "tonino-owner-standalone-v1",
    nativeApk: "tonino-owner-native-apk"
  };

  function isOwnerApp() {
    try {
      if (window.__TONINO_APP_TARGET__ === "owner") return true;
      if (localStorage.getItem(KEYS.nativeApk) === "1") return true;
      if (localStorage.getItem("zekiq-manager-native") === "1") return true;
      var id = window.Capacitor && window.Capacitor.config && window.Capacitor.config.appId;
      if (id === "com.tonino.owner" || id === "com.zekiq.manager") return true;
    } catch (e) {}
    return false;
  }

  if (!isOwnerApp()) return;

  function forceTunnelOverLanNow() {
    var tunnel = trimUrl(lsGet(KEYS.remoteBase));
    if (!tunnel.startsWith("https://")) {
      var alt = trimUrl(lsGet(KEYS.workingApi));
      if (alt.startsWith("https://")) tunnel = alt;
    }
    if (!tunnel.startsWith("https://")) return false;
    var server = trimUrl(lsGet(KEYS.server));
    if (!isPrivateLanUrl(server) && server.startsWith("https://")) return false;
    persistConnection(tunnel, "remote");
    try {
      var profiles = JSON.parse(lsGet("tonino-owner-server-profiles") || "[]");
      if (profiles[0]) {
        profiles[0].server = tunnel;
        profiles[0].savedAt = Date.now();
        lsSet("tonino-owner-server-profiles", JSON.stringify(profiles));
      }
    } catch (e) {}
    return true;
  }

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

  function bestUrl() {
    var order = [KEYS.workingApi, KEYS.activeApi, KEYS.server, KEYS.remoteBase];
    var tunnel = "";
    var lan = "";
    for (var i = 0; i < order.length; i++) {
      var v = trimUrl(lsGet(order[i]));
      if (!v.startsWith("http")) continue;
      if (v.startsWith("https://") && !tunnel) tunnel = v;
      if (isPrivateLanUrl(v) && !lan) lan = v;
    }
    if (tunnel) return { url: tunnel, via: "remote" };
    if (lan) return { url: lan, via: "lan" };
    return null;
  }

  function persistConnection(url, via) {
    url = trimUrl(url);
    if (!url.startsWith("http")) return;
    lsSet(KEYS.server, url);
    lsSet(KEYS.workingApi, url);
    lsSet(KEYS.activeApi, url);
    lsSet(KEYS.linkMode, via || (url.startsWith("https://") ? "remote" : "wifi"));
    lsSet(KEYS.workingVia, via === "remote" ? "remote" : "lan");
    lsSet(KEYS.manualTarget, "1");
    lsSet(KEYS.standalone, "1");
    lsSet(KEYS.nativeApk, "1");
    lsSet("zekiq-manager-native", "1");
    if (url.startsWith("https://")) lsSet(KEYS.remoteBase, url);
    try {
      localStorage.removeItem("tonino-owner-remote-shell");
      localStorage.removeItem("tonino-owner-network-locked");
      localStorage.removeItem("tonino-owner-locked-host");
    } catch (e) {}
    window.dispatchEvent(new CustomEvent("tonino-owner-link-changed"));
  }

  function keepBundledUi() {
    try {
      localStorage.removeItem("tonino-owner-remote-shell");
      localStorage.removeItem("tonino-owner-network-locked");
      localStorage.removeItem("tonino-owner-locked-host");
      lsSet(KEYS.standalone, "1");
      lsSet(KEYS.nativeApk, "1");
      lsSet(KEYS.manualTarget, "1");
      lsSet("zekiq-manager-native", "1");
    } catch (e) {}
    var pick = bestUrl();
    if (pick) persistConnection(pick.url, pick.via);
  }

  function patchLocationReplace() {
    if (window.__zekiqOwnerNoRedirect) return;
    window.__zekiqOwnerNoRedirect = true;
    function blockRemoteNav(url) {
      try {
        var u = String(url || "");
        return u.indexOf("/owner?") >= 0 && (u.indexOf("remote=1") >= 0 || u.indexOf("shell=remote") >= 0 || u.indexOf("link=1") >= 0);
      } catch (e) { return false; }
    }
    var origReplace = window.location.replace.bind(window.location);
    window.location.replace = function (url) {
      if (blockRemoteNav(url)) return;
      return origReplace(url);
    };
    var origAssign = window.location.assign.bind(window.location);
    window.location.assign = function (url) {
      if (blockRemoteNav(url)) return;
      return origAssign(url);
    };
  }

  function probeAndFixConnection() {
    var pick = bestUrl();
    if (!pick) return;
    var api = trimUrl(lsGet(KEYS.server) || lsGet(KEYS.activeApi));
    if (isPrivateLanUrl(api) && pick.url.startsWith("https://")) {
      persistConnection(pick.url, "remote");
      return;
    }
    if (!api.startsWith("http")) {
      persistConnection(pick.url, pick.via);
    }
  }

  function hideReconnectIfOnline() {
    var body = document.body && document.body.innerText || "";
    var isError = body.indexOf("تعذ") >= 0 || body.indexOf("إعادة ربط المحل") >= 0 ||
      body.indexOf("Reconnect to shop") >= 0 || body.indexOf("Connection failed") >= 0;
    if (!isError) return;
    var pick = bestUrl();
    if (!pick) return;
    fetch(pick.url + "/api/health", { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) return null;
        return r.json();
      })
      .then(function (j) {
        if (!j) return;
        persistConnection(pick.url, pick.via);
        setTimeout(function () {
          try { window.location.reload(); } catch (e) {}
        }, 300);
      })
      .catch(function () {});
  }

  keepBundledUi();
  patchLocationReplace();
  if (forceTunnelOverLanNow()) {
    try {
      if (!sessionStorage.getItem("zekiq-tunnel-fixed-v54")) {
        sessionStorage.setItem("zekiq-tunnel-fixed-v54", "1");
        location.reload();
      }
    } catch (e) {}
  }
  probeAndFixConnection();
  setInterval(keepBundledUi, 2000);
  setInterval(probeAndFixConnection, 3000);
  setInterval(hideReconnectIfOnline, 2500);
})();
