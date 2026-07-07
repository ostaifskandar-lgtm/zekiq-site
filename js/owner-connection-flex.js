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
    nativeApk: "tonino-owner-native-apk",
    profiles: "tonino-owner-server-profiles",
    remoteForIp: "tonino-owner-remote-for-ip"
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

  function linkMode() {
    if (lsGet("tonino-owner-lan-lock") === "1" || lsGet("tonino-owner-tablet-clone") === "1") {
      return "wifi";
    }
    return lsGet(KEYS.linkMode);
  }

  function isLanLocked() {
    return lsGet("tonino-owner-lan-lock") === "1" || lsGet("tonino-owner-tablet-clone") === "1";
  }

  function profileLanUrl() {
    try {
      var profiles = JSON.parse(lsGet(KEYS.profiles) || "[]");
      var s = profiles[0] && profiles[0].server ? trimUrl(profiles[0].server) : "";
      if (s && isPrivateLanUrl(s)) return s;
    } catch (e) {}
    var rip = lsGet(KEYS.remoteForIp);
    if (rip) return "http://" + rip + ":3000";
    return "";
  }

  function storedLanUrl() {
    var order = [KEYS.workingApi, KEYS.activeApi, KEYS.server];
    for (var i = 0; i < order.length; i++) {
      var v = trimUrl(lsGet(order[i]));
      if (v.startsWith("http://") && isPrivateLanUrl(v)) return v;
    }
    return profileLanUrl();
  }

  function storedTunnelUrl() {
    var order = [KEYS.remoteBase, KEYS.workingApi, KEYS.activeApi, KEYS.server];
    for (var i = 0; i < order.length; i++) {
      var v = trimUrl(lsGet(order[i]));
      if (v.startsWith("https://")) return v;
    }
    return "";
  }

  function persistLan(lan) {
    lan = trimUrl(lan);
    if (!lan.startsWith("http://") || !isPrivateLanUrl(lan)) return;
    lsSet(KEYS.server, lan);
    lsSet(KEYS.workingApi, lan);
    lsSet(KEYS.activeApi, lan);
    lsSet(KEYS.linkMode, "wifi");
    lsSet(KEYS.workingVia, "lan");
    lsSet(KEYS.manualTarget, "1");
    try {
      var profiles = JSON.parse(lsGet(KEYS.profiles) || "[]");
      if (!profiles.length) profiles = [{ id: "cashier", label: "Shop", server: lan, savedAt: Date.now() }];
      else {
        profiles[0].server = lan;
        profiles[0].savedAt = Date.now();
      }
      lsSet(KEYS.profiles, JSON.stringify(profiles));
      lsSet(KEYS.remoteForIp, new URL(lan).hostname);
    } catch (e) {}
    window.dispatchEvent(new CustomEvent("tonino-owner-link-changed"));
  }

  function persistRemote(tunnel, lan) {
    tunnel = trimUrl(tunnel);
    if (!tunnel.startsWith("https://")) return;
    lan = trimUrl(lan || profileLanUrl());
    lsSet(KEYS.remoteBase, tunnel);
    lsSet(KEYS.server, tunnel);
    lsSet(KEYS.workingApi, tunnel);
    lsSet(KEYS.activeApi, tunnel);
    lsSet(KEYS.linkMode, "remote");
    lsSet(KEYS.workingVia, "remote");
    lsSet(KEYS.manualTarget, "1");
    if (lan && isPrivateLanUrl(lan)) {
      try {
        lsSet(KEYS.remoteForIp, new URL(lan).hostname);
        var profiles = JSON.parse(lsGet(KEYS.profiles) || "[]");
        if (!profiles.length) profiles = [{ id: "cashier", label: "Shop", server: lan, savedAt: Date.now() }];
        else {
          profiles[0].server = lan;
          profiles[0].savedAt = Date.now();
        }
        lsSet(KEYS.profiles, JSON.stringify(profiles));
      } catch (e) {}
    }
    window.dispatchEvent(new CustomEvent("tonino-owner-link-changed"));
  }

  function repairWifiProfileIfBroken() {
    var mode = linkMode();
    var lan = storedLanUrl();
    var tunnel = storedTunnelUrl();
    var server = trimUrl(lsGet(KEYS.server));

    if (mode === "wifi" || mode === "lan") {
      if (lan && (!isPrivateLanUrl(server) || server.startsWith("https://"))) {
        persistLan(lan);
        return true;
      }
      return false;
    }

    if (mode === "remote" && tunnel && lan) {
      try {
        var profiles = JSON.parse(lsGet(KEYS.profiles) || "[]");
        if (profiles[0] && profiles[0].server && String(profiles[0].server).startsWith("https://")) {
          profiles[0].server = lan;
          profiles[0].savedAt = Date.now();
          lsSet(KEYS.profiles, JSON.stringify(profiles));
          return true;
        }
      } catch (e) {}
    }
    return false;
  }

  function probeLan(ms) {
    var lan = storedLanUrl();
    if (!lan) return Promise.resolve(false);
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, ms || 2500);
    return fetch(lan + "/api/health", { cache: "no-store", signal: ctrl && ctrl.signal })
      .then(function (r) { clearTimeout(timer); return r.ok; })
      .catch(function () { clearTimeout(timer); return false; });
  }

  function unlockFlags() {
    try {
      localStorage.removeItem("tonino-owner-remote-shell");
      localStorage.removeItem("tonino-owner-network-locked");
      localStorage.removeItem("tonino-owner-locked-host");
      lsSet(KEYS.standalone, "1");
      lsSet(KEYS.nativeApk, "1");
      lsSet("zekiq-manager-native", "1");
    } catch (e) {}
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

  function maybeFixConnection() {
    repairWifiProfileIfBroken();
    if (isLanLocked()) {
      var lockedLan = storedLanUrl();
      if (lockedLan) persistLan(lockedLan);
      return;
    }

    var mode = linkMode();
    var lan = storedLanUrl();
    var tunnel = storedTunnelUrl();

    if (mode === "wifi" || mode === "lan") {
      if (lan) persistLan(lan);
      return;
    }

    if (mode === "remote" && tunnel) return;

    if (lan) {
      probeLan(2000).then(function (ok) {
        if (ok) persistLan(lan);
        else if (tunnel) persistRemote(tunnel, lan);
      });
    }
  }

  window.__zekiqRepairOwnerWifi = repairWifiProfileIfBroken;
  window.__zekiqPersistOwnerLan = persistLan;

  unlockFlags();
  patchLocationReplace();
  repairWifiProfileIfBroken();
  maybeFixConnection();
  setInterval(unlockFlags, 5000);
  setInterval(repairWifiProfileIfBroken, 4000);
})();
