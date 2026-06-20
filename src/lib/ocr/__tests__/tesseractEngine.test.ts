import { describe, it, expect, vi, beforeEach } from "vitest";

const recognizeMock = vi.fn();
vi.mock("tesseract.js", () => ({
    default: { recognize: (...args: unknown[]) => recognizeMock(...args) },
}));

import { tesseractEngine } from "@/lib/ocr/tesseractEngine";

describe("tesseractEngine", () => {
    beforeEach(() => recognizeMock.mockReset());

    it("normalizes confidence from 0..100 to 0..1", async () => {
        recognizeMock.mockResolvedValue({ data: { text: "hello world", confidence: 90 } });
        const canvas = document.createElement("canvas");
        const result = await tesseractEngine.recognize(canvas, "eng");
        expect(result.text).toBe("hello world");
        expect(result.confidence).toBeCloseTo(0.9);
        expect(recognizeMock).toHaveBeenCalledWith(canvas, "eng");
    });

    it("defaults missing fields safely", async () => {
        recognizeMock.mockResolvedValue({ data: {} });
        const result = await tesseractEngine.recognize(document.createElement("canvas"), "eng");
        expect(result.text).toBe("");
        expect(result.confidence).toBe(0);
    });
});
