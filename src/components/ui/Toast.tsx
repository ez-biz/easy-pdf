import { motion } from "framer-motion";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
    type: ToastType;
    message: string;
    onClose: () => void;
}

const toastConfig = {
    success: {
        icon: CheckCircle,
        bgClass: "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800",
        iconClass: "text-green-600 dark:text-green-400",
        textClass: "text-green-800 dark:text-green-200",
    },
    error: {
        icon: XCircle,
        bgClass: "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800",
        iconClass: "text-red-600 dark:text-red-400",
        textClass: "text-red-800 dark:text-red-200",
    },
    warning: {
        icon: AlertCircle,
        bgClass: "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800",
        iconClass: "text-yellow-600 dark:text-yellow-400",
        textClass: "text-yellow-800 dark:text-yellow-200",
    },
    info: {
        icon: Info,
        bgClass: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800",
        iconClass: "text-blue-600 dark:text-blue-400",
        textClass: "text-blue-800 dark:text-blue-200",
    },
};

export function Toast({ type, message, onClose }: ToastProps) {
    const config = toastConfig[type];
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto min-w-[300px] max-w-md rounded-xl border shadow-lg p-4 ${config.bgClass}`}
        >
            <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconClass}`} />
                <p className={`flex-1 text-sm font-medium ${config.textClass}`}>{message}</p>
                <button
                    onClick={onClose}
                    className={`flex-shrink-0 ${config.iconClass} hover:opacity-70 transition-opacity`}
                    aria-label="Close"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}
