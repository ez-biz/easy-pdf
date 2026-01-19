import { PDFDocument } from "pdf-lib";
import { readFileAsArrayBuffer } from "@/lib/utils";

export interface MergeResult {
    success: boolean;
    data?: Uint8Array;
    pageCount?: number;
    error?: string;
}

export async function mergePDFs(files: File[]): Promise<MergeResult> {
    try {
        if (files.length < 2) {
            return {
                success: false,
                error: "At least 2 PDF files are required to merge",
            };
        }

        const mergedPdf = await PDFDocument.create();

        for (const file of files) {
            const arrayBuffer = await readFileAsArrayBuffer(file);
            const pdf = await PDFDocument.load(arrayBuffer);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        const mergedPdfBytes = await mergedPdf.save();

        return {
            success: true,
            data: mergedPdfBytes,
            pageCount: mergedPdf.getPageCount(),
        };
    } catch (error) {
        console.error("Error merging PDFs:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to merge PDFs",
        };
    }
}
