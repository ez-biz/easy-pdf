import * as pdfjs from "pdfjs-dist";
import { TextWatermarkOptions } from "./watermark";
import { PageNumberOptions, PageNumberFormat } from "./pageNumbers";

// Set worker source
if (typeof window !== "undefined") {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

/**
 * Renders a PDF page to a canvas element
 */
export async function renderPDFPageToCanvas(
    file: File,
    pageNumber: number = 1,
    scale: number = 1.5
): Promise<HTMLCanvasElement> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const context = canvas.getContext("2d");
    if (!context) {
        throw new Error("Could not get canvas context");
    }

    // White background
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
        canvasContext: context,
        viewport,
    }).promise;

    return canvas;
}

/**
 * Applies watermark overlay to a canvas
 */
export function applyWatermarkToCanvas(
    canvas: HTMLCanvasElement,
    options: TextWatermarkOptions
): void {
    const context = canvas.getContext("2d");
    if (!context) return;

    const { width, height } = canvas;
    const text = options.text || "";
    const fontSize = options.fontSize || 48;
    const opacity = options.opacity || 0.3;
    const color = options.color || { r: 0.5, g: 0.5, b: 0.5 };
    const position = options.position || "diagonal";
    const rotation = options.rotation ?? (position === "diagonal" ? 45 : 0);

    // Set font
    context.font = `${fontSize}px Helvetica`;
    context.globalAlpha = opacity;
    context.fillStyle = `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})`;

    // Measure text
    const textMetrics = context.measureText(text);
    const textWidth = textMetrics.width;
    const textHeight = fontSize;

    // Calculate position
    let x: number, y: number;

    switch (position) {
        case "center":
            x = (width - textWidth) / 2;
            y = height / 2;
            break;
        case "diagonal":
            x = width / 2;
            y = height / 2;
            break;
        case "top-left":
            x = 50;
            y = 50 + textHeight;
            break;
        case "top-right":
            x = width - textWidth - 50;
            y = 50 + textHeight;
            break;
        case "bottom-left":
            x = 50;
            y = height - 50;
            break;
        case "bottom-right":
            x = width - textWidth - 50;
            y = height - 50;
            break;
        default:
            x = width / 2;
            y = height / 2;
    }

    // Apply rotation if needed
    if (rotation !== 0) {
        context.save();
        context.translate(x, y);
        context.rotate((rotation * Math.PI) / 180);
        context.fillText(text, -textWidth / 2, 0);
        context.restore();
    } else {
        context.fillText(text, x, y);
    }

    // Reset alpha
    context.globalAlpha = 1;
}

/**
 * Converts canvas to data URL
 */
export function canvasToDataURL(canvas: HTMLCanvasElement): string {
    return canvas.toDataURL("image/jpeg", 0.85);
}

/**
 * Debounce utility function
 */
export function debounce<T extends (...args: never[]) => unknown>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            timeout = null;
            func(...args);
        };

        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(later, wait);
    };
}

/**
 * Generate watermark preview for a PDF file
 */
export async function generateWatermarkPreview(
    file: File,
    options: TextWatermarkOptions
): Promise<string> {
    try {
        // Render PDF page to canvas
        const canvas = await renderPDFPageToCanvas(file, 1, 1.5);

        // Apply watermark overlay
        applyWatermarkToCanvas(canvas, options);

        // Convert to data URL
        return canvasToDataURL(canvas);
    } catch (error) {
        console.error("Error generating preview:", error);
        throw error;
    }
}

/**
 * Helper function to format page numbers
 */
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

/**
 * Applies page number overlay to a canvas
 */
export function applyPageNumberToCanvas(
    canvas: HTMLCanvasElement,
    pageNumber: number,
    totalPages: number,
    options: PageNumberOptions
): void {
    const context = canvas.getContext("2d");
    if (!context) return;

    const { width, height } = canvas;
    const position = options.position || "bottom-center";
    const format = options.format || "number";
    const fontSize = options.fontSize || 12;
    const startNumber = options.startNumber || 1;
    const margin = (options.margin || 30) * 1.5; // Scale margin for preview
    const color = options.color || { r: 0, g: 0, b: 0 };

    const pageNum = startNumber + pageNumber - 1;
    const text = formatPageNumber(pageNum, totalPages + startNumber - 1, format);

    // Set font
    context.font = `${fontSize * 1.5}px Helvetica`; // Scale font for preview
    context.fillStyle = `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})`;

    // Measure text
    const textMetrics = context.measureText(text);
    const textWidth = textMetrics.width;

    // Calculate position
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
        y = margin + fontSize * 1.5;
    } else {
        // bottom
        y = height - margin;
    }

    context.fillText(text, x, y);
}

/**
 * Generate page number preview for a PDF file
 */
export async function generatePageNumberPreview(
    file: File,
    options: PageNumberOptions
): Promise<string> {
    try {
        // Get total pages
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdf.numPages;

        // Render first page to canvas
        const canvas = await renderPDFPageToCanvas(file, 1, 1.5);

        // Apply page number overlay
        applyPageNumberToCanvas(canvas, 1, totalPages, options);

        // Convert to data URL
        return canvasToDataURL(canvas);
    } catch (error) {
        console.error("Error generating page number preview:", error);
        throw error;
    }
}

