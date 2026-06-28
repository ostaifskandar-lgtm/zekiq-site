#!/usr/bin/env node
/**
 * Build ZEKiQ Manager — com.zekiq.manager, debug-signed, embedded fixes.
 * Installs ALONGSIDE com.tonino.owner (no uninstall required on Samsung).
 *
 * ToninoOwner.apk stays release-signed (restore via patch-owner-apk.mjs restore).
 */
import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = path.join(ROOT, "android", "ToninoOwner-release-base.apk");
const OUT = path.join(ROOT, "downloads", "ZEKiQManager.apk");
const RELEASE_OUT = path.join(ROOT, "downloads", "ToninoOwner.apk");
const KEYSTORE = path.join(ROOT, "android", "owner-debug.keystore");
const STORE_PASS = "android";
const APKTOOL = process.env.APKTOOL || "java -jar /tmp/apktool.jar";
const PKG = "com.zekiq.manager";
const VERSION_CODE = "210";
const VERSION_NAME = "2.1.0";

const SCRIPTS = [
  "owner-runtime-fix.js",
  "owner-storage-native.js",
  "owner-update-guard.js",
  "owner-login-fix.js",
  "owner-connection-flex.js",
  "owner-bootstrap.js",
  "owner-tables-pro.js"
];

const ASSET_MAP = SCRIPTS.map((f) => [`js/${f}`, `assets/public/${f}`]);

function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

if (!fs.existsSync(BASE)) {
  console.error("Missing release base:", BASE);
  process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "zekiq-mgr-"));
const decodeDir = path.join(tmp, "decode");
const builtApk = path.join(tmp, "built.apk");

console.log("Decoding release base...");
run(`${APKTOOL} d -f "${BASE}" -o "${decodeDir}"`);

const ymlPath = path.join(decodeDir, "apktool.yml");
if (fs.existsSync(ymlPath)) {
  let yml = fs.readFileSync(ymlPath, "utf8");
  yml = yml.replace(/versionCode:\s*\d+/, `versionCode: ${VERSION_CODE}`);
  yml = yml.replace(/versionName:\s*[^\n]+/, `versionName: ${VERSION_NAME}`);
  yml = yml.replace(/renameManifestPackage:.*\n/g, "");
  fs.writeFileSync(ymlPath, yml);
}

const manifestPath = path.join(decodeDir, "AndroidManifest.xml");
if (fs.existsSync(manifestPath)) {
  let manifest = fs.readFileSync(manifestPath, "utf8");
  manifest = manifest.replace(/package="com\.tonino\.owner"/, `package="${PKG}"`);
  manifest = manifest.replace(/com\.tonino\.owner/g, PKG);
  fs.writeFileSync(manifestPath, manifest);
}

const capCfg = path.join(decodeDir, "assets/capacitor.config.json");
if (fs.existsSync(capCfg)) {
  const buf = fs.readFileSync(capCfg);
  const off = buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf ? 3 : 0;
  const j = JSON.parse(buf.slice(off).toString("utf8"));
  j.appId = PKG;
  j.appName = "ZEKiQ Manager";
  fs.writeFileSync(capCfg, JSON.stringify(j, null, 2));
}

const stringsPath = path.join(decodeDir, "res/values/strings.xml");
if (fs.existsSync(stringsPath)) {
  let s = fs.readFileSync(stringsPath, "utf8");
  s = s.replace(/<string name="app_name">[^<]*<\/string>/, "<string name=\"app_name\">ZEKiQ مدير</string>");
  s = s.replace(/<string name="title_activity_main">[^<]*<\/string>/, "<string name=\"title_activity_main\">ZEKiQ مدير</string>");
  fs.writeFileSync(stringsPath, s);
}

for (const [src, dest] of ASSET_MAP) {
  const to = path.join(decodeDir, dest);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(path.join(ROOT, src), to);
}

const indexPath = path.join(decodeDir, "assets/public/index.html");
if (!fs.existsSync(indexPath)) {
  console.error("index.html not found");
  process.exit(1);
}

let html = fs.readFileSync(indexPath, "utf8");
html = html.replace(/<script src="\/owner-[^"]+\.js"><\/script>\s*/g, "");
const inject = SCRIPTS.map((f) => `    <script src="/${f}"></script>`).join("\n");
const versionTag = `<script>window.__ZEKIQ_OWNER_EXT_VERSION__="${VERSION_NAME}";window.__TONINO_APP_TARGET__="owner";try{localStorage.setItem("zekiq-manager-native","1");localStorage.setItem("tonino-owner-native-apk","1")}catch(e){}</script>`;
if (!html.includes("owner-runtime-fix.js")) {
  html = html.replace("<head>", `<head>\n${inject}\n${versionTag}\n`);
}
fs.writeFileSync(indexPath, html);

console.log("Building APK...");
run(`${APKTOOL} b "${decodeDir}" -o "${builtApk}"`);

const uberSigner = process.env.UBER_APK_SIGNER || "/tmp/uber-apk-signer.jar";
if (!fs.existsSync(uberSigner)) {
  run(`curl -sL -o "${uberSigner}" https://github.com/patrickfav/uber-apk-signer/releases/download/v1.3.0/uber-apk-signer-1.3.0.jar`);
}
run(
  `java -jar "${uberSigner}" -a "${builtApk}" --ks "${KEYSTORE}" --ksAlias androiddebugkey --ksPass "${STORE_PASS}" --ksKeyPass "${STORE_PASS}" --allowResign --overwrite`
);

console.log("Restoring release-signed ToninoOwner.apk...");
run(`node "${path.join(ROOT, "scripts/patch-owner-apk.mjs")}" restore`, { stdio: "inherit" });

fs.copyFileSync(builtApk, OUT);

console.log("Done:");
console.log("  ZEKiQManager.apk =", OUT, "(com.zekiq.manager — install WITHOUT uninstall)");
console.log("  ToninoOwner.apk  =", RELEASE_OUT, "(com.tonino.owner — Samsung upgrade only)");
