"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { FileWithPreview } from "@/types/tools";
import { removePages, getPageCount } from "@/lib/pdf/organize";
import { getPDFThumbnails } from "@/lib/pdf/toImage";
import { downloadBlob, createPdfBlob } from "@/lib/utils";
import Image from "next/image";

interface PageInfo {
    index: number;
    thumbnail: string;
    selected: boolean;
}

export default function RemovePagesClient() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [pages, setPages] = useState<PageInfo[]>([]);
    const [isLoadingPages, setIsLoadingPages] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<{ blob: Blob; removedCount: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFilesChange = useCallback((newFiles: FileWithPreview[]) => {
        setFiles(newFiles);
        setPages([]);
        setResult(null);
        setError(null);
    }, []);

    // Load thumbnails when file is uploaded
    useEffect(() => {
        async function loadPages() {
            if (files.length === 0) return;

            setIsLoadingPages(true);
            try {
                const file = files[0].file;
                const pageCount = await getPageCount(file);
                const thumbnails = await getPDFThumbnails(file, 150);

                const pageInfos: PageInfo[] = [];
                for (let i = 0; i < pageCount; i++) {
                    pageInfos.push({
                        index: i,
                        thumbnail: thumbnails[i] || "",
                        selected: false,
                    });
                }
                setPages(pageInfos);
            } catch {
                setError("Failed to load PDF pages");
            } finally {
                setIsLoadingPages(false);
            }
        }

        loadPages();
    }, [files]);

    const togglePage = (index: number) => {
        setPages((prev) =>
            prev.map((p) =>
                p.index === index ? { ...p, selected: !p.selected } : p
            )
        );
    };

    const selectAll = () => {
        const allSelected = pages.every((p) => p.selected);
        // Don't allow selecting all pages
        if (!allSelected && pages.filter(p => !p.selected).length <= 1) {
            setError("Cannot remove all pages from PDF");
            return;
        }
        setPages((prev) =>
            prev.map((p, i) => ({ ...p, selected: i < prev.length - 1 ? !allSelected : false }))
        );
    };

    const handleRemovePages = async () => {
        const selectedPages = pages.filter((p) => p.selected);
        if (selectedPages.length === 0) {
            setError("Please select pages to remove");
            return;
        }

        if (selectedPages.length >= pages.length) {
            setError("Cannot remove all pages from PDF");
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

            const pagesToRemove = selectedPages.map((p) => p.index);
            const removeResult = await removePages(file, pagesToRemove);

            clearInterval(progressInterval);
            setProgress(100);

            if (removeResult.success && removeResult.data) {
                const blob = createPdfBlob(removeResult.data);
                setResult({ blob, removedCount: selectedPages.length });
            } else {
                setError(removeResult.error || "Failed to remove pages");
            }
        } catch (err) {
            console.error(err);
            setError("An error occurred while removing pages");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (result) {
            const originalName = files[0]?.name.replace(".pdf", "") || "document";
            downloadBlob(result.blob, `${originalName}_edited.pdf`);
        }
    };

    const handleReset = () => {
        setFiles([]);
        setPages([]);
        setResult(null);
        setError(null);
        setProgress(0);
    };

    const selectedCount = pages.filter((p) => p.selected).length;

    return (
        <ToolLayout
            title="Remove Pages"
            description="Delete specific pages from your PDF document"
            icon={Trash2}
            color="from-red-400 to-red-500"
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

                    {/* Loading */}
                    {isLoadingPages && (
                        <div className="text-center py-8">
                            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-surface-500">Loading pages...</p>
                        </div>
                    )}

                    {/* Page Selection */}
                    {pages.length > 0 && !isLoadingPages && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-surface-900 dark:text-white">
                                    Select pages to remove ({selectedCount} selected)
                                </h3>
                                <Button variant="ghost" size="sm" onClick={selectAll}>
                                    {pages.every((p) => p.selected) ? "Deselect All" : "Select All"}
                                </Button>
                            </div>

                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                                {pages.map((page) => (
                                    <button
                                        key={page.index}
                                        type="button"
                                        onClick={() => togglePage(page.index)}
                                        className={`relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${page.selected
                                            ? "border-red-500 ring-2 ring-red-500/30"
                                            : "border-surface-200 dark:border-surface-600 hover:border-surface-400"
                                            }`}
                                    >
                                        {page.thumbnail ? (
                                            <Image
                                                src={page.thumbnail}
                                                alt={`Page ${page.index + 1}`}
                                                fill
                                                className={`object-cover ${page.selected ? "opacity-50" : ""}`}
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
                                                <span className="text-surface-400">{page.index + 1}</span>
                                            </div>
                                        )}
                                        {page.selected && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
                                                <Trash2 className="w-6 h-6 text-red-500" />
                                            </div>
                                        )}
                                        <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                                            {page.index + 1}
                                        </div>
                                    </button>
                                ))}
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
                            <p className="text-sm text-center text-surface-500">Removing pages...</p>
                        </motion.div>
                    )}

                    {/* Action Button */}
                    {pages.length > 0 && selectedCount > 0 && !isProcessing && (
                        <div className="flex justify-center">
                            <Button onClick={handleRemovePages} size="lg" variant="danger">
                                Remove {selectedCount} Page{selectedCount > 1 ? "s" : ""}
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <DownloadButton
                        onClick={handleDownload}
                        filename={`${files[0]?.name.replace(".pdf", "")}_edited.pdf`}
                        fileSize={result.blob.size}
                        isReady
                    />
                    <div className="text-center">
                        <p className="text-sm text-surface-500 mb-4">
                            {result.removedCount} page{result.removedCount > 1 ? "s" : ""} removed
                        </p>
                        <Button variant="secondary" onClick={handleReset}>
                            Edit Another PDF
                        </Button>
                    </div>
                </div>
            )}
        </ToolLayout>
    );
}
