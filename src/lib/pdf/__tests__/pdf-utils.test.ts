import { describe, it, expect } from "vitest";
import { PDFDocument } from "@cantoo/pdf-lib";
import { mergePDFs } from "@/lib/pdf/merge";
import { compressPDF } from "@/lib/pdf/compress";
import { splitPDF } from "@/lib/pdf/split";
import { rotatePDF } from "@/lib/pdf/rotate";
import { removePages, extractPages, organizePDF } from "@/lib/pdf/organize";
import { readMetadata, updateMetadata } from "@/lib/pdf/metadata";

// Helper: create a test PDF with N pages
async function createTestPDF(pageCount: number = 1, name: string = "test.pdf"): Promise<File> {
    const pdf = await PDFDocument.create();
    for (let i = 0; i < pageCount; i++) {
        pdf.addPage([612, 792]); // Letter size
    }
    const bytes = await pdf.save();
    return new File([new Uint8Array(bytes)], name, { type: "application/pdf" });
}

// Helper: create a PDF with metadata
async function createTestPDFWithMetadata(): Promise<File> {
    const pdf = await PDFDocument.create();
    pdf.addPage([612, 792]);
    pdf.setTitle("Test Title");
    pdf.setAuthor("Test Author");
    pdf.setSubject("Test Subject");
    pdf.setKeywords(["keyword1", "keyword2"]);
    pdf.setCreator("Test Creator");
    pdf.setProducer("Test Producer");
    const bytes = await pdf.save();
    return new File([new Uint8Array(bytes)], "metadata-test.pdf", { type: "application/pdf" });
}

// ─── Merge Tests ─────────────────────────────────────────────

describe("mergePDFs", () => {
    it("merges 2 PDFs successfully", async () => {
        const file1 = await createTestPDF(2, "a.pdf");
        const file2 = await createTestPDF(3, "b.pdf");

        const result = await mergePDFs([file1, file2]);

        expect(result.success).toBe(true);
        expect(result.data).toBeInstanceOf(Uint8Array);
        expect(result.pageCount).toBe(5);
    });

    it("rejects fewer than 2 files", async () => {
        const file = await createTestPDF(1);
        const result = await mergePDFs([file]);

        expect(result.success).toBe(false);
        expect(result.error).toContain("At least 2");
    });

    it("merges 3 PDFs with correct total page count", async () => {
        const files = await Promise.all([
            createTestPDF(1, "a.pdf"),
            createTestPDF(4, "b.pdf"),
            createTestPDF(2, "c.pdf"),
        ]);

        const result = await mergePDFs(files);

        expect(result.success).toBe(true);
        expect(result.pageCount).toBe(7);
    });

    it("produces a valid PDF", async () => {
        const files = await Promise.all([
            createTestPDF(1, "a.pdf"),
            createTestPDF(1, "b.pdf"),
        ]);

        const result = await mergePDFs(files);
        expect(result.success).toBe(true);

        // Verify the output is a loadable PDF
        const pdf = await PDFDocument.load(result.data!);
        expect(pdf.getPageCount()).toBe(2);
    });
});

// ─── Compress Tests ──────────────────────────────────────────

describe("compressPDF", () => {
    it("compresses a PDF successfully", async () => {
        const file = await createTestPDF(3);
        const result = await compressPDF(file);

        expect(result.success).toBe(true);
        expect(result.data).toBeInstanceOf(Uint8Array);
        expect(result.originalSize).toBe(file.size);
        expect(result.compressedSize).toBeGreaterThan(0);
    });

    it("returns valid originalSize and compressedSize", async () => {
        const file = await createTestPDF(5);
        const result = await compressPDF(file);

        expect(result.success).toBe(true);
        expect(typeof result.originalSize).toBe("number");
        expect(typeof result.compressedSize).toBe("number");
    });

    it("produces a valid PDF", async () => {
        const file = await createTestPDF(2);
        const result = await compressPDF(file);

        expect(result.success).toBe(true);
        const pdf = await PDFDocument.load(result.data!);
        expect(pdf.getPageCount()).toBe(2);
    });
});

// ─── Split Tests ─────────────────────────────────────────────

describe("splitPDF", () => {
    it("splits all pages into individual files", async () => {
        const file = await createTestPDF(4);
        const result = await splitPDF(file, { mode: "all" });

        expect(result.success).toBe(true);
        expect(result.fileCount).toBe(4);
        expect(result.data).toBeInstanceOf(Blob);
    });

    it("splits by range", async () => {
        const file = await createTestPDF(10);
        const result = await splitPDF(file, { mode: "range", ranges: "1-5, 6-10" });

        expect(result.success).toBe(true);
        expect(result.fileCount).toBe(2);
    });

    it("splits every N pages", async () => {
        const file = await createTestPDF(9);
        const result = await splitPDF(file, { mode: "every", everyN: 3 });

        expect(result.success).toBe(true);
        expect(result.fileCount).toBe(3);
    });

    it("splits specific pages", async () => {
        const file = await createTestPDF(5);
        const result = await splitPDF(file, { mode: "pages", pages: [1, 3, 5] });

        expect(result.success).toBe(true);
        expect(result.fileCount).toBe(3);
    });

    it("errors on missing ranges", async () => {
        const file = await createTestPDF(5);
        const result = await splitPDF(file, { mode: "range" });

        expect(result.success).toBe(false);
        expect(result.error).toContain("ranges");
    });

    it("errors on empty pages selection", async () => {
        const file = await createTestPDF(5);
        const result = await splitPDF(file, { mode: "pages", pages: [] });

        expect(result.success).toBe(false);
        expect(result.error).toContain("pages");
    });

    it("errors on invalid everyN", async () => {
        const file = await createTestPDF(5);
        const result = await splitPDF(file, { mode: "every", everyN: 0 });

        expect(result.success).toBe(false);
    });
});

