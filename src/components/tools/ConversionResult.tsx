"use client";

import { motion } from "framer-motion";
import { CheckCircle, LucideIcon, Download } from "lucide-react";
import { formatFileSize } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface ConversionResultProps {
    sourceFormat: string;
    targetFormat: string;
    sourceIcon: LucideIcon;
    targetIcon: LucideIcon;
    sourceColor: string;
    targetColor: string;
    filename: string;
    fileSize: number;
    details?: {
        pageCount?: number;
        sheetCount?: number;
    };
    onDownload: () => void;
    onReset: () => void;
}

export function ConversionResult({
    sourceFormat,
    targetFormat,
    sourceIcon: SourceIcon,
    targetIcon: TargetIcon,
    sourceColor,
    targetColor,
    filename,
    fileSize,
    details,
    onDownload,
    onReset,
}: ConversionResultProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.23, 0.88, 0.26, 0.92] }}
            className="space-y-6"
        >
            {/* Success Header */}
            <div className="relative bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-8 overflow-hidden">
                {/* Subtle success gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-900/10 dark:to-transparent" />

                <div className="relative flex flex-col items-center">
                    {/* Conversion Flow Visual */}
                    <div className="flex items-center gap-4 mb-6">
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="flex flex-col items-center gap-2"
                        >
                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${sourceColor} flex items-center justify-center text-white shadow-lg`}>
                                <SourceIcon className="w-7 h-7" aria-hidden="true" />
                            </div>
                            <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                                {sourceFormat}
                            </span>
                        </motion.div>

                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                            className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30"
                        >
                            <CheckCircle className="w-5 h-5 text-green-500" aria-hidden="true" />
                        </motion.div>

                        <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col items-center gap-2"
                        >
                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${targetColor} flex items-center justify-center text-white shadow-lg`}>
                                <TargetIcon className="w-7 h-7" aria-hidden="true" />
                            </div>
                            <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                                {targetFormat}
                            </span>
                        </motion.div>
                    </div>

                    {/* Success Message */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="text-center mb-6"
                    >
                        <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-1">
                            Conversion Complete
                        </h3>
                        <p className="text-sm text-surface-500 dark:text-surface-400">
                            {filename}
                        </p>
                    </motion.div>

                    {/* Stats Row */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex items-center gap-6 mb-6"
                    >
                        <div className="text-center">
                            <p className="text-2xl font-bold text-surface-900 dark:text-white tabular-nums">
                                {formatFileSize(fileSize)}
                            </p>
                            <p className="text-xs text-surface-500 dark:text-surface-400">File Size</p>
                        </div>
                        {details?.pageCount && (
                            <>
                                <div className="w-px h-8 bg-surface-200 dark:bg-surface-700" />
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-surface-900 dark:text-white tabular-nums">
                                        {details.pageCount}
                                    </p>
                                    <p className="text-xs text-surface-500 dark:text-surface-400">
                                        {details.pageCount === 1 ? "Page" : "Pages"}
                                    </p>
                                </div>
                            </>
                        )}
                        {details?.sheetCount && (
                            <>
                                <div className="w-px h-8 bg-surface-200 dark:bg-surface-700" />
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-surface-900 dark:text-white tabular-nums">
                                        {details.sheetCount}
                                    </p>
                                    <p className="text-xs text-surface-500 dark:text-surface-400">
                                        {details.sheetCount === 1 ? "Sheet" : "Sheets"}
                                    </p>
                                </div>
                            </>
                        )}
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                        className="flex items-center gap-3"
                    >
                        <Button
                            onClick={onDownload}
                            size="lg"
                            leftIcon={<Download className="w-5 h-5" aria-hidden="true" />}
                        >
                            Download {targetFormat}
                        </Button>
                        <Button variant="secondary" onClick={onReset}>
                            Convert Another
                        </Button>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
