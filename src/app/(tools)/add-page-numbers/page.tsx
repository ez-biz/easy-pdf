"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Hash, Check } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { FileWithPreview } from "@/types/tools";
import {
    addPageNumbers,
    PageNumberPosition,
    PageNumberFormat,
} from "@/lib/pdf/pageNumbers";
import { downloadBlob, createPdfBlob } from "@/lib/utils";

const POSITION_OPTIONS: { id: PageNumberPosition; name: string }[] = [
    { id: "bottom-left", name: "Bottom Left" },
    { id: "bottom-center", name: "Bottom Center" },
    { id: "bottom-right", name: "Bottom Right" },
    { id: "top-left", name: "Top Left" },
    { id: "top-center", name: "Top Center" },
    { id: "top-right", name: "Top Right" },
];

const FORMAT_OPTIONS: { id: PageNumberFormat; name: string; example: string }[] = [
    { id: "number", name: "Simple", example: "1, 2, 3..." },
    { id: "page-number", name: "With Label", example: "Page 1, Page 2..." },
    { id: "number-of-total", name: "With Total", example: "1 of 10, 2 of 10..." },
];

export default function AddPageNumbersPage() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [position, setPosition] = useState<PageNumberPosition>("bottom-center");
    const [format, setFormat] = useState<PageNumberFormat>("number");
    const [fontSize, setFontSize] = useState(12);
    const [startNumber, setStartNumber] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<{ blob: Blob } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFilesChange = useCallback((newFiles: FileWithPreview[]) => {
        setFiles(newFiles);
        setResult(null);
        setError(null);
    }, []);

    const handleAddNumbers = async () => {
        if (files.length === 0) {
            setError("Please upload a PDF file");
            return;
        }

        setIsProcessing(true);
        setProgress(0);
        setError(null);

        try {
            const file = files[0].file;
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 15, 90));
            }, 150);

            const numbersResult = await addPageNumbers(file, {
                position,
                format,
                fontSize,
                startNumber,
                margin: 30,
            });

            clearInterval(progressInterval);
            setProgress(100);

            if (numbersResult.success && numbersResult.data) {
                const blob = createPdfBlob(numbersResult.data);
                setResult({ blob });
            } else {
                setError(numbersResult.error || "Failed to add page numbers");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (result) {
            const originalName = files[0]?.name.replace(".pdf", "") || "document";
            downloadBlob(result.blob, `${originalName}_numbered.pdf`);
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
            title="Add Page Numbers"
            description="Add page numbers to your PDF documents"
            icon={Hash}
            color="from-teal-500 to-teal-600"
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
                        label="Drop your PDF here"
                        description="or click to browse"
                    />

                    {/* Options */}
                    {files.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid md:grid-cols-2 gap-6"
                        >
                            {/* Position */}
                            <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                                <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
                                    Position
                                </h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {POSITION_OPTIONS.map((option) => (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => setPosition(option.id)}
                                            className={`p-2 rounded-lg border-2 text-xs font-medium transition-all ${position === option.id
                                                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600"
                                                : "border-surface-200 dark:border-surface-600"
                                                }`}
                                        >
                                            {option.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Format */}
                            <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                                <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
                                    Format
                                </h3>
                                <div className="space-y-2">
                                    {FORMAT_OPTIONS.map((option) => (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => setFormat(option.id)}
                                            className={`w-full p-3 rounded-xl border-2 text-left flex items-center justify-between transition-all ${format === option.id
                                                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                                : "border-surface-200 dark:border-surface-600"
                                                }`}
                                        >
                                            <div>
                                                <span className="font-medium text-surface-900 dark:text-white">
                                                    {option.name}
                                                </span>
                                                <span className="text-sm text-surface-500 ml-2">
                                                    ({option.example})
                                                </span>
                                            </div>
                                            {format === option.id && (
                                                <Check className="w-5 h-5 text-primary-500" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Font Size */}
                            <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                                <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
                                    Font Size: {fontSize}pt
                                </h3>
                                <input
                                    type="range"
                                    min="8"
                                    max="24"
                                    step="1"
                                    value={fontSize}
                                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                                    className="w-full h-2 bg-surface-200 dark:bg-surface-600 rounded-lg appearance-none cursor-pointer accent-primary-500"
                                />
                                <div className="flex justify-between text-xs text-surface-500 mt-1">
                                    <span>8pt</span>
                                    <span>24pt</span>
                                </div>
                            </div>

                            {/* Start Number */}
                            <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                                <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
                                    Start Number
                                </h3>
                                <input
                                    type="number"
                                    min="1"
                                    value={startNumber}
                                    onChange={(e) => setStartNumber(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* Error */}
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
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                            <ProgressBar value={progress} />
                            <p className="text-sm text-center text-surface-500">Adding page numbers...</p>
                        </motion.div>
                    )}

                    {/* Action Button */}
                    {files.length > 0 && !isProcessing && (
                        <div className="flex justify-center">
                            <Button onClick={handleAddNumbers} size="lg">
                                Add Page Numbers
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <DownloadButton
                        onClick={handleDownload}
                        filename={`${files[0]?.name.replace(".pdf", "")}_numbered.pdf`}
                        fileSize={result.blob.size}
                        isReady
                    />
                    <div className="text-center">
                        <Button variant="secondary" onClick={handleReset}>
                            Number Another PDF
                        </Button>
                    </div>
                </div>
            )}
        </ToolLayout>
    );
}
