/**
 * ZEKiQ marketing site — PIN gate (hash in site-gate.json, not plain PIN).
 * Guest pages (table/, g/, guest/) do not load this script.
 */
(function (global) {
  var STORAGE_KEY = "zekiq_site_gate_ok";
  var cfg = null;
  var unlocked = false;
  var pending = [];

  function isUnlocked() {
    if (!cfg) return false;
    if (!cfg.enabled) return true;
    if (unlocked) return true;
    try {
      return sessionStorage.getItem(STORAGE_KEY) === cfg.pinHash;
    } catch {
      return false;
    }
  }

  function setUnlocked() {
    unlocked = true;
    if (cfg && cfg.enabled && cfg.pinHash) {
      try {
        sessionStorage.setItem(STORAGE_KEY, cfg.pinHash);
      } catch {
        /* private mode */
      }
    }
    document.documentElement.classList.remove("site-gate-locked");
    var el = document.getElementById("siteGate");
    if (el) el.remove();
    pending.forEach(function (fn) {
      try {
        fn();
      } catch (e) {
        console.error(e);
      }
    });
    pending = [];
  }

  async function hashPin(pin) {
    var buf = new TextEncoder().encode(String(pin));
    var hash = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(hash))
      .map(function (b) {
        return b.toString(16).padStart(2, "0");
      })
      .join("");
  }

  function t(key) {
    var lang = "en";
    try {
      lang = localStorage.getItem("zekiq_lang") || document.documentElement.lang || "en";
    } catch {
      /* ignore */
    }
    var ar = {
      title: "ZEKiQ — دخول خاص",
      desc: "أدخل الرقم السري لعرض الموقع",
      pin: "الرمز السري",
      open: "دخول",
      wrong: "رمز خاطئ",
    };
    var tr = {
      title: "ZEKiQ — özel giriş",
      desc: "Siteyi görmek için gizli kodu girin",
      pin: "Gizli kod",
      open: "Giriş",
      wrong: "Yanlış kod",
    };
    var en = {
      title: "ZEKiQ — private access",
      desc: "Enter the secret code to view this site",
      pin: "Secret code",
      open: "Enter",
      wrong: "Wrong code",
    };
    var pack = lang === "ar" ? ar : lang === "tr" ? tr : en;
    return pack[key] || en[key] || key;
  }

  function mountGate() {
    document.documentElement.classList.add("site-gate-locked");
    var wrap = document.createElement("div");
    wrap.id = "siteGate";
    wrap.className = "site-gate";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.innerHTML =
      '<div class="site-gate-card">' +
      '<img src="assets/logo.svg" width="56" height="56" alt="" class="site-gate-logo" />' +
      '<h1 class="site-gate-title">' +
      t("title") +
      "</h1>" +
      '<p class="site-gate-desc">' +
      t("desc") +
      "</p>" +
      '<form class="site-gate-form" autocomplete="off">' +
      '<label class="site-gate-label" for="siteGatePin">' +
      t("pin") +
      "</label>" +
      '<input id="siteGatePin" class="site-gate-input" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="12" autocomplete="off" />' +
      '<p class="site-gate-err" id="siteGateErr" hidden></p>' +
      '<button type="submit" class="btn btn-gold site-gate-btn">' +
      t("open") +
      "</button>" +
      "</form></div>";
    document.body.appendChild(wrap);

    var form = wrap.querySelector(".site-gate-form");
    var input = wrap.querySelector("#siteGatePin");
    var err = wrap.querySelector("#siteGateErr");

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      void (async function () {
        var pin = String(input.value || "").trim();
        if (pin.length < 4) {
          err.textContent = t("wrong");
          err.hidden = false;
          return;
        }
        var h = await hashPin(pin);
        if (h === cfg.pinHash) {
          setUnlocked();
        } else {
          err.textContent = t("wrong");
          err.hidden = false;
          input.value = "";
          input.focus();
        }
      })();
    });

    setTimeout(function () {
      input.focus();
    }, 80);
  }

  function loadGateConfig() {
    return fetch("site-gate.json?_=" + Date.now())
      .then(function (r) {
        if (!r.ok) throw new Error("no gate config");
        return r.json();
      })
      .catch(function () {
        return { enabled: false };
      });
  }

  function run(fn) {
    if (typeof fn === "function") {
      if (isUnlocked()) fn();
      else pending.push(fn);
    }
  }

  function boot() {
    loadGateConfig().then(function (c) {
      cfg = c;
      if (!cfg.enabled || !cfg.pinHash) {
        cfg.enabled = false;
        setUnlocked();
        return;
      }
      if (isUnlocked()) {
        setUnlocked();
        return;
      }
      mountGate();
    });
  }

  global.ZekiqSiteGate = { run: run, isUnlocked: isUnlocked, boot: boot };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window);
