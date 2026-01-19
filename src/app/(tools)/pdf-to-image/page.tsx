"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Image, FileText, Check } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { FileWithPreview } from "@/types/tools";
import { pdfToImages, ImageFormat, DPI } from "@/lib/pdf/toImage";
import { downloadBlob } from "@/lib/utils";
import { IMAGE_FORMATS, DPI_OPTIONS } from "@/lib/constants";

export default function PDFToImagePage() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [format, setFormat] = useState<ImageFormat>("png");
    const [dpi, setDpi] = useState<DPI>(150);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<{ blob: Blob; imageCount: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const file = files[0]?.file;

    const handleFilesChange = useCallback((newFiles: FileWithPreview[]) => {
        setFiles(newFiles.slice(0, 1));
        setResult(null);
        setError(null);
    }, []);

    const handleConvert = async () => {
        if (!file) {
            setError("Please upload a PDF file");
            return;
        }

        setIsProcessing(true);
        setProgress(0);
        setError(null);

        try {
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 5, 90));
            }, 300);

            const convertResult = await pdfToImages(file, format, dpi);

            clearInterval(progressInterval);
            setProgress(100);

            if (convertResult.success && convertResult.data) {
                setResult({ blob: convertResult.data, imageCount: convertResult.imageCount || 0 });
            } else {
                setError(convertResult.error || "Failed to convert PDF");
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
            downloadBlob(result.blob, `${baseName}_images.zip`);
        }
    };

    const handleReset = () => {
        setFiles([]);
        setResult(null);
        setError(null);
        setProgress(0);
    };

    return (
        <ToolLayout
            title="PDF to Image"
            description="Convert PDF pages to JPG, PNG, or WEBP images"
            icon={Image}
            color="from-pink-500 to-pink-600"
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

                    {/* Conversion Options */}
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
                                </div>
                            </div>

                            {/* Format Selection */}
                            <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                                <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
                                    Output Format
                                </h3>
                                <div className="grid grid-cols-3 gap-3">
                                    {IMAGE_FORMATS.map((f) => (
                                        <button
                                            key={f.value}
                                            onClick={() => setFormat(f.value as ImageFormat)}
                                            className={`p-4 rounded-xl border-2 text-center transition-all ${format === f.value
                                                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                                : "border-surface-200 dark:border-surface-700 hover:border-surface-300"
                                                }`}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                {format === f.value && (
                                                    <Check className="w-4 h-4 text-primary-500" />
                                                )}
                                                <span className="font-medium text-surface-900 dark:text-white">
                                                    {f.label}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* DPI Selection */}
                            <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                                <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
                                    Image Quality (DPI)
                                </h3>
                                <div className="space-y-2">
                                    {DPI_OPTIONS.map((d) => (
                                        <button
                                            key={d.value}
                                            onClick={() => setDpi(d.value as DPI)}
                                            className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${dpi === d.value
                                                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                                : "border-surface-200 dark:border-surface-700 hover:border-surface-300"
                                                }`}
                                        >
                                            <div
                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${dpi === d.value
                                                    ? "border-primary-500 bg-primary-500"
                                                    : "border-surface-300"
                                                    }`}
                                            >
                                                {dpi === d.value && (
                                                    <Check className="w-3 h-3 text-white" />
                                                )}
                                            </div>
                                            <span className="font-medium text-surface-900 dark:text-white">
                                                {d.label}
                                            </span>
                                        </button>
                                    ))}
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
                                Converting PDF to images...
                            </p>
                        </motion.div>
                    )}

                    {/* Action Buttons */}
                    {file && !isProcessing && (
                        <div className="flex justify-center gap-4">
                            <Button variant="secondary" onClick={handleReset}>
                                Clear
                            </Button>
                            <Button onClick={handleConvert} size="lg">
                                Convert to {format.toUpperCase()}
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <DownloadButton
                        onClick={handleDownload}
                        filename={`${file.name.replace(".pdf", "")}_images.zip`}
                        fileSize={result.blob.size}
                        isReady
                    />
                    <div className="text-center">
                        <p className="text-sm text-surface-500 mb-4">
                            {result.imageCount} images created
                        </p>
                        <Button variant="secondary" onClick={handleReset}>
                            Convert Another PDF
                        </Button>
                    </div>
                </div>
            )}
        </ToolLayout>
    );
}
