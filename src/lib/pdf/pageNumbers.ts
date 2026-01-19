import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export type PageNumberPosition =
    | "bottom-left"
    | "bottom-center"
    | "bottom-right"
    | "top-left"
    | "top-center"
    | "top-right";

export type PageNumberFormat = "number" | "page-number" | "number-of-total";

export interface PageNumberOptions {
    position?: PageNumberPosition;
    format?: PageNumberFormat;
    fontSize?: number;
    startNumber?: number;
    margin?: number;
    color?: { r: number; g: number; b: number };
}

export interface PageNumberResult {
    success: boolean;
    data?: Uint8Array;
    error?: string;
}

function formatPageNumber(
    pageNum: number,
    totalPages: number,
    format: PageNumberFormat
): string {
    switch (format) {
        case "number":
            return `${pageNum}`;
        case "page-number":
            return `Page ${pageNum}`;
        case "number-of-total":
            return `${pageNum} of ${totalPages}`;
        default:
            return `${pageNum}`;
    }
}

export async function addPageNumbers(
    pdfFile: File,
    options: PageNumberOptions = {}
): Promise<PageNumberResult> {
    try {
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();

        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const position = options.position || "bottom-center";
        const format = options.format || "number";
        const fontSize = options.fontSize || 12;
        const startNumber = options.startNumber || 1;
        const margin = options.margin || 30;
        const color = options.color || { r: 0, g: 0, b: 0 };

        const totalPages = pages.length;

        pages.forEach((page, index) => {
            const pageNum = startNumber + index;
            const text = formatPageNumber(pageNum, totalPages + startNumber - 1, format);
            const textWidth = font.widthOfTextAtSize(text, fontSize);

            const { width, height } = page.getSize();

            let x: number, y: number;

            // Horizontal position
            if (position.includes("left")) {
                x = margin;
            } else if (position.includes("right")) {
                x = width - textWidth - margin;
            } else {
                // center
                x = (width - textWidth) / 2;
            }

            // Vertical position
            if (position.includes("top")) {
                y = height - margin;
            } else {
                // bottom
                y = margin;
            }

            page.drawText(text, {
                x,
                y,
                size: fontSize,
                font,
                color: rgb(color.r, color.g, color.b),
            });
        });

        const pdfBytes = await pdfDoc.save();
        return { success: true, data: pdfBytes };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to add page numbers",
        };
    }
}
