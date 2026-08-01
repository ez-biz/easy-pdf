"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileCode, FileText } from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "@cantoo/pdf-lib";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { PrimaryAction } from "@/components/tools/PrimaryAction";
import { Button } from "@/components/ui/Button";
import { downloadBlob, createPdfBlob } from "@/lib/utils";

const DEFAULT_MARKDOWN = `# Welcome to Markdown to PDF

This is a **sample** document to get you started.

## Features

- Convert Markdown to PDF
- **Bold** and *italic* text support
- Headings (H1, H2, H3)
- Bullet lists

## How to use

1. Write or paste your Markdown
2. Click **Convert to PDF**
3. Download your PDF

---

> This is a blockquote example.

\`\`\`
// Code block example
console.log("Hello, PDF!");
\`\`\`

Happy converting! 🎉`;

// Simple markdown to structured content parser
interface TextSegment {
    text: string;
    bold?: boolean;
    italic?: boolean;
    code?: boolean;
}

interface ContentBlock {
    type: "h1" | "h2" | "h3" | "paragraph" | "bullet" | "blockquote" | "code" | "hr";
    segments?: TextSegment[];
    text?: string;
}

function parseInlineFormatting(text: string): TextSegment[] {
    const segments: TextSegment[] = [];
    let remaining = text;
    let currentPlain = "";

    const flushPlain = () => {
        if (currentPlain) {
            segments.push({ text: currentPlain });
            currentPlain = "";
        }
    };

    while (remaining.length > 0) {
        const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
        const italicMatch = remaining.match(/^\*(.+?)\*(?!\*)/);
        const codeMatch = remaining.match(/^`(.+?)`/);

        if (boldMatch) {
            flushPlain();
            segments.push({ text: boldMatch[1], bold: true });
            remaining = remaining.slice(boldMatch[0].length);
        } else if (italicMatch) {
            flushPlain();
            segments.push({ text: italicMatch[1], italic: true });
            remaining = remaining.slice(italicMatch[0].length);
        } else if (codeMatch) {
            flushPlain();
            segments.push({ text: codeMatch[1], code: true });
            remaining = remaining.slice(codeMatch[0].length);
        } else {
            currentPlain += remaining[0];
            remaining = remaining.slice(1);
        }
    }

    flushPlain();
    return segments;
}

