"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Minimize2, FileText, TrendingDown, Check } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { FileWithPreview } from "@/types/tools";
import { compressPDF, CompressionLevel } from "@/lib/pdf/compress";
import { downloadBlob, formatFileSize, createPdfBlob } from "@/lib/utils";
import { COMPRESSION_LEVELS } from "@/lib/constants";

export default function CompressPDFPage() {
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
                        <div className="flex items-center justify-center gap-2 mb-6">
                            <TrendingDown className="w-6 h-6 text-green-500" />
                            <span className="text-2xl font-bold text-green-500">
                                {compressionPercentage}% smaller
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-6 text-center">
                            <div>
                                <p className="text-sm text-surface-500 mb-1">Original Size</p>
                                <p className="text-lg font-semibold text-surface-900 dark:text-white">
                                    {formatFileSize(result.originalSize)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-surface-500 mb-1">Compressed Size</p>
                                <p className="text-lg font-semibold text-green-500">
                                    {formatFileSize(result.compressedSize)}
                                </p>
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
