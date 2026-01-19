"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
    RotateCw,
    RotateCcw,
} from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { FileWithPreview } from "@/types/tools";
import { rotatePDF, RotationAngle } from "@/lib/pdf/rotate";
import { getPDFThumbnails } from "@/lib/pdf/toImage";
import { downloadBlob, createPdfBlob } from "@/lib/utils";
import Image from "next/image";

export default function RotateClient() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [thumbnails, setThumbnails] = useState<string[]>([]);
    const [rotations, setRotations] = useState<Map<number, RotationAngle>>(new Map());
    const [isLoadingThumbnails, setIsLoadingThumbnails] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<{ blob: Blob } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const file = files[0]?.file;

    useEffect(() => {
        if (file) {
            setIsLoadingThumbnails(true);
            getPDFThumbnails(file, 20)
                .then((thumbs) => {
                    setThumbnails(thumbs);
                    setRotations(new Map());
                })
                .catch(() => setThumbnails([]))
                .finally(() => setIsLoadingThumbnails(false));
        } else {
            setThumbnails([]);
            setRotations(new Map());
        }
    }, [file]);

    const handleFilesChange = useCallback((newFiles: FileWithPreview[]) => {
        setFiles(newFiles.slice(0, 1));
        setResult(null);
        setError(null);
    }, []);

    const rotatePageBy = (pageIndex: number, angle: 90 | -90) => {
        setRotations((prev) => {
            const newMap = new Map(prev);
            const current = (newMap.get(pageIndex) || 0) as number;
            let newAngle = (current + angle) % 360;
            if (newAngle < 0) newAngle += 360;
            if (newAngle === 0) {
                newMap.delete(pageIndex);
            } else {
                newMap.set(pageIndex, newAngle as RotationAngle);
            }
            return newMap;
        });
    };

    const rotateAllPages = (angle: RotationAngle) => {
        const newMap = new Map<number, RotationAngle>();
        thumbnails.forEach((_, i) => {
            if (angle !== 0) {
                newMap.set(i, angle);
            }
        });
        setRotations(newMap);
    };

    const handleRotate = async () => {
        if (!file) {
            setError("Please upload a PDF file");
            return;
        }

        if (rotations.size === 0) {
            setError("Please rotate at least one page");
            return;
        }

        setIsProcessing(true);
        setProgress(0);
        setError(null);

        try {
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 15, 90));
            }, 200);

            const rotateResult = await rotatePDF(file, rotations);

            clearInterval(progressInterval);
            setProgress(100);

            if (rotateResult.success && rotateResult.data) {
                const blob = createPdfBlob(rotateResult.data);
                setResult({ blob });
            } else {
                setError(rotateResult.error || "Failed to rotate PDF");
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
            downloadBlob(result.blob, `${baseName}_rotated.pdf`);
        }
    };

    const handleReset = () => {
        setFiles([]);
        setThumbnails([]);
        setRotations(new Map());
        setResult(null);
        setError(null);
        setProgress(0);
    };

    return (
        <ToolLayout
            title="Rotate PDF"
            description="Rotate PDF pages to the correct orientation"
            icon={RotateCw}
            color="from-accent-500 to-accent-600"
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

                    {/* Quick Actions */}
                    {thumbnails.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-surface-800 rounded-2xl p-4 border border-surface-200 dark:border-surface-700"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <p className="text-sm text-surface-600 dark:text-surface-300">
                                    Quick actions:
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => rotateAllPages(90)}
                                        leftIcon={<RotateCw className="w-4 h-4" />}
                                    >
                                        Rotate All 90°
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => rotateAllPages(180)}
                                    >
                                        Rotate All 180°
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => rotateAllPages(270)}
                                        leftIcon={<RotateCcw className="w-4 h-4" />}
                                    >
                                        Rotate All 270°
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Page Thumbnails */}
                    {isLoadingThumbnails && (
                        <div className="flex items-center justify-center py-12">
                            <div className="spinner border-primary-500" />
                            <span className="ml-3 text-surface-500">Loading pages...</span>
                        </div>
                    )}

                    {thumbnails.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700"
                        >
                            <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
                                Pages ({thumbnails.length})
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {thumbnails.map((thumb, index) => {
                                    const rotation = rotations.get(index) || 0;
                                    return (
                                        <div key={index} className="space-y-2">
                                            <div
                                                className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${rotation !== 0
                                                    ? "border-primary-500 ring-2 ring-primary-500/20"
                                                    : "border-surface-200 dark:border-surface-700"
                                                    }`}
                                            >
                                                <Image
                                                    src={thumb}
                                                    alt={`Page ${index + 1}`}
                                                    fill
                                                    className="object-contain bg-white transition-transform duration-300"
                                                    style={{ transform: `rotate(${rotation}deg)` }}
                                                    unoptimized
                                                />
                                                <div className="absolute top-1 left-1 bg-surface-900/70 text-white text-xs px-1.5 py-0.5 rounded">
                                                    {index + 1}
                                                </div>
                                                {rotation !== 0 && (
                                                    <div className="absolute top-1 right-1 bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded">
                                                        {rotation}°
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex gap-1 justify-center">
                                                <button
                                                    onClick={() => rotatePageBy(index, -90)}
                                                    className="p-2 rounded-lg bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
                                                    title="Rotate left"
                                                >
                                                    <RotateCcw className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => rotatePageBy(index, 90)}
                                                    className="p-2 rounded-lg bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
                                                    title="Rotate right"
                                                >
                                                    <RotateCw className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
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
                                Rotating pages...
                            </p>
                        </motion.div>
                    )}

                    {/* Action Buttons */}
                    {thumbnails.length > 0 && !isProcessing && (
                        <div className="flex justify-center gap-4">
                            <Button variant="secondary" onClick={handleReset}>
                                Clear
                            </Button>
                            <Button
                                onClick={handleRotate}
                                size="lg"
                                disabled={rotations.size === 0}
                            >
                                Apply Rotation ({rotations.size} pages)
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <DownloadButton
                        onClick={handleDownload}
                        filename={`${file.name.replace(".pdf", "")}_rotated.pdf`}
                        fileSize={result.blob.size}
                        isReady
                    />
                    <div className="text-center">
                        <p className="text-sm text-surface-500 mb-4">
                            {rotations.size} pages rotated
                        </p>
                        <Button variant="secondary" onClick={handleReset}>
                            Rotate Another PDF
                        </Button>
                    </div>
                </div>
            )}
        </ToolLayout>
    );
}
