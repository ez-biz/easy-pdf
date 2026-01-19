"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { Toast, ToastType } from "@/components/ui/Toast";

interface ToastMessage {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastContextType {
    showToast: (type: ToastType, message: string, duration?: number) => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback(
        (type: ToastType, message: string, duration: number = 4000) => {
            const id = Math.random().toString(36).substring(2, 9);
            const toast: ToastMessage = { id, type, message, duration };

            setToasts((prev) => [...prev, toast]);

            if (duration > 0) {
                setTimeout(() => {
                    removeToast(id);
                }, duration);
            }
        },
        [removeToast]
    );

    const success = useCallback(
        (message: string, duration?: number) => showToast("success", message, duration),
        [showToast]
    );

    const error = useCallback(
        (message: string, duration?: number) => showToast("error", message, duration),
        [showToast]
    );

    const warning = useCallback(
        (message: string, duration?: number) => showToast("warning", message, duration),
        [showToast]
    );

    const info = useCallback(
        (message: string, duration?: number) => showToast("info", message, duration),
        [showToast]
    );

    return (
        <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
            {children}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <Toast
                            key={toast.id}
                            type={toast.type}
                            message={toast.message}
                            onClose={() => removeToast(toast.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
