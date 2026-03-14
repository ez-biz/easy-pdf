# PDF-Office Conversion & OCR Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add client-side PDF-to-Office (Word, Excel, PowerPoint) conversion, Office-to-PDF conversion, and OCR capabilities to EasyPDF.

**Architecture:** Each conversion runs entirely in the browser. PDF-to-Office tools use `pdfjs-dist` to extract text/render pages, then JS libraries (`docx`, `xlsx`, `pptxgenjs`) to build output files. Office-to-PDF tools parse Office formats and render to PDF via `jspdf`. OCR uses `tesseract.js` WASM. A separate `conversion.worker.ts` handles these operations to keep the main thread free, following the same pattern as the existing `pdf.worker.ts` + `usePDFWorker` hook.

**Tech Stack:** Next.js 15, React 19, TypeScript, pdfjs-dist, docx, xlsx (SheetJS), pptxgenjs, mammoth, tesseract.js, jspdf

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install npm packages**

Run:
```bash
npm install docx mammoth pptxgenjs xlsx tesseract.js
```

**Step 2: Verify install**

Run: `npm run build`
Expected: Build passes (no type errors from new packages)

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add docx, mammoth, pptxgenjs, xlsx, tesseract.js dependencies"
```

---

## Task 2: Create Conversion Worker

**Files:**
- Create: `src/lib/pdf/conversion.worker.ts`
- Modify: `src/hooks/usePDFWorker.ts` (add support for alternate worker path)

This worker handles all conversion operations separately from the PDF manipulation worker. This keeps bundle sizes separate -- the PDF worker doesn't need to load `docx`, `mammoth`, etc.

**Step 1: Create `src/hooks/useConversionWorker.ts`**

This is a copy of `usePDFWorker` but points to the conversion worker:

```typescript
import { useState, useCallback, useRef, useEffect } from "react";

export type ConversionOperation =
    | "pdf-to-word"
    | "pdf-to-excel"
    | "pdf-to-pptx"
    | "word-to-pdf"
    | "excel-to-pdf"
    | "pptx-to-pdf"
    | "ocr";

export interface ConversionWorkerRequest {
    id: string;
    operation: ConversionOperation;
    buffers: ArrayBuffer[];
    options?: Record<string, unknown>;
    fileNames?: string[];
}

export interface ConversionWorkerProgressMessage {
    id: string;
    type: "progress";
    progress: number;
    stage?: string;
}

export interface ConversionWorkerResultMessage {
    id: string;
    type: "result";
    data: Uint8Array | ArrayBuffer;
    details?: Record<string, unknown>;
}

export interface ConversionWorkerErrorMessage {
    id: string;
    type: "error";
    error: string;
}

export type ConversionWorkerResponse =
    | ConversionWorkerProgressMessage
    | ConversionWorkerResultMessage
    | ConversionWorkerErrorMessage;

interface ProcessOptions {
    operation: ConversionOperation;
    files: File[];
    options?: Record<string, unknown>;
}

interface WorkerResult {
    data: Uint8Array | ArrayBuffer;
    details?: Record<string, unknown>;
}

export function useConversionWorker() {
    const [progress, setProgress] = useState(0);
    const [stage, setStage] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);
    const workerRef = useRef<Worker | null>(null);
    const requestIdRef = useRef(0);

    useEffect(() => {
        return () => {
            workerRef.current?.terminate();
            workerRef.current = null;
        };
    }, []);

    const getWorker = useCallback(() => {
        if (!workerRef.current) {
            workerRef.current = new Worker(
                new URL("@/lib/pdf/conversion.worker.ts", import.meta.url),
                { type: "module" }
            );
        }
        return workerRef.current;
    }, []);

    const process = useCallback(
        async ({ operation, files, options }: ProcessOptions): Promise<WorkerResult> => {
            setIsProcessing(true);
            setProgress(0);
            setStage("Preparing...");

            const id = String(++requestIdRef.current);
            const buffers = await Promise.all(files.map((f) => f.arrayBuffer()));

            return new Promise<WorkerResult>((resolve, reject) => {
                const worker = getWorker();

                const handleMessage = (e: MessageEvent<ConversionWorkerResponse>) => {
                    const msg = e.data;
                    if (msg.id !== id) return;

                    switch (msg.type) {
                        case "progress":
                            setProgress(msg.progress);
                            if (msg.stage) setStage(msg.stage);
                            break;
                        case "result":
                            worker.removeEventListener("message", handleMessage);
                            worker.removeEventListener("error", handleError);
                            setIsProcessing(false);
                            setProgress(100);
                            setStage("Complete");
                            resolve({ data: msg.data, details: msg.details });
                            break;
                        case "error":
                            worker.removeEventListener("message", handleMessage);
                            worker.removeEventListener("error", handleError);
                            setIsProcessing(false);
                            setProgress(0);
                            setStage("");
                            reject(new Error(msg.error));
                            break;
                    }
                };

                const handleError = (e: ErrorEvent) => {
                    worker.removeEventListener("message", handleMessage);
                    worker.removeEventListener("error", handleError);
                    setIsProcessing(false);
                    setProgress(0);
                    setStage("");
                    reject(new Error(e.message || "Worker error"));
                };

                worker.addEventListener("message", handleMessage);
                worker.addEventListener("error", handleError);

                worker.postMessage({
                    id,
                    operation,
                    buffers,
                    options,
                    fileNames: files.map((f) => f.name),
                });
            });
        },
        [getWorker]
    );

    const resetProgress = useCallback(() => {
        setProgress(0);
        setStage("");
    }, []);

    return { process, progress, stage, isProcessing, resetProgress };
}
```

**Step 2: Create `src/lib/pdf/conversion.worker.ts` skeleton**

```typescript
import type {
    ConversionWorkerRequest,
    ConversionWorkerProgressMessage,
    ConversionWorkerResultMessage,
    ConversionWorkerErrorMessage,
    ConversionWorkerResponse,
} from "@/hooks/useConversionWorker";

