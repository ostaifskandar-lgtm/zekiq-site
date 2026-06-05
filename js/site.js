/**
 * ZEKiQ public site — shared logic (no hardcoded GitHub URLs).
 * Config: site-config.json (vendor) + dl.json (installer) + version.json (build).
 */
(function (global) {
  var cache = { config: null, dl: null, version: null };

  function fetchJson(url) {
    return fetch(url + "?_=" + Date.now())
      .then(function (r) {
        if (!r.ok) throw new Error("http " + r.status);
        return r.json();
      });
  }

  function loadConfig() {
    if (cache.config) return Promise.resolve(cache.config);
    return fetchJson("site-config.json")
      .then(function (cfg) {
        cache.config = cfg;
        return cfg;
      })
      .catch(function () {
        cache.config = {
          brandName: "ZEKiQ",
          whatsapp: "",
          annualPriceUsd: 150,
          annualPriceLabel: "$150 / سنة",
          trialDays: 30,
          trialNote: "أول شهر مجاني",
        };
        return cache.config;
      });
  }

  function loadDl() {
    if (cache.dl) return Promise.resolve(cache.dl);
    return fetchJson("dl.json")
      .then(function (cfg) {
        cache.dl = cfg;
        return cfg;
      })
      .catch(function () {
        cache.dl = { fileName: "ZEKiQ-POS-Setup.exe", setupUrl: "" };
        return cache.dl;
      });
  }

  function loadVersion() {
    if (cache.version) return Promise.resolve(cache.version);
    return fetchJson("version.json")
      .then(function (v) {
        cache.version = v;
        return v;
      })
      .catch(function () {
        cache.version = null;
        return null;
      });
  }

  function waLink(number, message) {
    var n = String(number || "").replace(/\D/g, "");
    if (!n) return "#";
    return "https://wa.me/" + n + "?text=" + encodeURIComponent(message || "");
  }

  function bindWhatsApp(selector, messageBuilder) {
    return loadConfig().then(function (cfg) {
      var nodes = document.querySelectorAll(selector);
      nodes.forEach(function (a) {
        var plan = a.getAttribute("data-plan");
        var msg =
          typeof messageBuilder === "function"
            ? messageBuilder(cfg, plan, a)
            : plan
              ? "مرحباً، أريد الاشتراك في ZEKiQ POS — " + plan
              : "مرحباً، أريد معرفة المزيد عن ZEKiQ POS";
        a.href = waLink(cfg.whatsapp, msg);
        a.target = "_blank";
        a.rel = "noreferrer";
      });
    });
  }

  function formatVersion(v) {
    if (!v) return "";
    var line =
      "الإصدار " +
      (v.displayVersion || v.productVersion || "") +
      (v.installerSizeMb ? " · ~" + v.installerSizeMb + " MB" : "");
    return line;
  }

  function setVersionText(elementId, extra) {
    return loadVersion().then(function (v) {
      var el = document.getElementById(elementId);
      if (!el) return;
      if (!v) {
        el.textContent = extra || "الإصدار سيظهر بعد النشر";
        return;
      }
      el.textContent = formatVersion(v) + (extra ? " · " + extra : "");
    });
  }

  function bindDownloadButton(buttonId, versionId) {
    return Promise.all([loadDl(), loadVersion()]).then(function (res) {
      var dl = res[0];
      var v = res[1];
      var btn = document.getElementById(buttonId);
      if (btn) {
        if (!dl.setupUrl) {
          btn.href = "#";
          btn.classList.add("btn-ghost");
          btn.textContent = "المثبّت قيد النشر — تواصل واتساب";
          btn.addEventListener("click", function (e) {
            e.preventDefault();
            loadConfig().then(function (cfg) {
              window.open(waLink(cfg.whatsapp, "مرحباً، أريد رابط تحميل ZEKiQ POS"), "_blank");
            });
          });
        } else {
          btn.href = dl.setupUrl;
          btn.textContent = "⬇️ تحميل " + (dl.fileName || "ZEKiQ-POS-Setup.exe");
        }
      }
      if (versionId) {
        var el = document.getElementById(versionId);
        if (el && v) el.textContent = formatVersion(v);
      }
    });
  }

  function applyPricing() {
    return loadConfig().then(function (cfg) {
      document.querySelectorAll("[data-price]").forEach(function (el) {
        el.textContent = cfg.annualPriceLabel || "$150 / سنة";
      });
      document.querySelectorAll("[data-trial-days]").forEach(function (el) {
        el.textContent = String(cfg.trialDays || 30);
      });
      document.querySelectorAll("[data-trial-note]").forEach(function (el) {
        el.textContent = cfg.trialNote || "أول شهر مجاني";
      });
    });
  }

  function setYear(id) {
    var el = document.getElementById(id || "year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  function markActiveNav() {
    var page = document.body.getAttribute("data-page");
    if (!page) return;
    document.querySelectorAll(".nav-links a[data-nav]").forEach(function (a) {
      if (a.getAttribute("data-nav") === page) a.classList.add("active");
    });
  }

  global.ZekiqSite = {
    loadConfig: loadConfig,
    loadDl: loadDl,
    loadVersion: loadVersion,
    bindWhatsApp: bindWhatsApp,
    setVersionText: setVersionText,
    bindDownloadButton: bindDownloadButton,
    applyPricing: applyPricing,
    setYear: setYear,
    markActiveNav: markActiveNav,
    waLink: waLink,
  };
})(window);
