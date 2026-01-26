import { PDFDocument } from "@cantoo/pdf-lib";
import { readFileAsArrayBuffer, readFileAsDataURL } from "@/lib/utils";
import { PAGE_SIZES } from "@/lib/constants";

export interface FromImageResult {
    success: boolean;
    data?: Uint8Array;
    pageCount?: number;
    error?: string;
}

export type PageSize = "a4" | "letter" | "original";
export type Orientation = "portrait" | "landscape" | "auto";
export type Margin = "none" | "small" | "medium" | "large";

const MARGINS: Record<Margin, number> = {
    none: 0,
    small: 20,
    medium: 40,
    large: 60,
};

export async function imagesToPDF(
    images: File[],
    pageSize: PageSize = "a4",
    orientation: Orientation = "auto",
    margin: Margin = "small",
    fitToPage: boolean = true
): Promise<FromImageResult> {
    try {
        if (images.length === 0) {
            return { success: false, error: "No images provided" };
        }

        const pdf = await PDFDocument.create();
        const marginSize = MARGINS[margin];

        for (const imageFile of images) {
            const imageData = await readFileAsArrayBuffer(imageFile);

            let image;
            if (imageFile.type === "image/jpeg" || imageFile.type === "image/jpg") {
                image = await pdf.embedJpg(new Uint8Array(imageData));
            } else if (imageFile.type === "image/png") {
                image = await pdf.embedPng(new Uint8Array(imageData));
            } else {
                // Convert other formats to PNG via canvas
                const dataUrl = await readFileAsDataURL(imageFile);
                const img = await loadImage(dataUrl);
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0);

                const pngDataUrl = canvas.toDataURL("image/png");
                const pngData = await fetch(pngDataUrl).then((r) => r.arrayBuffer());
                image = await pdf.embedPng(new Uint8Array(pngData));
            }

            const imgWidth = image.width;
            const imgHeight = image.height;
            const isLandscape = imgWidth > imgHeight;

            let pageWidth: number;
            let pageHeight: number;

            if (pageSize === "original") {
                pageWidth = imgWidth + marginSize * 2;
                pageHeight = imgHeight + marginSize * 2;
            } else {
                const size = PAGE_SIZES[pageSize];
                if (orientation === "auto") {
                    pageWidth = isLandscape ? size.height : size.width;
                    pageHeight = isLandscape ? size.width : size.height;
                } else if (orientation === "landscape") {
                    pageWidth = size.height;
                    pageHeight = size.width;
                } else {
                    pageWidth = size.width;
                    pageHeight = size.height;
                }
            }

            const page = pdf.addPage([pageWidth, pageHeight]);

            const availableWidth = pageWidth - marginSize * 2;
            const availableHeight = pageHeight - marginSize * 2;

            let drawWidth: number;
            let drawHeight: number;

            if (fitToPage) {
                const widthRatio = availableWidth / imgWidth;
                const heightRatio = availableHeight / imgHeight;
                const ratio = Math.min(widthRatio, heightRatio);
                drawWidth = imgWidth * ratio;
                drawHeight = imgHeight * ratio;
            } else {
                drawWidth = Math.min(imgWidth, availableWidth);
                drawHeight = Math.min(imgHeight, availableHeight);
            }

            const x = (pageWidth - drawWidth) / 2;
            const y = (pageHeight - drawHeight) / 2;

            page.drawImage(image, {
                x,
                y,
                width: drawWidth,
                height: drawHeight,
            });
        }

        const pdfBytes = await pdf.save();

        return {
            success: true,
            data: pdfBytes,
            pageCount: images.length,
        };
    } catch (error) {
        console.error("Error converting images to PDF:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to convert images to PDF",
        };
    }
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}
