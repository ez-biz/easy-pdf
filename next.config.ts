import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import nextra from "nextra";

const withPWA = withPWAInit({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: true,
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
