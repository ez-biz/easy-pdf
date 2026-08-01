"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Code, FileText } from "lucide-react";
import { PDFDocument, rgb } from "@cantoo/pdf-lib";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { PrimaryAction } from "@/components/tools/PrimaryAction";
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
            // Use browser print API to generate PDF from HTML
            const iframe = document.createElement("iframe");
            iframe.style.position = "fixed";
            iframe.style.top = "-10000px";
            iframe.style.left = "-10000px";
            iframe.style.width = "210mm";
            iframe.style.height = "297mm";
            document.body.appendChild(iframe);

            const doc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!doc) throw new Error("Could not create document");

            doc.open();
            doc.write(html);
            doc.close();

            // Wait for images and styles to load
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Use window.print approach via the iframe
            // For client-side, we use the print-to-PDF dialog
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();

            // Remove after print dialog
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);

            // Since browser print is dialog-based, also offer a simple text-based fallback
            // using pdf-lib to create a basic PDF with the HTML as plain text
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage([595.28, 841.89]);

            // Strip HTML tags for plain text fallback
            const textContent = html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
            const lines = textContent.match(/.{1,90}/g) || [textContent];

            // Draw text as fallback
            let y = 800;
            for (const line of lines.slice(0, 60)) {
                if (y < 40) break;
                page.drawText(line, { x: 50, y, size: 10, color: rgb(0.1, 0.1, 0.1) });
                y -= 14;
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

                    <div className="flex items-center justify-between">
                        <p className="text-sm text-surface-500">
                            {html.split("\n").length} lines
                        </p>
                        <PrimaryAction
                            onClick={handleConvert}
                            loading={isProcessing}
                            icon={<FileText className="w-4 h-4" />}
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
                        <p className="text-xs text-surface-400 mt-2">
                            Tip: For best results, use the browser&apos;s native Print → Save as PDF for complex HTML layouts.
                        </p>
                    </div>

                    <div className="flex items-center justify-between">
                        <DownloadButton
                            onClick={() => downloadBlob(result.blob, "document.pdf")}
                            filename="document.pdf"
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
