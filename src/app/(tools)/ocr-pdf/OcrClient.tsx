"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { ScanText } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { Button } from "@/components/ui/Button";
import { PrimaryAction } from "@/components/tools/PrimaryAction";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { FileWithPreview } from "@/types/tools";
import { downloadBlob } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import { getEngine, joinPages } from "@/lib/ocr";
import { OCR_LANGUAGES, getTesseractCode, isSupportedBy } from "@/lib/ocr/languages";
import type { OcrEngineId } from "@/lib/ocr/types";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.mjs",
    import.meta.url
).toString();

export default function OcrClient() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [language, setLanguage] = useState("eng");
    const [engineId, setEngineId] = useState<OcrEngineId>("paddle");
    const [result, setResult] = useState<{ text: string; blob: Blob } | null>(null);
    const [progress, setProgress] = useState(0);
    const [stage, setStage] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const toast = useToast();

    const file = files[0]?.file;

    // If the chosen engine can't handle the current language, fall back to English.
    useEffect(() => {
        if (!isSupportedBy(engineId, language)) {
            setLanguage("eng");
        }
    }, [engineId, language]);

    const handleFilesChange = useCallback((newFiles: FileWithPreview[]) => {
        setFiles(newFiles.slice(0, 1));
        setResult(null);
        setError(null);
    }, []);

    const runOcr = async (useEngine: OcrEngineId) => {
        if (!file) {
            setError("Please upload a PDF file");
            return;
        }
        if (!isSupportedBy(useEngine, language)) {
            setError("Selected language isn't available for this engine. Switch engine or language.");
            return;
        }
        // Tesseract needs its language code; the PaddleOCR default model is
        // language-agnostic, so we pass the UI code through (the engine ignores it).
        const langArg = useEngine === "tesseract" ? getTesseractCode(language)! : language;

        setIsProcessing(true);
        setProgress(0);
        setStage(useEngine === "paddle" ? "Loading OCR model…" : "Loading PDF…");
        setError(null);

        const engine = getEngine(useEngine);

        try {
            await engine.init(langArg, (_p, s) => setStage(s));

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const totalPages = pdf.numPages;
            const allText: string[] = [];

            for (let i = 1; i <= totalPages; i++) {
                setStage(`Processing page ${i} of ${totalPages}…`);

                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 });

                const canvas = document.createElement("canvas");
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const context = canvas.getContext("2d")!;

                await page.render({ canvasContext: context, viewport }).promise;

                const { text } = await engine.recognize(canvas, langArg);
                allText.push(text);

                setProgress(Math.round((i / totalPages) * 100));
            }

            const text = joinPages(allText);
            const blob = new Blob([text], { type: "text/plain" });
            setResult({ text, blob });
            setStage("");
        } catch (err) {
            const message = err instanceof Error ? err.message : "An error occurred during OCR processing";
            if (useEngine === "paddle") {
                // High-accuracy engine failed — fall back to Tesseract rather than dead-ending.
                setError(`High-accuracy engine failed: ${message}. Retrying with Tesseract…`);
                setIsProcessing(false);
                await runOcr("tesseract");
                return;
            }
            setError(message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleOcr = () => runOcr(engineId);

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
                        allowCamera
                    />

                    {file && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700"
                        >
                            <span className="block font-semibold text-surface-900 dark:text-white mb-3">OCR Engine</span>
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {([
                                    { id: "paddle", title: "High accuracy", sub: "PaddleOCR PP-OCRv5" },
                                    { id: "tesseract", title: "Fast", sub: "Tesseract" },
                                ] as const).map((opt) => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setEngineId(opt.id)}
                                        aria-pressed={engineId === opt.id}
                                        className={`rounded-xl border p-3 text-left transition focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none ${
                                            engineId === opt.id
                                                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                                : "border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900"
                                        }`}
                                    >
                                        <span className="block font-medium text-surface-900 dark:text-white">{opt.title}</span>
                                        <span className="block text-xs text-surface-500">{opt.sub}</span>
                                    </button>
                                ))}
                            </div>
                            {engineId === "paddle" && (
                                <p className="mb-6 text-xs text-surface-500">
                                    First run loads the OCR model once (~13&nbsp;MB), then works offline. Your files never leave your browser.
                                </p>
                            )}

                            <label htmlFor="ocr-language" className="block font-semibold text-surface-900 dark:text-white mb-4">OCR Language</label>
                            <select
                                id="ocr-language"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full p-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                            >
                                {OCR_LANGUAGES.map((lang) => {
                                    const supported = isSupportedBy(engineId, lang.uiCode);
                                    return (
                                        <option key={lang.uiCode} value={lang.uiCode} disabled={!supported}>
                                            {lang.label}
                                            {!supported ? " (not in this engine)" : ""}
                                        </option>
                                    );
                                })}
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
                            <PrimaryAction
                                onClick={handleOcr}
                                loading={isProcessing}
                                context="1 file ready"
                            >
                                Extract Text
                            </PrimaryAction>
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
