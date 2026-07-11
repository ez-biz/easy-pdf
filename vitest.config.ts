import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    // Use the automatic JSX runtime (matches Next.js) so component tests can
    // render JSX without React in scope.
    esbuild: {
        jsx: "automatic",
    },
    test: {
        environment: "jsdom",
        globals: true,
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
