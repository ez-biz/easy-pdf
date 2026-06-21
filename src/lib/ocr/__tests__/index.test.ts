import { describe, it, expect } from "vitest";
import { getEngine, joinPages } from "@/lib/ocr";
import { paddleEngine } from "@/lib/ocr/paddleEngine";
import { tesseractEngine } from "@/lib/ocr/tesseractEngine";

describe("getEngine", () => {
    it("returns the matching engine singleton", () => {
        expect(getEngine("paddle")).toBe(paddleEngine);
        expect(getEngine("tesseract")).toBe(tesseractEngine);
    });
});

describe("joinPages", () => {
    it("joins pages with a page-break separator", () => {
        expect(joinPages(["a", "b"])).toBe("a\n\n--- Page Break ---\n\nb");
    });
    it("returns a single page unchanged", () => {
        expect(joinPages(["only"])).toBe("only");
    });
    it("returns empty string for no pages", () => {
        expect(joinPages([])).toBe("");
    });
});
