import { PDFDocument } from "@cantoo/pdf-lib";
import JSZip from "jszip";
import { readFileAsArrayBuffer } from "@/lib/utils";

export interface SplitResult {
    success: boolean;
    data?: Blob;
    fileCount?: number;
    error?: string;
}

export type SplitMode = "range" | "pages" | "every" | "all";

export interface SplitOptions {
    mode: SplitMode;
    ranges?: string; // e.g., "1-5, 6-10, 11-15"
    pages?: number[]; // e.g., [1, 3, 7, 12]
    everyN?: number; // split every N pages
}

function parseRanges(rangesStr: string, totalPages: number): number[][] {
    const ranges: number[][] = [];
    const parts = rangesStr.split(",").map((s) => s.trim());

    for (const part of parts) {
        if (part.includes("-")) {
            const [start, end] = part.split("-").map((n) => parseInt(n.trim()));
            if (start >= 1 && end <= totalPages && start <= end) {
                ranges.push(
                    Array.from({ length: end - start + 1 }, (_, i) => start + i - 1)
                );
            }
        } else {
            const page = parseInt(part);
            if (page >= 1 && page <= totalPages) {
                ranges.push([page - 1]);
            }
        }
    }

    return ranges;
}

export async function splitPDF(
    file: File,
    options: SplitOptions
): Promise<SplitResult> {
    try {
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const pdf = await PDFDocument.load(arrayBuffer);
        const totalPages = pdf.getPageCount();

        let pageGroups: number[][] = [];

        switch (options.mode) {
            case "range":
                if (!options.ranges) {
                    return { success: false, error: "Please specify page ranges" };
                }
                pageGroups = parseRanges(options.ranges, totalPages);
                break;

            case "pages":
                if (!options.pages || options.pages.length === 0) {
                    return { success: false, error: "Please select pages to extract" };
                }
                pageGroups = options.pages.map((p) => [p - 1]);
                break;

            case "every":
                if (!options.everyN || options.everyN < 1) {
                    return { success: false, error: "Please specify a valid number" };
                }
                for (let i = 0; i < totalPages; i += options.everyN) {
                    const group: number[] = [];
                    for (let j = i; j < Math.min(i + options.everyN, totalPages); j++) {
                        group.push(j);
                    }
                    pageGroups.push(group);
                }
                break;

            case "all":
                pageGroups = Array.from({ length: totalPages }, (_, i) => [i]);
                break;
        }

        if (pageGroups.length === 0) {
            return { success: false, error: "No valid pages to split" };
        }

        const zip = new JSZip();
        const baseName = file.name.replace(".pdf", "");

        for (let i = 0; i < pageGroups.length; i++) {
            const group = pageGroups[i];
            const newPdf = await PDFDocument.create();
            const copiedPages = await newPdf.copyPages(pdf, group);
            copiedPages.forEach((page) => newPdf.addPage(page));

            const pdfBytes = await newPdf.save();
            const fileName =
                options.mode === "all"
                    ? `${baseName}_page_${group[0] + 1}.pdf`
                    : `${baseName}_part_${i + 1}.pdf`;
            zip.file(fileName, pdfBytes);
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });

        return {
            success: true,
            data: zipBlob,
            fileCount: pageGroups.length,
        };
    } catch (error) {
        console.error("Error splitting PDF:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to split PDF",
        };
    }
}

export async function getPDFPageCount(file: File): Promise<number> {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const pdf = await PDFDocument.load(arrayBuffer);
    return pdf.getPageCount();
}
