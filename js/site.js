/**
 * ZEKiQ public site — config, i18n, stats, download (device-linked counts).
 */
(function (global) {
  var cache = { config: null, dl: null, version: null, stats: null };

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
          siteUrl: "",
          whatsapp: "",
          annualPriceUsd: 150,
          trialDays: 30,
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

  function loadStats(cfg) {
    if (cache.stats) return Promise.resolve(cache.stats);
    var api = cfg && cfg.statsApiUrl ? String(cfg.statsApiUrl).replace(/\/$/, "") + "/stats" : "";
    var p = api
      ? fetchJson(api).catch(function () {
          return fetchJson("stats.json");
        })
      : fetchJson("stats.json");
    return p
      .then(function (s) {
        cache.stats = s;
        return s;
      })
      .catch(function () {
        cache.stats = {
          uniqueDevices: 0,
          verifiedInstalls: 0,
          websiteDownloads: 0,
        };
        return cache.stats;
      });
  }

  function formatInstallCount(n) {
    n = Number(n) || 0;
    if (n >= 1000) return Math.floor(n / 100) / 10 + "k+";
    if (n > 0) return String(n) + "+";
    return "—";
  }

  function applyInstallStats() {
    return loadConfig().then(function (cfg) {
      return loadStats(cfg).then(function (s) {
        var n = s.verifiedInstalls || s.uniqueDevices || 0;
        var display = formatInstallCount(n);
        document.querySelectorAll("[data-install-count]").forEach(function (el) {
          el.textContent = n > 0 ? display : "—";
        });
        document.querySelectorAll("[data-install-raw]").forEach(function (el) {
          el.textContent = String(n);
        });
        document.querySelectorAll("[data-i18n-trust]").forEach(function (el) {
          if (global.ZekiqI18n) {
            el.innerHTML = global.ZekiqI18n.tr("trust_installs", { n: n > 0 ? display : "0" });
          }
        });
        document.querySelectorAll("[data-i18n-dl-counter]").forEach(function (el) {
          if (global.ZekiqI18n) {
            el.textContent = global.ZekiqI18n.tr("dl_counter", { n: n > 0 ? String(n) : "0" });
          }
        });
        var statN = document.getElementById("statInstalls");
        if (statN) statN.textContent = n > 0 ? display : "0";
      });
    });
  }

  function trackWebsiteDownload(cfg) {
    var base = cfg && cfg.statsApiUrl ? String(cfg.statsApiUrl).replace(/\/$/, "") : "";
    if (!base) return;
    fetch(base + "/track-download", { method: "POST", mode: "cors" }).catch(function () {});
  }

  function waLink(number, message) {
    var n = String(number || "").replace(/\D/g, "");
    if (!n) return "#";
    return "https://wa.me/" + n + "?text=" + encodeURIComponent(message || "");
  }

  function waMessage(cfg, plan) {
    if (!global.ZekiqI18n) return "ZEKiQ POS";
    if (plan) return global.ZekiqI18n.tr("wa_plan", { plan: plan });
    return global.ZekiqI18n.tr("wa_default");
  }

  function bindWhatsApp(selector, messageBuilder) {
    return loadConfig().then(function (cfg) {
      var nodes = document.querySelectorAll(selector);
      nodes.forEach(function (a) {
        var plan = a.getAttribute("data-plan");
        var msg =
          typeof messageBuilder === "function"
            ? messageBuilder(cfg, plan, a)
            : waMessage(cfg, plan);
        a.href = waLink(cfg.whatsapp, msg);
        a.target = "_blank";
        a.rel = "noreferrer";
      });
    });
  }

  function formatVersion(v) {
    if (!v) return "";
    var prefix = global.ZekiqI18n ? global.ZekiqI18n.tr("ver_prefix") : "Version";
    return (
      prefix +
      " " +
      (v.displayVersion || v.productVersion || "") +
      (v.installerSizeMb ? " · ~" + v.installerSizeMb + " MB" : "")
    );
  }

  function setVersionText(elementId, extraKey) {
    return loadVersion().then(function (v) {
      var el = document.getElementById(elementId);
      if (!el) return;
      if (!v) {
        el.textContent = extraKey && global.ZekiqI18n ? global.ZekiqI18n.tr(extraKey) : "…";
        return;
      }
      var extra = extraKey && global.ZekiqI18n ? global.ZekiqI18n.tr(extraKey) : "";
      el.textContent = formatVersion(v) + (extra ? " · " + extra : "");
    });
  }

  function priceLabel(cfg) {
    var lang = global.ZekiqI18n ? global.ZekiqI18n.getLang() : "en";
    var usd = cfg.annualPriceUsd || 150;
    if (lang === "ar") return "$" + usd + " / سنة";
    if (lang === "tr") return "$" + usd + " / yıl";
    return "$" + usd + " / year";
  }

  function applyPricing() {
    return loadConfig().then(function (cfg) {
      var price = priceLabel(cfg);
      document.querySelectorAll("[data-price]").forEach(function (el) {
        el.textContent = price;
      });
      document.querySelectorAll("[data-trial-days]").forEach(function (el) {
        el.textContent = String(cfg.trialDays || 30);
      });
      document.querySelectorAll("[data-trial-note]").forEach(function (el) {
        var lang = global.ZekiqI18n ? global.ZekiqI18n.getLang() : "en";
        var notes = {
          en: cfg.trialNoteEn || "First month free — try before you pay",
          tr: cfg.trialNoteTr || "İlk ay ücretsiz — ödemeden dene",
          ar: cfg.trialNote || "أول شهر مجاني — جرّب قبل الدفع",
        };
        el.textContent = notes[lang] || notes.en;
      });
      if (global.ZekiqI18n) {
        global.ZekiqI18n.apply();
        var lead = document.querySelector('[data-i18n="hero_lead"]');
        if (lead) {
          var noteEl = document.querySelector("[data-trial-note]");
          lead.innerHTML = global.ZekiqI18n.tr("hero_lead", {
            trial: noteEl ? noteEl.textContent : "",
          });
        }
      }
    });
  }

  function bindDownloadButton(buttonId, versionId) {
    return Promise.all([loadConfig(), loadDl(), loadVersion()]).then(function (res) {
      var cfg = res[0];
      var dl = res[1];
      var v = res[2];
      var btn = document.getElementById(buttonId);
      if (btn) {
        if (!dl.setupUrl) {
          btn.href = "#";
          btn.classList.add("btn-ghost");
          btn.textContent = global.ZekiqI18n ? global.ZekiqI18n.tr("dl_no_url") : "…";
          btn.addEventListener("click", function (e) {
            e.preventDefault();
            window.open(waLink(cfg.whatsapp, global.ZekiqI18n ? global.ZekiqI18n.tr("wa_dl_help") : ""), "_blank");
          });
        } else {
          btn.href = dl.setupUrl;
          btn.addEventListener("click", function () {
            trackWebsiteDownload(cfg);
          });
          btn.textContent =
            "⬇️ " +
            (global.ZekiqI18n
              ? global.ZekiqI18n.tr("dl_btn_file", { file: dl.fileName || "ZEKiQ-POS-Setup.exe" })
              : dl.fileName || "ZEKiQ-POS-Setup.exe");
        }
      }
      if (versionId) {
        var el = document.getElementById(versionId);
        if (el && v) el.textContent = formatVersion(v);
      }
    });
  }

  function initMeta() {
    return loadConfig().then(function (cfg) {
      if (cfg.siteUrl) {
        var link = document.querySelector('link[rel="canonical"]');
        if (!link) {
          link = document.createElement("link");
          link.rel = "canonical";
          document.head.appendChild(link);
        }
        var page = document.body.getAttribute("data-page") || "home";
        var paths = { home: "", download: "download.html", phone: "phone.html" };
        link.href = cfg.siteUrl.replace(/\/$/, "") + "/" + (paths[page] || "");
      }
      var og = document.querySelector('meta[property="og:url"]');
      if (og && cfg.siteUrl) og.content = cfg.siteUrl;
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

  function onLangChange() {
    applyPricing();
    applyInstallStats();
    bindWhatsApp(".js-wa");
    var verId = document.body.getAttribute("data-version-id");
    var verExtra = document.body.getAttribute("data-version-extra");
    if (verId) setVersionText(verId, verExtra || "");
  }

  function init() {
    if (global.ZekiqI18n) global.ZekiqI18n.init();
    setYear();
    markActiveNav();
    initMeta();
    applyPricing();
    applyInstallStats();
    bindWhatsApp(".js-wa");
    var verId = document.body.getAttribute("data-version-id");
    var verExtra = document.body.getAttribute("data-version-extra");
    if (verId) setVersionText(verId, verExtra || "");
    var dlBtn = document.body.getAttribute("data-dl-btn");
    if (dlBtn) bindDownloadButton(dlBtn, verId || "");
  }

  global.ZekiqSite = {
    loadConfig: loadConfig,
    loadStats: function () {
      return loadConfig().then(loadStats);
    },
    bindWhatsApp: bindWhatsApp,
    setVersionText: setVersionText,
    bindDownloadButton: bindDownloadButton,
    applyPricing: applyPricing,
    applyInstallStats: applyInstallStats,
    setYear: setYear,
    markActiveNav: markActiveNav,
    onLangChange: onLangChange,
    init: init,
    waLink: waLink,
  };
})(window);
