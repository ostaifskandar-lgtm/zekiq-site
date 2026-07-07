#!/usr/bin/env node
/**
 * Migrate Tonino cashier LAN IP across site configs.
 * Usage: node scripts/migrate-cashier-ip.mjs 192.168.1.49
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const NEW_IP = process.argv[2];
const OLD_IP = process.argv[3] || "192.168.1.25";
const PORT = process.argv[4] || "3000";

if (!NEW_IP || !/^\d{1,3}(\.\d{1,3}){3}$/.test(NEW_IP)) {
  console.error("Usage: node scripts/migrate-cashier-ip.mjs <new-ip> [old-ip] [port]");
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const LAN = `http://${NEW_IP}:${PORT}`;
const OLD_LAN = `http://${OLD_IP}:${PORT}`;
const TUNNEL = "https://tonino.zekiqmenu.com";
const now = new Date().toISOString();

function readJson(p) {
  return JSON.parse(readFileSync(p, "utf8"));
}

function writeJson(p, data) {
  writeFileSync(p, JSON.stringify(data, null, 2) + "\n");
}

function replaceInFile(path, pairs) {
  let s = readFileSync(path, "utf8");
  let changed = false;
  for (const [from, to] of pairs) {
    if (s.includes(from)) {
      s = s.split(from).join(to);
      changed = true;
    }
  }
  if (changed) writeFileSync(path, s);
  return changed;
}

// owner-config.json
const ownerCfgPath = join(root, "owner-config.json");
const ownerCfg = readJson(ownerCfgPath);
ownerCfg.lanHost = NEW_IP;
ownerCfg.lanPort = PORT;
ownerCfg.lanUrl = LAN;
ownerCfg.updatedAt = now;
writeJson(ownerCfgPath, ownerCfg);

// guest-api-protected-shops.json
const lockPath = join(root, "guest-api-protected-shops.json");
const lock = readJson(lockPath);
lock.defaultProduction.lanUrl = LAN;
const shopEntry = {
  tunnelUrl: TUNNEL,
  lanUrl: LAN,
  shopName: "Tonino",
  hostname: "tonino.zekiqmenu.com",
  updatedAt: now
};
delete lock.shops[OLD_IP];
lock.shops[NEW_IP] = shopEntry;
lock.shops["tonino.zekiqmenu.com"] = shopEntry;
writeJson(lockPath, lock);

// guest-api.json
const guestPath = join(root, "guest-api.json");
const guest = readJson(guestPath);
guest.lanUrl = LAN;
guest.updatedAt = now;
guest.shops = guest.shops || {};
delete guest.shops[OLD_IP];
guest.shops[NEW_IP] = { ...shopEntry };
guest.shops["tonino.zekiqmenu.com"] = { ...shopEntry };
writeJson(guestPath, guest);

// guest-api-tonino.json
writeJson(join(root, "guest-api-tonino.json"), {
  apiUrl: TUNNEL,
  tunnelUrl: TUNNEL,
  lanUrl: LAN,
  shopName: "Tonino",
  updatedAt: now
});

const textPairs = [
  [OLD_IP, NEW_IP],
  [OLD_LAN, LAN]
];

const dirs = ["js", "."];
const exts = new Set([".js", ".html", ".json"]);
let touched = 0;

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git" || name === "downloads" || name === "android") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else if (exts.has(name.slice(name.lastIndexOf(".")))) {
      if (name === "guest-api.json" || name === "guest-api-protected-shops.json" || name === "owner-config.json" || name === "guest-api-tonino.json") continue;
      if (replaceInFile(p, textPairs)) touched++;
    }
  }
}

walk(join(root, "js"));
for (const f of ["manager.html", "tablet-replace.html", "owner-connect.html", "owner-resync.html", "owner-wifi-fix.html", "cashier-replace.html"]) {
  const p = join(root, f);
  try {
    if (replaceInFile(p, textPairs)) touched++;
  } catch (_) {}
}

console.log(`Migrated Tonino cashier: ${OLD_IP} → ${NEW_IP}:${PORT}`);
console.log(`LAN: ${LAN}`);
console.log(`Updated text files: ${touched}`);
console.log("Next: commit, push main, restart tunnel on new cashier PC");
