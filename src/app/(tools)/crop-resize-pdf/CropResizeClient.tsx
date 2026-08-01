"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Crop, FileText } from "lucide-react";
import { PDFDocument } from "@cantoo/pdf-lib";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { PrimaryAction } from "@/components/tools/PrimaryAction";
import { FileWithPreview } from "@/types/tools";
import { downloadBlob, formatFileSize, createPdfBlob, readFileAsArrayBuffer } from "@/lib/utils";

interface Margins {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

export default function CropResizeClient() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [margins, setMargins] = useState<Margins>({ top: 0, bottom: 0, left: 0, right: 0 });
    const [result, setResult] = useState<{ blob: Blob; size: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const file = files[0]?.file;

    const handleFilesChange = useCallback((newFiles: FileWithPreview[]) => {
        setFiles(newFiles.slice(0, 1));
        setResult(null);
        setError(null);
    }, []);

    const handleCrop = async () => {
        if (!file) {
            setError("Please upload a PDF file");
            return;
        }

        setError(null);
        setIsProcessing(true);

        try {
            const arrayBuffer = await readFileAsArrayBuffer(file);
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pages = pdfDoc.getPages();

            for (const page of pages) {
                const { width, height } = page.getSize();
                const newX = margins.left;
                const newY = margins.bottom;
                const newWidth = width - margins.left - margins.right;
                const newHeight = height - margins.top - margins.bottom;

                if (newWidth <= 0 || newHeight <= 0) {
                    throw new Error("Margins are too large — they exceed the page size");
                }

                page.setCropBox(newX, newY, newWidth, newHeight);
                page.setMediaBox(newX, newY, newWidth, newHeight);
            }

            const pdfBytes = await pdfDoc.save();
            const blob = createPdfBlob(pdfBytes);
            setResult({ blob, size: blob.size });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to crop PDF");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (result && file) {
            const baseName = file.name.replace(/\.pdf$/i, "");
            downloadBlob(result.blob, `${baseName}_cropped.pdf`);
        }
    };

    const handleReset = () => {
        setFiles([]);
        setResult(null);
        setError(null);
        setMargins({ top: 0, bottom: 0, left: 0, right: 0 });
    };

    const marginField = (label: string, value: number, key: keyof Margins) => (
        <div className="space-y-1">
            <label className="text-sm font-medium text-surface-700 dark:text-surface-300">{label}</label>
            <div className="flex items-center gap-2">
                <input
                    type="range"
                    min={0}
                    max={200}
                    value={value}
                    onChange={(e) => setMargins({ ...margins, [key]: Number(e.target.value) })}
                    className="flex-1 h-2 bg-surface-200 dark:bg-surface-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
                <span className="w-10 text-sm text-surface-500 text-right">{value}px</span>
            </div>
        </div>
    );

    return (
        <ToolLayout
            title="Crop & Resize PDF"
            description="Trim margins and resize PDF pages"
            icon={Crop}
            color="from-teal-500 to-cyan-600"
        >
            {!result ? (
                <div className="space-y-6">
                    <FileUploader
                        accept={{ "application/pdf": [".pdf"] }}
                        multiple={false}
                        maxFiles={1}
                        files={files}
                        onFilesChange={handleFilesChange}
                        label="Drop your PDF file here"
                    />

                    {file && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-3 p-4 bg-surface-50 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
                                <div className="w-12 h-14 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <p className="font-medium text-surface-900 dark:text-white truncate">{file.name}</p>
                                    <p className="text-sm text-surface-500">{formatFileSize(file.size)}</p>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                                <h3 className="font-semibold text-surface-900 dark:text-white mb-4">Crop Margins</h3>
                                <p className="text-sm text-surface-500 mb-4">
                                    Set how many pixels to trim from each edge. All pages will be cropped uniformly.
                                </p>
                                <div className="space-y-4">
                                    {marginField("Top Margin", margins.top, "top")}
                                    {marginField("Bottom Margin", margins.bottom, "bottom")}
                                    {marginField("Left Margin", margins.left, "left")}
                                    {marginField("Right Margin", margins.right, "right")}
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <p className="text-sm text-surface-500">Ready to crop</p>
                                <PrimaryAction
                                    onClick={handleCrop}
                                    loading={isProcessing}
                                    icon={<Crop className="w-4 h-4" />}
                                >
                                    Crop PDF
                                </PrimaryAction>
                            </div>
                        </motion.div>
                    )}
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
                            className="w-20 h-20 bg-teal-100 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        >
                            <Crop className="w-10 h-10 text-teal-500" />
                        </motion.div>
                        <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">PDF Cropped</h2>
                        <p className="text-surface-500 dark:text-surface-400">
                            Margins trimmed: T:{margins.top} B:{margins.bottom} L:{margins.left} R:{margins.right}px
                        </p>
                    </div>

                    <div className="flex items-center justify-between">
                        <DownloadButton
                            onClick={handleDownload}
                            filename={file.name.replace(/\.pdf$/i, "_cropped.pdf")}
                            fileSize={result.size}
                            isReady={true}
                        />
                        <button onClick={handleReset} className="text-sm text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 transition-colors">
                            Crop Another
                        </button>
                    </div>
                </motion.div>
            )}
        </ToolLayout>
    );
}
