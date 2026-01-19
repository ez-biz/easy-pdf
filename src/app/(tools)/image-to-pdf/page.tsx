"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { FileImage, Trash2, Check, ArrowUp, ArrowDown } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { FileWithPreview } from "@/types/tools";
import { imagesToPDF, PageSize, Orientation, Margin } from "@/lib/pdf/fromImage";
import { downloadBlob, createPdfBlob } from "@/lib/utils";
import Image from "next/image";

const PAGE_SIZE_OPTIONS = [
    { id: "a4" as PageSize, name: "A4", description: "210 × 297 mm" },
    { id: "letter" as PageSize, name: "Letter", description: "8.5 × 11 in" },
    { id: "original" as PageSize, name: "Original", description: "Match image size" },
];

const ORIENTATION_OPTIONS = [
    { id: "auto" as Orientation, name: "Auto", description: "Based on image" },
    { id: "portrait" as Orientation, name: "Portrait", description: "Vertical" },
    { id: "landscape" as Orientation, name: "Landscape", description: "Horizontal" },
];

const MARGIN_OPTIONS = [
    { id: "none" as Margin, name: "None" },
    { id: "small" as Margin, name: "Small" },
    { id: "medium" as Margin, name: "Medium" },
    { id: "large" as Margin, name: "Large" },
];

