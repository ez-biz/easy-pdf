import { describe, it, expect } from "vitest";
import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import { OPERATIONS, OPERATION_LIST } from "../operations";

async function samplePdf(pages = 3): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    for (let i = 0; i < pages; i++) {
        const p = doc.addPage([300, 400]);
        p.drawText(`Page ${i + 1}`, { x: 20, y: 360, size: 18, font });
    }
    return doc.save();
}

const isValidPdf = async (bytes: Uint8Array) => {
    const doc = await PDFDocument.load(bytes);
    return doc.getPageCount();
};

describe("operations registry", () => {
    it("exposes the 7 v1 operations in order", () => {
        expect(OPERATION_LIST.map((o) => o.id)).toEqual([
            "compress", "rotate", "watermark", "page-numbers", "metadata", "protect", "unlock",
        ]);
    });

    it("rotate produces a valid same-page-count PDF", async () => {
        const out = await OPERATIONS.rotate.run(await samplePdf(3), { angle: 90, scope: "all" });
        expect(await isValidPdf(out)).toBe(3);
    });

    it("page-numbers produces a valid PDF", async () => {
        const out = await OPERATIONS["page-numbers"].run(await samplePdf(2), {
            format: "number-of-total", position: "bottom-center", startNumber: 1,
        });
        expect(await isValidPdf(out)).toBe(2);
    });

    it("metadata sets the title", async () => {
        const out = await OPERATIONS.metadata.run(await samplePdf(1), {
            title: "Hello", author: "", subject: "", keywords: "",
        });
        const doc = await PDFDocument.load(out);
        expect(doc.getTitle()).toBe("Hello");
    });

    it("protect then unlock round-trips", async () => {
        const protectedBytes = await OPERATIONS.protect.run(await samplePdf(1), { password: "s3cret" });
        const unlocked = await OPERATIONS.unlock.run(protectedBytes, { password: "s3cret" });
        expect(await isValidPdf(unlocked)).toBe(1);
    });

    it("unlock with wrong password throws", async () => {
        const protectedBytes = await OPERATIONS.protect.run(await samplePdf(1), { password: "right" });
        await expect(OPERATIONS.unlock.run(protectedBytes, { password: "wrong" })).rejects.toThrow();
    });

    it("watermark produces a valid same-page-count PDF", async () => {
        const out = await OPERATIONS.watermark.run(await samplePdf(2), {
            text: "CONFIDENTIAL", opacity: 0.3, position: "diagonal",
        });
        expect(await isValidPdf(out)).toBe(2);
    });
});
