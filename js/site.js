/**
 * ZEKiQ public site — config, i18n, stats, download (device-linked counts).
 */
(function (global) {
  var cache = { config: null, dl: null, version: null, stats: null, garsonDl: null };

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

  function loadGarsonDl() {
    if (cache.garsonDl) return Promise.resolve(cache.garsonDl);
    return fetchJson("garson-dl.json")
      .then(function (cfg) {
        cache.garsonDl = cfg;
        return cfg;
      })
      .catch(function () {
        cache.garsonDl = { fileName: "ToninoStaff.apk", setupUrl: "" };
        return cache.garsonDl;
      });
  }

  function formatGarsonVersion(dl) {
    if (!dl || !dl.versionName) return "";
    var prefix = global.ZekiqI18n ? global.ZekiqI18n.tr("garson_ver_prefix") : "Garson version";
    var extra = dl.versionCode ? " · build " + dl.versionCode : "";
    var size = dl.sizeMb ? " · ~" + dl.sizeMb + " MB" : "";
    return prefix + " " + dl.versionName + extra + size;
  }

  function garsonDownloadButtonLabel(dl) {
    var file = dl.fileName || "ToninoStaff.apk";
    return (
      "⬇️ " +
      (global.ZekiqI18n ? global.ZekiqI18n.tr("garson_btn_file", { file: file }) : file)
    );
  }

  function bindGarsonDownloadButton(buttonId, versionId) {
    return loadGarsonDl().then(function (dl) {
      var btn = document.getElementById(buttonId);
      if (btn) {
        btn.classList.remove("btn-ghost");
        if (!dl.setupUrl) {
          btn.href = "#";
          btn.removeAttribute("target");
          btn.classList.add("btn-ghost");
          btn.setAttribute("aria-disabled", "true");
          btn.textContent = global.ZekiqI18n ? global.ZekiqI18n.tr("garson_no_url") : "…";
        } else {
          btn.removeAttribute("aria-disabled");
          btn.href = dl.setupUrl;
          btn.removeAttribute("target");
          btn.removeAttribute("rel");
          btn.setAttribute("download", dl.fileName || "ToninoStaff.apk");
          btn.textContent = garsonDownloadButtonLabel(dl);
        }
      }
      if (versionId) {
        var el = document.getElementById(versionId);
        if (el) el.textContent = formatGarsonVersion(dl);
      }
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
          el.style.display = n > 0 ? "" : "none";
        });
        document.querySelectorAll(".install-badge").forEach(function (el) {
          el.style.display = n > 0 ? "" : "none";
        });
        document.querySelectorAll("[data-i18n-trust]").forEach(function (el) {
          if (global.ZekiqI18n) {
            el.innerHTML =
              n > 0
                ? global.ZekiqI18n.tr("trust_installs", { n: display })
                : global.ZekiqI18n.tr("trust_installs_zero");
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

  function downloadButtonLabel(dl) {
    var file = dl.fileName || "ZEKiQ-POS-Setup.exe";
    return (
      "⬇️ " +
      (global.ZekiqI18n ? global.ZekiqI18n.tr("dl_btn_file", { file: file }) : file)
    );
  }

  function bindDownloadButton(buttonId, versionId) {
    return Promise.all([loadConfig(), loadDl(), loadVersion()]).then(function (res) {
      var cfg = res[0];
      var dl = res[1];
      var v = res[2];
      var btn = document.getElementById(buttonId);
      if (btn) {
        btn.classList.remove("btn-ghost");
        if (!dl.setupUrl) {
          btn.href = "#";
          btn.removeAttribute("target");
          btn.classList.add("btn-ghost");
          btn.setAttribute("aria-disabled", "true");
          btn.textContent = global.ZekiqI18n ? global.ZekiqI18n.tr("dl_no_url") : "…";
        } else {
          btn.removeAttribute("aria-disabled");
          btn.href = dl.setupUrl;
          btn.target = "_blank";
          btn.rel = "noopener noreferrer";
          btn.textContent = downloadButtonLabel(dl);
          if (!btn.dataset.dlBound) {
            btn.dataset.dlBound = "1";
            btn.addEventListener("click", function () {
              trackWebsiteDownload(cfg);
            });
          }
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
        var paths = { home: "", download: "download.html", phone: "phone.html", garson: "garson.html" };
        link.href = cfg.siteUrl.replace(/\/$/, "") + "/" + (paths[page] || "");
      }
      var og = document.querySelector('meta[property="og:url"]');
      if (og && cfg.siteUrl) {
        var page = document.body.getAttribute("data-page") || "home";
        var paths = { home: "", download: "download.html", phone: "phone.html", garson: "garson.html" };
        og.content = cfg.siteUrl.replace(/\/$/, "") + "/" + (paths[page] || "");
      }
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
    var verId = document.body.getAttribute("data-version-id");
    var verExtra = document.body.getAttribute("data-version-extra");
    if (verId) setVersionText(verId, verExtra || "");
    var dlBtnId = document.body.getAttribute("data-dl-btn");
    if (dlBtnId) bindDownloadButton(dlBtnId, verId || "");
    var garsonBtnId = document.body.getAttribute("data-garson-dl-btn");
    var garsonVerId = document.body.getAttribute("data-garson-version-id");
    if (garsonBtnId) bindGarsonDownloadButton(garsonBtnId, garsonVerId || "");
  }

  function init() {
    if (global.ZekiqI18n) global.ZekiqI18n.init();
    setYear();
    markActiveNav();
    initMeta();
    applyPricing();
    applyInstallStats();
    var verId = document.body.getAttribute("data-version-id");
    var verExtra = document.body.getAttribute("data-version-extra");
    if (verId) setVersionText(verId, verExtra || "");
    var dlBtn = document.body.getAttribute("data-dl-btn");
    if (dlBtn) bindDownloadButton(dlBtn, verId || "");
    var garsonBtn = document.body.getAttribute("data-garson-dl-btn");
    var garsonVer = document.body.getAttribute("data-garson-version-id");
    if (garsonBtn) bindGarsonDownloadButton(garsonBtn, garsonVer || "");
  }

  global.ZekiqSite = {
    loadConfig: loadConfig,
    loadGarsonDl: loadGarsonDl,
    loadStats: function () {
      return loadConfig().then(loadStats);
    },
    setVersionText: setVersionText,
    bindDownloadButton: bindDownloadButton,
    bindGarsonDownloadButton: bindGarsonDownloadButton,
    applyPricing: applyPricing,
    applyInstallStats: applyInstallStats,
    setYear: setYear,
    markActiveNav: markActiveNav,
    onLangChange: onLangChange,
    init: init,
  };
})(window);
