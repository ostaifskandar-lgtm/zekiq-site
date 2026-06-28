(function () {
  "use strict";

  if (typeof window === "undefined") return;

  function isOwnerApp() {
    try {
      if (window.__TONINO_APP_TARGET__ === "owner") return true;
      if (localStorage.getItem("tonino-owner-native-apk") === "1") return true;
      if (window.Capacitor && window.Capacitor.config && window.Capacitor.config.appId === "com.tonino.owner") return true;
    } catch (e) {}
    return false;
  }

  if (!isOwnerApp()) return;

  function keepBundledUi() {
    try {
      localStorage.setItem("tonino-owner-standalone-v1", "1");
      localStorage.setItem("tonino-owner-native-apk", "1");
      localStorage.removeItem("tonino-owner-remote-shell");
      localStorage.removeItem("tonino-owner-network-locked");
      localStorage.removeItem("tonino-owner-locked-host");
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

  keepBundledUi();
  patchLocationReplace();
  setInterval(keepBundledUi, 3000);
})();