function parseMarkdown(md: string): ContentBlock[] {
    const lines = md.split("\n");
    const blocks: ContentBlock[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Headings
        const h1 = line.match(/^# (.+)/);
        const h2 = line.match(/^## (.+)/);
        const h3 = line.match(/^### (.+)/);

        if (h1) {
            blocks.push({ type: "h1", segments: parseInlineFormatting(h1[1]) });
            continue;
        }
        if (h2) {
            blocks.push({ type: "h2", segments: parseInlineFormatting(h2[1]) });
            continue;
        }
        if (h3) {
            blocks.push({ type: "h3", segments: parseInlineFormatting(h3[1]) });
            continue;
        }

        // Horizontal rule
        if (/^[-*_]{3,}\s*$/.test(line)) {
            blocks.push({ type: "hr" });
            continue;
        }

        // Blockquote
        if (line.startsWith("> ")) {
            blocks.push({ type: "blockquote", segments: parseInlineFormatting(line.slice(2)) });
            continue;
        }

        // Code block
        if (line.startsWith("```")) {
            const codeLines: string[] = [];
            i++;
            while (i < lines.length && !lines[i].startsWith("```")) {
                codeLines.push(lines[i]);
                i++;
            }
            blocks.push({ type: "code", text: codeLines.join("\n") });
            continue;
        }

        // Bullet list
        const bullet = line.match(/^[-*+]\s+(.+)/);
        if (bullet) {
            blocks.push({ type: "bullet", segments: parseInlineFormatting(bullet[1]) });
            continue;
        }

        // Numbered list (treat as bullet for simplicity)
        const numbered = line.match(/^\d+\.\s+(.+)/);
        if (numbered) {
            blocks.push({ type: "bullet", segments: parseInlineFormatting(numbered[1]) });
            continue;
        }

        // Empty line
        if (line.trim() === "") {
            continue;
        }

        // Regular paragraph
        blocks.push({ type: "paragraph", segments: parseInlineFormatting(line) });
    }

    return blocks;
}

function renderSegmentsToString(segments?: TextSegment[]): string {
    if (!segments) return "";
    return segments.map((s) => s.text).join("");
}

export default function MarkdownToPdfClient() {
    const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
    const [result, setResult] = useState<{ blob: Blob; size: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [preview, setPreview] = useState(false);

    const handleConvert = async () => {
        if (!markdown.trim()) {
            setError("Please enter some Markdown text");
            return;
        }

        setError(null);
        setIsProcessing(true);

        try {
            const blocks = parseMarkdown(markdown);
            const pdfDoc = await PDFDocument.create();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const italicFont = await pdfDoc.embedFont(StandardFonts.Helvetica); // No italic in standard fonts, fallback

            const pageWidth = 595.28; // A4 width
            const pageHeight = 841.89;
            const marginLeft = 60;
            const marginRight = 60;
            const marginTop = 60;
            const marginBottom = 60;
            const contentWidth = pageWidth - marginLeft - marginRight;
            const lineHeight = 16;
            const paragraphSpacing = 10;

            let currentY = pageHeight - marginTop;
            let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);

            const ensureSpace = (needed: number) => {
                if (currentY - needed < marginBottom) {
                    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
                    currentY = pageHeight - marginTop;
                }
            };

            const drawTextSegments = (segments: TextSegment[], x: number, y: number, size: number, baseFont: typeof font) => {
                let cursorX = x;
                for (const seg of segments) {
                    const segFont = seg.bold ? boldFont : seg.italic ? italicFont : baseFont;
                    const segColor = seg.code ? rgb(0.8, 0.2, 0.2) : rgb(0.1, 0.1, 0.1);
                    const width = segFont.widthOfTextAtSize(seg.text, size);
                    currentPage.drawText(seg.text, {
                        x: cursorX,
                        y,
                        size,
                        font: segFont,
                        color: segColor,
                    });
                    cursorX += width;
                }
            };

            const wrapText = (segments: TextSegment[], size: number, font: typeof boldFont): string[] => {
                const fullText = renderSegmentsToString(segments);
                const words = fullText.split(" ");
                const lines: string[] = [];
                let currentLine = "";

                for (const word of words) {
                    const testLine = currentLine ? currentLine + " " + word : word;
                    if (font.widthOfTextAtSize(testLine, size) <= contentWidth) {
                        currentLine = testLine;
                    } else {
                        if (currentLine) lines.push(currentLine);
                        currentLine = word;
                    }
                }
                if (currentLine) lines.push(currentLine);
                return lines;
            };

            for (const block of blocks) {
                switch (block.type) {
                    case "h1": {
                        ensureSpace(40);
                        const size = 24;
                        currentY -= size + 8;
                        drawTextSegments(block.segments!, marginLeft, currentY, size, boldFont);
                        currentY -= paragraphSpacing;
                        break;
                    }
                    case "h2": {
                        ensureSpace(34);
                        const size = 18;
                        currentY -= size + 6;
                        drawTextSegments(block.segments!, marginLeft, currentY, size, boldFont);
                        currentY -= paragraphSpacing;
                        break;
                    }
                    case "h3": {
                        ensureSpace(28);
                        const size = 14;
                        currentY -= size + 4;
                        drawTextSegments(block.segments!, marginLeft, currentY, size, boldFont);
                        currentY -= paragraphSpacing;
                        break;
                    }
                    case "paragraph": {
                        const size = 11;
                        const lines = wrapText(block.segments!, size, font);
                        for (const line of lines) {
                            ensureSpace(lineHeight);
                            currentY -= lineHeight;
                            const segs = parseInlineFormatting(line);
                            drawTextSegments(segs.length > 0 ? segs : [{ text: line }], marginLeft, currentY, size, font);
                        }
                        currentY -= paragraphSpacing;
                        break;
                    }
                    case "bullet": {
                        ensureSpace(lineHeight);
                        currentY -= lineHeight;
                        currentPage.drawText("•", { x: marginLeft, y: currentY, size: 11, font, color: rgb(0.1, 0.1, 0.1) });
                        const lines = wrapText(block.segments!, 11, font);
                        for (const line of lines) {
                            ensureSpace(lineHeight);
                            const segs = parseInlineFormatting(line);
                            drawTextSegments(segs.length > 0 ? segs : [{ text: line }], marginLeft + 15, currentY, 11, font);
                            if (lines.indexOf(line) < lines.length - 1) {
                                currentY -= lineHeight;
                            }
                        }
                        currentY -= paragraphSpacing;
                        break;
                    }
                    case "blockquote": {
                        ensureSpace(20);
                        currentY -= 10;
                        currentPage.drawRectangle({
                            x: marginLeft,
                            y: currentY - 4,
                            width: 4,
                            height: lineHeight + 8,
                            color: rgb(0.6, 0.6, 0.6),
                        });
                        drawTextSegments(block.segments!, marginLeft + 12, currentY, 10, font);
                        currentY -= lineHeight + paragraphSpacing;
                        break;
                    }
                    case "code": {
                        const codeLines = (block.text || "").split("\n");
                        for (const codeLine of codeLines) {
                            ensureSpace(lineHeight);
                            currentY -= lineHeight;
                            const codeText = codeLine || " ";
                            currentPage.drawText(codeText, {
                                x: marginLeft + 8,
                                y: currentY,
                                size: 9,
                                font,
                                color: rgb(0.2, 0.2, 0.2),
                            });
                        }
                        currentY -= paragraphSpacing;
                        break;
                    }
                    case "hr": {
                        ensureSpace(20);
                        currentY -= 15;
                        currentPage.drawLine({
                            start: { x: marginLeft, y: currentY },
                            end: { x: pageWidth - marginRight, y: currentY },
                            thickness: 1,
                            color: rgb(0.8, 0.8, 0.8),
                        });
                        currentY -= paragraphSpacing;
                        break;
                    }
                }
            }

            const pdfBytes = await pdfDoc.save();
            const blob = createPdfBlob(pdfBytes);
            setResult({ blob, size: blob.size });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to convert Markdown to PDF");
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
            title="Markdown to PDF"
            description="Convert Markdown text to a formatted PDF document"
            icon={FileCode}
            color="from-violet-500 to-purple-600"
        >
            {!result ? (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-surface-900 dark:text-white">Markdown Editor</h3>
                            <Button
                                onClick={() => setPreview(!preview)}
                                variant="outline"
                                size="sm"
                            >
                                {preview ? "Edit" : "Preview"}
                            </Button>
                        </div>

                        {preview ? (
                            <div className="bg-surface-50 dark:bg-surface-900 rounded-xl p-4 min-h-[300px] max-h-[500px] overflow-y-auto border border-surface-200 dark:border-surface-700">
                                <pre className="text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap font-sans">
                                    {markdown}
                                </pre>
                            </div>
                        ) : (
                            <textarea
                                value={markdown}
                                onChange={(e) => setMarkdown(e.target.value)}
                                placeholder="Type or paste your Markdown here..."
                                className="w-full min-h-[300px] max-h-[500px] p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-y transition"
                            />
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <p className="text-sm text-surface-500">
                            {markdown.split("\n").length} lines
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
                            className="w-20 h-20 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        >
                            <FileText className="w-10 h-10 text-violet-500" />
                        </motion.div>
                        <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">PDF Ready</h2>
                        <p className="text-surface-500 dark:text-surface-400">
                            Your Markdown has been converted to a formatted PDF.
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
