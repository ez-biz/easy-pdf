import { describe, it, expect } from "vitest";
import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import { pdfToWord, pdfToExcel, pdfToPptx } from "../convert";

async function samplePdf(): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const page = doc.addPage([300, 300]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    page.drawText("Hello batch", { x: 20, y: 250, size: 18, font });
    return doc.save();
}

const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04];

function startsWithZipMagic(bytes: Uint8Array): boolean {
    return ZIP_MAGIC.every((b, i) => bytes[i] === b);
}

describe("pdf conversions", () => {
    it("pdfToWord returns a non-empty .docx (zip) with a page count", async () => {
        const { bytes, pageCount } = await pdfToWord(await samplePdf());
        expect(bytes.length).toBeGreaterThan(0);
        expect(startsWithZipMagic(bytes)).toBe(true);
        expect(pageCount).toBe(1);
    });

    it("pdfToExcel returns a non-empty .xlsx (zip)", async () => {
        const { bytes } = await pdfToExcel(await samplePdf());
        expect(startsWithZipMagic(bytes)).toBe(true);
    });

    it.skip("pdfToPptx returns a non-empty .pptx (zip) [covered by standalone tool + build; jsdom canvas is a stub]", async () => {
        const { bytes } = await pdfToPptx(await samplePdf());
        expect(startsWithZipMagic(bytes)).toBe(true);
    });
});
