import { PDFDocument, degrees } from "pdf-lib";
import { readFileAsArrayBuffer } from "@/lib/utils";

export interface RotateResult {
    success: boolean;
    data?: Uint8Array;
    error?: string;
}

export type RotationAngle = 0 | 90 | 180 | 270;

export async function rotatePDF(
    file: File,
    rotations: Map<number, RotationAngle> | RotationAngle
): Promise<RotateResult> {
    try {
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const pdf = await PDFDocument.load(arrayBuffer);
        const pages = pdf.getPages();

        if (typeof rotations === "number") {
            // Apply same rotation to all pages
            pages.forEach((page) => {
                const currentRotation = page.getRotation().angle;
                page.setRotation(degrees(currentRotation + rotations));
            });
        } else {
            // Apply individual rotations
            rotations.forEach((angle, pageIndex) => {
                if (pageIndex < pages.length) {
                    const page = pages[pageIndex];
                    const currentRotation = page.getRotation().angle;
                    page.setRotation(degrees(currentRotation + angle));
                }
            });
        }

        const rotatedPdfBytes = await pdf.save();

        return {
            success: true,
            data: rotatedPdfBytes,
        };
    } catch (error) {
        console.error("Error rotating PDF:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to rotate PDF",
        };
    }
}
