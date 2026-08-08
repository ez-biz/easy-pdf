import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import nextra from "nextra";
import fs from "node:fs";
import path from "node:path";

/**
 * Every route this app exports, as the .html file `output: "export"` produces.
 *
 * Workbox precaches these so each tool works offline even if the user never
 * opened it before going offline. We list the `.html` paths (which always
 * exist on disk) rather than clean URLs, and rely on Workbox's `cleanURLs`
 * behaviour to resolve a `/flatten-pdf` navigation to the `/flatten-pdf.html`
 * entry — and `directoryIndex` to resolve `/` to `/index.html`.
 */
function collectRouteDocuments(): string[] {
    const appDir = path.join(process.cwd(), "src", "app");
    const routes: string[] = [];

    const walk = (dir: string, segments: string[]) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            if (!entry.isDirectory()) continue;
            const name = entry.name;
            // Route groups "(tools)" and private "_folders" add no URL segment.
            if (name.startsWith("_") || name.startsWith("@")) continue;
            const next = name.startsWith("(") && name.endsWith(")") ? segments : [...segments, name];
            walk(path.join(dir, name), next);
        }

        const hasPage = ["page.tsx", "page.ts", "page.mdx", "page.jsx", "page.js"].some((f) =>
            fs.existsSync(path.join(dir, f)),
        );
        if (hasPage) {
            routes.push(segments.length === 0 ? "/index.html" : `/${segments.join("/")}.html`);
        }
    };

    walk(appDir, []);
    return [...new Set(routes)].sort();
}

// Changes every production build so the precached HTML is refreshed on deploy.
const BUILD_REVISION = Date.now().toString(36);

const withPWA = withPWAInit({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: true,
    workboxOptions: {
        // The exported HTML documents. Without these the app shell's JS is
        // cached but every navigation still needs the network.
        additionalManifestEntries: collectRouteDocuments().map((url) => ({
            url,
            revision: BUILD_REVISION,
        })),
        runtimeCaching: [
            {
                // Self-hosted OCR models + onnxruntime-web wasm — cache for offline reuse.
                urlPattern: /\/(?:models\/ppocr|ort)\/.*\.(?:ort|onnx|wasm|mjs|txt)$/i,
                handler: "CacheFirst",
                options: {
                    cacheName: "ocr-assets",
                    expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 90 },
                    cacheableResponse: { statuses: [0, 200] },
                },
            },
            {
                // Google Fonts stylesheet + font files. Precaching can't cover
                // these (cross-origin), so they become offline-capable after the
                // first online load — which is the visit the user installs from.
                urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
                handler: "CacheFirst",
                options: {
                    cacheName: "google-fonts",
                    expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
                    cacheableResponse: { statuses: [0, 200] },
                },
            },
            {
                // Safety net for any navigation the precache misses: serve fresh
                // when online, fall back to the last-seen copy when offline.
                urlPattern: ({ request }: { request: Request }) => request.mode === "navigate",
                handler: "NetworkFirst",
                options: {
                    cacheName: "pages",
                    expiration: { maxEntries: 64 },
                    cacheableResponse: { statuses: [0, 200] },
                },
            },
        ],
    },
});

const withNextra = nextra({
    defaultShowCopyCode: true,
});

const nextConfig: NextConfig = {
    output: "export",
    images: {
        unoptimized: true,
    },
    webpack: (config, { isServer }) => {
        // Handle pdf.js worker
        config.resolve.alias.canvas = false;
        config.resolve.alias.encoding = false;

        if (!isServer) {
            // Strip node: prefix so fallbacks can handle them (pptxgenjs, etc.)
            config.plugins.push({
                apply(compiler: { hooks: { normalModuleFactory: { tap: (name: string, cb: (nmf: { hooks: { beforeResolve: { tap: (name: string, cb: (resolve: { request: string }) => void) => void } } }) => void) => void } } }) {
                    compiler.hooks.normalModuleFactory.tap("node-prefix-strip", (nmf) => {
                        nmf.hooks.beforeResolve.tap("node-prefix-strip", (resolve) => {
                            if (resolve.request.startsWith("node:")) {
                                resolve.request = resolve.request.slice(5);
                            }
                        });
                    });
                },
            });

            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                path: false,
                https: false,
                http: false,
                stream: false,
                zlib: false,
                url: false,
                util: false,
                crypto: false,
            };
        }

        return config;
    },
};

export default withPWA(withNextra(nextConfig));
