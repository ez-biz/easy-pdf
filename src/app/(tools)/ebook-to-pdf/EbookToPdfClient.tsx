"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { BookOpen, FileText } from "lucide-react";
import JSZip from "jszip";
import { PDFDocument, StandardFonts, rgb } from "@cantoo/pdf-lib";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { PrimaryAction } from "@/components/tools/PrimaryAction";
import { FileWithPreview } from "@/types/tools";
import { downloadBlob, formatFileSize, createPdfBlob, readFileAsArrayBuffer } from "@/lib/utils";

async function parseEpubContent(arrayBuffer: ArrayBuffer): Promise<{ title: string; chapters: { title: string; text: string }[] }> {
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Find content.opf for metadata and spine
    const containerXml = await zip.files["META-INF/container.xml"]?.async("text");
    const opfMatch = containerXml?.match(/full-path="([^"]+)"/);
    const opfPath = opfMatch?.[1] || "OEBPS/content.opf";

    const opfXml = await zip.files[opfPath]?.async("text") || "";
    const titleMatch = opfXml.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/);
    const title = titleMatch?.[1] || "Untitled";

    // Get spine items
    const spineMatch = opfXml.match(/<spine[^>]*>([\s\S]*?)<\/spine>/);
    const idrefs = spineMatch?.[1]?.match(/idref="([^"]+)"/g)?.map((m) => m.replace(/idref="([^"]+)"/, "$1")) || [];

    // Get manifest items
    const manifestMatch = opfXml.match(/<manifest[^>]*>([\s\S]*?)<\/manifest>/);
    const items = manifestMatch?.[1]?.match(/<item[^>]*\/>/g) || [];

    const chapters: { title: string; text: string }[] = [];
    const opfDir = opfPath.split("/").slice(0, -1).join("/");

    for (const idref of idrefs) {
        const itemMatch = items.find((item) => item.includes(`id="${idref}"`));
        const hrefMatch = itemMatch?.match(/href="([^"]+)"/);
        const href = hrefMatch?.[1];
        if (!href) continue;

        const fullPath = opfDir ? `${opfDir}/${href}` : href;
        const htmlContent = await zip.files[fullPath]?.async("text");
        if (!htmlContent) continue;

        // Extract title
        const chapterTitleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/);
        const chapterTitle = chapterTitleMatch?.[1] || `Chapter ${chapters.length + 1}`;

        // Strip HTML tags for text
        const text = htmlContent
            .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/\s+/g, " ")
            .trim();

        if (text.length > 50) {
            chapters.push({ title: chapterTitle, text });
        }
    }

    return { title, chapters };
}

export default function EbookToPdfClient() {
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
            setError("Please upload an EPUB file");
            return;
        }

        setError(null);
        setIsProcessing(true);
        setProgress(0);

        try {
            const arrayBuffer = await readFileAsArrayBuffer(file);
            const { title, chapters } = await parseEpubContent(arrayBuffer);

            if (chapters.length === 0) {
                throw new Error("No readable content found in this EPUB");
            }

            const pdfDoc = await PDFDocument.create();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            const pageWidth = 426; // A5-ish (good for e-books)
            const pageHeight = 600;
            const marginX = 40;
            const marginTop = 50;
            const marginBottom = 50;
            const contentWidth = pageWidth - marginX * 2;
            const lineHeight = 15;
            const fontSize = 11;

            for (let i = 0; i < chapters.length; i++) {
                const chapter = chapters[i];
                const page = pdfDoc.addPage([pageWidth, pageHeight]);

                // Chapter title
                const titleText = chapter.title.substring(0, 50);
                page.drawText(titleText, {
                    x: marginX,
                    y: pageHeight - marginTop,
                    size: 16,
                    font: boldFont,
                    color: rgb(0.1, 0.1, 0.1),
                });

                // Divider
                page.drawLine({
                    start: { x: marginX, y: pageHeight - marginTop - 10 },
                    end: { x: pageWidth - marginX, y: pageHeight - marginTop - 10 },
                    thickness: 1,
                    color: rgb(0.85, 0.85, 0.85),
                });

                // Wrap text
                const words = chapter.text.split(" ");
                let y = pageHeight - marginTop - 28;
                let currentLine = "";
                let currentPage = page;

                for (const word of words) {
                    const testLine = currentLine ? currentLine + " " + word : word;
                    const lineWidth = font.widthOfTextAtSize(testLine, fontSize);

                    if (lineWidth > contentWidth) {
                        currentPage.drawText(currentLine, {
                            x: marginX,
                            y,
                            size: fontSize,
                            font,
                            color: rgb(0.15, 0.15, 0.15),
                        });
                        y -= lineHeight;
                        currentLine = word;

                        if (y < marginBottom) {
                            currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
                            y = pageHeight - marginTop;
                        }
                    } else {
                        currentLine = testLine;
                    }
                }

                // Last line
                if (currentLine) {
                    currentPage.drawText(currentLine, {
                        x: marginX,
                        y,
                        size: fontSize,
                        font,
                        color: rgb(0.15, 0.15, 0.15),
                    });
                }

                setProgress(Math.round(((i + 1) / chapters.length) * 100));
            }

            const pdfBytes = await pdfDoc.save();
            const blob = createPdfBlob(pdfBytes);
            setResult({ blob, size: blob.size });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to convert EPUB to PDF");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (result && file) {
            const baseName = file.name.replace(/\.epub$/i, "");
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
            title="eBook to PDF"
            description="Convert EPUB eBooks to PDF format"
            icon={BookOpen}
            color="from-indigo-500 to-purple-600"
        >
            {!result ? (
                <div className="space-y-6">
                    <FileUploader
                        accept={{ "application/epub+zip": [".epub"] }}
                        multiple={false}
                        maxFiles={1}
                        files={files}
                        onFilesChange={handleFilesChange}
                        label="Drop your EPUB file here"
                    />

                    {file && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-3 p-4 bg-surface-50 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
                                <div className="w-12 h-14 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                                    <BookOpen className="w-6 h-6 text-indigo-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-surface-900 dark:text-white truncate">{file.name}</p>
                                    <p className="text-sm text-surface-500">Current size: {formatFileSize(file.size)}</p>
                                </div>
                            </div>

                            {isProcessing && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-surface-500">
                                        <span>Converting chapters...</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2">
                                        <div className="bg-primary-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <p className="text-sm text-surface-500">Ready to convert</p>
                                <PrimaryAction
                                    onClick={handleConvert}
                                    loading={isProcessing}
                                    icon={<FileText className="w-4 h-4" />}
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
                            className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        >
                            <FileText className="w-10 h-10 text-indigo-500" />
                        </motion.div>
                        <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">Conversion Complete</h2>
                        <p className="text-surface-500 dark:text-surface-400">
                            EPUB converted to PDF — {formatFileSize(file.size)} → {formatFileSize(result.size)}
                        </p>
                    </div>

                    <div className="flex items-center justify-between">
                        <DownloadButton
                            onClick={handleDownload}
                            filename={file.name.replace(/\.epub$/i, ".pdf")}
                            fileSize={result.size}
                            isReady={true}
                        />
                        <button onClick={handleReset} className="text-sm text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 transition-colors">
                            Start Over
                        </button>
                    </div>
                </motion.div>
            )}
        </ToolLayout>
    );
}