// ─── Rotate Tests ────────────────────────────────────────────

describe("rotatePDF", () => {
    it("rotates all pages uniformly", async () => {
        const file = await createTestPDF(3);
        const result = await rotatePDF(file, 90);

        expect(result.success).toBe(true);
        expect(result.data).toBeInstanceOf(Uint8Array);

        const pdf = await PDFDocument.load(result.data!);
        const pages = pdf.getPages();
        pages.forEach((page) => {
            expect(page.getRotation().angle).toBe(90);
        });
    });

    it("rotates specific pages with a Map", async () => {
        const file = await createTestPDF(3);
        const rotations = new Map<number, 0 | 90 | 180 | 270>();
        rotations.set(0, 90);
        rotations.set(2, 180);

        const result = await rotatePDF(file, rotations);

        expect(result.success).toBe(true);
        const pdf = await PDFDocument.load(result.data!);
        const pages = pdf.getPages();
        expect(pages[0].getRotation().angle).toBe(90);
        expect(pages[1].getRotation().angle).toBe(0); // untouched
        expect(pages[2].getRotation().angle).toBe(180);
    });
});

// ─── Organize Tests ──────────────────────────────────────────

describe("removePages", () => {
    it("removes specified pages", async () => {
        const file = await createTestPDF(5);
        const result = await removePages(file, [0, 2, 4]);

        expect(result.success).toBe(true);
        expect(result.pageCount).toBe(2);
    });

    it("rejects removing all pages", async () => {
        const file = await createTestPDF(2);
        const result = await removePages(file, [0, 1]);

        expect(result.success).toBe(false);
        expect(result.error).toContain("Cannot remove all pages");
    });

    it("rejects invalid page indices", async () => {
        const file = await createTestPDF(3);
        const result = await removePages(file, [5]);

        expect(result.success).toBe(false);
        expect(result.error).toContain("Invalid page indices");
    });
});

describe("extractPages", () => {
    it("extracts specified pages", async () => {
        const file = await createTestPDF(5);
        const result = await extractPages(file, [0, 2, 4]);

        expect(result.success).toBe(true);
        expect(result.pageCount).toBe(3);
    });

    it("rejects empty selection", async () => {
        const file = await createTestPDF(3);
        const result = await extractPages(file, []);

        expect(result.success).toBe(false);
        expect(result.error).toContain("No pages selected");
    });

    it("rejects invalid page indices", async () => {
        const file = await createTestPDF(3);
        const result = await extractPages(file, [10]);

        expect(result.success).toBe(false);
        expect(result.error).toContain("Invalid page indices");
    });

    it("produces a valid PDF", async () => {
        const file = await createTestPDF(5);
        const result = await extractPages(file, [1, 3]);

        expect(result.success).toBe(true);
        const pdf = await PDFDocument.load(result.data!);
        expect(pdf.getPageCount()).toBe(2);
    });
});

describe("organizePDF", () => {
    it("reorders pages", async () => {
        const file = await createTestPDF(3);
        const result = await organizePDF(file, [
            { originalIndex: 2, rotation: 0 },
            { originalIndex: 0, rotation: 0 },
            { originalIndex: 1, rotation: 0 },
        ]);

        expect(result.success).toBe(true);
        expect(result.pageCount).toBe(3);
    });

    it("applies rotation during organize", async () => {
        const file = await createTestPDF(2);
        const result = await organizePDF(file, [
            { originalIndex: 0, rotation: 90 },
            { originalIndex: 1, rotation: 180 },
        ]);

        expect(result.success).toBe(true);
        const pdf = await PDFDocument.load(result.data!);
        const pages = pdf.getPages();
        expect(pages[0].getRotation().angle).toBe(90);
        expect(pages[1].getRotation().angle).toBe(180);
    });
});

// ─── Metadata Tests ──────────────────────────────────────────

describe("readMetadata", () => {
    it("reads metadata from a PDF", async () => {
        const file = await createTestPDFWithMetadata();
        const result = await readMetadata(file);

        expect(result.success).toBe(true);
        expect(result.metadata?.title).toBe("Test Title");
        expect(result.metadata?.author).toBe("Test Author");
        expect(result.metadata?.subject).toBe("Test Subject");
        expect(result.metadata?.creator).toBe("Test Creator");
        // Producer is overwritten by pdf-lib on save, so just check it's a non-empty string
        expect(result.metadata?.producer).toBeTruthy();
    });

    it("returns empty strings for missing metadata", async () => {
        const file = await createTestPDF(1);
        const result = await readMetadata(file);

        expect(result.success).toBe(true);
        expect(result.metadata?.title).toBe("");
        expect(result.metadata?.author).toBe("");
    });
});

describe("updateMetadata", () => {
    it("updates metadata fields", async () => {
        const file = await createTestPDF(1);
        const result = await updateMetadata(file, {
            title: "New Title",
            author: "New Author",
        });

        expect(result.success).toBe(true);
        expect(result.data).toBeInstanceOf(Uint8Array);

        // Verify by reloading
        const pdf = await PDFDocument.load(result.data!);
        expect(pdf.getTitle()).toBe("New Title");
        expect(pdf.getAuthor()).toBe("New Author");
    });

    it("sets modification date", async () => {
        const file = await createTestPDF(1);
        const before = new Date();
        const result = await updateMetadata(file, { title: "Updated" });

        expect(result.success).toBe(true);
        const pdf = await PDFDocument.load(result.data!);
        const modDate = pdf.getModificationDate();
        expect(modDate).toBeDefined();
        expect(modDate!.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
    });
});
