/**
 * Fitting a captured image onto a real paper-sized PDF page.
 *
 * Extracted from ScanToPdfClient. The bug this guards against: pages were
 * created with `addPage([image.width, image.height])`, so a 1920x1080 camera
 * capture became a ~26x15 inch page instead of a sheet of paper.
 */

/** A4 in PDF points. */
export const A4_SHORT = 595.28;
export const A4_LONG = 841.89;

export interface PageFit {
    pageWidth: number;
    pageHeight: number;
    drawWidth: number;
    drawHeight: number;
    x: number;
    y: number;
}

/**
 * Scale an image to fit an A4 sheet, centred, preserving aspect ratio.
 * Orientation follows the image so landscape captures get a landscape page.
 */
export function fitImageToPage(imageWidth: number, imageHeight: number): PageFit {
    const landscape = imageWidth > imageHeight;
    const pageWidth = landscape ? A4_LONG : A4_SHORT;
    const pageHeight = landscape ? A4_SHORT : A4_LONG;

    const scale = Math.min(pageWidth / imageWidth, pageHeight / imageHeight);
    const drawWidth = imageWidth * scale;
    const drawHeight = imageHeight * scale;

    return {
        pageWidth,
        pageHeight,
        drawWidth,
        drawHeight,
        x: (pageWidth - drawWidth) / 2,
        y: (pageHeight - drawHeight) / 2,
    };
}