function postProgress(id: string, progress: number, stage?: string) {
    self.postMessage({
        id,
        type: "progress",
        progress,
        stage,
    } satisfies ConversionWorkerProgressMessage);
}

// Operation handlers will be added in subsequent tasks

self.onmessage = async (e: MessageEvent<ConversionWorkerRequest>) => {
    const { id, operation, buffers, options, fileNames } = e.data;

    try {
        let result: { data: Uint8Array | ArrayBuffer; details?: Record<string, unknown> };

        switch (operation) {
            // Cases will be added per-tool
            default:
                throw new Error(`Unknown operation: ${operation}`);
        }

        const msg: ConversionWorkerResultMessage = {
            id,
            type: "result",
            data: result.data,
            details: result.details,
        };
        self.postMessage(msg);
    } catch (error) {
        const msg: ConversionWorkerErrorMessage = {
            id,
            type: "error",
            error: error instanceof Error ? error.message : "Operation failed",
        };
        self.postMessage(msg);
    }
};
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build passes

**Step 4: Commit**

```bash
git add src/hooks/useConversionWorker.ts src/lib/pdf/conversion.worker.ts
git commit -m "feat: add conversion worker skeleton and useConversionWorker hook"
```

---

## Task 3: PDF to Word (pdf-to-word)

**Files:**
- Modify: `src/lib/pdf/conversion.worker.ts` (add `handlePdfToWord`)
- Create: `src/app/(tools)/pdf-to-word/page.tsx`
- Create: `src/app/(tools)/pdf-to-word/PdfToWordClient.tsx`
- Modify: `src/lib/constants.ts` (remove `comingSoon` from pdf-to-word)

**Approach:** Use `pdfjs-dist` to extract text items with position data from each page. Group text items into lines by Y-coordinate proximity. Create a DOCX using the `docx` library with paragraphs for each text line. This gives editable text output (not layout-perfect, but functional).

**Step 1: Add `handlePdfToWord` to `conversion.worker.ts`**

```typescript
import * as pdfjsLib from "pdfjs-dist";
import { Document, Packer, Paragraph, TextRun, PageBreak, HeadingLevel } from "docx";

// Set worker path for pdfjs inside the web worker
pdfjsLib.GlobalWorkerOptions.workerSrc = "";

interface TextItem {
    str: string;
    x: number;
    y: number;
    fontSize: number;
    fontName: string;
}

async function handlePdfToWord(
    id: string,
    buffers: ArrayBuffer[]
): Promise<{ data: ArrayBuffer; details?: Record<string, unknown> }> {
    postProgress(id, 5, "Loading PDF...");

    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffers[0]) }).promise;
    const totalPages = pdf.numPages;
    const sections: Paragraph[][] = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        postProgress(id, 5 + (pageNum / totalPages) * 70, `Extracting page ${pageNum} of ${totalPages}`);

        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1.0 });

        // Collect text items with position info
        const items: TextItem[] = [];
        for (const item of textContent.items) {
            if ("str" in item && item.str.trim()) {
                const tx = item.transform;
                items.push({
                    str: item.str,
                    x: tx[4],
                    y: viewport.height - tx[5], // Flip Y (PDF is bottom-up)
                    fontSize: Math.abs(tx[0]) || 12,
                    fontName: item.fontName || "",
                });
            }
        }

        // Sort by Y position (top to bottom), then X (left to right)
        items.sort((a, b) => a.y - b.y || a.x - b.x);

        // Group items into lines (items within 3px Y are same line)
        const lines: TextItem[][] = [];
        let currentLine: TextItem[] = [];
        let lastY = -999;

        for (const item of items) {
            if (Math.abs(item.y - lastY) > 3) {
                if (currentLine.length > 0) lines.push(currentLine);
                currentLine = [item];
                lastY = item.y;
            } else {
                currentLine.push(item);
            }
        }
        if (currentLine.length > 0) lines.push(currentLine);

        // Convert lines to paragraphs
        const pageParagraphs: Paragraph[] = [];
        for (const line of lines) {
            const text = line.map((item) => item.str).join(" ");
            const avgFontSize = line.reduce((sum, item) => sum + item.fontSize, 0) / line.length;
            const isBold = line.some((item) => item.fontName.toLowerCase().includes("bold"));

            // Heuristic: larger font = heading
            let heading: (typeof HeadingLevel)[keyof typeof HeadingLevel] | undefined;
            if (avgFontSize > 20) heading = HeadingLevel.HEADING_1;
            else if (avgFontSize > 16) heading = HeadingLevel.HEADING_2;
            else if (avgFontSize > 14) heading = HeadingLevel.HEADING_3;

            pageParagraphs.push(
                new Paragraph({
                    heading,
                    children: [
                        new TextRun({
                            text,
                            bold: isBold,
                            size: Math.round(avgFontSize * 2), // docx uses half-points
                        }),
                    ],
                })
            );
        }

        // Add page break between pages (except last)
        if (pageNum < totalPages) {
            pageParagraphs.push(
                new Paragraph({
                    children: [new PageBreak()],
                })
            );
        }

        sections.push(pageParagraphs);
    }

    postProgress(id, 85, "Creating Word document...");

    const doc = new Document({
        sections: [
            {
                children: sections.flat(),
            },
        ],
    });

    const docxBuffer = await Packer.toBuffer(doc);

    postProgress(id, 100, "Complete");

    return {
        data: docxBuffer,
        details: { pageCount: totalPages },
    };
}
```

