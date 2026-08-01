"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import * as pdfjs from "pdfjs-dist";
import { BookOpen, FileText } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { PrimaryAction } from "@/components/tools/PrimaryAction";
import { Button } from "@/components/ui/Button";
import { FileWithPreview } from "@/types/tools";
import { downloadBlob, formatFileSize, readFileAsArrayBuffer } from "@/lib/utils";
import { itemsToParagraphs, paragraphsToChapters, buildEpubZip } from "@/lib/epub/build";

if (typeof window !== "undefined") {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

async function createEpubFromPdf(pdfBuffer: ArrayBuffer, title: string): Promise<Blob> {
    const pdf = await pdfjs.getDocument({ data: pdfBuffer }).promise;

    const pages: string[][] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const items = content.items
            .filter((it) => "str" in it)
            .map((it) => {
                const t = it as { str: string; hasEOL?: boolean };
                return { str: t.str, hasEOL: t.hasEOL };
            });
        pages.push(itemsToParagraphs(items));
    }

    const zip = buildEpubZip(paragraphsToChapters(pages), title, {
        identifier: `urn:uuid:${crypto.randomUUID()}`,
        modified: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    });

    return await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}

export default function PdfToEpubClient() {
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

    const handleConvert = async () => {
        if (!file) {
            setError("Please upload a PDF file");
            return;
        }

        setError(null);
        setIsProcessing(true);

        try {
            const arrayBuffer = await readFileAsArrayBuffer(file);
            const title = file.name.replace(/\.pdf$/i, "");
            const epubBlob = await createEpubFromPdf(arrayBuffer, title);
            setResult({ blob: epubBlob, size: epubBlob.size });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to convert PDF to EPUB");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (result && file) {
            const baseName = file.name.replace(/\.pdf$/i, "");
            downloadBlob(result.blob, `${baseName}.epub`);
        }
    };

    const handleReset = () => {
        setFiles([]);
        setResult(null);
        setError(null);
    };

    return (
        <ToolLayout
            title="PDF to EPUB"
            description="Convert PDF documents to EPUB format for e-readers"
            icon={BookOpen}
            color="from-cyan-500 to-blue-600"
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
                                <div className="flex-1">
                                    <p className="font-medium text-surface-900 dark:text-white truncate">{file.name}</p>
                                    <p className="text-sm text-surface-500">Current size: {formatFileSize(file.size)}</p>
                                </div>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                    Text from each PDF page becomes a chapter in the EPUB. Images and layout are not carried over.
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
                                    onClick={handleConvert}
                                    loading={isProcessing}
                                    icon={<BookOpen className="w-4 h-4" />}
                                    context="Ready to convert"
                                >
                                    Convert to EPUB
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
                            className="w-20 h-20 bg-cyan-100 dark:bg-cyan-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        >
                            <BookOpen className="w-10 h-10 text-cyan-500" />
                        </motion.div>
                        <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">EPUB Ready</h2>
                        <p className="text-surface-500 dark:text-surface-400">
                            PDF converted to EPUB — {formatFileSize(file.size)} → {formatFileSize(result.size)}
                        </p>
                    </div>

                    <DownloadButton
                        onClick={handleDownload}
                        filename={file.name.replace(/\.pdf$/i, ".epub")}
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
