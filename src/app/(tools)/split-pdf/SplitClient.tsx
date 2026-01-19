"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Scissors, FileText } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { FileWithPreview } from "@/types/tools";
import { splitPDF, getPDFPageCount, SplitMode } from "@/lib/pdf/split";
import { downloadBlob } from "@/lib/utils";

const SPLIT_MODES = [
    {
        id: "range" as SplitMode,
        name: "Split by Range",
        description: "Split into custom page ranges",
        placeholder: "e.g., 1-5, 6-10, 11-15",
    },
    {
        id: "pages" as SplitMode,
        name: "Extract Pages",
        description: "Extract specific pages",
        placeholder: "e.g., 1, 3, 5, 7",
    },
    {
        id: "every" as SplitMode,
        name: "Split Every N Pages",
        description: "Split document every N pages",
        placeholder: "e.g., 5",
    },
    {
        id: "all" as SplitMode,
        name: "Extract All Pages",
        description: "One PDF per page",
        placeholder: "",
    },
];

export default function SplitClient() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [pageCount, setPageCount] = useState(0);
    const [splitMode, setSplitMode] = useState<SplitMode>("range");
    const [inputValue, setInputValue] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<{ blob: Blob; fileCount: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const file = files[0]?.file;

    useEffect(() => {
        if (file) {
            getPDFPageCount(file).then(setPageCount).catch(() => setPageCount(0));
        } else {
            setPageCount(0);
        }
    }, [file]);

    const handleFilesChange = useCallback((newFiles: FileWithPreview[]) => {
        setFiles(newFiles.slice(0, 1));
        setResult(null);
        setError(null);
        setInputValue("");
    }, []);

    const handleSplit = async () => {
        if (!file) {
            setError("Please upload a PDF file");
            return;
        }

        setIsProcessing(true);
        setProgress(0);
        setError(null);

        try {
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 200);

            const options = {
                mode: splitMode,
                ranges: splitMode === "range" ? inputValue : undefined,
                pages:
                    splitMode === "pages"
                        ? inputValue.split(",").map((p) => parseInt(p.trim())).filter((n) => !isNaN(n))
                        : undefined,
                everyN: splitMode === "every" ? parseInt(inputValue) : undefined,
            };

            const splitResult = await splitPDF(file, options);

            clearInterval(progressInterval);
            setProgress(100);

            if (splitResult.success && splitResult.data) {
                setResult({ blob: splitResult.data, fileCount: splitResult.fileCount || 0 });
            } else {
                setError(splitResult.error || "Failed to split PDF");
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
            downloadBlob(result.blob, `${baseName}_split.zip`);
        }
    };

    const handleReset = () => {
        setFiles([]);
        setResult(null);
        setError(null);
        setProgress(0);
        setInputValue("");
        setPageCount(0);
    };

    const selectedMode = SPLIT_MODES.find((m) => m.id === splitMode);

    return (
        <ToolLayout
            title="Split PDF"
            description="Separate PDF pages into multiple files"
            icon={Scissors}
            color="from-secondary-500 to-secondary-600"
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

                    {/* Split Options */}
                    {file && pageCount > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            {/* Page Count Info */}
                            <div className="flex items-center gap-3 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                                <div className="w-12 h-14 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <p className="font-medium text-surface-900 dark:text-white">
                                        {file.name}
                                    </p>
                                    <p className="text-sm text-surface-500">
                                        {pageCount} pages
                                    </p>
                                </div>
                            </div>

                            {/* Split Mode Selection */}
                            <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                                <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
                                    Choose split method
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {SPLIT_MODES.map((mode) => (
                                        <button
                                            key={mode.id}
                                            onClick={() => {
                                                setSplitMode(mode.id);
                                                setInputValue("");
                                            }}
                                            className={`p-4 rounded-xl border-2 text-left transition-all ${splitMode === mode.id
                                                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                                : "border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600"
                                                }`}
                                        >
                                            <p className="font-medium text-surface-900 dark:text-white">
                                                {mode.name}
                                            </p>
                                            <p className="text-sm text-surface-500 dark:text-surface-400">
                                                {mode.description}
                                            </p>
                                        </button>
                                    ))}
                                </div>

                                {/* Input Field */}
                                {selectedMode && selectedMode.placeholder && (
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                            {splitMode === "range" && "Enter page ranges"}
                                            {splitMode === "pages" && "Enter page numbers"}
                                            {splitMode === "every" && "Split every N pages"}
                                        </label>
                                        <input
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            placeholder={selectedMode.placeholder}
                                            className="w-full px-4 py-3 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                )}
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
                                Splitting PDF...
                            </p>
                        </motion.div>
                    )}

                    {/* Action Buttons */}
                    {file && pageCount > 0 && !isProcessing && (
                        <div className="flex justify-center gap-4">
                            <Button variant="secondary" onClick={handleReset}>
                                Clear
                            </Button>
                            <Button onClick={handleSplit} size="lg">
                                Split PDF
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <DownloadButton
                        onClick={handleDownload}
                        filename={`${file.name.replace(".pdf", "")}_split.zip`}
                        fileSize={result.blob.size}
                        isReady
                    />
                    <div className="text-center">
                        <p className="text-sm text-surface-500 mb-4">
                            {result.fileCount} files created
                        </p>
                        <Button variant="secondary" onClick={handleReset}>
                            Split Another PDF
                        </Button>
                    </div>
                </div>
            )}
        </ToolLayout>
    );
}
