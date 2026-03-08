"use client";

import { useEffect } from "react";
import { initSentry } from "@/lib/sentry";

let initialized = false;

export function SentryInit() {
    useEffect(() => {
        if (!initialized) {
            initSentry();
            initialized = true;
        }
    }, []);
    return null;
}
