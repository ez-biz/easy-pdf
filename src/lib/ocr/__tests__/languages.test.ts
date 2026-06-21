import { describe, it, expect } from "vitest";
import {
    OCR_LANGUAGES,
    getLanguage,
    getTesseractCode,
    isSupportedBy,
} from "@/lib/ocr/languages";

describe("languages", () => {
    it("maps the Tesseract code and marks English as PaddleOCR-supported", () => {
        expect(getTesseractCode("eng")).toBe("eng");
        expect(isSupportedBy("paddle", "eng")).toBe(true);
        expect(isSupportedBy("tesseract", "eng")).toBe(true);
    });

    it("returns undefined / false for an unknown ui code", () => {
        expect(getLanguage("zzz")).toBeUndefined();
        expect(getTesseractCode("zzz")).toBeUndefined();
        expect(isSupportedBy("paddle", "zzz")).toBe(false);
        expect(isSupportedBy("tesseract", "zzz")).toBe(false);
    });

    it("routes a non-Latin language (e.g. Arabic) to Tesseract only in v1", () => {
        expect(isSupportedBy("tesseract", "ara")).toBe(true);
        expect(isSupportedBy("paddle", "ara")).toBe(false);
    });

    it("supports every listed language under Tesseract (universal fallback)", () => {
        for (const l of OCR_LANGUAGES) {
            expect(isSupportedBy("tesseract", l.uiCode)).toBe(true);
        }
    });
});