export default function ImageToPDFPage() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [pageSize, setPageSize] = useState<PageSize>("a4");
    const [orientation, setOrientation] = useState<Orientation>("auto");
    const [margin, setMargin] = useState<Margin>("small");
    const [fitToPage, setFitToPage] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<{ blob: Blob; pageCount: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFilesChange = useCallback((newFiles: FileWithPreview[]) => {
        setFiles(newFiles);
        setResult(null);
        setError(null);
    }, []);

    const moveFile = useCallback((index: number, direction: "up" | "down") => {
        setFiles((prev) => {
            const newFiles = [...prev];
            const newIndex = direction === "up" ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= newFiles.length) return prev;
            [newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]];
            return newFiles;
        });
    }, []);

    const removeFile = useCallback((fileId: string) => {
        setFiles((prev) => {
            const file = prev.find((f) => f.id === fileId);
            if (file?.preview) URL.revokeObjectURL(file.preview);
            return prev.filter((f) => f.id !== fileId);
        });
        setResult(null);
    }, []);

    const handleConvert = async () => {
        if (files.length === 0) {
            setError("Please upload at least one image");
            return;
        }

        setIsProcessing(true);
        setProgress(0);
        setError(null);

        try {
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 200);

            const actualFiles = files.map(f => f.file);
            const convertResult = await imagesToPDF(
                actualFiles,
                pageSize,
                orientation,
                margin,
                fitToPage
            );

            clearInterval(progressInterval);
            setProgress(100);

            if (convertResult.success && convertResult.data) {
                const blob = createPdfBlob(convertResult.data);
                setResult({ blob, pageCount: convertResult.pageCount || 0 });
            } else {
                setError(convertResult.error || "Failed to create PDF");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (result) {
            downloadBlob(result.blob, "images.pdf");
        }
    };

    const handleReset = () => {
        files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
        setFiles([]);
        setResult(null);
        setError(null);
        setProgress(0);
    };

    return (
        <ToolLayout
            title="Image to PDF"
            description="Create a PDF from multiple images. Reorder using arrows."
            icon={FileImage}
            color="from-rose-500 to-rose-600"
        >
            {!result ? (
                <div className="space-y-6">
                    {/* File Uploader */}
                    <FileUploader
                        accept={{
                            "image/jpeg": [".jpg", ".jpeg"],
                            "image/png": [".png"],
                            "image/webp": [".webp"],
                            "image/gif": [".gif"],
                            "image/bmp": [".bmp"],
                        }}
                        multiple
                        files={files}
                        onFilesChange={handleFilesChange}
                        label="Drop your images here"
                        description="JPG, PNG, WEBP, GIF, BMP supported"
                    />

                    {/* Image Preview & Reorder */}
                    {files.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-surface-900 dark:text-white">
                                    Images ({files.length})
                                </h3>
                                <p className="text-sm text-surface-500">Use arrows to reorder</p>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {files.map((file, index) => (
                                    <div
                                        key={file.id}
                                        className="relative group"
                                    >
                                        <div className="aspect-[3/4] rounded-xl overflow-hidden border-2 border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-700">
                                            {file.preview && (
                                                <Image
                                                    src={file.preview}
                                                    alt={file.name}
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                            )}
                                        </div>
                                        <div className="absolute top-2 left-2 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                            {index + 1}
                                        </div>
                                        {/* Controls */}
                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {index > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => moveFile(index, "up")}
                                                    className="p-1.5 bg-surface-800/80 text-white rounded-full hover:bg-surface-700"
                                                    aria-label="Move up"
                                                >
                                                    <ArrowUp className="w-3 h-3" />
                                                </button>
                                            )}
                                            {index < files.length - 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => moveFile(index, "down")}
                                                    className="p-1.5 bg-surface-800/80 text-white rounded-full hover:bg-surface-700"
                                                    aria-label="Move down"
                                                >
                                                    <ArrowDown className="w-3 h-3" />
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeFile(file.id)}
                                                className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                                                aria-label="Remove"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <div className="absolute bottom-2 left-2 right-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded truncate">
                                            {file.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Options */}
                    {files.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="grid md:grid-cols-2 gap-6"
                        >
                            {/* Page Size */}
                            <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                                <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
                                    Page Size
                                </h3>
                                <div className="space-y-2">
                                    {PAGE_SIZE_OPTIONS.map((option) => (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => setPageSize(option.id)}
                                            className={`w-full p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${pageSize === option.id
                                                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                                : "border-surface-200 dark:border-surface-700"
                                                }`}
                                        >
                                            <div
                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${pageSize === option.id
                                                    ? "border-primary-500 bg-primary-500"
                                                    : "border-surface-300"
                                                    }`}
                                            >
                                                {pageSize === option.id && (
                                                    <Check className="w-3 h-3 text-white" />
                                                )}
                                            </div>
                                            <div>
                                                <span className="font-medium text-surface-900 dark:text-white">
                                                    {option.name}
                                                </span>
                                                <span className="text-sm text-surface-500 ml-2">
                                                    {option.description}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Orientation */}
                            <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                                <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
                                    Orientation
                                </h3>
                                <div className="space-y-2">
                                    {ORIENTATION_OPTIONS.map((option) => (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => setOrientation(option.id)}
                                            className={`w-full p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${orientation === option.id
                                                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                                : "border-surface-200 dark:border-surface-700"
                                                }`}
                                        >
                                            <div
                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${orientation === option.id
                                                    ? "border-primary-500 bg-primary-500"
                                                    : "border-surface-300"
                                                    }`}
                                            >
                                                {orientation === option.id && (
                                                    <Check className="w-3 h-3 text-white" />
                                                )}
                                            </div>
                                            <div>
                                                <span className="font-medium text-surface-900 dark:text-white">
                                                    {option.name}
                                                </span>
                                                <span className="text-sm text-surface-500 ml-2">
                                                    {option.description}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Margin */}
                            <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                                <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
                                    Margin
                                </h3>
                                <div className="flex gap-2">
                                    {MARGIN_OPTIONS.map((option) => (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => setMargin(option.id)}
                                            className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${margin === option.id
                                                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                                : "border-surface-200 dark:border-surface-700"
                                                }`}
                                        >
                                            <span className="font-medium text-surface-900 dark:text-white text-sm">
                                                {option.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Fit to Page */}
                            <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                                <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
                                    Scaling
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setFitToPage(!fitToPage)}
                                    className={`w-full p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${fitToPage
                                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                        : "border-surface-200 dark:border-surface-700"
                                        }`}
                                >
                                    <div
                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${fitToPage
                                            ? "border-primary-500 bg-primary-500"
                                            : "border-surface-300"
                                            }`}
                                    >
                                        {fitToPage && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <div>
                                        <span className="font-medium text-surface-900 dark:text-white">
                                            Fit to page
                                        </span>
                                        <p className="text-sm text-surface-500">
                                            Scale images to fit within page
                                        </p>
                                    </div>
                                </button>
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
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                            <ProgressBar value={progress} />
                            <p className="text-sm text-center text-surface-500">Creating PDF...</p>
                        </motion.div>
                    )}

                    {/* Action Buttons */}
                    {files.length > 0 && !isProcessing && (
                        <div className="flex justify-center gap-4">
                            <Button variant="secondary" onClick={handleReset}>
                                Clear All
                            </Button>
                            <Button onClick={handleConvert} size="lg">
                                Create PDF
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <DownloadButton
                        onClick={handleDownload}
                        filename="images.pdf"
                        fileSize={result.blob.size}
                        isReady
                    />
                    <div className="text-center">
                        <p className="text-sm text-surface-500 mb-4">
                            {result.pageCount} pages created from {files.length} images
                        </p>
                        <Button variant="secondary" onClick={handleReset}>
                            Convert More Images
                        </Button>
                    </div>
                </div>
            )}
        </ToolLayout>
    );
}
