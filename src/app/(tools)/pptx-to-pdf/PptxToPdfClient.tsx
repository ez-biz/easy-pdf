"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Presentation, FileText } from "lucide-react";
import JSZip from "jszip";
import { PDFDocument, StandardFonts, rgb } from "@cantoo/pdf-lib";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { PrimaryAction } from "@/components/tools/PrimaryAction";
import { Button } from "@/components/ui/Button";
import { FileWithPreview } from "@/types/tools";
import { downloadBlob, formatFileSize, createPdfBlob, readFileAsArrayBuffer } from "@/lib/utils";

interface SlideInfo {
    num: number;
    title?: string;
    textContent: string[];
}

async function parsePptxSlides(arrayBuffer: ArrayBuffer): Promise<SlideInfo[]> {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const slides: SlideInfo[] = [];

    // Find slide files
    const slideFiles = Object.keys(zip.files)
        .filter((name) => name.match(/^ppt\/slides\/slide\d+\.xml$/i))
        .sort((a, b) => {
            const na = parseInt(a.match(/slide(\d+)/i)?.[1] || "0");
            const nb = parseInt(b.match(/slide(\d+)/i)?.[1] || "0");
            return na - nb;
        });

    for (const slidePath of slideFiles) {
        const slideNum = parseInt(slidePath.match(/slide(\d+)/i)?.[1] || "0");
        const xmlContent = await zip.files[slidePath].async("text");

        // Extract text from <a:t> elements (drawingML text)
        const textRegex = /<a:t[^>]*>([^<]*)<\/a:t>/g;
        const texts: string[] = [];
        let match;
        while ((match = textRegex.exec(xmlContent)) !== null) {
            const text = match[1].trim();
            if (text) texts.push(text);
        }

        slides.push({
            num: slideNum,
            title: texts[0] || undefined,
            textContent: texts,
        });
    }

    return slides;
}

export default function PptxToPdfClient() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [result, setResult] = useState<{ blob: Blob; size: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const file = files[0]?.file;

    const handleFilesChange = useCallback((newFiles: FileWithPreview[]) => {
        setFiles(newFiles.slice(0, 1));
        setResult(null);
        setError(null);
    }, []);

    const handleConvert = async () => {
        if (!file) {
            setError("Please upload a PPTX file");
            return;
        }

        setError(null);
        setIsProcessing(true);
        setProgress(0);

        try {
            const arrayBuffer = await readFileAsArrayBuffer(file);
            const slides = await parsePptxSlides(arrayBuffer);

            if (slides.length === 0) {
                throw new Error("No slides found in this PPTX file");
            }

            const pdfDoc = await PDFDocument.create();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            const pageWidth = 960; // 16:9-ish
            const pageHeight = 540;

            for (let i = 0; i < slides.length; i++) {
                const slide = slides[i];
                const page = pdfDoc.addPage([pageWidth, pageHeight]);

                // Slide background
                page.drawRectangle({
                    x: 0,
                    y: 0,
                    width: pageWidth,
                    height: pageHeight,
                    color: rgb(0.98, 0.98, 0.98),
                });

                // Slide number badge
                page.drawRectangle({
                    x: pageWidth - 70,
                    y: pageHeight - 35,
                    width: 50,
                    height: 22,
                    color: rgb(0.4, 0.4, 0.9),
                });
                page.drawText(`${slide.num}`, {
                    x: pageWidth - 58,
                    y: pageHeight - 31,
                    size: 14,
                    font: boldFont,
                    color: rgb(1, 1, 1),
                });

                // Title
                if (slide.title) {
                    const title = slide.title.substring(0, 80);
                    page.drawText(title, {
                        x: 60,
                        y: pageHeight - 60,
                        size: 24,
                        font: boldFont,
                        color: rgb(0.1, 0.1, 0.2),
                    });
                }

                // Content text
                let y = pageHeight - 110;
                const contentLines = slide.textContent.slice(1, 20);
                for (const text of contentLines) {
                    if (y < 50) break;
                    const truncated = text.substring(0, 100);
                    page.drawText(`• ${truncated}`, {
                        x: 80,
                        y,
                        size: 14,
                        font,
                        color: rgb(0.2, 0.2, 0.3),
                    });
                    y -= 24;
                }

                setProgress(Math.round(((i + 1) / slides.length) * 100));
            }

            const pdfBytes = await pdfDoc.save();
            const blob = createPdfBlob(pdfBytes);
            setResult({ blob, size: blob.size });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to convert PPTX to PDF");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (result && file) {
            const baseName = file.name.replace(/\.pptx?$/i, "");
            downloadBlob(result.blob, `${baseName}.pdf`);
        }
    };

    const handleReset = () => {
        setFiles([]);
        setResult(null);
        setError(null);
        setProgress(0);
    };

    return (
        <ToolLayout
            title="PowerPoint to PDF"
            description="Convert PowerPoint presentations to PDF format"
            icon={Presentation}
            color="from-red-500 to-orange-600"
        >
            {!result ? (
                <div className="space-y-6">
                    <FileUploader
                        accept={{
                            "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
                            "application/vnd.ms-powerpoint": [".ppt"],
                        }}
                        multiple={false}
                        maxFiles={1}
                        files={files}
                        onFilesChange={handleFilesChange}
                        label="Drop your PowerPoint file here"
                    />

                    {file && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-3 p-4 bg-surface-50 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
                                <div className="w-12 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                                    <Presentation className="w-6 h-6 text-orange-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-surface-900 dark:text-white truncate">{file.name}</p>
                                    <p className="text-sm text-surface-500">Current size: {formatFileSize(file.size)}</p>
                                </div>
                            </div>

                            {isProcessing && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-surface-500">
                                        <span>Converting slides...</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2">
                                        <div className="bg-primary-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                                    </div>
                                </div>
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

                            <div className="flex justify-center gap-4">
                                <PrimaryAction
                                    onClick={handleConvert}
                                    loading={isProcessing}
                                    icon={<FileText className="w-4 h-4" />}
                                    context="Ready to convert"
                                >
                                    Convert to PDF
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
                            className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        >
                            <FileText className="w-10 h-10 text-red-500" />
                        </motion.div>
                        <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">Conversion Complete</h2>
                        <p className="text-surface-500 dark:text-surface-400">
                            PowerPoint converted to PDF — {formatFileSize(file.size)} → {formatFileSize(result.size)}
                        </p>
                    </div>

                    <DownloadButton
                        onClick={handleDownload}
                        filename={file.name.replace(/\.pptx?$/i, ".pdf")}
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
