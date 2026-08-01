"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Archive, FileText, Package, ArrowRight } from "lucide-react";
import JSZip from "jszip";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { PrimaryAction } from "@/components/tools/PrimaryAction";
import { FileWithPreview } from "@/types/tools";
import { downloadBlob, formatFileSize, readFileAsArrayBuffer } from "@/lib/utils";

export default function PdfToZipClient() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [result, setResult] = useState<{ blob: Blob; size: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFilesChange = useCallback((newFiles: FileWithPreview[]) => {
        setFiles(newFiles);
        setResult(null);
        setError(null);
    }, []);

    const handleConvert = async () => {
        if (files.length === 0) {
            setError("Please upload at least one PDF file");
            return;
        }

        setError(null);
        setIsProcessing(true);

        try {
            const zip = new JSZip();

            for (const f of files) {
                const buffer = await readFileAsArrayBuffer(f.file);
                zip.file(f.file.name, buffer);
            }

            const zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
            setResult({ blob: zipBlob, size: zipBlob.size });
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred while creating ZIP");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (result) {
            const name = files.length === 1
                ? files[0].file.name.replace(/\.pdf$/i, "")
                : "pdfs";
            downloadBlob(result.blob, `${name}.zip`);
        }
    };

    const handleReset = () => {
        setFiles([]);
        setResult(null);
        setError(null);
        setIsProcessing(false);
    };

    const totalOriginalSize = files.reduce((sum, f) => sum + f.file.size, 0);

    return (
        <ToolLayout
            title="PDF to ZIP"
            description="Package multiple PDF files into a single ZIP archive"
            icon={Archive}
            color="from-amber-500 to-orange-600"
        >
            {!result ? (
                <div className="space-y-6">
                    <FileUploader
                        accept={{ "application/pdf": [".pdf"] }}
                        multiple={true}
                        files={files}
                        onFilesChange={handleFilesChange}
                        label="Drop your PDF files here"
                        description="Add multiple PDFs to bundle into a ZIP"
                    />

                    {files.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                                <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
                                    Files to ZIP ({files.length})
                                </h3>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {files.map((f) => (
                                        <div
                                            key={f.id}
                                            className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-800/50 rounded-lg border border-surface-200 dark:border-surface-700"
                                        >
                                            <div className="w-10 h-12 bg-red-100 dark:bg-red-900/30 rounded flex items-center justify-center flex-shrink-0">
                                                <FileText className="w-5 h-5 text-red-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-surface-900 dark:text-white truncate">
                                                    {f.file.name}
                                                </p>
                                                <p className="text-sm text-surface-500">
                                                    {formatFileSize(f.file.size)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700 flex items-center justify-between">
                                    <span className="text-sm text-surface-500">Total size</span>
                                    <span className="font-semibold text-surface-900 dark:text-white">
                                        {formatFileSize(totalOriginalSize)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <p className="text-sm text-surface-500">
                                    {files.length} file{files.length !== 1 ? "s" : ""} selected
                                </p>
                                <PrimaryAction
                                    onClick={handleConvert}
                                    loading={isProcessing}
                                    icon={<Package className="w-4 h-4" />}
                                >
                                    Create ZIP
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
                            className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        >
                            <Archive className="w-10 h-10 text-amber-500" />
                        </motion.div>
                        <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
                            ZIP Archive Ready
                        </h2>
                        <p className="text-surface-500 dark:text-surface-400">
                            {files.length} file{files.length !== 1 ? "s" : ""} packaged into a ZIP archive
                        </p>
                        <div className="mt-6 flex items-center justify-center gap-6 text-sm">
                            <div className="text-center">
                                <p className="text-surface-500">Original</p>
                                <p className="font-semibold text-surface-900 dark:text-white">
                                    {formatFileSize(totalOriginalSize)}
                                </p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-surface-400" />
                            <div className="text-center">
                                <p className="text-surface-500">ZIP Size</p>
                                <p className="font-semibold text-green-600 dark:text-green-400">
                                    {formatFileSize(result.size)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <DownloadButton
                            onClick={handleDownload}
                            filename={files.length === 1 ? `${files[0].file.name.replace(/\.pdf$/i, "")}.zip` : "pdfs.zip"}
                            fileSize={result.size}
                            isReady={true}
                        />
                        <button
                            onClick={handleReset}
                            className="text-sm text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 transition-colors"
                        >
                            Start Over
                        </button>
                    </div>
                </motion.div>
            )}
        </ToolLayout>
    );
}
