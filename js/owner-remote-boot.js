(function () {
  "use strict";
  if (window.__ZEKIQ_REMOTE_BOOT__) return;
  window.__ZEKIQ_REMOTE_BOOT__ = true;

  var CDN = "https://cdn.jsdelivr.net/gh/ostaifskandar-lgtm/zekiq-site@main/js/";
  var SCRIPTS = [
    "owner-update-guard.js",
    "owner-login-fix.js",
    "owner-connection-flex.js",
    "owner-bootstrap.js",
    "owner-tables-pro.js"
  ];
  var i = 0;

  function next() {
    if (i >= SCRIPTS.length) return;
    var s = document.createElement("script");
    s.src = CDN + SCRIPTS[i] + "?v=221";
    s.async = false;
    s.onload = s.onerror = function () {
      i += 1;
      next();
    };
    (document.head || document.documentElement).appendChild(s);
  }

  window.__ZEKIQ_OWNER_EXT_VERSION__ = "2.2.1";
  try {
    localStorage.setItem("tonino-owner-native-apk", "1");
    localStorage.setItem("zekiq-manager-native", "1");
  } catch (e) {}

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", next);
  } else {
    next();
  }
})();
