"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import * as pdfjs from "pdfjs-dist";
import { PDFDocument } from "@cantoo/pdf-lib";
import { SunMoon, FileText, Image } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { PrimaryAction } from "@/components/tools/PrimaryAction";
import { Button } from "@/components/ui/Button";
import { FileWithPreview } from "@/types/tools";
import { downloadBlob, formatFileSize, createPdfBlob, readFileAsArrayBuffer } from "@/lib/utils";

if (typeof window !== "undefined") {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

export default function InvertPdfClient() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [result, setResult] = useState<{ blob: Blob; size: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const file = files[0]?.file;

    const handleFilesChange = useCallback((newFiles: FileWithPreview[]) => {
        setFiles(newFiles.slice(0, 1));
        setResult(null);
        setError(null);
    }, []);

    const handleInvert = async () => {
        if (!file) {
            setError("Please upload a PDF file");
            return;
        }

        setError(null);
        setIsProcessing(true);
        setProgress(0);

        try {
            const arrayBuffer = await readFileAsArrayBuffer(file);
            const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
            const totalPages = pdf.numPages;

            const newPdf = await PDFDocument.create();

            for (let i = 1; i <= totalPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2 });

                const canvas = document.createElement("canvas");
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const ctx = canvas.getContext("2d");
                if (!ctx) continue;

                await page.render({ canvasContext: ctx, viewport }).promise;

                // Invert colours
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                for (let j = 0; j < data.length; j += 4) {
                    data[j] = 255 - data[j];       // R
                    data[j + 1] = 255 - data[j + 1]; // G
                    data[j + 2] = 255 - data[j + 2]; // B
                    // Alpha stays the same
                }
                ctx.putImageData(imageData, 0, 0);

                const pngBlob = await new Promise<Blob>((resolve, reject) => {
                    canvas.toBlob((b) => {
                        if (b) resolve(b);
                        else reject(new Error("Failed to create image"));
                    }, "image/png");
                });

                const pngBytes = await pngBlob.arrayBuffer();
                const img = await newPdf.embedPng(new Uint8Array(pngBytes));
                const newPage = newPdf.addPage([viewport.width, viewport.height]);
                newPage.drawImage(img, {
                    x: 0,
                    y: 0,
                    width: viewport.width,
                    height: viewport.height,
                });

                setProgress(Math.round((i / totalPages) * 100));
            }

            const pdfBytes = await newPdf.save();
            const blob = createPdfBlob(pdfBytes);
            setResult({ blob, size: blob.size });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to invert PDF colours");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (result && file) {
            const baseName = file.name.replace(/\.pdf$/i, "");
            downloadBlob(result.blob, `${baseName}_inverted.pdf`);
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
            title="Invert PDF Colours"
            description="Invert colours — create a dark mode version of your PDF"
            icon={SunMoon}
            color="from-gray-600 to-gray-800"
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
                        description="Invert colours for dark mode reading"
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
                                <div className="flex-1">
                                    <p className="font-medium text-surface-900 dark:text-white truncate">
                                        {file.name}
                                    </p>
                                    <p className="text-sm text-surface-500">
                                        Current size: {formatFileSize(file.size)}
                                    </p>
                                </div>
                            </div>

                            {isProcessing && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-surface-500">
                                        <span>Inverting colours...</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2">
                                        <div
                                            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

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
                                    onClick={handleInvert}
                                    loading={isProcessing}
                                    icon={<SunMoon className="w-4 h-4" />}
                                    context="Ready to invert"
                                >
                                    Invert Colours
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
                            className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        >
                            <SunMoon className="w-10 h-10 text-gray-500" />
                        </motion.div>
                        <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
                            Colours Inverted
                        </h2>
                        <p className="text-surface-500 dark:text-surface-400">
                            Your PDF is now in dark mode — white backgrounds become black.
                        </p>
                        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                            <div className="text-center">
                                <p className="text-surface-500">Original</p>
                                <p className="font-semibold text-surface-900 dark:text-white">
                                    {formatFileSize(file.size)}
                                </p>
                            </div>
                            <span className="text-surface-300">→</span>
                            <div className="text-center">
                                <p className="text-surface-500">Inverted</p>
                                <p className="font-semibold text-green-600 dark:text-green-400">
                                    {formatFileSize(result.size)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <DownloadButton
                        onClick={handleDownload}
                        filename={file.name.replace(/\.pdf$/i, "_inverted.pdf")}
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
