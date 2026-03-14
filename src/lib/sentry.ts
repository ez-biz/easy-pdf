import * as Sentry from "@sentry/react";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

export function initSentry() {
    if (!SENTRY_DSN) return;

    Sentry.init({
        dsn: SENTRY_DSN,
        environment: process.env.NEXT_PUBLIC_VERCEL_ENV || "development",
        sampleRate: 1.0,
        tracesSampleRate: 0.2,
        integrations: [Sentry.browserTracingIntegration()],
    });
}

export { Sentry };
