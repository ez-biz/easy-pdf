"use client";

import { useState, useCallback } from "react";
import { Presentation, FileText } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { ConversionProgress } from "@/components/tools/ConversionProgress";
import { ConversionResult } from "@/components/tools/ConversionResult";
import { Button } from "@/components/ui/Button";
import { PrimaryAction } from "@/components/tools/PrimaryAction";
import { FileWithPreview } from "@/types/tools";
import { downloadBlob } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import { useConversionWorker } from "@/hooks/useConversionWorker";

export default function PdfToPptxClient() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [result, setResult] = useState<{ blob: Blob; pageCount: number } | null>(null);
    const toast = useToast();
    const { process, progress, stage, isProcessing, resetProgress } = useConversionWorker();

    const handleFilesChange = useCallback((newFiles: FileWithPreview[]) => {
        setFiles(newFiles.slice(0, 1));
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
                operation: "pdf-to-pptx",
                files: actualFiles,
            });

            const blob = new Blob([new Uint8Array(workerResult.data as ArrayBuffer)], {
                type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            });
            const pageCount = (workerResult.details?.pageCount as number) || 1;
            setResult({ blob, pageCount });
            toast.success("PDF converted to PowerPoint successfully!");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "An error occurred");
        }
    };

    const originalName = files[0]?.file.name.replace(/\.pdf$/i, "") || "converted";

    const handleDownload = () => {
        if (result) {
            downloadBlob(result.blob, `${originalName}.pptx`);
        }
    };

    const handleReset = () => {
        setFiles([]);
        setResult(null);
        resetProgress();
    };

    return (
        <ToolLayout
            title="PDF to PowerPoint"
            description="Convert PDF pages to PowerPoint slides. Each page becomes a slide."
            icon={Presentation}
            color="from-orange-500 to-orange-600"
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
                            targetIcon={Presentation}
                            sourceColor="from-red-500 to-red-600"
                            targetColor="from-orange-500 to-orange-600"
                            sourceFormat="PDF"
                            targetFormat="PPTX"
                        />
                    )}

                    {files.length > 0 && !isProcessing && (
                        <div className="flex justify-center gap-4">
                            <Button variant="secondary" onClick={handleReset}>
                                Clear All
                            </Button>
                            <PrimaryAction
                                onClick={handleConvert}
                                loading={isProcessing}
                                context="1 file ready"
                            >
                                Convert to PowerPoint
                            </PrimaryAction>
                        </div>
                    )}
                </div>
            ) : (
                <ConversionResult
                    sourceFormat="PDF"
                    targetFormat="PPTX"
                    sourceIcon={FileText}
                    targetIcon={Presentation}
                    sourceColor="from-red-500 to-red-600"
                    targetColor="from-orange-500 to-orange-600"
                    filename={`${originalName}.pptx`}
                    fileSize={result.blob.size}
                    details={{ pageCount: result.pageCount }}
                    onDownload={handleDownload}
                    onReset={handleReset}
                />
            )}
        </ToolLayout>
    );
}
