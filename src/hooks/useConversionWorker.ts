import { useState, useCallback, useRef } from "react";

export type ConversionOperation =
    | "pdf-to-word"
    | "pdf-to-excel"
    | "pdf-to-pptx"
    | "word-to-pdf"
    | "excel-to-pdf"
    | "ocr";

interface ProcessOptions {
    operation: ConversionOperation;
    files: File[];
    options?: Record<string, unknown>;
}

interface ConversionResult {
    data: ArrayBuffer;
    details?: Record<string, unknown>;
}

type ProgressCallback = (progress: number, stage?: string) => void;

// ─── Conversion Functions (lazy-loaded) ──────────────────────────────────────

async function handlePdfToWord(
    buffer: ArrayBuffer,
    onProgress: ProgressCallback
): Promise<ConversionResult> {
    onProgress(5, "Loading PDF...");
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/legacy/build/pdf.worker.mjs",
        import.meta.url
    ).toString();

    const { Document, Packer, Paragraph, TextRun, PageBreak, HeadingLevel } = await import("docx");

    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
    const totalPages = pdf.numPages;
    const allParagraphs: InstanceType<typeof Paragraph>[] = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        onProgress(5 + (pageNum / totalPages) * 70, `Extracting page ${pageNum} of ${totalPages}`);

        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1.0 });

        const items: { str: string; x: number; y: number; fontSize: number; fontName: string }[] = [];
        for (const item of textContent.items) {
            if ("str" in item && item.str.trim()) {
                const tx = item.transform;
                items.push({
                    str: item.str,
                    x: tx[4],
                    y: viewport.height - tx[5],
                    fontSize: Math.abs(tx[0]) || 12,
                    fontName: item.fontName || "",
                });
            }
        }

        items.sort((a, b) => a.y - b.y || a.x - b.x);

        const lines: typeof items[] = [];
        let currentLine: typeof items = [];
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

        for (const line of lines) {
            const text = line.map((item) => item.str).join(" ");
            const avgFontSize = line.reduce((sum, item) => sum + item.fontSize, 0) / line.length;
            const isBold = line.some((item) => item.fontName.toLowerCase().includes("bold"));

            let heading: (typeof HeadingLevel)[keyof typeof HeadingLevel] | undefined;
            if (avgFontSize > 20) heading = HeadingLevel.HEADING_1;
            else if (avgFontSize > 16) heading = HeadingLevel.HEADING_2;
            else if (avgFontSize > 14) heading = HeadingLevel.HEADING_3;

            allParagraphs.push(
                new Paragraph({
                    heading,
                    children: [
                        new TextRun({
                            text,
                            bold: isBold,
                            size: Math.round(avgFontSize * 2),
                        }),
                    ],
                })
            );
        }

        if (pageNum < totalPages) {
            allParagraphs.push(new Paragraph({ children: [new PageBreak()] }));
        }
    }

    onProgress(85, "Creating Word document...");

    const doc = new Document({ sections: [{ children: allParagraphs }] });
    const docxBlob = await Packer.toBlob(doc);
    const data = await docxBlob.arrayBuffer();

    onProgress(100, "Complete");
    return { data, details: { pageCount: totalPages } };
}

async function handlePdfToExcel(
    buffer: ArrayBuffer,
    onProgress: ProgressCallback
): Promise<ConversionResult> {
    onProgress(5, "Loading PDF...");
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/legacy/build/pdf.worker.mjs",
        import.meta.url
    ).toString();
    const XLSX = await import("xlsx");

    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
    const totalPages = pdf.numPages;
    const workbook = XLSX.utils.book_new();

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        onProgress(5 + (pageNum / totalPages) * 80, `Processing page ${pageNum} of ${totalPages}`);

        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1.0 });

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

        items.sort((a, b) => a.y - b.y || a.x - b.x);

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
                cells[colIdx] = cells[colIdx] ? cells[colIdx] + " " + item.str : item.str;
            }
            return cells;
        });

        const worksheet = XLSX.utils.aoa_to_sheet(gridRows);
        XLSX.utils.book_append_sheet(workbook, worksheet, `Page ${pageNum}`);
    }

    onProgress(90, "Creating Excel file...");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    onProgress(100, "Complete");

    return { data: excelBuffer, details: { pageCount: totalPages } };
}

