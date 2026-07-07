#!/usr/bin/env node
/**
 * Inject remote-boot + extension scripts into release base APK, re-sign (debug).
 * Output: downloads/ToninoOwner-patched.apk (requires uninstall of release-signed app first)
 */
import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = path.join(ROOT, "android", "ToninoOwner-release-base.apk");
const OUT = path.join(ROOT, "downloads", "ToninoOwner-patched.apk");
const KEYSTORE = path.join(ROOT, "android", "owner-debug.keystore");
const STORE_PASS = "android";
const BOOT_TAG =
  '<script src="https://cdn.jsdelivr.net/gh/ostaifskandar-lgtm/zekiq-site@main/js/owner-remote-boot.js?v=223"></script>';

const FILES = [
  ["js/owner-remote-boot.js", "assets/public/owner-remote-boot.js"],
  ["js/owner-update-guard.js", "assets/public/owner-update-guard.js"],
  ["js/owner-login-fix.js", "assets/public/owner-login-fix.js"],
  ["js/owner-connection-flex.js", "assets/public/owner-connection-flex.js"],
  ["js/owner-tablet-clone.js", "assets/public/owner-tablet-clone.js"],
  ["js/owner-bootstrap.js", "assets/public/owner-bootstrap.js"],
  ["js/owner-tables-pro.js", "assets/public/owner-tables-pro.js"]
];

function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

if (!fs.existsSync(BASE)) {
  console.error("Missing release base:", BASE);
  process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "zekiq-zip-"));
const extractDir = path.join(tmp, "apk");
fs.mkdirSync(extractDir);

run(`unzip -q "${BASE}" -d "${extractDir}"`);

const indexPath = path.join(extractDir, "assets/public/index.html");
if (!fs.existsSync(indexPath)) {
  console.error("index.html not found in APK");
  process.exit(1);
}

let html = fs.readFileSync(indexPath, "utf8");
if (!html.includes("owner-remote-boot.js")) {
  html = html.replace("<head>", "<head>\n" + BOOT_TAG + "\n");
  fs.writeFileSync(indexPath, html);
}

for (const [src, dest] of FILES) {
  const to = path.join(extractDir, dest);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(path.join(ROOT, src), to);
}

const unsigned = path.join(tmp, "unsigned.apk");
run(`cd "${extractDir}" && zip -qr "${unsigned}" .`);

const uberSigner = process.env.UBER_APK_SIGNER || "/tmp/uber-apk-signer.jar";
if (!fs.existsSync(uberSigner)) {
  run(`curl -sL -o "${uberSigner}" https://github.com/patrickfav/uber-apk-signer/releases/download/v1.3.0/uber-apk-signer-1.3.0.jar`);
}
run(
  `java -jar "${uberSigner}" -a "${unsigned}" --ks "${KEYSTORE}" --ksAlias androiddebugkey --ksPass "${STORE_PASS}" --ksKeyPass "${STORE_PASS}" --allowResign --overwrite`
);

fs.copyFileSync(unsigned, OUT);
console.log("Done:", OUT);
console.log("NOTE: uninstall old app first (different signature), then install ToninoOwner-patched.apk");
