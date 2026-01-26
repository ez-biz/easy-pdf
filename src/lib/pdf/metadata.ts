import { PDFDocument } from "@cantoo/pdf-lib";

export interface PDFMetadata {
    title: string;
    author: string;
    subject: string;
    keywords: string;
    creator: string;
    producer: string;
    creationDate: Date | null;
    modificationDate: Date | null;
}

/**
 * Read metadata from a PDF file
 */
export async function readMetadata(file: File): Promise<{
    success: boolean;
    metadata?: PDFMetadata;
    error?: string;
}> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);

        const title = pdfDoc.getTitle() || "";
        const author = pdfDoc.getAuthor() || "";
        const subject = pdfDoc.getSubject() || "";
        // getKeywords() returns an array, convert to comma-separated string
        const keywordsArray = pdfDoc.getKeywords() || [];
        const keywords = Array.isArray(keywordsArray) ? keywordsArray.join(", ") : "";
        const creator = pdfDoc.getCreator() || "";
        const producer = pdfDoc.getProducer() || "";
        const creationDate = pdfDoc.getCreationDate() || null;
        const modificationDate = pdfDoc.getModificationDate() || null;

        return {
            success: true,
            metadata: {
                title,
                author,
                subject,
                keywords,
                creator,
                producer,
                creationDate,
                modificationDate,
            },
        };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : "Failed to read PDF metadata",
        };
    }
}

/**
 * Update metadata in a PDF file
 */
export async function updateMetadata(
    file: File,
    metadata: Partial<PDFMetadata>
): Promise<{
    success: boolean;
    data?: Uint8Array;
    error?: string;
}> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);

        // Update metadata fields
        if (metadata.title !== undefined) {
            pdfDoc.setTitle(metadata.title);
        }
        if (metadata.author !== undefined) {
            pdfDoc.setAuthor(metadata.author);
        }
        if (metadata.subject !== undefined) {
            pdfDoc.setSubject(metadata.subject);
        }
        if (metadata.keywords !== undefined) {
            // setKeywords expects an array, so split the string
            const keywordsArray = metadata.keywords
                .split(',')
                .map(k => k.trim())
                .filter(k => k.length > 0);
            pdfDoc.setKeywords(keywordsArray);
        }
        if (metadata.creator !== undefined) {
            pdfDoc.setCreator(metadata.creator);
        }
        if (metadata.producer !== undefined) {
            pdfDoc.setProducer(metadata.producer);
        }

        // Always update modification date
        pdfDoc.setModificationDate(new Date());

        const pdfBytes = await pdfDoc.save();

        return {
            success: true,
            data: pdfBytes,
        };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : "Failed to update PDF metadata",
        };
    }
}
