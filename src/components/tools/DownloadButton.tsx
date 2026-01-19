"use client";

import { Download, Loader2, CheckCircle } from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

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
    return (
        <div
            className={cn(
                "flex flex-col items-center gap-4 p-8 bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700",
                className
            )}
        >
            {isReady ? (
                <>
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-1">
                            Your file is ready!
                        </h3>
                        <p className="text-sm text-surface-500 dark:text-surface-400">
                            {filename}
                            {fileSize && ` · ${formatFileSize(fileSize)}`}
                        </p>
                    </div>
                    <Button onClick={onClick} size="lg" leftIcon={<Download className="w-5 h-5" />}>
                        Download File
                    </Button>
                </>
            ) : isLoading ? (
                <>
                    <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-1">
                            Processing...
                        </h3>
                        <p className="text-sm text-surface-500 dark:text-surface-400">
                            Please wait while we process your file
                        </p>
                    </div>
                </>
            ) : null}
        </div>
    );
}