Add the case to the switch in `self.onmessage`:
```typescript
case "pdf-to-word":
    result = await handlePdfToWord(id, buffers);
    break;
```

**Step 2: Create `src/app/(tools)/pdf-to-word/page.tsx`**

```tsx
import { Metadata } from "next";
import PdfToWordClient from "./PdfToWordClient";

export const metadata: Metadata = {
    title: "PDF to Word - Convert PDF to DOCX Online",
    description:
        "Convert PDF files to editable Word documents. Extract text with formatting. Free, private, and runs entirely in your browser.",
    openGraph: {
        title: "PDF to Word - Convert PDF to DOCX Online",
        description:
            "Convert PDF files to editable Word documents. Extract text with formatting. Free, private, and runs entirely in your browser.",
    },
};

export default function PdfToWordPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        name: "EasyPDF - PDF to Word",
                        applicationCategory: "ProductivityApplication",
                        operatingSystem: "Any",
                        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
                        description: "Convert PDF files to editable Word documents.",
                    }),
                }}
            />
            <PdfToWordClient />
        </>
    );
}
```

**Step 3: Create `src/app/(tools)/pdf-to-word/PdfToWordClient.tsx`**

```tsx
"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { FileType } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { FileWithPreview } from "@/types/tools";
import { downloadBlob } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import { useConversionWorker } from "@/hooks/useConversionWorker";

export default function PdfToWordClient() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [result, setResult] = useState<{ blob: Blob; pageCount: number } | null>(null);
    const toast = useToast();
    const { process, progress, stage, isProcessing, resetProgress } = useConversionWorker();

    const file = files[0]?.file;

    const handleFilesChange = useCallback((newFiles: FileWithPreview[]) => {
        setFiles(newFiles.slice(0, 1));
        setResult(null);
    }, []);

    const handleConvert = async () => {
        if (!file) {
            toast.warning("Please upload a PDF file");
            return;
        }

        try {
            const workerResult = await process({
                operation: "pdf-to-word",
                files: [file],
            });

            const blob = new Blob([workerResult.data], {
                type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });
            const pageCount = (workerResult.details?.pageCount as number) || 0;
            setResult({ blob, pageCount });
            toast.success("PDF converted to Word successfully!");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Conversion failed");
        }
    };

    const handleDownload = () => {
        if (result && file) {
            const baseName = file.name.replace(/\.pdf$/i, "");
            downloadBlob(result.blob, `${baseName}.docx`);
        }
    };

    const handleReset = () => {
        setFiles([]);
        setResult(null);
        resetProgress();
    };

    return (
        <ToolLayout
            title="PDF to Word"
            description="Convert PDF to editable Word documents. Best for text-heavy documents."
            icon={FileType}
            color="from-indigo-500 to-indigo-600"
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

                    {isProcessing && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                            <ProgressBar value={progress} />
                            <p className="text-sm text-center text-surface-500">{stage || "Converting..."}</p>
                        </motion.div>
                    )}

                    {file && !isProcessing && (
                        <div className="flex justify-center gap-4">
                            <Button variant="secondary" onClick={handleReset}>
                                Clear
                            </Button>
                            <Button onClick={handleConvert} size="lg">
                                Convert to Word
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <DownloadButton
                        onClick={handleDownload}
                        filename={`${file?.name.replace(/\.pdf$/i, "")}.docx`}
                        fileSize={result.blob.size}
                        isReady
                    />
                    <div className="text-center">
                        <p className="text-sm text-surface-500 mb-4">
                            Extracted {result.pageCount} pages to Word
                        </p>
                        <Button variant="secondary" onClick={handleReset}>
                            Convert Another
                        </Button>
                    </div>
                </div>
            )}
        </ToolLayout>
    );
}
```

**Step 4: Remove `comingSoon` from constants.ts**

In `src/lib/constants.ts`, remove line `comingSoon: true,` from the `pdf-to-word` entry (around line 107).

**Step 5: Verify build**

