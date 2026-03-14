"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { FileText, FileType } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { ConversionProgress } from "@/components/tools/ConversionProgress";
import { ConversionResult } from "@/components/tools/ConversionResult";
import { Button } from "@/components/ui/Button";
import { FileWithPreview } from "@/types/tools";
import { downloadBlob, createPdfBlob } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import { useConversionWorker } from "@/hooks/useConversionWorker";

export default function WordToPdfClient() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [result, setResult] = useState<{ blob: Blob; pageCount: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { process, progress, stage, isProcessing, resetProgress } = useConversionWorker();
    const toast = useToast();

    const file = files[0]?.file;

    const handleFilesChange = useCallback((newFiles: FileWithPreview[]) => {
        setFiles(newFiles.slice(0, 1));
        setResult(null);
        setError(null);
    }, []);

    const handleConvert = async () => {
        if (!file) {
            setError("Please upload a Word document");
            return;
        }

        setError(null);

        try {
            const workerResult = await process({
                operation: "word-to-pdf",
                files: [file],
            });

            const data = new Uint8Array(workerResult.data as ArrayBuffer);
            const blob = createPdfBlob(data);
            const pageCount = (workerResult.details?.pageCount as number) || 1;

            setResult({ blob, pageCount });
            toast.success("Word document converted to PDF successfully!");
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        }
    };

    const baseName = file?.name.replace(/\.(docx?|doc)$/i, "") || "converted";

    const handleDownload = () => {
        if (result) {
            downloadBlob(result.blob, `${baseName}.pdf`);
        }
    };

    const handleReset = () => {
        setFiles([]);
        setResult(null);
        setError(null);
        resetProgress();
    };

    return (
        <ToolLayout
            title="Word to PDF"
            description="Convert Word documents to PDF format."
            icon={FileText}
            color="from-blue-500 to-blue-600"
        >
            {!result ? (
                <div className="space-y-6">
                    <FileUploader
                        accept={{
                            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
                            "application/msword": [".doc"],
                        }}
                        multiple={false}
                        maxFiles={1}
                        files={files}
                        onFilesChange={handleFilesChange}
                        label="Drop your Word document here"
                    />

                    {error && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm"
                            role="alert"
                        >
                            {error}
                        </motion.div>
                    )}

                    {isProcessing && (
                        <ConversionProgress
                            progress={progress}
                            stage={stage}
                            sourceIcon={FileType}
                            targetIcon={FileText}
                            sourceColor="from-blue-500 to-blue-600"
                            targetColor="from-red-500 to-red-600"
                            sourceFormat="DOCX"
                            targetFormat="PDF"
                        />
                    )}

                    {file && !isProcessing && (
                        <div className="flex justify-center gap-4">
                            <Button variant="secondary" onClick={handleReset}>
                                Clear
                            </Button>
                            <Button onClick={handleConvert} size="lg">
                                Convert to PDF
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <ConversionResult
                    sourceFormat="DOCX"
                    targetFormat="PDF"
                    sourceIcon={FileType}
                    targetIcon={FileText}
                    sourceColor="from-blue-500 to-blue-600"
                    targetColor="from-red-500 to-red-600"
                    filename={`${baseName}.pdf`}
                    fileSize={result.blob.size}
                    details={{ pageCount: result.pageCount }}
                    onDownload={handleDownload}
                    onReset={handleReset}
                />
            )}
        </ToolLayout>
    );
}
