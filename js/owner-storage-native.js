(function () {
  "use strict";

  if (typeof window === "undefined") return;

  var KEYS = {
    server: "tonino-owner-server",
    workingApi: "tonino-owner-working-api",
    activeApi: "tonino-owner-active-api",
    remoteBase: "tonino-owner-remote-base",
    remoteForIp: "tonino-owner-remote-for-ip",
    linkMode: "tonino-owner-link-mode",
    workingVia: "tonino-owner-working-via",
    manualTarget: "tonino-owner-manual-target",
    profiles: "tonino-owner-server-profiles"
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

  function hostFromUrl(u) {
    try { return new URL(u).hostname; } catch (e) { return ""; }
  }

  function getTunnelUrl() {
    var order = [KEYS.remoteBase, KEYS.workingApi, KEYS.activeApi, KEYS.server];
    for (var i = 0; i < order.length; i++) {
      var v = trimUrl(lsGet(order[i]));
      if (v.startsWith("https://")) return v;
    }
    return "";
  }

  function readProfile() {
    try {
      var profiles = JSON.parse(lsGet(KEYS.profiles) || "[]");
      return profiles[0] || null;
    } catch (e) { return null; }
  }

  function profileNeedsRepair() {
    var prof = readProfile();
    if (!prof || !prof.server) return false;
    var server = trimUrl(prof.server);
    if (server.startsWith("https://")) return true;
    var host = hostFromUrl(server);
    if (!host || !isPrivateLanUrl(server)) return false;
    var rip = lsGet(KEYS.remoteForIp);
    return !!rip && rip !== host;
  }

  function applyRemoteOwnerStorage(tunnel, lanUrl, shopLabel) {
    tunnel = trimUrl(tunnel);
    lanUrl = trimUrl(lanUrl);
    if (!tunnel.startsWith("https://")) return false;

    var lanHost = hostFromUrl(lanUrl);
    var profileServer = lanUrl && isPrivateLanUrl(lanUrl) ? lanUrl : tunnel;
    var prof = readProfile();

    lsSet(KEYS.remoteBase, tunnel);
    lsSet(KEYS.server, tunnel);
    lsSet(KEYS.workingApi, tunnel);
    lsSet(KEYS.activeApi, tunnel);
    lsSet(KEYS.linkMode, "remote");
    lsSet(KEYS.workingVia, "remote");
    lsSet(KEYS.manualTarget, "1");
    if (lanHost) lsSet(KEYS.remoteForIp, lanHost);

    lsSet(KEYS.profiles, JSON.stringify([{
      id: "cashier",
      label: shopLabel || (prof && prof.label) || "Shop",
      server: profileServer,
      savedAt: Date.now()
    }]));

    try {
      localStorage.removeItem("tonino-owner-network-locked");
      localStorage.removeItem("tonino-owner-locked-host");
      localStorage.removeItem("tonino-owner-remote-shell");
    } catch (e) {}

    window.dispatchEvent(new CustomEvent("tonino-owner-link-changed"));
    return true;
  }

  function repairOwnerStorageIfNeeded() {
    if (!profileNeedsRepair()) return Promise.resolve(false);
    var tunnel = getTunnelUrl();
    if (!tunnel.startsWith("https://")) return Promise.resolve(false);

    var prof = readProfile();
    var profServer = prof && prof.server ? trimUrl(prof.server) : "";
    var rip = lsGet(KEYS.remoteForIp);

    if (profServer && isPrivateLanUrl(profServer) && rip === hostFromUrl(profServer)) {
      applyRemoteOwnerStorage(tunnel, profServer, prof && prof.label);
      return Promise.resolve(true);
    }

    if (rip && profServer.startsWith("https://")) {
      applyRemoteOwnerStorage(tunnel, "http://" + rip + ":3000", prof && prof.label);
      return Promise.resolve(true);
    }

    if (window.__zekiqStorageRepairPending) return Promise.resolve(false);
    window.__zekiqStorageRepairPending = true;

    return fetch(tunnel + "/api/owner/config", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (cfg) {
        if (!cfg || typeof cfg.ip !== "string" || !cfg.ip.trim()) return false;
        var lan = "http://" + cfg.ip.trim() + ":" + (cfg.port || 3000);
        applyRemoteOwnerStorage(tunnel, lan, cfg.shopName || (prof && prof.label));
        return true;
      })
      .catch(function () { return false; })
      .finally(function () { window.__zekiqStorageRepairPending = false; });
  }

  window.__zekiqApplyRemoteOwnerStorage = applyRemoteOwnerStorage;
  window.__zekiqRepairOwnerStorageIfNeeded = repairOwnerStorageIfNeeded;
  window.__zekiqGetOwnerTunnelUrl = getTunnelUrl;

  repairOwnerStorageIfNeeded();
})();
