(function () {
  "use strict";

  var CONFIG_URLS = [
    "https://ostaifskandar-lgtm.github.io/zekiq-site/owner-config.json",
    "https://cdn.jsdelivr.net/gh/ostaifskandar-lgtm/zekiq-site@main/owner-config.json"
  ];

  window.__ZEKIQ_TONINO_LAN__ = "http://192.168.1.25:3000";
  window.__ZEKIQ_TONINO_TUNNEL__ = "https://tonino.zekiqmenu.com";
  window.__ZEKIQ_TONINO_LAN_HOST__ = "192.168.1.25";

  function apply(cfg) {
    if (!cfg) return;
    if (cfg.lanUrl) window.__ZEKIQ_TONINO_LAN__ = String(cfg.lanUrl).trim().replace(/\/+$/, "");
    if (cfg.tunnelUrl) window.__ZEKIQ_TONINO_TUNNEL__ = String(cfg.tunnelUrl).trim().replace(/\/+$/, "");
    if (cfg.lanHost) window.__ZEKIQ_TONINO_LAN_HOST__ = String(cfg.lanHost).trim();
    window.dispatchEvent(new CustomEvent("zekiq-owner-config-loaded"));
  }

  function load() {
    var i = 0;
    function next() {
      if (i >= CONFIG_URLS.length) return Promise.resolve();
      return fetch(CONFIG_URLS[i++] + "?_=" + Date.now(), { cache: "no-store" })
        .then(function (r) { return r.ok ? r.json() : next(); })
        .then(function (cfg) { if (cfg) apply(cfg); })
        .catch(next);
    }
    return next();
  }

  window.__zekiqLoadOwnerConfig = load;
  window.__zekiqToninoLan = function () {
    return window.__ZEKIQ_TONINO_LAN__ || "http://192.168.1.25:3000";
  };
  load();
})();
