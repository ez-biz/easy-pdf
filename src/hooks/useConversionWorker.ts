import { useState, useCallback, useRef } from "react";
import { pdfToWord, pdfToExcel, pdfToPptx } from "@/lib/pdf/convert";

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
                    case "pdf-to-word": {
                        const { bytes, pageCount } = await pdfToWord(new Uint8Array(buffer), onProgress);
                        result = { data: bytes.buffer as ArrayBuffer, details: { pageCount } };
                        break;
                    }
                    case "pdf-to-excel": {
                        const { bytes, pageCount } = await pdfToExcel(new Uint8Array(buffer), onProgress);
                        result = { data: bytes.buffer as ArrayBuffer, details: { pageCount } };
                        break;
                    }
                    case "pdf-to-pptx": {
                        const { bytes, pageCount } = await pdfToPptx(new Uint8Array(buffer), onProgress);
                        result = { data: bytes.buffer as ArrayBuffer, details: { pageCount } };
                        break;
                    }
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