Run: `npm run build`
Expected: Build passes, `/pdf-to-word` route is generated

**Step 6: Commit**

```bash
git add src/lib/pdf/conversion.worker.ts src/app/\(tools\)/pdf-to-word/ src/lib/constants.ts
git commit -m "feat: add PDF to Word conversion tool"
```

---

## Task 4: PDF to Excel (pdf-to-excel)

**Files:**
- Modify: `src/lib/pdf/conversion.worker.ts` (add `handlePdfToExcel`)
- Create: `src/app/(tools)/pdf-to-excel/page.tsx`
- Create: `src/app/(tools)/pdf-to-excel/PdfToExcelClient.tsx`
- Modify: `src/lib/constants.ts` (remove `comingSoon` from pdf-to-excel)

**Approach:** Use `pdfjs-dist` to extract text items. Group into rows by Y-coordinate, columns by X-coordinate gaps. Use `xlsx` (SheetJS) to create an Excel workbook with one sheet per PDF page.

**Step 1: Add `handlePdfToExcel` to `conversion.worker.ts`**

```typescript
import * as XLSX from "xlsx";

async function handlePdfToExcel(
    id: string,
    buffers: ArrayBuffer[]
): Promise<{ data: ArrayBuffer; details?: Record<string, unknown> }> {
    postProgress(id, 5, "Loading PDF...");

    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffers[0]) }).promise;
    const totalPages = pdf.numPages;
    const workbook = XLSX.utils.book_new();

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        postProgress(id, 5 + (pageNum / totalPages) * 80, `Processing page ${pageNum} of ${totalPages}`);

        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1.0 });

        // Collect text items
        const items: { str: string; x: number; y: number }[] = [];
        for (const item of textContent.items) {
            if ("str" in item && item.str.trim()) {
                const tx = item.transform;
                items.push({
                    str: item.str,
                    x: Math.round(tx[4]),
                    y: Math.round(viewport.height - tx[5]),
                });
            }
        }

        // Sort by Y then X
        items.sort((a, b) => a.y - b.y || a.x - b.x);

        // Group into rows by Y proximity (within 5px = same row)
        const rows: { str: string; x: number }[][] = [];
        let currentRow: { str: string; x: number }[] = [];
        let lastY = -999;

        for (const item of items) {
            if (Math.abs(item.y - lastY) > 5) {
                if (currentRow.length > 0) rows.push(currentRow);
                currentRow = [{ str: item.str, x: item.x }];
                lastY = item.y;
            } else {
                currentRow.push({ str: item.str, x: item.x });
            }
        }
        if (currentRow.length > 0) rows.push(currentRow);

        // Detect column boundaries from X positions
        const allXPositions = items.map((i) => i.x).sort((a, b) => a - b);
        const columnBoundaries: number[] = [];
        if (allXPositions.length > 0) {
            columnBoundaries.push(allXPositions[0]);
            for (let i = 1; i < allXPositions.length; i++) {
                if (allXPositions[i] - allXPositions[i - 1] > 30) {
                    columnBoundaries.push(allXPositions[i]);
                }
            }
        }

        // Map rows to grid
        const gridRows: string[][] = rows.map((row) => {
            const cells = new Array(Math.max(columnBoundaries.length, 1)).fill("");
            for (const item of row) {
                let colIdx = 0;
                for (let c = columnBoundaries.length - 1; c >= 0; c--) {
                    if (item.x >= columnBoundaries[c] - 15) {
                        colIdx = c;
                        break;
                    }
                }
                cells[colIdx] = cells[colIdx]
                    ? cells[colIdx] + " " + item.str
                    : item.str;
            }
            return cells;
        });

        const worksheet = XLSX.utils.aoa_to_sheet(gridRows);
        XLSX.utils.book_append_sheet(workbook, worksheet, `Page ${pageNum}`);
    }

    postProgress(id, 90, "Creating Excel file...");

    const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
    });

    postProgress(id, 100, "Complete");

    return {
        data: excelBuffer,
        details: { pageCount: totalPages },
    };
}
```

Add switch case:
```typescript
case "pdf-to-excel":
    result = await handlePdfToExcel(id, buffers);
    break;
```

**Step 2: Create `src/app/(tools)/pdf-to-excel/page.tsx`**

Follow exact same pattern as pdf-to-word page.tsx but with:
- Title: `"PDF to Excel - Extract PDF Data to Spreadsheet"`
- Description: `"Extract data and tables from PDF files to Excel spreadsheets."`
- Component: `PdfToExcelClient`

**Step 3: Create `src/app/(tools)/pdf-to-excel/PdfToExcelClient.tsx`**

Follow same pattern as `PdfToWordClient` but:
- Operation: `"pdf-to-excel"`
- Icon: `Sheet` from lucide-react (matches constants.ts)
- Color: `"from-emerald-500 to-emerald-600"`
- Title: `"PDF to Excel"`
- Description: `"Extract data from PDF to Excel spreadsheets. Best for documents with tables."`
- Blob type: `"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"`
- Output extension: `.xlsx`
- Button text: `"Convert to Excel"`

**Step 4: Remove `comingSoon` from pdf-to-excel in constants.ts**

