#!/usr/bin/env node
/**
 * Patch Owner APK while keeping Tonino release signature when possible.
 *
 * The phone installs APKs signed with CN=Tonino Garson (Gradle release).
 * Re-signing with debug keystore causes "Uygulama yüklenmedi" on Samsung.
 *
 * Usage:
 *   node scripts/patch-owner-apk.mjs [versionCode]     → legacy (needs release keystore to patch)
 *   node scripts/patch-owner-apk.mjs manager [code]    → ZEKiQManager output
 *   node scripts/patch-owner-apk.mjs restore           → copy release base to downloads/
 */
import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const RESTORE = args[0] === "restore";
const MANAGER = args[0] === "manager";
const VERSION = String(MANAGER ? (args[1] || "202") : RESTORE ? "0" : (args[0] || "54"));
const VERSION_NAME = MANAGER ? "2.0.2" : RESTORE ? "release-base" : `1.0.${VERSION}`;
const RELEASE_BASE = path.join(ROOT, "android", "ToninoOwner-release-base.apk");
const LEGACY_APK = path.join(ROOT, "downloads", "ToninoOwner.apk");
const MANAGER_APK = path.join(ROOT, "downloads", "ZEKiQManager.apk");
const OUT_APK = MANAGER ? MANAGER_APK : LEGACY_APK;
const RELEASE_KEYSTORE = process.env.RELEASE_KEYSTORE || path.join(ROOT, "android", "tonino-release.keystore");
const RELEASE_KS_ALIAS = process.env.RELEASE_KS_ALIAS || "tonino";
const RELEASE_KS_PASS = process.env.RELEASE_KS_PASS || "";
const DEBUG_KEYSTORE = path.join(ROOT, "android", "owner-debug.keystore");
const DEBUG_KS_PASS = "android";
const APKTOOL = process.env.APKTOOL || "java -jar /tmp/apktool.jar";
const PKG = "com.tonino.owner";
const APP_LABEL_AR = "ZEKiQ مدير";
const APP_LABEL_EN = "ZEKiQ Manager";
const CDN_BASE = "https://cdn.jsdelivr.net/gh/ostaifskandar-lgtm/zekiq-site@main/downloads";

const FILES = [
  ["js/owner-update-guard.js", "assets/public/owner-update-guard.js"],
  ["js/owner-api-lan-force.js", "assets/public/owner-api-lan-force.js"],
  ["js/owner-tablet-clone.js", "assets/public/owner-tablet-clone.js"],
  ["js/owner-login-fix.js", "assets/public/owner-login-fix.js"],
  ["js/owner-connection-flex.js", "assets/public/owner-connection-flex.js"],
  ["js/owner-bootstrap.js", "assets/public/owner-bootstrap.js"],
  ["js/owner-tables-pro.js", "assets/public/owner-tables-pro.js"]
];

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: "inherit", ...opts });
}

function hasReleaseKeystore() {
  return fs.existsSync(RELEASE_KEYSTORE) && RELEASE_KS_PASS.length > 0;
}

function restoreRelease() {
  if (!fs.existsSync(RELEASE_BASE)) {
    console.error("Missing release base:", RELEASE_BASE);
    process.exit(1);
  }
  fs.copyFileSync(RELEASE_BASE, LEGACY_APK);
  fs.copyFileSync(RELEASE_BASE, MANAGER_APK);
  console.log("Restored release-signed APK -> ToninoOwner.apk + ZEKiQManager.apk");
  console.log("Signature: CN=Tonino Garson (Samsung-compatible upgrade)");
}

if (RESTORE) {
  restoreRelease();
  process.exit(0);
}

if (!fs.existsSync(RELEASE_BASE)) {
  console.error("Missing release base APK:", RELEASE_BASE);
  process.exit(1);
}

if (!hasReleaseKeystore()) {
  console.warn("⚠ No release keystore — publishing unpatched release APK (installs on Samsung).");
  console.warn("  Set RELEASE_KEYSTORE + RELEASE_KS_PASS to build patched release-signed APK.");
  restoreRelease();
  process.exit(0);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "zekiq-apk-"));
const decodeDir = path.join(tmp, "decode");
const builtApk = path.join(tmp, "dist.apk");

