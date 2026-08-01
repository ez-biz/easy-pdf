"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Code, FileText } from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "@cantoo/pdf-lib";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { PrimaryAction } from "@/components/tools/PrimaryAction";
import { Button } from "@/components/ui/Button";
import { downloadBlob, createPdfBlob } from "@/lib/utils";

const SAMPLE_HTML = `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
  h1 { color: #6366f1; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
  p { line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
  th { background: #f3f4f6; }
  .highlight { background: #fef3c7; padding: 16px; border-left: 4px solid #f59e0b; }
</style>
</head>
<body>
<h1>Sample Document</h1>
<p>This HTML will be converted to a PDF. You can include <strong>bold text</strong>, <em>italics</em>, tables, and more.</p>

<div class="highlight">
  <strong>Tip:</strong> Use inline styles for best results when converting to PDF.
</div>

<h2>Table Example</h2>
<table>
  <tr><th>Item</th><th>Qty</th><th>Price</th></tr>
  <tr><td>Widget A</td><td>5</td><td>$10.00</td></tr>
  <tr><td>Widget B</td><td>3</td><td>$15.50</td></tr>
  <tr><td>Widget C</td><td>2</td><td>$22.75</td></tr>
</table>

<p>Edit this HTML or paste your own to convert!</p>
</body>
</html>`;

export default function HtmlToPdfClient() {
    const [html, setHtml] = useState(SAMPLE_HTML);
    const [result, setResult] = useState<{ blob: Blob; size: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleConvert = async () => {
        if (!html.trim()) {
            setError("Please enter HTML content");
            return;
        }

        setError(null);
        setIsProcessing(true);

        try {
            // Strip HTML tags for plain text
            const strippedHtml = html
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
                .replace(/<br\s*\/?>/gi, "\n")
                .replace(/<\/p>/gi, "\n\n")
                .replace(/<\/h[1-6]>/gi, "\n\n")
                .replace(/<\/li>/gi, "\n")
                .replace(/<\/div>/gi, "\n")
                .replace(/<[^>]+>/g, "")
                .replace(/&nbsp;/g, " ")
                .replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/\n{3,}/g, "\n\n")
                .trim();

            if (!strippedHtml) {
                throw new Error("No text content found in HTML");
            }

            const pdfDoc = await PDFDocument.create();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            const pageWidth = 595.28;
            const pageHeight = 841.89;
            const marginX = 50;
            const marginTop = 50;
            const marginBottom = 50;
            const contentWidth = pageWidth - marginX * 2;
            const lineHeight = 14;
            const fontSize = 11;

            let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            let y = pageHeight - marginTop;

            const addNewPage = () => {
                currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
                y = pageHeight - marginTop;
            };

            const drawLine = (text: string, isBold = false, size = fontSize) => {
                if (y < marginBottom) addNewPage();
                currentPage.drawText(text, {
                    x: marginX,
                    y,
                    size,
                    font: isBold ? boldFont : font,
                    color: rgb(0.1, 0.1, 0.1),
                });
                y -= size + 4;
            };

            const paragraphs = strippedHtml.split(/\n\n+/);

            for (const para of paragraphs) {
                const trimmed = para.trim();
                if (!trimmed) continue;

                if (y < marginBottom + lineHeight * 3) addNewPage();

                // Wrap text to fit page width
                const words = trimmed.split(/\s+/);
                let currentLine = "";
                for (const word of words) {
                    const testLine = currentLine ? currentLine + " " + word : word;
                    if (font.widthOfTextAtSize(testLine, fontSize) > contentWidth) {
                        drawLine(currentLine);
                        currentLine = word;
                    } else {
                        currentLine = testLine;
                    }
                }
                if (currentLine) {
                    drawLine(currentLine);
                }
                y -= 6; // paragraph spacing
            }

            const pdfBytes = await pdfDoc.save();
            const blob = createPdfBlob(pdfBytes);
            setResult({ blob, size: blob.size });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to convert HTML to PDF");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setResult(null);
        setError(null);
    };

    return (
        <ToolLayout
            title="HTML to PDF"
            description="Convert HTML code to a PDF document"
            icon={Code}
            color="from-orange-500 to-red-600"
        >
            {!result ? (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                        <h3 className="font-semibold text-surface-900 dark:text-white mb-4">HTML Editor</h3>
                        <textarea
                            value={html}
                            onChange={(e) => setHtml(e.target.value)}
                            placeholder="Paste your HTML here..."
                            className="w-full min-h-[400px] p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-y transition"
                        />
                    </div>

                    <div className="flex justify-center gap-4">
                        <PrimaryAction
                            onClick={handleConvert}
                            loading={isProcessing}
                            icon={<FileText className="w-4 h-4" />}
                            context={`${html.split("\n").length} lines`}
                        >
                            Convert to PDF
                        </PrimaryAction>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
                            {error}
                        </div>
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
                            className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        >
                            <FileText className="w-10 h-10 text-orange-500" />
                        </motion.div>
                        <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">PDF Ready</h2>
                        <p className="text-surface-500 dark:text-surface-400">
                            HTML has been converted to a PDF document.
                        </p>
                    </div>

                    <DownloadButton
                        onClick={() => downloadBlob(result.blob, "document.pdf")}
                        filename="document.pdf"
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
