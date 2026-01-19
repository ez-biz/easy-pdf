import * as pdfjs from "pdfjs-dist";
import JSZip from "jszip";
import { readFileAsArrayBuffer } from "@/lib/utils";

// Set worker source
if (typeof window !== "undefined") {
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

export interface ToImageResult {
    success: boolean;
    data?: Blob;
    imageCount?: number;
    error?: string;
}

export type ImageFormat = "jpg" | "png" | "webp";
export type DPI = 72 | 150 | 300;

export async function pdfToImages(
    file: File,
    format: ImageFormat = "png",
    dpi: DPI = 150,
    pages?: number[]
): Promise<ToImageResult> {
    try {
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdf.numPages;

        const pagesToConvert = pages || Array.from({ length: totalPages }, (_, i) => i + 1);
        const scale = dpi / 72;

        const zip = new JSZip();
        const baseName = file.name.replace(".pdf", "");

        for (const pageNum of pagesToConvert) {
            if (pageNum < 1 || pageNum > totalPages) continue;

            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement("canvas");
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            const context = canvas.getContext("2d");
            if (!context) continue;

            // White background for JPG
            if (format === "jpg") {
                context.fillStyle = "#ffffff";
                context.fillRect(0, 0, canvas.width, canvas.height);
            }

            await page.render({
                canvasContext: context,
                viewport,
            }).promise;

            const mimeType =
                format === "jpg"
                    ? "image/jpeg"
                    : format === "png"
                        ? "image/png"
                        : "image/webp";

            const quality = format === "png" ? undefined : 0.92;

            const blob = await new Promise<Blob>((resolve) => {
                canvas.toBlob(
                    (blob) => resolve(blob!),
                    mimeType,
                    quality
                );
            });

            const extension = format === "jpg" ? "jpg" : format;
            zip.file(`${baseName}_page_${pageNum}.${extension}`, blob);
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });

        return {
            success: true,
            data: zipBlob,
            imageCount: pagesToConvert.length,
        };
    } catch (error) {
        console.error("Error converting PDF to images:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to convert PDF to images",
        };
    }
}

export async function getPDFThumbnails(
    file: File,
    maxPages?: number
): Promise<string[]> {
    try {
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const totalPages = maxPages
            ? Math.min(pdf.numPages, maxPages)
            : pdf.numPages;

        const thumbnails: string[] = [];
        const scale = 0.3; // Small scale for thumbnails

        for (let i = 1; i <= totalPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement("canvas");
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            const context = canvas.getContext("2d");
            if (!context) continue;

            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, canvas.width, canvas.height);

            await page.render({
                canvasContext: context,
                viewport,
            }).promise;

            thumbnails.push(canvas.toDataURL("image/jpeg", 0.7));
        }

        return thumbnails;
    } catch (error) {
        console.error("Error generating thumbnails:", error);
        return [];
    }
}
