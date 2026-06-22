"use client";

import { Loader2 } from "lucide-react";
import { useMobileActionBar } from "./MobileActionContext";

/** Fixed bottom action bar, mobile only. Renders nothing when no action is registered. */
export function MobileActionBar() {
    const action = useMobileActionBar();
    if (!action) return null;

    const { label, onClick, disabled, loading, context } = action;

    return (
        <div
            className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-surface-200 dark:border-surface-700 bg-white/95 dark:bg-surface-800/95 backdrop-blur px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] shadow-[0_-6px_18px_rgba(0,0,0,0.08)]"
        >
            {context && (
                <p className="text-center text-xs text-surface-500 dark:text-surface-400 mb-2">
                    {context}
                </p>
            )}
            <button
                type="button"
                onClick={onClick}
                disabled={disabled || loading}
                className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold text-base shadow-lg shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />}
                {label}
            </button>
        </div>
    );
}
