"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Droplets, Type } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { FileWithPreview } from "@/types/tools";
import {
    addTextWatermark,
    WatermarkPosition,
} from "@/lib/pdf/watermark";
import { downloadBlob, createPdfBlob } from "@/lib/utils";

const POSITION_OPTIONS: { id: WatermarkPosition; name: string }[] = [
    { id: "center", name: "Center" },
    { id: "diagonal", name: "Diagonal" },
    { id: "top-left", name: "Top Left" },
    { id: "top-right", name: "Top Right" },
    { id: "bottom-left", name: "Bottom Left" },
    { id: "bottom-right", name: "Bottom Right" },
];

const FONT_SIZE_OPTIONS = [
    { value: 24, label: "Small" },
    { value: 48, label: "Medium" },
    { value: 72, label: "Large" },
    { value: 96, label: "Extra Large" },
];

export default function AddWatermarkPage() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
    const [position, setPosition] = useState<WatermarkPosition>("diagonal");
    const [fontSize, setFontSize] = useState(48);
    const [opacity, setOpacity] = useState(0.3);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<{ blob: Blob } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFilesChange = useCallback((newFiles: FileWithPreview[]) => {
        setFiles(newFiles);
        setResult(null);
        setError(null);
    }, []);

    const handleApplyWatermark = async () => {
        if (files.length === 0 || !watermarkText.trim()) {
            setError("Please upload a PDF and enter watermark text");
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

            const watermarkResult = await addTextWatermark(file, {
                text: watermarkText,
                fontSize,
                opacity,
                position,
                color: { r: 0.5, g: 0.5, b: 0.5 },
            });

            clearInterval(progressInterval);
            setProgress(100);

            if (watermarkResult.success && watermarkResult.data) {
                const blob = createPdfBlob(watermarkResult.data);
                setResult({ blob });
            } else {
                setError(watermarkResult.error || "Failed to add watermark");
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
            downloadBlob(result.blob, `${originalName}_watermarked.pdf`);
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
            title="Add Watermark"
            description="Add text watermarks to your PDF documents"
            icon={Droplets}
            color="from-cyan-500 to-cyan-600"
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

                    {/* Watermark Options */}
                    {files.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid md:grid-cols-2 gap-6"
                        >
                            {/* Watermark Text */}
                            <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                                <h3 className="font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Type className="w-5 h-5" />
                                    Watermark Text
                                </h3>
                                <input
                                    type="text"
                                    value={watermarkText}
                                    onChange={(e) => setWatermarkText(e.target.value)}
                                    placeholder="Enter watermark text"
                                    className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            {/* Position */}
                            <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                                <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
                                    Position
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {POSITION_OPTIONS.map((option) => (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => setPosition(option.id)}
                                            className={`p-2 rounded-lg border-2 text-sm font-medium transition-all ${position === option.id
                                                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                                                : "border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300"
                                                }`}
                                        >
                                            {option.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Font Size */}
                            <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                                <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
                                    Font Size
                                </h3>
                                <div className="flex gap-2">
                                    {FONT_SIZE_OPTIONS.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setFontSize(option.value)}
                                            className={`flex-1 p-2 rounded-lg border-2 text-sm font-medium transition-all ${fontSize === option.value
                                                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                                : "border-surface-200 dark:border-surface-600"
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Opacity */}
                            <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                                <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
                                    Opacity: {Math.round(opacity * 100)}%
                                </h3>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="1"
                                    step="0.1"
                                    value={opacity}
                                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-surface-200 dark:bg-surface-600 rounded-lg appearance-none cursor-pointer accent-primary-500"
                                />
                                <div className="flex justify-between text-xs text-surface-500 mt-1">
                                    <span>Light</span>
                                    <span>Dark</span>
                                </div>
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
                            <p className="text-sm text-center text-surface-500">Adding watermark...</p>
                        </motion.div>
                    )}

                    {/* Action Button */}
                    {files.length > 0 && !isProcessing && (
                        <div className="flex justify-center">
                            <Button onClick={handleApplyWatermark} size="lg">
                                Add Watermark
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <DownloadButton
                        onClick={handleDownload}
                        filename={`${files[0]?.name.replace(".pdf", "")}_watermarked.pdf`}
                        fileSize={result.blob.size}
                        isReady
                    />
                    <div className="text-center">
                        <Button variant="secondary" onClick={handleReset}>
                            Watermark Another PDF
                        </Button>
                    </div>
                </div>
            )}
        </ToolLayout>
    );
}