console.log(MANAGER ? "Building ZEKiQ Manager (release-signed)..." : "Patching ToninoOwner.apk (release-signed)...");
run(`${APKTOOL} d -f "${RELEASE_BASE}" -o "${decodeDir}"`);

const ymlPath = path.join(decodeDir, "apktool.yml");
if (fs.existsSync(ymlPath)) {
  let yml = fs.readFileSync(ymlPath, "utf8");
  yml = yml.replace(/versionCode:\s*\d+/, `versionCode: ${VERSION}`);
  yml = yml.replace(/versionName:\s*[^\n]+/, `versionName: ${VERSION_NAME}`);
  yml = yml.replace(/renameManifestPackage:.*\n/g, "");
  fs.writeFileSync(ymlPath, yml);
}

if (MANAGER) {
  const capCfg = path.join(decodeDir, "assets/capacitor.config.json");
  if (fs.existsSync(capCfg)) {
    const buf = fs.readFileSync(capCfg);
    const off = buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf ? 3 : 0;
    const j = JSON.parse(buf.slice(off).toString("utf8"));
    j.appId = PKG;
    j.appName = APP_LABEL_EN;
    fs.writeFileSync(capCfg, JSON.stringify(j, null, 2));
  }
  const stringsPath = path.join(decodeDir, "res/values/strings.xml");
  if (fs.existsSync(stringsPath)) {
    let s = fs.readFileSync(stringsPath, "utf8");
    s = s.replace(/تطبيق المالك/g, APP_LABEL_AR);
    s = s.replace(/<string name="app_name">[^<]*<\/string>/, `<string name="app_name">${APP_LABEL_AR}</string>`);
    s = s.replace(/<string name="title_activity_main">[^<]*<\/string>/, `<string name="title_activity_main">${APP_LABEL_AR}</string>`);
    fs.writeFileSync(stringsPath, s);
  }
}

for (const [src, dest] of FILES) {
  fs.mkdirSync(path.dirname(path.join(decodeDir, dest)), { recursive: true });
  fs.copyFileSync(path.join(ROOT, src), path.join(decodeDir, dest));
}

const indexPath = path.join(decodeDir, "assets/public/index.html");
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, "utf8");
  html = html.replace(/window\.__ZEKIQ_OWNER_EXT_VERSION__\s*=\s*"[^"]*"/, `window.__ZEKIQ_OWNER_EXT_VERSION__="${VERSION_NAME}"`);
  html = html.replace(/<script src="\/owner-(?:update-guard|connection-flex|bootstrap|tables-pro)\.js"><\/script>\s*/g, "");
  const inject =
    '    <script src="/owner-update-guard.js"></script>\n' +
    '    <script src="/owner-connection-flex.js"></script>\n' +
    '    <script src="/owner-bootstrap.js"></script>\n' +
    '    <script src="/owner-tables-pro.js"></script>\n';
  html = html.replace("<head>", "<head>\n" + inject);
  if (!html.includes("__ZEKIQ_OWNER_EXT_VERSION__")) {
    html = html.replace("<head>", `<head>\n<script>window.__ZEKIQ_OWNER_EXT_VERSION__="${VERSION_NAME}"</script>\n`);
  }
  fs.writeFileSync(indexPath, html);
}

run(`${APKTOOL} b "${decodeDir}" -o "${builtApk}"`);

const uberSigner = process.env.UBER_APK_SIGNER || "/tmp/uber-apk-signer.jar";
if (!fs.existsSync(uberSigner)) {
  run(`curl -sL -o "${uberSigner}" https://github.com/patrickfav/uber-apk-signer/releases/download/v1.3.0/uber-apk-signer-1.3.0.jar`);
}
run(
  `java -jar "${uberSigner}" -a "${builtApk}" --ks "${RELEASE_KEYSTORE}" --ksAlias "${RELEASE_KS_ALIAS}" --ksPass "${RELEASE_KS_PASS}" --ksKeyPass "${RELEASE_KS_PASS}" --allowResign --overwrite`
);

fs.copyFileSync(builtApk, OUT_APK);
if (MANAGER) fs.copyFileSync(builtApk, LEGACY_APK);
console.log(`Done: ${path.basename(OUT_APK)} v${VERSION_NAME} (${PKG}) release-signed`);
console.log(`CDN: ${CDN_BASE}/${path.basename(OUT_APK)}?v=${VERSION}`);
