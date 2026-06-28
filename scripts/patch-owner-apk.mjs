#!/usr/bin/env node
/**
 * Patch Owner/Manager APK: bump version, inject scripts, optional relabel.
 * Usage:
 *   node scripts/patch-owner-apk.mjs [versionCode]           → ToninoOwner.apk (legacy)
 *   node scripts/patch-owner-apk.mjs manager [versionCode]   → ZEKiQManager.apk (relabel, same package)
 */
import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const MANAGER = args[0] === "manager";
const VERSION = String(MANAGER ? (args[1] || "201") : (args[0] || "54"));
const VERSION_NAME = MANAGER ? "2.0.1" : `1.0.${VERSION}`;
const LEGACY_APK = path.join(ROOT, "downloads", "ToninoOwner.apk");
const MANAGER_APK = path.join(ROOT, "downloads", "ZEKiQManager.apk");
const SOURCE_APK = LEGACY_APK;
const OUT_APK = MANAGER ? MANAGER_APK : LEGACY_APK;
const KEYSTORE = path.join(ROOT, "android", "owner-debug.keystore");
const STORE_PASS = "android";
const APKTOOL = process.env.APKTOOL || "java -jar /tmp/apktool.jar";
const PKG = "com.tonino.owner";
const APP_LABEL_AR = "ZEKiQ مدير";
const APP_LABEL_EN = "ZEKiQ Manager";

const FILES = [
  ["js/owner-update-guard.js", "assets/public/owner-update-guard.js"],
  ["js/owner-connection-flex.js", "assets/public/owner-connection-flex.js"],
  ["js/owner-bootstrap.js", "assets/public/owner-bootstrap.js"],
  ["js/owner-tables-pro.js", "assets/public/owner-tables-pro.js"]
];

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: "inherit", ...opts });
}

function relabelApp(decodeDir) {
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
  console.log("Relabeled ->", APP_LABEL_AR, "| package kept ->", PKG);
}

if (!fs.existsSync(SOURCE_APK)) {
  console.error("APK not found:", SOURCE_APK);
  process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "zekiq-apk-"));
const decodeDir = path.join(tmp, "decode");
const builtApk = path.join(tmp, "dist.apk");

console.log(MANAGER ? "Building ZEKiQ Manager (same package, Samsung-safe)..." : "Patching ToninoOwner.apk...");
run(`${APKTOOL} d -f "${SOURCE_APK}" -o "${decodeDir}"`);

const ymlPath = path.join(decodeDir, "apktool.yml");
if (fs.existsSync(ymlPath)) {
  let yml = fs.readFileSync(ymlPath, "utf8");
  yml = yml.replace(/versionCode:\s*\d+/, `versionCode: ${VERSION}`);
  yml = yml.replace(/versionName:\s*[^\n]+/, `versionName: ${VERSION_NAME}`);
  yml = yml.replace(/renameManifestPackage:.*\n/g, "");
  fs.writeFileSync(ymlPath, yml);
  console.log("Version ->", VERSION_NAME, `(code ${VERSION})`);
}

if (MANAGER) {
  relabelApp(decodeDir);
}

for (const [src, dest] of FILES) {
  const from = path.join(ROOT, src);
  const to = path.join(decodeDir, dest);
  if (!fs.existsSync(from)) {
    console.error("Missing:", from);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

const indexPath = path.join(decodeDir, "assets/public/index.html");
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, "utf8");
  html = html.replace(
    /window\.__ZEKIQ_OWNER_EXT_VERSION__\s*=\s*"[^"]*"/,
    `window.__ZEKIQ_OWNER_EXT_VERSION__="${VERSION_NAME}"`
  );
  if (MANAGER) {
    html = html.replace(
      /localStorage\.setItem\("tonino-owner-native-apk","1"\)/,
      `localStorage.setItem("tonino-owner-native-apk","1");localStorage.setItem("zekiq-manager-native","1")`
    );
  }
  html = html.replace(/<script src="\/owner-(?:update-guard|connection-flex|bootstrap|tables-pro)\.js"><\/script>\s*/g, "");
  const inject =
    '    <script src="/owner-update-guard.js"></script>\n' +
    '    <script src="/owner-connection-flex.js"></script>\n' +
    '    <script src="/owner-bootstrap.js"></script>\n' +
    '    <script src="/owner-tables-pro.js"></script>\n';
  html = html.replace("<head>", "<head>\n" + inject);
  fs.writeFileSync(indexPath, html);
}

console.log("Building APK...");
run(`${APKTOOL} b "${decodeDir}" -o "${builtApk}"`);

console.log("Signing APK (v1+v2+v3)...");
const uberSigner = process.env.UBER_APK_SIGNER || "/tmp/uber-apk-signer.jar";
if (!fs.existsSync(uberSigner)) {
  run(`curl -sL -o "${uberSigner}" https://github.com/patrickfav/uber-apk-signer/releases/download/v1.3.0/uber-apk-signer-1.3.0.jar`);
}
run(
  `java -jar "${uberSigner}" -a "${builtApk}" --ks "${KEYSTORE}" --ksAlias androiddebugkey --ksPass "${STORE_PASS}" --ksKeyPass "${STORE_PASS}" --allowResign --overwrite`
);

fs.copyFileSync(builtApk, OUT_APK);
if (MANAGER) {
  fs.copyFileSync(builtApk, LEGACY_APK);
  console.log("Also updated ToninoOwner.apk (same build)");
}
const idsig = OUT_APK + ".idsig";
if (fs.existsSync(idsig)) fs.unlinkSync(idsig);

console.log(`Done: ${path.basename(OUT_APK)} -> v${VERSION_NAME} (${PKG})`);
