import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";

export type WatermarkPosition =
    | "center"
    | "diagonal"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";

export interface TextWatermarkOptions {
    text: string;
    fontSize?: number;
    opacity?: number;
    color?: { r: number; g: number; b: number };
    position?: WatermarkPosition;
    rotation?: number;
}

export interface ImageWatermarkOptions {
    imageData: ArrayBuffer;
    imageType: "png" | "jpg";
    scale?: number;
    opacity?: number;
    position?: WatermarkPosition;
}

export interface WatermarkResult {
    success: boolean;
    data?: Uint8Array;
    error?: string;
}

export async function addTextWatermark(
    pdfFile: File,
    options: TextWatermarkOptions
): Promise<WatermarkResult> {
    try {
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();

        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontSize = options.fontSize || 48;
        const opacity = options.opacity || 0.3;
        const color = options.color || { r: 0.5, g: 0.5, b: 0.5 };
        const position = options.position || "diagonal";
        const rotation = options.rotation ?? (position === "diagonal" ? 45 : 0);

        for (const page of pages) {
            const { width, height } = page.getSize();
            const textWidth = font.widthOfTextAtSize(options.text, fontSize);
            const textHeight = fontSize;

            let x: number, y: number;

            switch (position) {
                case "center":
                    x = (width - textWidth) / 2;
                    y = (height - textHeight) / 2;
                    break;
                case "diagonal":
                    x = (width - textWidth) / 2;
                    y = (height - textHeight) / 2;
                    break;
                case "top-left":
                    x = 50;
                    y = height - 50 - textHeight;
                    break;
                case "top-right":
                    x = width - textWidth - 50;
                    y = height - 50 - textHeight;
                    break;
                case "bottom-left":
                    x = 50;
                    y = 50;
                    break;
                case "bottom-right":
                    x = width - textWidth - 50;
                    y = 50;
                    break;
                default:
                    x = (width - textWidth) / 2;
                    y = (height - textHeight) / 2;
            }

            page.drawText(options.text, {
                x,
                y,
                size: fontSize,
                font,
                color: rgb(color.r, color.g, color.b),
                opacity,
                rotate: degrees(rotation),
            });
        }

        const pdfBytes = await pdfDoc.save();
        return { success: true, data: pdfBytes };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to add watermark",
        };
    }
}

export async function addImageWatermark(
    pdfFile: File,
    options: ImageWatermarkOptions
): Promise<WatermarkResult> {
    try {
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();

        // Embed image
        let image;
        if (options.imageType === "png") {
            image = await pdfDoc.embedPng(options.imageData);
        } else {
            image = await pdfDoc.embedJpg(options.imageData);
        }

        const scale = options.scale || 0.5;
        const opacity = options.opacity || 0.3;
        const position = options.position || "center";

        const imgWidth = image.width * scale;
        const imgHeight = image.height * scale;

        for (const page of pages) {
            const { width, height } = page.getSize();

            let x: number, y: number;

            switch (position) {
                case "center":
                case "diagonal":
                    x = (width - imgWidth) / 2;
                    y = (height - imgHeight) / 2;
                    break;
                case "top-left":
                    x = 50;
                    y = height - imgHeight - 50;
                    break;
                case "top-right":
                    x = width - imgWidth - 50;
                    y = height - imgHeight - 50;
                    break;
                case "bottom-left":
                    x = 50;
                    y = 50;
                    break;
                case "bottom-right":
                    x = width - imgWidth - 50;
                    y = 50;
                    break;
                default:
                    x = (width - imgWidth) / 2;
                    y = (height - imgHeight) / 2;
            }

            page.drawImage(image, {
                x,
                y,
                width: imgWidth,
                height: imgHeight,
                opacity,
            });
        }

        const pdfBytes = await pdfDoc.save();
        return { success: true, data: pdfBytes };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to add image watermark",
        };
    }
}
