#!/usr/bin/env node
/**
 * Patch ZEKiQ POS bundle: enlarge & highlight price on selected order lines.
 *
 * Usage:
 *   node scripts/patch-pos-selected-price.mjs <path-to-index-*.js>
 *   node scripts/patch-pos-selected-price.mjs "C:/ZEKiQ POS/dist/assets/index-f7EHMTO3.js"
 */
import fs from "fs";
import path from "path";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/patch-pos-selected-price.mjs <index-bundle.js>");
  process.exit(1);
}

const abs = path.resolve(file);
if (!fs.existsSync(abs)) {
  console.error("File not found:", abs);
  process.exit(1);
}

let src = fs.readFileSync(abs, "utf8");
const original = src;

const patches = [
  {
    name: "grid-view price",
    from: 'className:"text-xs font-bold tabular-nums text-amber-600",children:`${hl.toLocaleString("tr-TR")}₺`}',
    to: 'className:`${Gn?"text-sm font-black tabular-nums text-blue-700":"text-xs font-bold tabular-nums text-amber-600"}`,children:`${hl.toLocaleString("tr-TR")}₺`}'
  },
  {
    name: "grid-view discounted net price",
    from: 'className:"block text-[11px] font-bold tabular-nums text-violet-700",children:[Gc.toLocaleString("tr-TR"),"₺"]',
    to: 'className:`block font-bold tabular-nums ${Gn?"text-sm text-blue-700":"text-[11px] text-violet-700"}`,children:[Gc.toLocaleString("tr-TR"),"₺"]'
  },
  {
    name: "list-view price",
    from: 'className:`shrink-0 text-sm font-bold tabular-nums ${Mr||Er||Or?"text-gray-400 line-through":wa?"text-emerald-700":pl?"text-violet-700":"text-amber-600"}`',
    to: 'className:`shrink-0 tabular-nums ${Mr||Er||Or?"text-sm font-bold text-gray-400 line-through":wa?"text-sm font-bold text-emerald-700":pl?"text-sm font-bold text-violet-700":Gn?"text-base font-black text-blue-700":"text-sm font-bold text-amber-600"}`'
  }
];

let applied = 0;
for (const p of patches) {
  if (!src.includes(p.from)) {
    console.warn("SKIP (not found):", p.name);
    continue;
  }
  src = src.replace(p.from, p.to);
  applied += 1;
  console.log("OK:", p.name);
}

if (applied === 0) {
  console.error("No patches applied — bundle may already be patched or version changed.");
  process.exit(1);
}

if (src === original) {
  console.error("No changes made.");
  process.exit(1);
}

fs.writeFileSync(abs, src);
console.log("Patched:", abs, `(${applied}/${patches.length} rules)`);
console.log("Restart ZEKiQ POS / refresh browser on /pos");
