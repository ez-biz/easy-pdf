"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ScanText } from "lucide-react";
import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { FileWithPreview } from "@/types/tools";
import { downloadBlob } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.mjs",
    import.meta.url
).toString();

const LANGUAGES = [
    { value: "eng", label: "English" },
    { value: "spa", label: "Spanish" },
    { value: "fra", label: "French" },
    { value: "deu", label: "German" },
    { value: "ita", label: "Italian" },
    { value: "por", label: "Portuguese" },
    { value: "hin", label: "Hindi" },
    { value: "jpn", label: "Japanese" },
    { value: "kor", label: "Korean" },
    { value: "chi_sim", label: "Chinese (Simplified)" },
    { value: "ara", label: "Arabic" },
];

export default function OcrClient() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [language, setLanguage] = useState("eng");
    const [result, setResult] = useState<{ text: string; blob: Blob } | null>(null);
    const [progress, setProgress] = useState(0);
    const [stage, setStage] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const toast = useToast();

    const file = files[0]?.file;

    const handleFilesChange = useCallback((newFiles: FileWithPreview[]) => {
        setFiles(newFiles.slice(0, 1));
        setResult(null);
        setError(null);
    }, []);

    const handleOcr = async () => {
        if (!file) {
            setError("Please upload a PDF file");
            return;
        }

        setIsProcessing(true);
        setProgress(0);
        setStage("Loading PDF...");
        setError(null);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const totalPages = pdf.numPages;
            const allText: string[] = [];

            for (let i = 1; i <= totalPages; i++) {
                setStage(`Processing page ${i} of ${totalPages}...`);

                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 });

                const canvas = document.createElement("canvas");
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const context = canvas.getContext("2d")!;

                await page.render({ canvasContext: context, viewport }).promise;

                const { data } = await Tesseract.recognize(canvas, language);
                allText.push(data.text);

                setProgress(Math.round((i / totalPages) * 100));
            }

            const text = allText.join("\n\n--- Page Break ---\n\n");
            const blob = new Blob([text], { type: "text/plain" });
            setResult({ text, blob });
            setStage("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred during OCR processing");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (result && file) {
            const baseName = file.name.replace(".pdf", "");
            downloadBlob(result.blob, `${baseName}_ocr.txt`);
        }
    };

    const handleCopyText = async () => {
        if (result) {
            await navigator.clipboard.writeText(result.text);
            toast.success("Text copied to clipboard!");
        }
    };

    const handleReset = () => {
        setFiles([]);
        setResult(null);
        setProgress(0);
        setStage("");
        setIsProcessing(false);
        setError(null);
    };

    return (
        <ToolLayout
            title="OCR PDF"
            description="Extract text from scanned PDFs using optical character recognition"
            icon={ScanText}
            color="from-violet-500 to-violet-600"
        >
            {!result ? (
                <div className="space-y-6">
                    <FileUploader
                        accept={{ "application/pdf": [".pdf"] }}
                        multiple={false}
                        maxFiles={1}
                        files={files}
                        onFilesChange={handleFilesChange}
                        label="Drop your scanned PDF here"
                    />

                    {file && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700"
                        >
                            <label htmlFor="ocr-language" className="block font-semibold text-surface-900 dark:text-white mb-4">OCR Language</label>
                            <select
                                id="ocr-language"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full p-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                            >
                                {LANGUAGES.map((lang) => (
                                    <option key={lang.value} value={lang.value}>
                                        {lang.label}
                                    </option>
                                ))}
                            </select>
                        </motion.div>
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

                    {isProcessing && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                            <ProgressBar value={progress} />
                            <p className="text-sm text-center text-surface-500">{stage || "Processing..."}</p>
                        </motion.div>
                    )}

                    {file && !isProcessing && (
                        <div className="flex justify-center gap-4">
                            <Button variant="secondary" onClick={handleReset}>
                                Clear
                            </Button>
                            <Button onClick={handleOcr} size="lg">
                                Extract Text
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700"
                    >
                        <h3 className="font-semibold text-surface-900 dark:text-white mb-4">Extracted Text</h3>
                        <pre className="max-h-96 overflow-y-auto p-4 bg-surface-50 dark:bg-surface-900 rounded-xl text-sm text-surface-900 dark:text-surface-100 whitespace-pre-wrap break-words">
                            <code>{result.text}</code>
                        </pre>
                    </motion.div>

                    <div className="flex justify-center gap-4">
                        <Button variant="secondary" onClick={handleCopyText}>
                            Copy Text
                        </Button>
                        <DownloadButton
                            onClick={handleDownload}
                            filename={`${file!.name.replace(".pdf", "")}_ocr.txt`}
                            fileSize={result.blob.size}
                            isReady
                        />
                        <Button variant="secondary" onClick={handleReset}>
                            Process Another
                        </Button>
                    </div>
                </div>
            )}
        </ToolLayout>
    );
}
