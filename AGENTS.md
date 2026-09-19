# zekiq-site

Static web front-end + distribution hub for the ZEKiQ POS ecosystem (restaurant/café POS). Served in production via GitHub Pages. This repo is **only** the static site + config JSON + Node tooling scripts; the POS backend and mobile-app sources live elsewhere.

## Cursor Cloud specific instructions

### What this is
- Pure static site: root-level HTML + `css/`, `js/`, `assets/`, plus JSON config files. There is **no `package.json`, no lockfile, no build step, no linter, and no test suite** — nothing to install. Node (v22) and Python 3 are preinstalled and are all that's needed.

### Run (development)
- Serve the repo root with any static HTTP server, e.g. `python3 -m http.server 8080`, then open pages relative to root:
  - `/` or `/index.html` — marketing/landing site (PIN-gated, see below)
  - `/download.html` — Windows POS installer page (also PIN-gated)
  - `/table/index.html` — guest QR ordering PWA (not gated)
  - `/owner.html`, `/manager.html`, `/garson.html` — Android app landing/config pages
- Pages use relative `fetch()` for their `*.json` config, so they must be opened through an HTTP server (not `file://`).

### PIN gate (non-obvious)
- `index.html`, `download.html`, `garson.html`, `phone.html` load `js/site-gate.js`, which enforces a SHA-256 PIN overlay controlled by `site-gate.json` (`enabled: true`). Guest pages (`table/`, `g/`, `guest/`) are intentionally **not** gated. The gate only stores an unlock flag in `sessionStorage`; it is a soft access gate, not real auth.

### Backend dependency (non-obvious)
- The guest ordering PWA (`table/`) and owner app call an external ZEKiQ POS/"cashier" backend at LAN `http://192.168.1.25:3000` or tunnel `https://tonino.zekiqmenu.com` (endpoints under `/api/guest/v1/*`, `/api/owner/*`). That backend is **not in this repo** and is frequently offline (tunnel may return 502). Without it, guest/owner pages render their UI shell but cannot load a live menu or place real orders. Full functional E2E requires that backend running and reachable.

### Tooling scripts (`scripts/*.mjs`, Node 22, built-in modules only)
- `merge-guest-api-shops.mjs`, `migrate-cashier-ip.mjs` — **mutate committed JSON/HTML in place**; don't run casually. Validate syntax non-destructively with `node --check <file>`.
- `patch-owner-apk.mjs` / `zip-inject-owner.mjs` — rebuild/re-sign the Owner/Manager APK; need external `apktool` + `uber-apk-signer` (downloaded to `/tmp`), Java, and a release keystore that is **not** checked in.
- `cashier-finish.ps1/.bat` — Windows-only, run on the cashier PC.

### CI
- `.github/workflows/protect-guest-api.yml` runs `merge-guest-api-shops.mjs` on pushes touching `guest-api.json`; `.github/workflows/update-cashier-ip.yml` is a manual dispatch running `migrate-cashier-ip.mjs`. Both use Node 20.
