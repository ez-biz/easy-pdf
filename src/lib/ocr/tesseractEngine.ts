import type { OcrEngine } from "./types";

/**
 * Wraps tesseract.js. Imported dynamically so it stays out of the initial
 * bundle and only loads when OCR actually runs. tesseract.js manages its
 * own worker internally, so no wrapper worker is needed here.
 */
export const tesseractEngine: OcrEngine = {
    async init() {
        // No-op: Tesseract.recognize lazily creates its own worker per call.
    },

    async recognize(canvas, lang) {
        const Tesseract = (await import("tesseract.js")).default;
        const { data } = await Tesseract.recognize(canvas, lang);
        return {
            text: data.text ?? "",
            confidence: (data.confidence ?? 0) / 100,
        };
    },

    terminate() {
        // Nothing persistent to release in the per-call recognize() path.
    },
};
