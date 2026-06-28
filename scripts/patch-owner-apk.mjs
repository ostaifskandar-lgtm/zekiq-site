#!/usr/bin/env node
/**
 * Patch ToninoOwner.apk with latest owner extension scripts and re-sign.
 * Usage: node scripts/patch-owner-apk.mjs [versionCode]
 */
import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VERSION = String(process.argv[2] || "40");
const VERSION_NAME = `1.0.${VERSION}`;
const APK_PATH = path.join(ROOT, "downloads", "ToninoOwner.apk");
const KEYSTORE = path.join(ROOT, "android", "owner-debug.keystore");
const STORE_PASS = "android";

const FILES = [
  ["js/owner-bootstrap.js", "assets/public/owner-bootstrap.js"],
  ["js/owner-tables-pro.js", "assets/public/owner-tables-pro.js"]
];

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: "inherit", ...opts });
}

if (!fs.existsSync(APK_PATH)) {
  console.error("APK not found:", APK_PATH);
  process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "owner-apk-"));
const extractDir = path.join(tmp, "apk");
fs.mkdirSync(extractDir);

console.log("Extracting APK...");
run(`unzip -q "${APK_PATH}" -d "${extractDir}"`);

for (const [src, dest] of FILES) {
  const from = path.join(ROOT, src);
  const to = path.join(extractDir, dest);
  if (!fs.existsSync(from)) {
    console.error("Missing:", from);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  console.log("Updated", dest);
}

const indexPath = path.join(extractDir, "assets/public/index.html");
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, "utf8");
  html = html.replace(
    /window\.__ZEKIQ_OWNER_EXT_VERSION__\s*=\s*"[^"]*"/,
    `window.__ZEKIQ_OWNER_EXT_VERSION__="${VERSION_NAME}"`
  );
  if (!html.includes("owner-bootstrap.js")) {
    html = html.replace(
      "</head>",
      '    <script src="/owner-bootstrap.js"></script>\n    <script src="/owner-tables-pro.js"></script>\n  </head>'
    );
  }
  fs.writeFileSync(indexPath, html);
  console.log("Updated index.html version ->", VERSION_NAME);
}

const outApk = path.join(tmp, "unsigned.apk");
console.log("Repacking APK...");
run(`cd "${extractDir}" && zip -qr "${outApk}" .`);

fs.copyFileSync(outApk, APK_PATH);
console.log("Signing APK...");
run(
  `jarsigner -sigalg SHA256withRSA -digestalg SHA-256 -keystore "${KEYSTORE}" -storepass "${STORE_PASS}" -keypass "${STORE_PASS}" "${APK_PATH}" androiddebugkey`
);

console.log(`Done: ToninoOwner.apk patched to v${VERSION_NAME}`);
