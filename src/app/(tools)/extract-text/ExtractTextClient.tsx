"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import * as pdfjs from "pdfjs-dist";
import { FileText, Copy, Check, Download } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { PrimaryAction } from "@/components/tools/PrimaryAction";
import { Button } from "@/components/ui/Button";
import { FileWithPreview } from "@/types/tools";
import { downloadBlob, readFileAsArrayBuffer, formatFileSize } from "@/lib/utils";

if (typeof window !== "undefined") {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

export default function ExtractTextClient() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [text, setText] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [pageCount, setPageCount] = useState(0);

    const file = files[0]?.file;

    const handleFilesChange = useCallback((newFiles: FileWithPreview[]) => {
        setFiles(newFiles.slice(0, 1));
        setText(null);
        setError(null);
    }, []);

    const handleExtract = async () => {
        if (!file) {
            setError("Please upload a PDF file");
            return;
        }

        setError(null);
        setIsProcessing(true);

        try {
            const arrayBuffer = await readFileAsArrayBuffer(file);
            const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
            setPageCount(pdf.numPages);

            const textParts: string[] = [];

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                const pageText = content.items
                    .map((item) => {
                        if ("str" in item) return item.str;
                        return "";
                    })
                    .join(" ");

                if (pageText.trim()) {
                    textParts.push(`--- Page ${i} ---\n${pageText.trim()}`);
                }
            }

            setText(textParts.join("\n\n") || "(No text found in this PDF)");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to extract text");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCopy = async () => {
        if (text) {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownloadText = () => {
        if (text) {
            const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
            const baseName = file?.name.replace(/\.pdf$/i, "") || "extracted";
            downloadBlob(blob, `${baseName}.txt`);
        }
    };

    const handleReset = () => {
        setFiles([]);
        setText(null);
        setError(null);
        setPageCount(0);
    };

    return (
        <ToolLayout
            title="Extract Text"
            description="Extract readable text from your PDF document"
            icon={FileText}
            color="from-emerald-500 to-teal-600"
        >
            {!text ? (
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
                                    <p className="font-medium text-surface-900 dark:text-white truncate">
                                        {file.name}
                                    </p>
                                    <p className="text-sm text-surface-500">
                                        Current size: {formatFileSize(file.size)}
                                    </p>
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
                                    onClick={handleExtract}
                                    loading={isProcessing}
                                    icon={<FileText className="w-4 h-4" />}
                                    context="Ready to extract text"
                                >
                                    Extract Text
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
                    <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-surface-900 dark:text-white">
                                Extracted Text ({pageCount} page{pageCount !== 1 ? "s" : ""})
                            </h3>
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={handleCopy}
                                    variant="outline"
                                    size="sm"
                                    leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                >
                                    {copied ? "Copied!" : "Copy All"}
                                </Button>
                                <Button
                                    onClick={handleDownloadText}
                                    variant="outline"
                                    size="sm"
                                    leftIcon={<Download className="w-4 h-4" />}
                                >
                                    Download .txt
                                </Button>
                            </div>
                        </div>
                        <pre className="bg-surface-50 dark:bg-surface-900 rounded-xl p-4 text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap font-sans max-h-96 overflow-y-auto border border-surface-200 dark:border-surface-700">
                            {text}
                        </pre>
                        <p className="text-xs text-surface-400 mt-2">
                            {text.length.toLocaleString()} characters extracted
                        </p>
                    </div>

                    <DownloadButton
                        onClick={handleDownloadText}
                        filename={file?.name?.replace(/\.pdf$/i, ".txt") || "extracted.txt"}
                        fileSize={new Blob([text]).size}
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
