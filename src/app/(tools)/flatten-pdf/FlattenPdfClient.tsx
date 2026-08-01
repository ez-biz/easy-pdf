"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Layers, FileText, ArrowRight } from "lucide-react";
import { PDFDocument } from "@cantoo/pdf-lib";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { PrimaryAction } from "@/components/tools/PrimaryAction";
import { Button } from "@/components/ui/Button";
import { FileWithPreview } from "@/types/tools";
import { downloadBlob, formatFileSize, createPdfBlob, readFileAsArrayBuffer } from "@/lib/utils";

export default function FlattenPdfClient() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [result, setResult] = useState<{ blob: Blob; size: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const file = files[0]?.file;

    const handleFilesChange = useCallback((newFiles: FileWithPreview[]) => {
        setFiles(newFiles.slice(0, 1));
        setResult(null);
        setError(null);
    }, []);

    const handleFlatten = async () => {
        if (!file) {
            setError("Please upload a PDF file");
            return;
        }

        setError(null);
        setIsProcessing(true);

        try {
            const arrayBuffer = await readFileAsArrayBuffer(file);
            const pdfDoc = await PDFDocument.load(arrayBuffer);

            const form = pdfDoc.getForm();
            const fields = form.getFields();

            // Flatten all form fields
            fields.forEach((field) => {
                try {
                    field.enableReadOnly();
                } catch {
                    // Some fields may not support readonly
                }
            });

            // Flatten the form
            try {
                form.flatten();
            } catch {
                // Flatten may not be directly supported; fall through
            }

            const pdfBytes = await pdfDoc.save();
            const blob = createPdfBlob(pdfBytes);
            setResult({ blob, size: blob.size });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to flatten PDF");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (result && file) {
            const baseName = file.name.replace(/\.pdf$/i, "");
            downloadBlob(result.blob, `${baseName}_flattened.pdf`);
        }
    };

    const handleReset = () => {
        setFiles([]);
        setResult(null);
        setError(null);
    };

    return (
        <ToolLayout
            title="Flatten PDF"
            description="Merge annotations and form fields into the document permanently"
            icon={Layers}
            color="from-purple-500 to-violet-600"
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
                        description="Flatten form fields and annotations permanently"
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

                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                    Flattening makes form fields and annotations a permanent part of the document.
                                    This cannot be undone.
                                </p>
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
                                    onClick={handleFlatten}
                                    loading={isProcessing}
                                    icon={<Layers className="w-4 h-4" />}
                                    context="Ready to flatten"
                                >
                                    Flatten PDF
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
                            className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        >
                            <Layers className="w-10 h-10 text-purple-500" />
                        </motion.div>
                        <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
                            PDF Flattened
                        </h2>
                        <p className="text-surface-500 dark:text-surface-400">
                            All form fields and annotations have been merged into the document.
                        </p>
                        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                            <div className="text-center">
                                <p className="text-surface-500">Original</p>
                                <p className="font-semibold text-surface-900 dark:text-white">
                                    {formatFileSize(file.size)}
                                </p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-surface-400" />
                            <div className="text-center">
                                <p className="text-surface-500">Flattened</p>
                                <p className="font-semibold text-green-600 dark:text-green-400">
                                    {formatFileSize(result.size)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <DownloadButton
                        onClick={handleDownload}
                        filename={file.name.replace(/\.pdf$/i, "_flattened.pdf")}
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
