import { describe, it, expect, vi } from "vitest";
import {
    clampBox,
    groupBoxesByPage,
    pointerToFractionRect,
    boxToPixelRect,
    applyRedactions,
    type RenderDeps,
    type RedactionBox,
} from "@/lib/pdf/redact";
import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";

const box = (over: Partial<RedactionBox> = {}): RedactionBox => ({
    id: "b1", page: 0, x: 0.1, y: 0.1, w: 0.2, h: 0.2, ...over,
});

describe("clampBox", () => {
    it("clamps coordinates into the page and keeps positive size", () => {
        const c = clampBox(box({ x: -0.5, y: 1.2, w: 5, h: -1 }));
        expect(c.x).toBe(0);
        expect(c.y).toBeLessThanOrEqual(1);
        expect(c.w).toBeGreaterThan(0);
        expect(c.h).toBeGreaterThan(0);
        expect(c.x + c.w).toBeLessThanOrEqual(1.0000001);
    });
});

describe("groupBoxesByPage", () => {
    it("groups boxes by their page index", () => {
        const g = groupBoxesByPage([box({ id: "a", page: 0 }), box({ id: "b", page: 2 }), box({ id: "c", page: 0 })]);
        expect(g.get(0)?.map((b) => b.id)).toEqual(["a", "c"]);
        expect(g.get(2)?.map((b) => b.id)).toEqual(["b"]);
        expect(g.has(1)).toBe(false);
    });
});

describe("pointerToFractionRect", () => {
    it("normalizes a drag (any direction) into a top-left fraction rect", () => {
        const r = pointerToFractionRect(80, 60, 20, 10, 100, 100);
        expect(r.x).toBeCloseTo(0.2);
        expect(r.y).toBeCloseTo(0.1);
        expect(r.w).toBeCloseTo(0.6);
        expect(r.h).toBeCloseTo(0.5);
    });
});

describe("boxToPixelRect", () => {
    it("scales a fraction box to pixel coordinates", () => {
        const r = boxToPixelRect({ id: "x", page: 0, x: 0.25, y: 0.5, w: 0.5, h: 0.25 }, 1000, 800);
        expect(r).toEqual({ x: 250, y: 400, w: 500, h: 200 });
    });
});

// Minimal valid 1x1 PNG.
const PNG_1x1 = Uint8Array.from(
    atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="),
    (c) => c.charCodeAt(0)
);

async function makePdf(pageCount: number): Promise<File> {
    const doc = await PDFDocument.create();
    for (let i = 0; i < pageCount; i++) doc.addPage([612, 792]);
    const bytes = await doc.save();
    return new File([new Uint8Array(bytes)], "in.pdf", { type: "application/pdf" });
}

async function extractPageTexts(bytes: Uint8Array): Promise<string[]> {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const pdf = await pdfjs.getDocument({ data: bytes, useWorkerFetch: false, isEvalSupported: false }).promise;
    const texts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const tc = await page.getTextContent();
        texts.push(tc.items.map((it) => ("str" in it ? it.str : "")).join(""));
    }
    return texts;
}

describe("applyRedactions", () => {
    it("rasterizes only pages with boxes, copies the rest, preserves page count", async () => {
        const file = await makePdf(3);
        const boxes: RedactionBox[] = [
            { id: "a", page: 0, x: 0.1, y: 0.1, w: 0.3, h: 0.1 },
            { id: "b", page: 2, x: 0.2, y: 0.2, w: 0.2, h: 0.2 },
        ];
        const deps: RenderDeps = { renderPageToPng: vi.fn().mockResolvedValue(PNG_1x1) };

        const { blob, rasterizedPages } = await applyRedactions(file, boxes, {}, deps);

        expect(rasterizedPages).toEqual([0, 2]);
        expect(deps.renderPageToPng).toHaveBeenCalledTimes(2);
        const outDoc = await PDFDocument.load(new Uint8Array(await blob.arrayBuffer()));
        expect(outDoc.getPageCount()).toBe(3);
        expect(Math.round(outDoc.getPage(0).getWidth())).toBe(612);
    });

    it("returns an empty rasterized list when there are no boxes", async () => {
        const file = await makePdf(2);
        const deps: RenderDeps = { renderPageToPng: vi.fn() };
        const { rasterizedPages } = await applyRedactions(file, [], {}, deps);
        expect(rasterizedPages).toEqual([]);
        expect(deps.renderPageToPng).not.toHaveBeenCalled();
    });

    it("SECURITY: redacted page has no extractable text; untouched page keeps its text", async () => {
        const doc = await PDFDocument.create();
        const font = await doc.embedFont(StandardFonts.Helvetica);
        doc.addPage([400, 200]).drawText("SECRET-12345", { x: 20, y: 100, size: 24, font });
        doc.addPage([400, 200]).drawText("KEEP-99999", { x: 20, y: 100, size: 24, font });
        const bytes = await doc.save();
        const file = new File([new Uint8Array(bytes)], "secret.pdf", { type: "application/pdf" });

        // Stub renderer stands in for the real raster; the security property is
        // that the affected page becomes image-only (no text), not the pixels.
        const deps: RenderDeps = { renderPageToPng: vi.fn().mockResolvedValue(PNG_1x1) };
        const { blob } = await applyRedactions(file, [{ id: "a", page: 0, x: 0, y: 0, w: 1, h: 1 }], {}, deps);

        const texts = await extractPageTexts(new Uint8Array(await blob.arrayBuffer()));
        expect(texts[0]).not.toContain("SECRET-12345");
        expect(texts[0]).toBe(""); // page fully rasterized → zero text
        expect(texts[1]).toContain("KEEP-99999"); // untouched page preserved
    });
});
