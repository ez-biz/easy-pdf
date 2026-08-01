"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
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
    const reduceMotion = useReducedMotion();

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

    // Note: only `installed` short-circuits here. `showPrompt` is left to
    // AnimatePresence — returning null on dismiss would unmount the card
    // instantly and the exit animation would never play.
    if (installed) return null;

    // Card springs in as one piece, then its contents stagger in behind it.
    const card: Variants = {
        hidden: { y: -20, opacity: 0, scale: 0.96 },
        show: {
            y: 0,
            opacity: 1,
            scale: 1,
            transition: reduceMotion
                ? { duration: 0 }
                : { type: "spring", duration: 0.5, bounce: 0, staggerChildren: 0.09, delayChildren: 0.1 },
        },
        // Exits stay softer than enters: a short lift, no scale.
        exit: { y: -12, opacity: 0, transition: { duration: reduceMotion ? 0 : 0.18 } },
    };

    const item: Variants = {
        hidden: { opacity: 0, y: 6 },
        show: {
            opacity: 1,
            y: 0,
            transition: reduceMotion ? { duration: 0 } : { type: "spring", duration: 0.4, bounce: 0 },
        },
    };

    return (
        <div className="fixed top-16 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
            <AnimatePresence>
                {showPrompt && (
                    <motion.div
                        variants={card}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        className={[
                            "w-full max-w-lg pointer-events-auto rounded-3xl p-3",
                            "flex items-center gap-3",
                            "bg-surface-800/95 backdrop-blur-xl",
                            // Layered shadows instead of a hard border, plus a 1px
                            // top highlight so the card reads as lit from above.
                            "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_4px_12px_-2px_rgba(0,0,0,0.4),0_18px_44px_-12px_rgba(0,0,0,0.55)]",
                        ].join(" ")}
                    >
                        {/* App icon — 12px radius inside 12px padding keeps it concentric with the 24px card */}
                        <motion.div
                            variants={item}
                            className="relative w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 shadow-[0_6px_16px_-4px_rgba(20,184,166,0.55),inset_0_1px_0_0_rgba(255,255,255,0.25)]"
                        >
                            <Image
                                src="/icons/icon-192x192.png"
                                alt=""
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded outline outline-1 -outline-offset-1 outline-white/10"
                            />
                        </motion.div>

                        {/* Text */}
                        <motion.div variants={item} className="flex-1 min-w-0">
                            <p className="font-semibold text-white text-sm leading-tight text-balance">
                                Install EasyPDF
                            </p>
                            <p className="text-surface-400 text-xs mt-0.5 leading-tight text-pretty">
                                Work offline &amp; faster access
                            </p>
                        </motion.div>

                        {/* Actions */}
                        <motion.div variants={item} className="flex items-center gap-1 flex-shrink-0">
                            <button
                                onClick={handleInstall}
                                className="inline-flex items-center justify-center min-h-10 px-4 rounded-xl bg-primary-500 hover:bg-primary-400 text-white text-sm font-medium shadow-[0_4px_12px_-2px_rgba(20,184,166,0.5)] hover:shadow-[0_6px_18px_-2px_rgba(45,212,191,0.6)] active:scale-[0.96] transition-[background-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
                            >
                                Install
                            </button>

                            <button
                                onClick={handleDismiss}
                                className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-surface-400 hover:text-white hover:bg-white/10 active:scale-[0.96] transition-[color,background-color,transform] duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
                                aria-label="Dismiss install prompt"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
