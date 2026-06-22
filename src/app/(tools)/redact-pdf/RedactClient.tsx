"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Eraser } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { RedactionEditor } from "@/components/tools/RedactionEditor";
import { Button } from "@/components/ui/Button";
import { PrimaryAction } from "@/components/tools/PrimaryAction";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { FileWithPreview } from "@/types/tools";
import { downloadBlob } from "@/lib/utils";
import { applyRedactions, type RedactionBox } from "@/lib/pdf/redact";

if (typeof window !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

export default function RedactClient() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [boxes, setBoxes] = useState<RedactionBox[]>([]);
    const [pageNumber, setPageNumber] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<Blob | null>(null);
    const [error, setError] = useState<string | null>(null);

    const file = files[0]?.file;

    useEffect(() => {
        let cancelled = false;
        if (!file) {
            setTotalPages(0);
            return;
        }
        (async () => {
            try {
                const data = new Uint8Array(await file.arrayBuffer());
                const pdf = await pdfjsLib.getDocument({ data }).promise;
                if (!cancelled) setTotalPages(pdf.numPages);
            } catch {
                if (!cancelled) setError("Could not read this PDF. It may be encrypted.");
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [file]);

    const handleFilesChange = useCallback((newFiles: FileWithPreview[]) => {
        setFiles(newFiles.slice(0, 1));
        setBoxes([]);
        setPageNumber(1);
        setResult(null);
        setError(null);
    }, []);

    const addBox = (rect: { x: number; y: number; w: number; h: number }) =>
        setBoxes((prev) => [...prev, { id: crypto.randomUUID(), page: pageNumber - 1, ...rect }]);
    const updateBox = (id: string, updates: Partial<RedactionBox>) =>
        setBoxes((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
    const deleteBox = (id: string) => setBoxes((prev) => prev.filter((b) => b.id !== id));

    const currentBoxes = boxes.filter((b) => b.page === pageNumber - 1);

    const handleApply = async () => {
        if (!file || boxes.length === 0) return;
        setIsProcessing(true);
        setError(null);
        try {
            const { blob } = await applyRedactions(file, boxes);
            setResult(blob);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Redaction failed. No file was produced.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (result && file) downloadBlob(result, `${file.name.replace(".pdf", "")}_redacted.pdf`);
    };

    const handleReset = () => {
        setFiles([]);
        setBoxes([]);
        setPageNumber(1);
        setResult(null);
        setError(null);
    };

    return (
        <ToolLayout
            title="Redact PDF"
            description="Permanently black out sensitive content — redacted pages are flattened so the hidden text is truly gone"
            icon={Eraser}
            color="from-red-500 to-red-600"
        >
            {!result ? (
                <div className="space-y-6">
                    <FileUploader
                        accept={{ "application/pdf": [".pdf"] }}
                        multiple={false}
                        maxFiles={1}
                        files={files}
                        onFilesChange={handleFilesChange}
                        label="Drop your PDF here to redact"
                    />

                    {file && totalPages > 0 && (
                        <>
                            <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                                Redacted pages are flattened to images, so they lose selectable/searchable text. This is what
                                makes the redaction permanent and unrecoverable.
                            </div>

                            <RedactionEditor
                                file={file}
                                pageNumber={pageNumber}
                                totalPages={totalPages}
                                boxes={currentBoxes}
                                onPageChange={setPageNumber}
                                onAddBox={addBox}
                                onUpdateBox={updateBox}
                                onDeleteBox={deleteBox}
                            />

                            {error && (
                                <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                                    {error}
                                </div>
                            )}

                            {isProcessing && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                                    <ProgressBar value={50} />
                                    <p className="text-center text-sm text-surface-500">Applying redactions…</p>
                                </motion.div>
                            )}

                            {!isProcessing && (
                                <div className="flex justify-center gap-4">
                                    <Button variant="secondary" onClick={handleReset}>
                                        Clear
                                    </Button>
                                    <PrimaryAction
                                        onClick={handleApply}
                                        disabled={boxes.length === 0}
                                        context={`${boxes.length} box${boxes.length === 1 ? "" : "es"} drawn`}
                                    >
                                        {boxes.length > 0 ? `Apply ${boxes.length} Redaction${boxes.length === 1 ? "" : "s"}` : "Apply Redactions"}
                                    </PrimaryAction>
                                </div>
                            )}
                        </>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="rounded-2xl border border-surface-200 bg-white p-6 text-center dark:border-surface-700 dark:bg-surface-800">
                        <h3 className="mb-2 font-semibold text-surface-900 dark:text-white">Redacted PDF ready</h3>
                        <p className="text-sm text-surface-500">The redacted content has been permanently removed.</p>
                    </div>
                    <div className="flex justify-center gap-4">
                        <DownloadButton
                            onClick={handleDownload}
                            filename={`${file!.name.replace(".pdf", "")}_redacted.pdf`}
                            fileSize={result.size}
                            isReady
                        />
                        <Button variant="secondary" onClick={handleReset}>
                            Redact Another
                        </Button>
                    </div>
                </div>
            )}
        </ToolLayout>
    );
}
