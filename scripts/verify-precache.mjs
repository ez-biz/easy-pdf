/**
 * Verify the generated service worker's precache manifest against the export.
 *
 * Workbox precaching is all-or-nothing: if a single URL in the manifest 404s
 * during install, the whole service worker fails to install. Users are then
 * left with no SW at all — worse than before it was added. This runs after
 * `npm run build` and fails the build if any precached URL is missing from
 * `out/`, so a renamed or removed route can't ship a broken SW.
 *
 * Run manually with: node scripts/verify-precache.mjs
 */
import fs from "node:fs";
import path from "node:path";

const OUT = "out";
const SW = path.join(OUT, "sw.js");

if (!fs.existsSync(SW)) {
    console.error(`verify-precache: ${SW} not found — run \`npm run build\` first.`);
    process.exit(1);
}

const source = fs.readFileSync(SW, "utf8");
const manifest = source.match(/precacheAndRoute\(\[(.*?)\],/s);

if (!manifest) {
    console.error("verify-precache: no precacheAndRoute() manifest found in sw.js.");
    process.exit(1);
}

const urls = [...manifest[1].matchAll(/url:"([^"]+)"/g)].map((m) => m[1]);

if (urls.length === 0) {
    console.error("verify-precache: precache manifest is empty.");
    process.exit(1);
}

// Resolve a precached URL the way Workbox will serve it, honouring the
// directoryIndex and cleanURLs defaults used for a static export.
const resolve = (url) => {
    const rel = decodeURIComponent(url.split("?")[0]).replace(/^\//, "");
    const candidates = [rel, `${rel}.html`, path.join(rel, "index.html")];
    return candidates.some((c) => {
        const f = path.join(OUT, c);
        return fs.existsSync(f) && fs.statSync(f).isFile();
    });
};

const missing = urls.filter((u) => !resolve(u));
const documents = urls.filter((u) => u.endsWith(".html"));

console.log(`verify-precache: ${urls.length} precached entries (${documents.length} HTML documents)`);

if (missing.length > 0) {
    console.error(
        `verify-precache: ${missing.length} precached URL(s) missing from ${OUT}/ — ` +
            `this would fail the service worker install:`,
    );
    for (const m of missing) console.error(`  - ${m}`);
    process.exit(1);
}

console.log("verify-precache: all precached URLs resolve. OK");