**Step 5: Build & commit**

```bash
npm run build
git add src/lib/pdf/conversion.worker.ts src/app/\(tools\)/pdf-to-excel/ src/lib/constants.ts
git commit -m "feat: add PDF to Excel conversion tool"
```

---

## Task 5: PDF to PowerPoint (pdf-to-pptx)

**Files:**
- Modify: `src/lib/pdf/conversion.worker.ts` (add `handlePdfToPptx`)
- Create: `src/app/(tools)/pdf-to-pptx/page.tsx`
- Create: `src/app/(tools)/pdf-to-pptx/PdfToPptxClient.tsx`
- Modify: `src/lib/constants.ts` (add new tool entry for pdf-to-pptx)

**Approach:** Render each PDF page to a canvas via `pdfjs-dist`, export as JPEG image, embed each image as a full-slide background in a PPTX using `pptxgenjs`. This gives visual fidelity (not editable text). Note: `OffscreenCanvas` is available in web workers.

**Step 1: Add `handlePdfToPptx` to `conversion.worker.ts`**

```typescript
import PptxGenJS from "pptxgenjs";

async function handlePdfToPptx(
    id: string,
    buffers: ArrayBuffer[]
): Promise<{ data: ArrayBuffer; details?: Record<string, unknown> }> {
    postProgress(id, 5, "Loading PDF...");

    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffers[0]) }).promise;
    const totalPages = pdf.numPages;
    const pptx = new PptxGenJS();

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        postProgress(id, 5 + (pageNum / totalPages) * 80, `Rendering page ${pageNum} of ${totalPages}`);

        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 }); // 2x for quality

        // Render to OffscreenCanvas
        const canvas = new OffscreenCanvas(viewport.width, viewport.height);
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Cannot create canvas context");

        await page.render({
            canvasContext: ctx as unknown as CanvasRenderingContext2D,
            viewport,
        }).promise;

        // Convert to JPEG blob then base64
        const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.85 });
        const arrayBuf = await blob.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuf)));

        // Determine slide dimensions (landscape vs portrait)
        const isLandscape = viewport.width > viewport.height;
        const slide = pptx.addSlide();

        if (isLandscape) {
            pptx.defineLayout({ name: "CUSTOM", width: 10, height: 7.5 });
        }

        slide.addImage({
            data: `image/jpeg;base64,${base64}`,
            x: 0,
            y: 0,
            w: "100%",
            h: "100%",
        });
    }

    postProgress(id, 90, "Creating PowerPoint...");

    const pptxOutput = await pptx.write({ outputType: "arraybuffer" });

    postProgress(id, 100, "Complete");

    return {
        data: pptxOutput as ArrayBuffer,
        details: { pageCount: totalPages },
    };
}
```

Add switch case:
```typescript
case "pdf-to-pptx":
    result = await handlePdfToPptx(id, buffers);
    break;
```

**Step 2: Add pdf-to-pptx entry to `src/lib/constants.ts`**

Add after the `pdf-to-excel` entry:

```typescript
{
    id: "pdf-to-pptx",
    name: "PDF to PowerPoint",
    description: "Convert PDF to PowerPoint presentations",
    href: "/pdf-to-pptx",
    icon: "Presentation",
    category: "convert",
    color: "from-orange-500 to-orange-600",
},
```

**Step 3: Create `src/app/(tools)/pdf-to-pptx/page.tsx`**

Same pattern with:
- Title: `"PDF to PowerPoint - Convert PDF to PPTX Online"`
- Component: `PdfToPptxClient`

**Step 4: Create `src/app/(tools)/pdf-to-pptx/PdfToPptxClient.tsx`**

Same pattern as PdfToWordClient but:
- Operation: `"pdf-to-pptx"`
- Icon: `Presentation` from lucide-react
- Color: `"from-orange-500 to-orange-600"`
- Title: `"PDF to PowerPoint"`
- Description: `"Convert PDF pages to PowerPoint slides. Each page becomes a slide."`
- Blob type: `"application/vnd.openxmlformats-officedocument.presentationml.presentation"`
- Output extension: `.pptx`

**Step 5: Build & commit**

```bash
npm run build
git add src/lib/pdf/conversion.worker.ts src/app/\(tools\)/pdf-to-pptx/ src/lib/constants.ts
git commit -m "feat: add PDF to PowerPoint conversion tool"
```

---

## Task 6: Word to PDF (word-to-pdf)

**Files:**
- Modify: `src/lib/pdf/conversion.worker.ts` (add `handleWordToPdf`)
- Create: `src/app/(tools)/word-to-pdf/page.tsx`
- Create: `src/app/(tools)/word-to-pdf/WordToPdfClient.tsx`
- Modify: `src/lib/constants.ts` (remove `comingSoon`)

