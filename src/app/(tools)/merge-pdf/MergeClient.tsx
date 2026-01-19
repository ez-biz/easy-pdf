"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Layers, FileText, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { FileWithPreview } from "@/types/tools";
import { mergePDFs } from "@/lib/pdf/merge";
import { downloadBlob, formatFileSize, createPdfBlob } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";

export default function MergeClient() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<{ blob: Blob; pageCount: number } | null>(
        null
    );
    const toast = useToast();

    const handleFilesChange = useCallback((newFiles: FileWithPreview[]) => {
        setFiles(newFiles);
        setResult(null);
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
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
        setResult(null);
    }, []);

    const handleMerge = async () => {
        if (files.length < 2) {
            toast.warning("Please add at least 2 PDF files to merge");
            return;
        }

        setIsProcessing(true);
        setProgress(0);

        try {
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 200);

            const actualFiles = files.map(f => f.file);
            const mergeResult = await mergePDFs(actualFiles);

            clearInterval(progressInterval);
            setProgress(100);

            if (mergeResult.success && mergeResult.data) {
                const blob = createPdfBlob(mergeResult.data);
                setResult({ blob, pageCount: mergeResult.pageCount || 0 });
                toast.success(`Successfully merged ${files.length} PDFs!`);
            } else {
                toast.error(mergeResult.error || "Failed to merge PDFs");
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (result) {
            downloadBlob(result.blob, "merged.pdf");
            toast.success("PDF downloaded successfully!");
        }
    };

    const handleReset = () => {
        setFiles([]);
        setResult(null);
        setProgress(0);
    };

    return (
        <ToolLayout
            title="Merge PDF"
            description="Combine multiple PDF files into a single document. Use arrows to reorder."
            icon={Layers}
            color="from-primary-500 to-primary-600"
        >
            {!result ? (
                <div className="space-y-6">
                    {/* File Uploader */}
                    <FileUploader
                        accept={{ "application/pdf": [".pdf"] }}
                        multiple
                        files={files}
                        onFilesChange={handleFilesChange}
                        label="Drop your PDF files here"
                        description="or click to browse"
                    />

                    {/* File List */}
                    {files.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-surface-900 dark:text-white">
                                    Files to merge ({files.length})
                                </h3>
                                <p className="text-sm text-surface-500">
                                    Use arrows to reorder
                                </p>
                            </div>

                            <div className="space-y-2">
                                {files.map((file, index) => (
                                    <div
                                        key={file.id}
                                        className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-700 rounded-xl"
                                    >
                                        <div className="w-8 h-8 flex items-center justify-center bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400 font-semibold text-sm">
                                            {index + 1}
                                        </div>
                                        <div className="w-10 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <FileText className="w-5 h-5 text-red-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-surface-900 dark:text-white truncate">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-surface-500">
                                                {formatFileSize(file.size)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {index > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => moveFile(index, "up")}
                                                    className="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
                                                    aria-label="Move up"
                                                >
                                                    <ArrowUp className="w-4 h-4 text-surface-500" />
                                                </button>
                                            )}
                                            {index < files.length - 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => moveFile(index, "down")}
                                                    className="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
                                                    aria-label="Move down"
                                                >
                                                    <ArrowDown className="w-4 h-4 text-surface-500" />
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeFile(file.id)}
                                                className="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
                                                aria-label="Remove file"
                                            >
                                                <Trash2 className="w-4 h-4 text-surface-400 hover:text-red-500" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                                Merging PDFs...
                            </p>
                        </motion.div>
                    )}

                    {/* Action Buttons */}
                    {files.length >= 2 && !isProcessing && (
                        <div className="flex justify-center gap-4">
                            <Button
                                variant="secondary"
                                onClick={handleReset}
                            >
                                Clear All
                            </Button>
                            <Button
                                onClick={handleMerge}
                                size="lg"
                            >
                                Merge {files.length} PDFs
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <DownloadButton
                        onClick={handleDownload}
                        filename="merged.pdf"
                        fileSize={result.blob.size}
                        isReady
                    />
                    <div className="text-center">
                        <p className="text-sm text-surface-500 mb-4">
                            {result.pageCount} pages merged from {files.length} files
                        </p>
                        <Button variant="secondary" onClick={handleReset}>
                            Merge More PDFs
                        </Button>
                    </div>
                </div>
            )}
        </ToolLayout>
    );
}
