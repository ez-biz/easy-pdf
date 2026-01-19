"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
    value: number;
    max?: number;
    showLabel?: boolean;
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function ProgressBar({
    value,
    max = 100,
    showLabel = true,
    size = "md",
    className,
}: ProgressBarProps) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizes = {
        sm: "h-1.5",
        md: "h-2.5",
        lg: "h-4",
    };

    return (
        <div className={cn("w-full", className)}>
            <div
                className={cn(
                    "w-full bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden",
                    sizes[size]
                )}
            >
                <div
                    className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {showLabel && (
                <div className="flex justify-between mt-1.5">
                    <span className="text-xs text-surface-500 dark:text-surface-400">
                        {Math.round(percentage)}%
                    </span>
                </div>
            )}
        </div>
    );
}
