import { PDFDocument } from "pdf-lib";

export interface OrganizeResult {
    success: boolean;
    data?: Uint8Array;
    pageCount?: number;
    error?: string;
}

/**
 * Remove specified pages from a PDF
 * @param pdfFile - The PDF file to modify
 * @param pagesToRemove - Array of page indices to remove (0-indexed)
 */
export async function removePages(
    pdfFile: File,
    pagesToRemove: number[]
): Promise<OrganizeResult> {
    try {
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const totalPages = pdfDoc.getPageCount();

        // Validate page indices
        const invalidPages = pagesToRemove.filter(
            (p) => p < 0 || p >= totalPages
        );
        if (invalidPages.length > 0) {
            return {
                success: false,
                error: `Invalid page indices: ${invalidPages.join(", ")}`,
            };
        }

        // Can't remove all pages
        if (pagesToRemove.length >= totalPages) {
            return {
                success: false,
                error: "Cannot remove all pages from PDF",
            };
        }

        // Sort in descending order to remove from end first (prevents index shifting)
        const sortedPages = [...pagesToRemove].sort((a, b) => b - a);

        for (const pageIndex of sortedPages) {
            pdfDoc.removePage(pageIndex);
        }

        const pdfBytes = await pdfDoc.save();
        return {
            success: true,
            data: pdfBytes,
            pageCount: pdfDoc.getPageCount(),
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to remove pages",
        };
    }
}

/**
 * Extract specified pages from a PDF to create a new PDF
 * @param pdfFile - The source PDF file
 * @param pagesToExtract - Array of page indices to extract (0-indexed)
 */
export async function extractPages(
    pdfFile: File,
    pagesToExtract: number[]
): Promise<OrganizeResult> {
    try {
        const arrayBuffer = await pdfFile.arrayBuffer();
        const sourcePdf = await PDFDocument.load(arrayBuffer);
        const totalPages = sourcePdf.getPageCount();

        // Validate page indices
        const invalidPages = pagesToExtract.filter(
            (p) => p < 0 || p >= totalPages
        );
        if (invalidPages.length > 0) {
            return {
                success: false,
                error: `Invalid page indices: ${invalidPages.join(", ")}`,
            };
        }

        if (pagesToExtract.length === 0) {
            return {
                success: false,
                error: "No pages selected for extraction",
            };
        }

        // Create new PDF and copy selected pages
        const newPdf = await PDFDocument.create();

        // Sort pages to maintain order
        const sortedPages = [...pagesToExtract].sort((a, b) => a - b);

        const copiedPages = await newPdf.copyPages(sourcePdf, sortedPages);
        copiedPages.forEach((page) => {
            newPdf.addPage(page);
        });

        const pdfBytes = await newPdf.save();
        return {
            success: true,
            data: pdfBytes,
            pageCount: newPdf.getPageCount(),
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to extract pages",
        };
    }
}

/**
 * Get page count of a PDF file
 */
export async function getPageCount(pdfFile: File): Promise<number> {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    return pdfDoc.getPageCount();
}
