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
    webpack: (config) => {
        // Handle pdf.js worker
        config.resolve.alias.canvas = false;
        config.resolve.alias.encoding = false;
        return config;
    },
};

export default withPWA(withNextra(nextConfig));
