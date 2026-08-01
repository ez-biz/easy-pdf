"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { PanelTop, PanelBottom, FileText, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "@cantoo/pdf-lib";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { PrimaryAction } from "@/components/tools/PrimaryAction";
import { FileWithPreview } from "@/types/tools";
import { downloadBlob, formatFileSize, createPdfBlob, readFileAsArrayBuffer } from "@/lib/utils";

type Alignment = "left" | "center" | "right";

export default function HeadersFootersClient() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [headerText, setHeaderText] = useState("");
    const [footerText, setFooterText] = useState("");
    const [fontSize, setFontSize] = useState(10);
    const [alignment, setAlignment] = useState<Alignment>("center");
    const [result, setResult] = useState<{ blob: Blob; size: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const file = files[0]?.file;

    const handleFilesChange = useCallback((newFiles: FileWithPreview[]) => {
        setFiles(newFiles.slice(0, 1));
        setResult(null);
        setError(null);
    }, []);

    const handleApply = async () => {
        if (!file) {
            setError("Please upload a PDF file");
            return;
        }
        if (!headerText.trim() && !footerText.trim()) {
            setError("Please enter header or footer text");
            return;
        }

        setError(null);
        setIsProcessing(true);

        try {
            const arrayBuffer = await readFileAsArrayBuffer(file);
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const pages = pdfDoc.getPages();

            for (const page of pages) {
                const { width, height } = page.getSize();
                const pageNum = pages.indexOf(page) + 1;
                const totalPages = pages.length;

                // Replace placeholders
                const header = headerText
                    .replace(/{page}/g, String(pageNum))
                    .replace(/{total}/g, String(totalPages));
                const footer = footerText
                    .replace(/{page}/g, String(pageNum))
                    .replace(/{total}/g, String(totalPages));

                // Draw header
                if (header.trim()) {
                    const headerWidth = font.widthOfTextAtSize(header, fontSize);
                    let headerX: number;
                    switch (alignment) {
                        case "left":
                            headerX = 50;
                            break;
                        case "right":
                            headerX = width - headerWidth - 50;
                            break;
                        default:
                            headerX = (width - headerWidth) / 2;
                    }
                    page.drawText(header, {
                        x: headerX,
                        y: height - fontSize - 30,
                        size: fontSize,
                        font,
                        color: rgb(0.4, 0.4, 0.4),
                    });
                }

                // Draw footer
                if (footer.trim()) {
                    const footerWidth = font.widthOfTextAtSize(footer, fontSize);
                    let footerX: number;
                    switch (alignment) {
                        case "left":
                            footerX = 50;
                            break;
                        case "right":
                            footerX = width - footerWidth - 50;
                            break;
                        default:
                            footerX = (width - footerWidth) / 2;
                    }
                    page.drawText(footer, {
                        x: footerX,
                        y: 30,
                        size: fontSize,
                        font,
                        color: rgb(0.4, 0.4, 0.4),
                    });
                }
            }

            const pdfBytes = await pdfDoc.save();
            const blob = createPdfBlob(pdfBytes);
            setResult({ blob, size: blob.size });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to add headers/footers");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (result && file) {
            const baseName = file.name.replace(/\.pdf$/i, "");
            downloadBlob(result.blob, `${baseName}_headers.pdf`);
        }
    };

    const handleReset = () => {
        setFiles([]);
        setResult(null);
        setError(null);
        setHeaderText("");
        setFooterText("");
        setAlignment("center");
        setFontSize(10);
    };

    return (
        <ToolLayout
            title="Headers & Footers"
            description="Add custom headers and footers to every page"
            icon={PanelTop}
            color="from-indigo-500 to-blue-600"
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
                                <div>
                                    <p className="font-medium text-surface-900 dark:text-white truncate">{file.name}</p>
                                    <p className="text-sm text-surface-500">{formatFileSize(file.size)}</p>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700 space-y-6">
                                {/* Header Text */}
                                <div>
                                    <label className="flex items-center gap-2 font-semibold text-surface-900 dark:text-white mb-2">
                                        <PanelTop className="w-4 h-4" /> Header Text
                                    </label>
                                    <input
                                        type="text"
                                        value={headerText}
                                        onChange={(e) => setHeaderText(e.target.value)}
                                        placeholder="e.g. Confidential - Page {page}"
                                        className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                                    />
                                </div>

                                {/* Footer Text */}
                                <div>
                                    <label className="flex items-center gap-2 font-semibold text-surface-900 dark:text-white mb-2">
                                        <PanelBottom className="w-4 h-4" /> Footer Text
                                    </label>
                                    <input
                                        type="text"
                                        value={footerText}
                                        onChange={(e) => setFooterText(e.target.value)}
                                        placeholder="e.g. Page {page} of {total}"
                                        className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                                    />
                                </div>

                                {/* Font Size */}
                                <div>
                                    <label className="font-semibold text-surface-900 dark:text-white mb-2 block">
                                        Font Size: {fontSize}pt
                                    </label>
                                    <input
                                        type="range"
                                        min={6}
                                        max={24}
                                        value={fontSize}
                                        onChange={(e) => setFontSize(Number(e.target.value))}
                                        className="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                                    />
                                </div>

                                {/* Alignment */}
                                <div>
                                    <label className="font-semibold text-surface-900 dark:text-white mb-3 block">Alignment</label>
                                    <div className="flex gap-2">
                                        {([
                                            { value: "left" as const, icon: AlignLeft, label: "Left" },
                                            { value: "center" as const, icon: AlignCenter, label: "Center" },
                                            { value: "right" as const, icon: AlignRight, label: "Right" },
                                        ]).map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setAlignment(opt.value)}
                                                className={`flex-1 p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-[border-color,background-color] ${
                                                    alignment === opt.value
                                                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                                        : "border-surface-200 dark:border-surface-700 hover:border-surface-300"
                                                }`}
                                            >
                                                <opt.icon className="w-4 h-4 text-surface-700 dark:text-surface-300" />
                                                <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                                                    {opt.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <p className="text-xs text-surface-400">
                                    Use {"{page}"} for current page number and {"{total}"} for total pages.
                                </p>
                            </div>

                            <div className="flex items-center justify-between">
                                <p className="text-sm text-surface-500">Ready to apply</p>
                                <PrimaryAction
                                    onClick={handleApply}
                                    loading={isProcessing}
                                    icon={<PanelTop className="w-4 h-4" />}
                                >
                                    Apply Headers & Footers
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
                            className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        >
                            <PanelTop className="w-10 h-10 text-indigo-500" />
                        </motion.div>
                        <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">Done</h2>
                        <p className="text-surface-500 dark:text-surface-400">
                            Headers and footers applied to all pages.
                        </p>
                    </div>

                    <div className="flex items-center justify-between">
                        <DownloadButton
                            onClick={handleDownload}
                            filename={file.name.replace(/\.pdf$/i, "_headers.pdf")}
                            fileSize={result.size}
                            isReady={true}
                        />
                        <button onClick={handleReset} className="text-sm text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 transition-colors">
                            Edit Another
                        </button>
                    </div>
                </motion.div>
            )}
        </ToolLayout>
    );
}