async function handlePdfToPptx(
    buffer: ArrayBuffer,
    onProgress: ProgressCallback
): Promise<ConversionResult> {
    onProgress(5, "Loading PDF...");
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/legacy/build/pdf.worker.mjs",
        import.meta.url
    ).toString();
    const PptxGenJS = (await import("pptxgenjs")).default;

    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
    const totalPages = pdf.numPages;
    const pptx = new PptxGenJS();

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        onProgress(5 + (pageNum / totalPages) * 80, `Rendering page ${pageNum} of ${totalPages}`);

        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Cannot create canvas context");

        await page.render({ canvasContext: ctx, viewport }).promise;

        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

        const slide = pptx.addSlide();
        slide.addImage({
            data: dataUrl,
            x: 0,
            y: 0,
            w: "100%",
            h: "100%",
        });
    }

    onProgress(90, "Creating PowerPoint...");
    const pptxOutput = await pptx.write({ outputType: "arraybuffer" });
    onProgress(100, "Complete");

    return { data: pptxOutput as ArrayBuffer, details: { pageCount: totalPages } };
}

async function handleWordToPdf(
    buffer: ArrayBuffer,
    onProgress: ProgressCallback
): Promise<ConversionResult> {
    onProgress(10, "Reading Word document...");
    const mammoth = (await import("mammoth")).default;
    const { jsPDF } = await import("jspdf");

    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    const text = result.value;

    onProgress(40, "Creating PDF...");

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

        y += lineHeight * 0.3;
        onProgress(40 + (i / paragraphs.length) * 50, "Rendering pages...");
    }

    onProgress(95, "Saving PDF...");
    const pdfOutput = pdf.output("arraybuffer");
    onProgress(100, "Complete");

    return { data: pdfOutput, details: { pageCount: pdf.getNumberOfPages() } };
}

async function handleExcelToPdf(
    buffer: ArrayBuffer,
    onProgress: ProgressCallback
): Promise<ConversionResult> {
    onProgress(10, "Reading Excel file...");
    const XLSX = await import("xlsx");
    const { jsPDF } = await import("jspdf");

    const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
    const sheetNames = workbook.SheetNames;

    onProgress(30, "Creating PDF...");

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

            if (y + rh > pageHeight - margin) {
                pdf.addPage();
                y = margin;
            }

            if (isHeader) {
                pdf.setFillColor(66, 133, 244);
                pdf.rect(margin, y, pageWidth - margin * 2, rh, "F");
                pdf.setTextColor(255, 255, 255);
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(headerFontSize);
            } else if (rowIdx % 2 === 0) {
                pdf.setFillColor(245, 245, 245);
                pdf.rect(margin, y, pageWidth - margin * 2, rh, "F");
            }

            if (!isHeader) {
                pdf.setTextColor(0, 0, 0);
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(fontSize);
            }

            for (let colIdx = 0; colIdx < maxCols; colIdx++) {
                const cellValue = String(row[colIdx] ?? "");
                const x = margin + colIdx * colWidth + cellPadding;
                const textY = y + rh / 2 + 1;
                const maxTextWidth = colWidth - cellPadding * 2;
                const truncated = pdf.splitTextToSize(cellValue, maxTextWidth)[0] || "";
                pdf.text(truncated, x, textY);
            }

            pdf.setDrawColor(200, 200, 200);
            pdf.line(margin, y + rh, pageWidth - margin, y + rh);

            y += rh;
        }

        onProgress(30 + ((s + 1) / sheetNames.length) * 60, `Processing sheet ${s + 1} of ${sheetNames.length}`);
    }

    onProgress(95, "Saving PDF...");
    const pdfOutput = pdf.output("arraybuffer");
    onProgress(100, "Complete");

    return {
        data: pdfOutput,
        details: { pageCount: pdf.getNumberOfPages(), sheetCount: sheetNames.length },
    };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useConversionWorker() {
    const [progress, setProgress] = useState(0);
    const [stage, setStage] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);
    const abortRef = useRef(false);

    const onProgress: ProgressCallback = useCallback((p: number, s?: string) => {
        setProgress(p);
        if (s) setStage(s);
    }, []);

    const process = useCallback(
        async ({ operation, files }: ProcessOptions): Promise<ConversionResult> => {
            setIsProcessing(true);
            setProgress(0);
            setStage("Preparing...");
            abortRef.current = false;

            try {
                const buffer = await files[0].arrayBuffer();

                let result: ConversionResult;
                switch (operation) {
                    case "pdf-to-word":
                        result = await handlePdfToWord(buffer, onProgress);
                        break;
                    case "pdf-to-excel":
                        result = await handlePdfToExcel(buffer, onProgress);
                        break;
                    case "pdf-to-pptx":
                        result = await handlePdfToPptx(buffer, onProgress);
                        break;
                    case "word-to-pdf":
                        result = await handleWordToPdf(buffer, onProgress);
                        break;
                    case "excel-to-pdf":
                        result = await handleExcelToPdf(buffer, onProgress);
                        break;
                    default:
                        throw new Error(`Unknown operation: ${operation}`);
                }

                return result;
            } finally {
                setIsProcessing(false);
            }
        },
        [onProgress]
    );

    const resetProgress = useCallback(() => {
        setProgress(0);
        setStage("");
    }, []);

    return { process, progress, stage, isProcessing, resetProgress };
}
