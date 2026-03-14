"use client";

import { useState, useCallback } from "react";
import { FileType, FileText } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { ConversionProgress } from "@/components/tools/ConversionProgress";
import { ConversionResult } from "@/components/tools/ConversionResult";
import { Button } from "@/components/ui/Button";
import { FileWithPreview } from "@/types/tools";
import { downloadBlob } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import { useConversionWorker } from "@/hooks/useConversionWorker";

export default function PdfToWordClient() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [result, setResult] = useState<{ blob: Blob; pageCount: number } | null>(null);
    const toast = useToast();
    const { process, progress, stage, isProcessing, resetProgress } = useConversionWorker();

    const handleFilesChange = useCallback((newFiles: FileWithPreview[]) => {
        setFiles(newFiles);
        setResult(null);
    }, []);

    const handleConvert = async () => {
        if (files.length === 0) {
            toast.warning("Please add a PDF file to convert");
            return;
        }

        try {
            const actualFiles = files.map((f) => f.file);
            const workerResult = await process({
                operation: "pdf-to-word",
                files: actualFiles,
            });

            const blob = new Blob([new Uint8Array(workerResult.data as ArrayBuffer)], {
                type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });
            const pageCount = (workerResult.details?.pageCount as number) || 1;
            setResult({ blob, pageCount });
            toast.success("PDF converted to Word successfully!");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "An error occurred");
        }
    };

    const originalName = files[0]?.file.name.replace(/\.pdf$/i, "") || "converted";

    const handleDownload = () => {
        if (result) {
            downloadBlob(result.blob, `${originalName}.docx`);
        }
    };

    const handleReset = () => {
        setFiles([]);
        setResult(null);
        resetProgress();
    };

    return (
        <ToolLayout
            title="PDF to Word"
            description="Convert PDF to editable Word documents. Best for text-heavy documents."
            icon={FileType}
            color="from-indigo-500 to-indigo-600"
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
                        description="or click to browse"
                    />

                    {isProcessing && (
                        <ConversionProgress
                            progress={progress}
                            stage={stage}
                            sourceIcon={FileText}
                            targetIcon={FileType}
                            sourceColor="from-red-500 to-red-600"
                            targetColor="from-indigo-500 to-indigo-600"
                            sourceFormat="PDF"
                            targetFormat="DOCX"
                        />
                    )}

                    {files.length > 0 && !isProcessing && (
                        <div className="flex justify-center gap-4">
                            <Button variant="secondary" onClick={handleReset}>
                                Clear All
                            </Button>
                            <Button onClick={handleConvert} size="lg">
                                Convert to Word
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <ConversionResult
                    sourceFormat="PDF"
                    targetFormat="DOCX"
                    sourceIcon={FileText}
                    targetIcon={FileType}
                    sourceColor="from-red-500 to-red-600"
                    targetColor="from-indigo-500 to-indigo-600"
                    filename={`${originalName}.docx`}
                    fileSize={result.blob.size}
                    details={{ pageCount: result.pageCount }}
                    onDownload={handleDownload}
                    onReset={handleReset}
                />
            )}
        </ToolLayout>
    );
}
