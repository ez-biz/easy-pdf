"use client";

import { useState, useCallback } from "react";
import { Table, FileText } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { ConversionProgress } from "@/components/tools/ConversionProgress";
import { ConversionResult } from "@/components/tools/ConversionResult";
import { Button } from "@/components/ui/Button";
import { PrimaryAction } from "@/components/tools/PrimaryAction";
import { FileWithPreview } from "@/types/tools";
import { downloadBlob, createPdfBlob } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import { useConversionWorker } from "@/hooks/useConversionWorker";

export default function ExcelToPdfClient() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [result, setResult] = useState<{
        blob: Blob;
        pageCount: number;
        sheetCount: number;
    } | null>(null);
    const toast = useToast();
    const { process, progress, stage, isProcessing, resetProgress } = useConversionWorker();

    const handleFilesChange = useCallback((newFiles: FileWithPreview[]) => {
        setFiles(newFiles.slice(0, 1));
        setResult(null);
    }, []);

    const handleConvert = async () => {
        if (files.length === 0) {
            toast.warning("Please add an Excel file to convert");
            return;
        }

        try {
            const actualFiles = files.map((f) => f.file);
            const workerResult = await process({
                operation: "excel-to-pdf",
                files: actualFiles,
            });

            const data = new Uint8Array(workerResult.data as ArrayBuffer);
            const blob = createPdfBlob(data);
            setResult({
                blob,
                pageCount: (workerResult.details?.pageCount as number) || 1,
                sheetCount: (workerResult.details?.sheetCount as number) || 1,
            });
            toast.success("Excel converted to PDF successfully!");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "An error occurred");
        }
    };

    const originalName = files[0]?.file.name.replace(/\.(xlsx|xls)$/i, "") || "converted";

    const handleDownload = () => {
        if (result) {
            downloadBlob(result.blob, `${originalName}.pdf`);
        }
    };

    const handleReset = () => {
        setFiles([]);
        setResult(null);
        resetProgress();
    };

    return (
        <ToolLayout
            title="Excel to PDF"
            description="Convert Excel spreadsheets to PDF format."
            icon={Table}
            color="from-green-500 to-green-600"
        >
            {!result ? (
                <div className="space-y-6">
                    <FileUploader
                        accept={{
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
                            "application/vnd.ms-excel": [".xls"],
                        }}
                        multiple={false}
                        maxFiles={1}
                        files={files}
                        onFilesChange={handleFilesChange}
                        label="Drop your Excel file here"
                    />

                    {isProcessing && (
                        <ConversionProgress
                            progress={progress}
                            stage={stage}
                            sourceIcon={Table}
                            targetIcon={FileText}
                            sourceColor="from-green-500 to-green-600"
                            targetColor="from-red-500 to-red-600"
                            sourceFormat="XLSX"
                            targetFormat="PDF"
                        />
                    )}

                    {files.length > 0 && !isProcessing && (
                        <div className="flex justify-center gap-4">
                            <Button variant="secondary" onClick={handleReset}>
                                Clear
                            </Button>
                            <PrimaryAction
                                onClick={handleConvert}
                                loading={isProcessing}
                                context="1 file ready"
                            >
                                Convert to PDF
                            </PrimaryAction>
                        </div>
                    )}
                </div>
            ) : (
                <ConversionResult
                    sourceFormat="XLSX"
                    targetFormat="PDF"
                    sourceIcon={Table}
                    targetIcon={FileText}
                    sourceColor="from-green-500 to-green-600"
                    targetColor="from-red-500 to-red-600"
                    filename={`${originalName}.pdf`}
                    fileSize={result.blob.size}
                    details={{ pageCount: result.pageCount, sheetCount: result.sheetCount }}
                    onDownload={handleDownload}
                    onReset={handleReset}
                />
            )}
        </ToolLayout>
    );
}
