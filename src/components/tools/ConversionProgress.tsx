"use client";

import { motion } from "framer-motion";
import { ArrowRight, LucideIcon } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface ConversionProgressProps {
    progress: number;
    stage: string;
    sourceIcon: LucideIcon;
    targetIcon: LucideIcon;
    sourceColor: string;
    targetColor: string;
    sourceFormat: string;
    targetFormat: string;
}

export function ConversionProgress({
    progress,
    stage,
    sourceIcon: SourceIcon,
    targetIcon: TargetIcon,
    sourceColor,
    targetColor,
    sourceFormat,
    targetFormat,
}: ConversionProgressProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6 space-y-5"
        >
            {/* Format Flow */}
            <div className="flex items-center justify-center gap-3">
                <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${sourceColor} flex items-center justify-center text-white shadow-md`}>
                        <SourceIcon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                        {sourceFormat}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 mb-5">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-primary-400"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{
                                duration: 1.2,
                                repeat: Infinity,
                                delay: i * 0.2,
                            }}
                        />
                    ))}
                    <ArrowRight className="w-4 h-4 text-surface-400" aria-hidden="true" />
                </div>
                <div className="flex flex-col items-center gap-1.5">
                    <motion.div
                        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${targetColor} flex items-center justify-center text-white shadow-md`}
                        animate={{ opacity: [0.5, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
                    >
                        <TargetIcon className="w-5 h-5" aria-hidden="true" />
                    </motion.div>
                    <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                        {targetFormat}
                    </span>
                </div>
            </div>

            {/* Progress */}
            <ProgressBar value={progress} />

            {/* Stage Text */}
            <p className="text-sm text-center text-surface-500 dark:text-surface-400">
                {stage || "Processing\u2026"}
            </p>
        </motion.div>
    );
}
