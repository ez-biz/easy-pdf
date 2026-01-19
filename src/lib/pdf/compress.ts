import { PDFDocument } from "pdf-lib";
import { readFileAsArrayBuffer } from "@/lib/utils";

export interface CompressResult {
    success: boolean;
    data?: Uint8Array;
    originalSize?: number;
    compressedSize?: number;
    error?: string;
}

export type CompressionLevel = "extreme" | "recommended" | "less";

// Note: True PDF compression requires image resampling which is complex in browser
// This implementation focuses on removing unused objects and optimizing structure
export async function compressPDF(
    file: File
    // level param removed as it was unused (quality handled internally)
): Promise<CompressResult> {
    try {
        const originalSize = file.size;
        const arrayBuffer = await readFileAsArrayBuffer(file);

        // Load and create a new PDF to strip unused objects
        const pdf = await PDFDocument.load(arrayBuffer, {
            ignoreEncryption: true,
        });

        // Create a new document and copy pages (this removes unused objects)
        const newPdf = await PDFDocument.create();
        const pages = await newPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((page) => newPdf.addPage(page));

        // Copy metadata
        newPdf.setTitle(pdf.getTitle() || "");
        newPdf.setAuthor(pdf.getAuthor() || "");
        newPdf.setSubject(pdf.getSubject() || "");
        newPdf.setCreator("EasyPDF");
        newPdf.setProducer("EasyPDF - PDF Compression Tool");

        // Save with object streams for better compression
        const compressedBytes = await newPdf.save({
            useObjectStreams: true,
            addDefaultPage: false,
        });

        return {
            success: true,
            data: compressedBytes,
            originalSize,
            compressedSize: compressedBytes.length,
        };
    } catch (error) {
        console.error("Error compressing PDF:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to compress PDF",
        };
    }
}
