"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { Minimize2, FileText, TrendingDown, Check, ArrowRight } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { FileWithPreview } from "@/types/tools";
import { compressPDF, CompressionLevel } from "@/lib/pdf/compress";
import { downloadBlob, formatFileSize, createPdfBlob } from "@/lib/utils";
import { COMPRESSION_LEVELS } from "@/lib/constants";

function AnimatedNumber({ value }: { value: number }) {
    const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
    const display = useTransform(spring, (current) => Math.round(current));

    useEffect(() => {
        spring.set(value);
    }, [value, spring]);

    return <motion.span>{display}</motion.span>;
}

export default function CompressClient() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>("recommended");
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<{
        blob: Blob;
        originalSize: number;
        compressedSize: number;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const file = files[0]?.file;

    const handleFilesChange = useCallback((newFiles: FileWithPreview[]) => {
        setFiles(newFiles.slice(0, 1));
        setResult(null);
        setError(null);
    }, []);

    const handleCompress = async () => {
        if (!file) {
            setError("Please upload a PDF file");
            return;
        }

        setIsProcessing(true);
        setProgress(0);
        setError(null);

        try {
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 15, 90));
            }, 200);

            const compressResult = await compressPDF(file);

            clearInterval(progressInterval);
            setProgress(100);

            if (compressResult.success && compressResult.data) {
                const blob = createPdfBlob(compressResult.data);
                setResult({
                    blob,
                    originalSize: compressResult.originalSize || file.size,
                    compressedSize: compressResult.compressedSize || blob.size,
                });
            } else {
                setError(compressResult.error || "Failed to compress PDF");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (result) {
            const baseName = file.name.replace(".pdf", "");
            downloadBlob(result.blob, `${baseName}_compressed.pdf`);
        }
    };

    const handleReset = () => {
        setFiles([]);
        setResult(null);
        setError(null);
        setProgress(0);
    };

    const compressionPercentage = result
        ? Math.round((1 - result.compressedSize / result.originalSize) * 100)
        : 0;

    const savedSize = result ? result.originalSize - result.compressedSize : 0;

    return (
        <ToolLayout
            title="Compress PDF"
            description="Reduce PDF file size while maintaining quality"
            icon={Minimize2}
            color="from-lime-500 to-lime-600"
        >
            {!result ? (
                <div className="space-y-6">
                    {/* File Uploader */}
                    <FileUploader
                        accept={{ "application/pdf": [".pdf"] }}
                        multiple={false}
                        maxFiles={1}
                        files={files}
                        onFilesChange={handleFilesChange}
                        label="Drop your PDF file here"
                    />

                    {/* Compression Options */}
                    {file && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            {/* File Info */}
                            <div className="flex items-center gap-3 p-4 bg-surface-50 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
                                <div className="w-12 h-14 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-red-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-surface-900 dark:text-white truncate">
                                        {file.name}
                                    </p>
                                    <p className="text-sm text-surface-500">
                                        Current size: {formatFileSize(file.size)}
                                    </p>
                                </div>
                            </div>

                            {/* Compression Level Selection */}
                            <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                                <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
                                    Compression Level
                                </h3>
                                <div className="space-y-3">
                                    {(Object.keys(COMPRESSION_LEVELS) as CompressionLevel[]).map((level) => {
                                        const config = COMPRESSION_LEVELS[level];
                                        const isSelected = compressionLevel === level;

                                        return (
                                            <button
                                                key={level}
                                                onClick={() => setCompressionLevel(level)}
                                                className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${isSelected
                                                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                                    : "border-surface-200 dark:border-surface-700 hover:border-surface-300"
                                                    }`}
                                            >
                                                <div
                                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected
                                                        ? "border-primary-500 bg-primary-500"
                                                        : "border-surface-300 dark:border-surface-600"
                                                        }`}
                                                >
                                                    {isSelected && <Check className="w-4 h-4 text-white" />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-surface-900 dark:text-white">
                                                        {config.label}
                                                    </p>
                                                    <p className="text-sm text-surface-500 dark:text-surface-400">
                                                        {config.description}
                                                    </p>
                                                </div>
                                                {level === "recommended" && (
                                                    <span className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 rounded-full">
                                                        Recommended
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm"
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Progress */}
                    {isProcessing && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-2"
                        >
                            <ProgressBar value={progress} />
                            <p className="text-sm text-center text-surface-500">
                                Compressing PDF...
                            </p>
                        </motion.div>
                    )}

                    {/* Action Buttons */}
                    {file && !isProcessing && (
                        <div className="flex justify-center gap-4">
                            <Button variant="secondary" onClick={handleReset}>
                                Clear
                            </Button>
                            <Button onClick={handleCompress} size="lg">
                                Compress PDF
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Compression Stats */}
                    <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                        {/* Header Stats */}
                        <div className="flex flex-col items-center justify-center mb-8">
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                className="flex items-center gap-2 mb-2"
                            >
                                <TrendingDown className="w-8 h-8 text-green-500" />
                                <span className="text-4xl font-bold text-green-500">
                                    <AnimatedNumber value={compressionPercentage} />%
                                </span>
                            </motion.div>
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-lg font-medium text-surface-600 dark:text-surface-300"
                            >
                                smaller!
                            </motion.p>

                            {savedSize > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="mt-4 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-medium"
                                >
                                    You saved {formatFileSize(savedSize)}!
                                </motion.div>
                            )}
                        </div>

                        {/* Visual Bar Comparison */}
                        <div className="mb-8 space-y-4">
                            <div className="relative h-12 bg-surface-100 dark:bg-surface-700 rounded-lg overflow-hidden flex items-center">
                                {/* Compressed Bar (Green) */}
                                <motion.div
                                    initial={{ width: "100%" }}
                                    animate={{ width: `${100 - compressionPercentage}%` }}
                                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                                    className="absolute left-0 top-0 bottom-0 bg-green-500 z-10"
                                />
                                {/* Label inside bar */}
                                <div className="absolute left-4 z-20 text-white font-medium text-sm whitespace-nowrap">
                                    Compressed: {formatFileSize(result.compressedSize)}
                                </div>
                            </div>

                            {/* Original Size Reference */}
                            <div className="flex justify-between text-sm text-surface-500 px-1">
                                <span>0 MB</span>
                                <span>Original: {formatFileSize(result.originalSize)}</span>
                            </div>
                        </div>

                        {/* Detailed Stats Grid */}
                        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-surface-200 dark:border-surface-700">
                            <div className="text-center">
                                <p className="text-sm text-surface-500 mb-1">Old Size</p>
                                <p className="text-lg font-semibold text-surface-900 dark:text-white line-through decoration-red-500/50">
                                    {formatFileSize(result.originalSize)}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-surface-500 mb-1">New Size</p>
                                <div className="flex items-center justify-center gap-2">
                                    <p className="text-lg font-semibold text-green-500">
                                        {formatFileSize(result.compressedSize)}
                                    </p>
                                    <ArrowRight className="w-4 h-4 text-surface-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DownloadButton
                        onClick={handleDownload}
                        filename={`${file.name.replace(".pdf", "")}_compressed.pdf`}
                        fileSize={result.compressedSize}
                        isReady
                    />

                    <div className="text-center">
                        <Button variant="secondary" onClick={handleReset}>
                            Compress Another PDF
                        </Button>
                    </div>
                </div>
            )}
        </ToolLayout>
    );
}
