"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_KEY = "easypdf-install-prompt-dismissed";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days before showing again

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [installed, setInstalled] = useState(false);

    const isStandalone = useCallback(() => {
        if (typeof window === "undefined") return false;
        return (
            window.matchMedia("(display-mode: standalone)").matches ||
            (navigator as Navigator & { standalone?: boolean }).standalone === true
        );
    }, []);

    useEffect(() => {
        // Don't show if already installed
        if (isStandalone()) {
            setInstalled(true);
            return;
        }

        // Check if user recently dismissed
        const dismissedAt = localStorage.getItem(DISMISS_KEY);
        if (dismissedAt) {
            const elapsed = Date.now() - parseInt(dismissedAt, 10);
            if (elapsed < DISMISS_DURATION_MS) return;
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Show after a short delay so the page has loaded
            setTimeout(() => setShowPrompt(true), 2000);
        };

        const handleAppInstalled = () => {
            setInstalled(true);
            setShowPrompt(false);
            setDeferredPrompt(null);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.addEventListener("appinstalled", handleAppInstalled);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
            window.removeEventListener("appinstalled", handleAppInstalled);
        };
    }, [isStandalone]);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === "accepted") {
                setInstalled(true);
                setShowPrompt(false);
            }
        } catch {
            // User dismissed the native prompt
        } finally {
            setDeferredPrompt(null);
            setShowPrompt(false);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem(DISMISS_KEY, Date.now().toString());
    };

    if (installed || !showPrompt) return null;

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ y: -80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -80, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="fixed top-16 inset-x-0 z-40 flex justify-center px-4"
                >
                    <div className="w-full max-w-lg bg-surface-800 dark:bg-surface-800 border border-surface-700 rounded-2xl shadow-2xl backdrop-blur-xl">
                        <div className="flex items-center gap-4 px-5 py-4">
                            {/* App Icon */}
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/25">
                                <Image
                                    src="/icons/icon-192x192.png"
                                    alt="EasyPDF"
                                    width={32}
                                    height={32}
                                    className="w-8 h-8 rounded-lg"
                                />
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white text-sm leading-tight">
                                    Install EasyPDF
                                </p>
                                <p className="text-surface-400 text-xs mt-0.5 leading-tight">
                                    Work offline &amp; faster access
                                </p>
                            </div>

                            {/* Install Button */}
                            <button
                                onClick={handleInstall}
                                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-xl transition-colors flex-shrink-0"
                            >
                                Install
                            </button>

                            {/* Close */}
                            <button
                                onClick={handleDismiss}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors flex-shrink-0"
                                aria-label="Dismiss install prompt"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
