"use client";

import { Download, Loader2, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatFileSize } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { usePathname } from "next/navigation";
import { trackToolUsage } from "@/lib/analytics";

interface DownloadButtonProps {
    onClick: () => void;
    filename: string;
    fileSize?: number;
    isLoading?: boolean;
    isReady?: boolean;
    className?: string;
}

export function DownloadButton({
    onClick,
    filename,
    fileSize,
    isLoading = false,
    isReady = false,
    className,
}: DownloadButtonProps) {
    const pathname = usePathname();

    const handleClick = () => {
        const toolName = pathname?.split("/").pop() || "unknown-tool";
        trackToolUsage(toolName, "download");
        onClick();
    };

    return (
        <AnimatePresence mode="wait">
            {isReady ? (
                <motion.div
                    key="ready"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                        "flex flex-col items-center gap-5 p-8 bg-white dark:bg-surface-800 rounded-2xl border-2 border-green-200 dark:border-green-800/50 shadow-lg",
                        className
                    )}
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                        className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
                    >
                        <CheckCircle className="w-8 h-8 text-green-500" aria-hidden="true" />
                    </motion.div>
                    <div className="text-center">
                        <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-1">
                            Your file is ready!
                        </h3>
                        <p className="text-sm text-surface-500 dark:text-surface-400">
                            {filename}
                            {fileSize && ` · ${formatFileSize(fileSize)}`}
                        </p>
                    </div>
                    <Button onClick={handleClick} size="lg" leftIcon={<Download className="w-5 h-5" />}>
                        Download File
                    </Button>
                </motion.div>
            ) : isLoading ? (
                <motion.div
                    key="loading"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(
                        "flex flex-col items-center gap-5 p-8 bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700",
                        className
                    )}
                >
                    <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" aria-hidden="true" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-1">
                            Processing&hellip;
                        </h3>
                        <p className="text-sm text-surface-500 dark:text-surface-400">
                            Please wait while we process your file
                        </p>
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
