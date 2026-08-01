"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { FilePlus, FileText } from "lucide-react";
import { PDFDocument } from "@cantoo/pdf-lib";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { PrimaryAction } from "@/components/tools/PrimaryAction";
import { Button } from "@/components/ui/Button";
import { downloadBlob, createPdfBlob } from "@/lib/utils";
import { PAGE_SIZES } from "@/lib/constants";

const PAGE_SIZE_OPTIONS: { label: string; value: keyof typeof PAGE_SIZES }[] = [
    { label: "A4 (210 × 297 mm)", value: "a4" },
    { label: "Letter (8.5 × 11 in)", value: "letter" },
];

const ORIENTATIONS = [
    { label: "Portrait", value: "portrait" as const },
    { label: "Landscape", value: "landscape" as const },
];

export default function CreatePdfClient() {
    const [pageSize, setPageSize] = useState<keyof typeof PAGE_SIZES>("a4");
    const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
    const [pageCount, setPageCount] = useState(1);
    const [result, setResult] = useState<{ blob: Blob; size: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCreate = async () => {
        setError(null);
        setIsProcessing(true);

        try {
            const pdfDoc = await PDFDocument.create();
            const size = PAGE_SIZES[pageSize];

            for (let i = 0; i < pageCount; i++) {
                const page = pdfDoc.addPage(
                    orientation === "landscape" ? [size.height, size.width] : [size.width, size.height]
                );
            }

            const pdfBytes = await pdfDoc.save();
            const blob = createPdfBlob(pdfBytes);
            setResult({ blob, size: blob.size });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create PDF");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setResult(null);
        setError(null);
    };

    return (
        <ToolLayout
            title="Create PDF"
            description="Create a new blank PDF document"
            icon={FilePlus}
            color="from-blue-500 to-indigo-600"
        >
            {!result ? (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700 space-y-6">
                        {/* Page Size */}
                        <div>
                            <h3 className="font-semibold text-surface-900 dark:text-white mb-3">Page Size</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {PAGE_SIZE_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setPageSize(opt.value)}
                                        className={`p-4 rounded-xl border-2 text-center transition-[border-color,background-color] ${
                                            pageSize === opt.value
                                                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                                : "border-surface-200 dark:border-surface-700 hover:border-surface-300"
                                        }`}
                                    >
                                        <p className="font-medium text-surface-900 dark:text-white">{opt.label}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Orientation */}
                        <div>
                            <h3 className="font-semibold text-surface-900 dark:text-white mb-3">Orientation</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {ORIENTATIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setOrientation(opt.value)}
                                        className={`p-4 rounded-xl border-2 text-center transition-[border-color,background-color] ${
                                            orientation === opt.value
                                                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                                : "border-surface-200 dark:border-surface-700 hover:border-surface-300"
                                        }`}
                                    >
                                        <p className="font-medium text-surface-900 dark:text-white">{opt.label}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Page Count */}
                        <div>
                            <h3 className="font-semibold text-surface-900 dark:text-white mb-3">
                                Number of Pages: {pageCount}
                            </h3>
                            <input
                                type="range"
                                min={1}
                                max={50}
                                value={pageCount}
                                onChange={(e) => setPageCount(Number(e.target.value))}
                                className="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                            />
                            <div className="flex justify-between text-xs text-surface-400 mt-1">
                                <span>1</span>
                                <span>50</span>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm"
                        >
                            {error}
                        </motion.div>
                    )}

                    <div className="flex justify-center gap-4">
                        <PrimaryAction
                            onClick={handleCreate}
                            loading={isProcessing}
                            icon={<FilePlus className="w-4 h-4" />}
                            context={`Creates a blank PDF with ${pageCount} page${pageCount !== 1 ? "s" : ""}`}
                        >
                            Create PDF
                        </PrimaryAction>
                    </div>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                >
                    <div className="bg-white dark:bg-surface-800 rounded-2xl p-8 border border-surface-200 dark:border-surface-700 text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        >
                            <FileText className="w-10 h-10 text-blue-500" />
                        </motion.div>
                        <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
                            PDF Created
                        </h2>
                        <p className="text-surface-500 dark:text-surface-400">
                            {pageCount} blank page{pageCount !== 1 ? "s" : ""} —{" "}
                            {orientation === "portrait" ? "Portrait" : "Landscape"} {pageSize.toUpperCase()}
                        </p>
                    </div>

                    <DownloadButton
                        onClick={() => downloadBlob(result.blob, "document.pdf")}
                        filename="document.pdf"
                        fileSize={result.size}
                        isReady={true}
                    />

                    <div className="text-center">
                        <div className="flex justify-center gap-3">
                            <Button variant="secondary" onClick={handleReset}>
                                Start Over
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}
        </ToolLayout>
    );
}
