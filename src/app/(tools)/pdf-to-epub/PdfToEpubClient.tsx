"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { BookOpen, FileText } from "lucide-react";
import JSZip from "jszip";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { PrimaryAction } from "@/components/tools/PrimaryAction";
import { FileWithPreview } from "@/types/tools";
import { downloadBlob, formatFileSize, readFileAsArrayBuffer } from "@/lib/utils";

async function createEpubFromPdf(pdfBuffer: ArrayBuffer, title: string): Promise<Blob> {
    const zip = new JSZip();

    // mimetype (must be first, uncompressed)
    zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

    // META-INF/container.xml
    zip.folder("META-INF")?.file("container.xml", `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

    const oebps = zip.folder("OEBPS");

    // Embed the PDF as a page
    oebps?.file("content.pdf", pdfBuffer);

    // content.opf
    oebps?.file("content.opf", `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="book-id" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${title}</dc:title>
    <dc:creator>EasyPDF</dc:creator>
    <dc:language>en</dc:language>
    <dc:date>${new Date().toISOString().split("T")[0]}</dc:date>
    <meta property="dcterms:modified">${new Date().toISOString()}</meta>
  </metadata>
  <manifest>
    <item id="content" href="content.pdf" media-type="application/pdf"/>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
  </manifest>
  <spine>
    <itemref idref="content" linear="yes"/>
  </spine>
</package>`);

    // Navigation
    oebps?.file("nav.xhtml", `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>${title}</title></head>
<body>
  <nav epub:type="toc">
    <h1>Contents</h1>
    <ol>
      <li><a href="content.pdf">${title}</a></li>
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
                                    The EPUB will contain the PDF embedded within it. Some e-readers may display it natively.
                                </p>
                            </div>

                            <div className="flex items-center justify-between">
                                <p className="text-sm text-surface-500">Ready to convert</p>
                                <PrimaryAction
                                    onClick={handleConvert}
                                    loading={isProcessing}
                                    icon={<BookOpen className="w-4 h-4" />}
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

                    <div className="flex items-center justify-between">
                        <DownloadButton
                            onClick={handleDownload}
                            filename={file.name.replace(/\.pdf$/i, ".epub")}
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
