#!/usr/bin/env node
/**
 * Patch ToninoOwner.apk: bump native versionCode, inject extension scripts, re-sign.
 * Usage: node scripts/patch-owner-apk.mjs [versionCode]
 */
import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VERSION = String(process.argv[2] || "41");
const VERSION_NAME = `1.0.${VERSION}`;
const APK_PATH = path.join(ROOT, "downloads", "ToninoOwner.apk");
const KEYSTORE = path.join(ROOT, "android", "owner-debug.keystore");
const STORE_PASS = "android";
const APKTOOL = process.env.APKTOOL || "java -jar /tmp/apktool.jar";

const FILES = [
  ["js/owner-update-guard.js", "assets/public/owner-update-guard.js"],
  ["js/owner-connection-flex.js", "assets/public/owner-connection-flex.js"],
  ["js/owner-bootstrap.js", "assets/public/owner-bootstrap.js"],
  ["js/owner-tables-pro.js", "assets/public/owner-tables-pro.js"]
];

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: "inherit", ...opts });
}

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

if (!fs.existsSync(APK_PATH)) {
  console.error("APK not found:", APK_PATH);
  process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "owner-apk-"));
const decodeDir = path.join(tmp, "decode");
const builtApk = path.join(tmp, "dist.apk");
const signedApk = path.join(tmp, "signed.apk");

console.log("Decoding APK with apktool...");
run(`${APKTOOL} d -f "${APK_PATH}" -o "${decodeDir}"`);

const ymlPath = path.join(decodeDir, "apktool.yml");
if (fs.existsSync(ymlPath)) {
  let yml = fs.readFileSync(ymlPath, "utf8");
  yml = yml.replace(/versionCode:\s*\d+/, `versionCode: ${VERSION}`);
  yml = yml.replace(/versionName:\s*[^\n]+/, `versionName: ${VERSION_NAME}`);
  fs.writeFileSync(ymlPath, yml);
  console.log("Bumped native version ->", VERSION_NAME, `(code ${VERSION})`);
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
  console.log("Updated", dest);
}

const indexPath = path.join(decodeDir, "assets/public/index.html");
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, "utf8");
  html = html.replace(
    /window\.__ZEKIQ_OWNER_EXT_VERSION__\s*=\s*"[^"]*"/,
    `window.__ZEKIQ_OWNER_EXT_VERSION__="${VERSION_NAME}"`
  );
  html = html.replace(
    /try\{localStorage\.setItem\('tonino-owner-bundled-ui-build',"[^"]*"\)\}catch\(e\)\{\}/,
    "try{localStorage.setItem('tonino-owner-bundled-ui-build',\"2026-06-27-134326\")}catch(e){}"
  );
  // Always inject in fixed order; update-guard MUST run first.
  html = html.replace(/<script src="\/owner-(?:update-guard|connection-flex|bootstrap|tables-pro)\.js"><\/script>\s*/g, "");
  const inject =
    '    <script src="/owner-update-guard.js"></script>\n' +
    '    <script src="/owner-connection-flex.js"></script>\n' +
    '    <script src="/owner-bootstrap.js"></script>\n' +
    '    <script src="/owner-tables-pro.js"></script>\n';
  html = html.replace("<head>", "<head>\n" + inject);
  fs.writeFileSync(indexPath, html);
  console.log("Updated index.html");
}

console.log("Building APK...");
run(`${APKTOOL} b "${decodeDir}" -o "${builtApk}"`);

console.log("Signing APK...");
run(
  `jarsigner -sigalg SHA256withRSA -digestalg SHA-256 -keystore "${KEYSTORE}" -storepass "${STORE_PASS}" -keypass "${STORE_PASS}" "${builtApk}" androiddebugkey`
);

fs.copyFileSync(builtApk, APK_PATH);
const verify = sh(`${APKTOOL.replace(/ d .*/, " d")} 2>/dev/null || true`);
try {
  const verifyYml = sh(`grep versionCode "${decodeDir}/apktool.yml"`);
  console.log("Verified:", verifyYml);
} catch {}

console.log(`Done: ToninoOwner.apk -> v${VERSION_NAME} (native code ${VERSION})`);
