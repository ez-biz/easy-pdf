"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import * as pdfjs from "pdfjs-dist";
import { BookOpen, FileText } from "lucide-react";
import JSZip from "jszip";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { PrimaryAction } from "@/components/tools/PrimaryAction";
import { Button } from "@/components/ui/Button";
import { FileWithPreview } from "@/types/tools";
import { downloadBlob, formatFileSize, readFileAsArrayBuffer } from "@/lib/utils";

if (typeof window !== "undefined") {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

function escapeXml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

/** Turn one PDF page's text items into paragraphs, using pdf.js end-of-line hints. */
function itemsToParagraphs(items: { str: string; hasEOL?: boolean }[]): string[] {
    const lines: string[] = [];
    let line = "";

    for (const item of items) {
        line += item.str;
        if (item.hasEOL) {
            lines.push(line.trim());
            line = "";
        }
    }
    if (line.trim()) lines.push(line.trim());

    // Blank lines separate paragraphs; consecutive lines are joined.
    const paragraphs: string[] = [];
    let current: string[] = [];
    for (const l of lines) {
        if (l === "") {
            if (current.length) paragraphs.push(current.join(" "));
            current = [];
        } else {
            current.push(l);
        }
    }
    if (current.length) paragraphs.push(current.join(" "));

    return paragraphs.filter((p) => p.trim() !== "");
}

/**
 * Convert a PDF into a spec-valid EPUB 3: the text of each PDF page becomes an
 * XHTML Content Document in the spine (a PDF cannot be a spine item itself).
 */
async function createEpubFromPdf(pdfBuffer: ArrayBuffer, title: string): Promise<Blob> {
    const pdf = await pdfjs.getDocument({ data: pdfBuffer }).promise;

    const chapters: { id: string; href: string; title: string; body: string }[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const items = content.items
            .filter((it) => "str" in it)
            .map((it) => {
                const t = it as { str: string; hasEOL?: boolean };
                return { str: t.str, hasEOL: t.hasEOL };
            });
        const paragraphs = itemsToParagraphs(items);
        const chapterTitle = `Page ${i}`;
        const body = paragraphs.length
            ? paragraphs.map((p) => `    <p>${escapeXml(p)}</p>`).join("\n")
            : `    <p/>`;

        chapters.push({
            id: `page${i}`,
            href: `page${i}.xhtml`,
            title: chapterTitle,
            body,
        });
    }

    const zip = new JSZip();

    // mimetype (must be first, uncompressed)
    zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

    zip.folder("META-INF")?.file("container.xml", `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

    const oebps = zip.folder("OEBPS");

    for (const ch of chapters) {
        oebps?.file(ch.href, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${escapeXml(ch.title)}</title>
  <meta charset="utf-8"/>
</head>
<body>
  <section epub:type="chapter" xmlns:epub="http://www.idpf.org/2007/ops">
${ch.body}
  </section>
</body>
</html>`);
    }

    const manifestItems = chapters
        .map((ch) => `    <item id="${ch.id}" href="${ch.href}" media-type="application/xhtml+xml"/>`)
        .join("\n");
    const spineItems = chapters
        .map((ch) => `    <itemref idref="${ch.id}" linear="yes"/>`)
        .join("\n");

    oebps?.file("content.opf", `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="book-id" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:creator>EasyPDF</dc:creator>
    <dc:language>en</dc:language>
    <dc:identifier id="book-id">urn:uuid:${crypto.randomUUID()}</dc:identifier>
    <dc:date>${new Date().toISOString().split("T")[0]}</dc:date>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d{3}Z$/, "Z")}</meta>
  </metadata>
  <manifest>
${manifestItems}
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
  </manifest>
  <spine>
${spineItems}
  </spine>
</package>`);

    const navItems = chapters
        .map((ch) => `      <li><a href="${ch.href}">${escapeXml(ch.title)}</a></li>`)
        .join("\n");

    oebps?.file("nav.xhtml", `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>${escapeXml(title)}</title><meta charset="utf-8"/></head>
<body>
  <nav epub:type="toc">
    <h1>Contents</h1>
    <ol>
${navItems}
    </ol>
  </nav>
</body>
</html>`);

    return await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}

export default function PdfToEpubClient() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [result, setResult] = useState<{ blob: Blob; size: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const file = files[0]?.file;

    const handleFilesChange = useCallback((newFiles: FileWithPreview[]) => {
        setFiles(newFiles.slice(0, 1));
        setResult(null);
        setError(null);
    }, []);

    const handleConvert = async () => {
        if (!file) {
            setError("Please upload a PDF file");
            return;
        }

        setError(null);
        setIsProcessing(true);

        try {
            const arrayBuffer = await readFileAsArrayBuffer(file);
            const title = file.name.replace(/\.pdf$/i, "");
            const epubBlob = await createEpubFromPdf(arrayBuffer, title);
            setResult({ blob: epubBlob, size: epubBlob.size });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to convert PDF to EPUB");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (result && file) {
            const baseName = file.name.replace(/\.pdf$/i, "");
            downloadBlob(result.blob, `${baseName}.epub`);
        }
    };

    const handleReset = () => {
        setFiles([]);
        setResult(null);
        setError(null);
    };

    return (
        <ToolLayout
            title="PDF to EPUB"
            description="Convert PDF documents to EPUB format for e-readers"
            icon={BookOpen}
            color="from-cyan-500 to-blue-600"
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
                                <div className="flex-1">
                                    <p className="font-medium text-surface-900 dark:text-white truncate">{file.name}</p>
                                    <p className="text-sm text-surface-500">Current size: {formatFileSize(file.size)}</p>
                                </div>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                    Text from each PDF page becomes a chapter in the EPUB. Images and layout are not carried over.
                                </p>
                            </div>

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
                                    icon={<BookOpen className="w-4 h-4" />}
                                    context="Ready to convert"
                                >
                                    Convert to EPUB
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
                            className="w-20 h-20 bg-cyan-100 dark:bg-cyan-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        >
                            <BookOpen className="w-10 h-10 text-cyan-500" />
                        </motion.div>
                        <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">EPUB Ready</h2>
                        <p className="text-surface-500 dark:text-surface-400">
                            PDF converted to EPUB — {formatFileSize(file.size)} → {formatFileSize(result.size)}
                        </p>
                    </div>

                    <DownloadButton
                        onClick={handleDownload}
                        filename={file.name.replace(/\.pdf$/i, ".epub")}
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
