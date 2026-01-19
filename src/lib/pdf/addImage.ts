import { PDFDocument, PDFImage, degrees } from "pdf-lib";

export interface ImageOverlay {
    id: string;
    file: File;
    x: number; // X position (0-100%)
    y: number; // Y position (0-100%)
    width: number; // Width (0-100%)
    height: number; // Height (auto-calculated usually, but strictly passed as %)
    page: number; // Page number (0-indexed)
    rotation: number;
}


/**
 * Add image overlays to a PDF file
 */
export async function addImagesToPDF(
    pdfFile: File,
    images: ImageOverlay[]
): Promise<{
    success: boolean;
    data?: Uint8Array;
    error?: string;
}> {
    try {
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();

        // Group images by page
        const imagesByPage = new Map<number, ImageOverlay[]>();
        images.forEach((img) => {
            if (!imagesByPage.has(img.page)) {
                imagesByPage.set(img.page, []);
            }
            imagesByPage.get(img.page)!.push(img);
        });

        // Cache for embedded images to avoid re-embedding same file multiple times?
        // For MVP, simplistic embedding is fine, but if user duplicates image, we might embed twice.
        // We'll rely on unique files for now.

        for (const [pageIndex, overlays] of imagesByPage) {
            if (pageIndex >= pages.length) continue;

            const page = pages[pageIndex];
            const { width: pageWidth, height: pageHeight } = page.getSize();

            // Get page origin for correct placement (CropBox/MediaBox)
            const cropBox = page.getCropBox() ?? page.getMediaBox();
            const pageOriginX = cropBox?.x ?? 0;
            const pageOriginY = cropBox?.y ?? 0;

            for (const overlay of overlays) {
                // Read image file
                const imageBuffer = await overlay.file.arrayBuffer();
                let pdfImage: PDFImage;

                // Embed based on type
                if (overlay.file.type === "image/png") {
                    pdfImage = await pdfDoc.embedPng(imageBuffer);
                } else if (overlay.file.type === "image/jpeg" || overlay.file.type === "image/jpg") {
                    pdfImage = await pdfDoc.embedJpg(imageBuffer);
                } else {
                    // Start basic heuristic or fail
                    try {
                        pdfImage = await pdfDoc.embedPng(imageBuffer);
                    } catch {
                        try {
                            pdfImage = await pdfDoc.embedJpg(imageBuffer);
                        } catch {
                            console.warn(`Unsupported image type for file: ${overlay.file.name}`);
                            continue;
                        }
                    }
                }

                // Calculate absolute position
                // x, y, width, height are percentages of the page dimensions
                const imgX = pageOriginX + (overlay.x / 100) * pageWidth;
                const imgW = (overlay.width / 100) * pageWidth;
                const imgH = (overlay.height / 100) * pageHeight;

                // PDF Y: Bottom-up. UI Top is overlay.y %.
                // Unrotated Bottom-Left Y: 
                const y = pageOriginY + pageHeight - (overlay.y / 100) * pageHeight - imgH;

                // ROTATION CENTER LOGIC
                // Calculate Center of the bounding box (UI placement center)
                const centerX = imgX + imgW / 2;
                const centerY = y + imgH / 2;

                // PDF-Lib rotation angle (Degrees)
                // UI angle is Clockwise from 12 o'clock, but PDF is CCW.
                // We use -rotation to flip the direction.
                const pdfAngle = -overlay.rotation;
                const angleRad = (pdfAngle * Math.PI) / 180;

                // Vector from Corner (bottom-left) to Center (relative to corner, unrotated)
                // localCenter = (w/2, h/2)
                // rotatedVector = Rotate(localCenter, angle)
                // v_x = (w/2)cos - (h/2)sin
                // v_y = (w/2)sin + (h/2)cos

                const halfW = imgW / 2;
                const halfH = imgH / 2;

                const vecX = halfW * Math.cos(angleRad) - halfH * Math.sin(angleRad);
                const vecY = halfW * Math.sin(angleRad) + halfH * Math.cos(angleRad);

                // Calculate Pivot Point (The x,y passed to drawImage)
                // drawPoint + rotatedVector = expectedCenter
                const drawX = centerX - vecX;
                const drawY = centerY - vecY;

                page.drawImage(pdfImage, {
                    x: drawX,
                    y: drawY,
                    width: imgW,
                    height: imgH,
                    rotate: degrees(pdfAngle),
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
            error: err instanceof Error ? err.message : "Failed to add images to PDF",
        };
    }
}