**Approach:** Use `mammoth` to convert DOCX to HTML. Then use `jspdf` to render the HTML content into a PDF. Note: `mammoth` works in web workers since it's pure JS. We'll parse the HTML and render text/paragraphs to jsPDF manually (since `html2canvas` requires DOM access which isn't available in workers).

**Step 1: Add `handleWordToPdf` to `conversion.worker.ts`**

```typescript
import mammoth from "mammoth";
import { jsPDF } from "jspdf";

async function handleWordToPdf(
    id: string,
    buffers: ArrayBuffer[]
): Promise<{ data: ArrayBuffer; details?: Record<string, unknown> }> {
    postProgress(id, 10, "Reading Word document...");

    const result = await mammoth.extractRawText({ arrayBuffer: buffers[0] });
    const text = result.value;

    postProgress(id, 40, "Creating PDF...");

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const lineHeight = 7;
    const maxWidth = pageWidth - margin * 2;

    pdf.setFont("helvetica");
    pdf.setFontSize(12);

    const paragraphs = text.split("\n");
    let y = margin;

    for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i].trim();
        if (!paragraph) {
            y += lineHeight / 2;
            continue;
        }

        const lines = pdf.splitTextToSize(paragraph, maxWidth);

        for (const line of lines) {
            if (y + lineHeight > pageHeight - margin) {
                pdf.addPage();
                y = margin;
            }
            pdf.text(line, margin, y);
            y += lineHeight;
        }

        y += lineHeight * 0.3; // paragraph spacing

        postProgress(id, 40 + (i / paragraphs.length) * 50, "Rendering pages...");
    }

    postProgress(id, 95, "Saving PDF...");

    const pdfOutput = pdf.output("arraybuffer");

    postProgress(id, 100, "Complete");

    return {
        data: pdfOutput,
        details: { pageCount: pdf.getNumberOfPages() },
    };
}
```

Add switch case:
```typescript
case "word-to-pdf":
    result = await handleWordToPdf(id, buffers);
    break;
```

**Step 2: Create `src/app/(tools)/word-to-pdf/page.tsx`**

Same pattern:
- Title: `"Word to PDF - Convert DOCX to PDF Online"`
- Component: `WordToPdfClient`

**Step 3: Create `src/app/(tools)/word-to-pdf/WordToPdfClient.tsx`**

Key differences from other tools:
- Accept: `{ "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"], "application/msword": [".doc"] }`
- Operation: `"word-to-pdf"`
- Icon: `FileText` from lucide-react
- Color: `"from-blue-500 to-blue-600"`
- Title: `"Word to PDF"`
- Description: `"Convert Word documents to PDF format."`
- Output blob type: `"application/pdf"` (use `createPdfBlob` from utils)
- Output extension: `.pdf`
- Label on FileUploader: `"Drop your Word document here"`

**Step 4: Remove `comingSoon` from word-to-pdf in constants.ts**

**Step 5: Build & commit**

```bash
npm run build
git add src/lib/pdf/conversion.worker.ts src/app/\(tools\)/word-to-pdf/ src/lib/constants.ts
git commit -m "feat: add Word to PDF conversion tool"
```

---

## Task 7: Excel to PDF (excel-to-pdf)

**Files:**
- Modify: `src/lib/pdf/conversion.worker.ts` (add `handleExcelToPdf`)
- Create: `src/app/(tools)/excel-to-pdf/page.tsx`
- Create: `src/app/(tools)/excel-to-pdf/ExcelToPdfClient.tsx`
- Modify: `src/lib/constants.ts` (remove `comingSoon`)

**Approach:** Use `xlsx` (SheetJS) to parse the Excel file, extract sheet data as arrays of arrays, and render tables into a PDF using `jspdf`. Each sheet gets its own page(s).

**Step 1: Add `handleExcelToPdf` to `conversion.worker.ts`**

```typescript
async function handleExcelToPdf(
    id: string,
    buffers: ArrayBuffer[]
): Promise<{ data: ArrayBuffer; details?: Record<string, unknown> }> {
    postProgress(id, 10, "Reading Excel file...");

    const workbook = XLSX.read(new Uint8Array(buffers[0]), { type: "array" });
    const sheetNames = workbook.SheetNames;

    postProgress(id, 30, "Creating PDF...");

    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const cellPadding = 3;
    const headerHeight = 8;
    const rowHeight = 7;
    const fontSize = 9;
    const headerFontSize = 10;

    for (let s = 0; s < sheetNames.length; s++) {
        if (s > 0) pdf.addPage();

        const sheetName = sheetNames[s];
        const sheet = workbook.Sheets[sheetName];
        const data: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];

        if (data.length === 0) continue;

        // Sheet title
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text(sheetName, margin, margin);

        const maxCols = Math.max(...data.map((r) => r.length));
        const colWidth = (pageWidth - margin * 2) / maxCols;
        let y = margin + 10;

        for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
            const row = data[rowIdx];
            const isHeader = rowIdx === 0;
            const rh = isHeader ? headerHeight : rowHeight;

            // Page break check
            if (y + rh > pageHeight - margin) {
                pdf.addPage();
                y = margin;
            }

            // Draw row background
            if (isHeader) {
                pdf.setFillColor(66, 133, 244); // Blue header
                pdf.rect(margin, y, pageWidth - margin * 2, rh, "F");
                pdf.setTextColor(255, 255, 255);
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(headerFontSize);
            } else if (rowIdx % 2 === 0) {
                pdf.setFillColor(245, 245, 245);
                pdf.rect(margin, y, pageWidth - margin * 2, rh, "F");
            }

            // Draw cells
            if (!isHeader) {
                pdf.setTextColor(0, 0, 0);
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(fontSize);
            }

            for (let colIdx = 0; colIdx < maxCols; colIdx++) {
                const cellValue = String(row[colIdx] ?? "");
                const x = margin + colIdx * colWidth + cellPadding;
                const textY = y + (rh / 2) + 1;
                const maxTextWidth = colWidth - cellPadding * 2;
                const truncated = pdf.splitTextToSize(cellValue, maxTextWidth)[0] || "";
                pdf.text(truncated, x, textY);
            }

            // Draw grid line
            pdf.setDrawColor(200, 200, 200);
            pdf.line(margin, y + rh, pageWidth - margin, y + rh);

            y += rh;
        }

        postProgress(id, 30 + ((s + 1) / sheetNames.length) * 60, `Processing sheet ${s + 1} of ${sheetNames.length}`);
    }

    postProgress(id, 95, "Saving PDF...");
    const pdfOutput = pdf.output("arraybuffer");
    postProgress(id, 100, "Complete");

    return {
        data: pdfOutput,
        details: { pageCount: pdf.getNumberOfPages(), sheetCount: sheetNames.length },
    };
}
```

Add switch case:
```typescript
case "excel-to-pdf":
    result = await handleExcelToPdf(id, buffers);
    break;
```

**Step 2: Create page.tsx and ExcelToPdfClient.tsx**

Same pattern:
- Accept: `{ "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"], "application/vnd.ms-excel": [".xls"] }`
- Icon: `Table` from lucide-react
- Color: `"from-green-500 to-green-600"`
- Output: PDF blob
- Label: `"Drop your Excel file here"`

**Step 3: Remove `comingSoon`, build & commit**

```bash
npm run build
git add src/lib/pdf/conversion.worker.ts src/app/\(tools\)/excel-to-pdf/ src/lib/constants.ts
git commit -m "feat: add Excel to PDF conversion tool"
```

---

## Task 8: OCR Tool (ocr-pdf)

**Files:**
- Create: `src/app/(tools)/ocr-pdf/page.tsx`
- Create: `src/app/(tools)/ocr-pdf/OcrClient.tsx`
- Modify: `src/lib/constants.ts` (add ocr-pdf tool entry)

**Approach:** Tesseract.js does NOT work inside web workers cleanly (it spawns its own worker). So this tool runs on the main thread. Render each PDF page to canvas via `pdfjs-dist`, pass canvas to Tesseract for OCR, collect text, offer as TXT or create a searchable PDF overlay.

**Important:** This tool does NOT use the conversion worker. Tesseract manages its own worker internally.

**Step 1: Add ocr-pdf to `src/lib/constants.ts`**

Add to the convert section:

```typescript
{
    id: "ocr-pdf",
    name: "OCR PDF",
    description: "Extract text from scanned PDFs using OCR",
    href: "/ocr-pdf",
    icon: "ScanText",
    category: "convert",
    color: "from-violet-500 to-violet-600",
},
```

**Step 2: Create `src/app/(tools)/ocr-pdf/page.tsx`**

Standard page.tsx:
- Title: `"OCR PDF - Extract Text from Scanned PDFs"`
- Description: `"Use OCR to extract text from scanned PDF documents. Supports multiple languages."`

**Step 3: Create `src/app/(tools)/ocr-pdf/OcrClient.tsx`**

```tsx
"use client";

import { useState, useCallback, useRef } from "react";
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

// Configure pdf.js worker
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
    const toast = useToast();

    const file = files[0]?.file;

    const handleFilesChange = useCallback((newFiles: FileWithPreview[]) => {
        setFiles(newFiles.slice(0, 1));
        setResult(null);
    }, []);

    const handleOcr = async () => {
        if (!file) {
            toast.warning("Please upload a PDF file");
            return;
        }

        setIsProcessing(true);
        setProgress(0);
        setStage("Loading PDF...");

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
            const totalPages = pdf.numPages;
            let fullText = "";

            for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                setStage(`Rendering page ${pageNum} of ${totalPages}...`);
                setProgress((pageNum / (totalPages + 1)) * 50);

                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement("canvas");
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const ctx = canvas.getContext("2d")!;

                await page.render({ canvasContext: ctx, viewport }).promise;

                setStage(`Running OCR on page ${pageNum}...`);

                const { data } = await Tesseract.recognize(canvas, language, {
                    logger: (m) => {
                        if (m.status === "recognizing text") {
                            const pageProgress = 50 + (pageNum / totalPages) * 45;
                            setProgress(pageProgress * (m.progress || 0));
                        }
                    },
                });

                fullText += `--- Page ${pageNum} ---\n${data.text}\n\n`;

                canvas.remove();
            }

            const textBlob = new Blob([fullText], { type: "text/plain" });
            setResult({ text: fullText, blob: textBlob });
            setProgress(100);
            setStage("Complete");
            toast.success("OCR completed successfully!");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "OCR failed");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (result && file) {
            const baseName = file.name.replace(/\.pdf$/i, "");
            downloadBlob(result.blob, `${baseName}_ocr.txt`);
        }
    };

    const handleCopyText = () => {
        if (result) {
            navigator.clipboard.writeText(result.text);
            toast.success("Text copied to clipboard!");
        }
    };

    const handleReset = () => {
        setFiles([]);
        setResult(null);
        setProgress(0);
        setStage("");
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

                    {file && !isProcessing && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700"
                        >
                            <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
                                OCR Language
                            </h3>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full p-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white"
                            >
                                {LANGUAGES.map((lang) => (
                                    <option key={lang.value} value={lang.value}>
                                        {lang.label}
                                    </option>
                                ))}
                            </select>
                        </motion.div>
                    )}

                    {isProcessing && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                            <ProgressBar value={progress} />
                            <p className="text-sm text-center text-surface-500">{stage}</p>
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
                    <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                        <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
                            Extracted Text
                        </h3>
                        <pre className="max-h-96 overflow-y-auto p-4 bg-surface-50 dark:bg-surface-900 rounded-xl text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap font-mono">
                            {result.text}
                        </pre>
                    </div>

                    <div className="flex justify-center gap-3">
                        <Button variant="secondary" onClick={handleCopyText}>
                            Copy Text
                        </Button>
                        <DownloadButton
                            onClick={handleDownload}
                            filename={`${file?.name.replace(/\.pdf$/i, "")}_ocr.txt`}
                            fileSize={result.blob.size}
                            isReady
                        />
                    </div>

                    <div className="text-center">
                        <Button variant="secondary" onClick={handleReset}>
                            Process Another
                        </Button>
                    </div>
                </div>
            )}
        </ToolLayout>
    );
}
```

**Step 4: Build & commit**

```bash
npm run build
git add src/app/\(tools\)/ocr-pdf/ src/lib/constants.ts
git commit -m "feat: add OCR tool with Tesseract.js for scanned PDFs"
```

---

## Task 9: Add SUPPORTED_OFFICE_TYPES constant & update constants.ts

**Files:**
- Modify: `src/lib/constants.ts`

**Step 1: Add file type constants**

Add at the end of constants.ts:

```typescript
export const SUPPORTED_WORD_TYPES = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
];

export const SUPPORTED_EXCEL_TYPES = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
];

export const SUPPORTED_PPTX_TYPES = [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-powerpoint",
];
```

**Step 2: Commit**

```bash
git add src/lib/constants.ts
git commit -m "chore: add Office file type constants"
```

---

## Task 10: Integration Testing & Polish

**Step 1: Run full build**

```bash
npm run build
```

Expected: All routes compile, no TypeScript errors.

**Step 2: Manual smoke test each tool**

Run `npm run dev` and test each tool with a sample file:

1. `/pdf-to-word` - Upload a text-heavy PDF, verify .docx output opens in Word/Google Docs
2. `/pdf-to-excel` - Upload a PDF with tables, verify .xlsx has rows/columns
3. `/pdf-to-pptx` - Upload any PDF, verify .pptx has one slide per page with images
4. `/word-to-pdf` - Upload a .docx, verify PDF output has text
5. `/excel-to-pdf` - Upload an .xlsx, verify PDF shows table data
6. `/ocr-pdf` - Upload a scanned PDF image, verify text extraction

**Step 3: Fix any issues found during testing**

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete PDF-Office conversion suite with OCR support"
```

---

## Summary of New Files

| File | Purpose |
|---|---|
| `src/hooks/useConversionWorker.ts` | React hook for conversion worker |
| `src/lib/pdf/conversion.worker.ts` | Web Worker handling all conversion operations |
| `src/app/(tools)/pdf-to-word/page.tsx` | PDF to Word page |
| `src/app/(tools)/pdf-to-word/PdfToWordClient.tsx` | PDF to Word UI |
| `src/app/(tools)/pdf-to-excel/page.tsx` | PDF to Excel page |
| `src/app/(tools)/pdf-to-excel/PdfToExcelClient.tsx` | PDF to Excel UI |
| `src/app/(tools)/pdf-to-pptx/page.tsx` | PDF to PowerPoint page |
| `src/app/(tools)/pdf-to-pptx/PdfToPptxClient.tsx` | PDF to PowerPoint UI |
| `src/app/(tools)/word-to-pdf/page.tsx` | Word to PDF page |
| `src/app/(tools)/word-to-pdf/WordToPdfClient.tsx` | Word to PDF UI |
| `src/app/(tools)/excel-to-pdf/page.tsx` | Excel to PDF page |
| `src/app/(tools)/excel-to-pdf/ExcelToPdfClient.tsx` | Excel to PDF UI |
| `src/app/(tools)/ocr-pdf/page.tsx` | OCR page |
| `src/app/(tools)/ocr-pdf/OcrClient.tsx` | OCR UI |

## Modified Files

| File | Changes |
|---|---|
| `package.json` | Added docx, mammoth, pptxgenjs, xlsx, tesseract.js |
| `src/lib/constants.ts` | Removed `comingSoon` from 4 tools, added pdf-to-pptx + ocr-pdf entries, added Office type constants |
