#!/usr/bin/env node
/**
 * Merge protected production shops into guest-api.json.
 * Prevents dev-cashier auto-publish from wiping Tonino (and other live venues).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const guestPath = join(root, "guest-api.json");
const lockPath = join(root, "guest-api-protected-shops.json");

const guest = JSON.parse(readFileSync(guestPath, "utf8"));
const lock = JSON.parse(readFileSync(lockPath, "utf8"));

guest.shops = guest.shops && typeof guest.shops === "object" ? guest.shops : {};

for (const [key, shop] of Object.entries(lock.shops || {})) {
  const prev = guest.shops[key] || {};
  guest.shops[key] = {
    ...shop,
    ...prev,
    tunnelUrl: shop.tunnelUrl || prev.tunnelUrl,
    lanUrl: shop.lanUrl || prev.lanUrl,
    shopName: shop.shopName || prev.shopName,
    hostname: shop.hostname || prev.hostname,
    updatedAt: prev.updatedAt || new Date().toISOString(),
  };
}

const prod = lock.defaultProduction || {};
const topIsDev = String(guest.apiUrl || "").includes("zekiq-dev");
const hasTonino = Boolean(guest.shops["192.168.1.25"] || guest.shops["tonino.zekiqmenu.com"]);

if (topIsDev && hasTonino && prod.apiUrl) {
  guest.apiUrl = prod.apiUrl;
  guest.tunnelUrl = prod.tunnelUrl || prod.apiUrl;
  guest.lanUrl = prod.lanUrl || guest.lanUrl;
}

writeFileSync(guestPath, JSON.stringify(guest, null, 2) + "\n");
console.log("guest-api.json merged with protected shops");
