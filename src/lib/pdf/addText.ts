import { PDFDocument, rgb, StandardFonts, PDFFont } from "pdf-lib";

export interface TextBox {
    id: string;
    text: string;
    x: number; // X position (0-100%)
    y: number; // Y position (0-100%)
    page: number; // Page number (0-indexed)
    fontSize: number; // Font size in points
    fontFamily: "Helvetica" | "Times-Roman" | "Courier";
    color: string; // Hex color
    rotation: 0 | 90 | 180 | 270;
    align: "left" | "center" | "right";
}

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255,
        }
        : { r: 0, g: 0, b: 0 };
}

/**
 * Get StandardFont from font family name
 */
async function getFont(
    pdfDoc: PDFDocument,
    fontFamily: TextBox["fontFamily"]
): Promise<PDFFont> {
    switch (fontFamily) {
        case "Times-Roman":
            return pdfDoc.embedFont(StandardFonts.TimesRoman);
        case "Courier":
            return pdfDoc.embedFont(StandardFonts.Courier);
        case "Helvetica":
        default:
            return pdfDoc.embedFont(StandardFonts.Helvetica);
    }
}

/**
 * Add text overlays to a PDF file
 */
export async function addTextToPDF(
    file: File,
    textBoxes: TextBox[]
): Promise<{
    success: boolean;
    data?: Uint8Array;
    error?: string;
}> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();

        // Group text boxes by page for efficiency
        const textBoxesByPage = new Map<number, TextBox[]>();
        textBoxes.forEach((box) => {
            if (!textBoxesByPage.has(box.page)) {
                textBoxesByPage.set(box.page, []);
            }
            textBoxesByPage.get(box.page)!.push(box);
        });

        // Process each page that has text boxes
        for (const [pageIndex, boxes] of textBoxesByPage) {
            if (pageIndex >= pages.length) continue;

            const page = pages[pageIndex];
            const { width, height } = page.getSize();

            for (const box of boxes) {
                // Convert percentage coordinates to absolute
                const x = (box.x / 100) * width;
                // PDF coordinates are from bottom-left, UI is from top-left
                const y = height - (box.y / 100) * height;

                // Get font
                const font = await getFont(pdfDoc, box.fontFamily);

                // Parse color
                const color = hexToRgb(box.color);

                // Calculate text width for alignment
                const textWidth = font.widthOfTextAtSize(box.text, box.fontSize);
                let textX = x;

                if (box.align === "center") {
                    textX = x - textWidth / 2;
                } else if (box.align === "right") {
                    textX = x - textWidth;
                }

                // Draw text
                page.drawText(box.text, {
                    x: textX,
                    y: y,
                    size: box.fontSize,
                    font: font,
                    color: rgb(color.r, color.g, color.b),
                });
            }
        }

        const pdfBytes = await pdfDoc.save();

        return {
            success: true,
            data: pdfBytes,
        };
    } catch (err) {
        return {
            success: false,
            error:
                err instanceof Error ? err.message : "Failed to add text to PDF",
        };
    }
}

/**
 * Generate page previews as data URLs
 */
export async function generatePagePreviews(
    file: File
): Promise<{
    success: boolean;
    pageCount?: number;
    error?: string;
}> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();

        return {
            success: true,
            pageCount: pages.length,
        };
    } catch (err) {
        return {
            success: false,
            error:
                err instanceof Error
                    ? err.message
                    : "Failed to generate page previews",
        };
    }
}
