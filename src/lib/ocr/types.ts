/** Normalized result both engines return, one per page. */
export interface OcrPageResult {
    text: string;
    /** Overall confidence in the range 0..1. */
    confidence: number;
    lines?: { text: string; confidence: number }[];
}

export type OcrEngineId = "paddle" | "tesseract";

export interface OcrEngine {
    /**
     * Prepare the engine for a language. May download/initialize models.
     * `onProgress` reports model-load progress (0..100) with a stage label.
     * Safe to call repeatedly; cheap when already initialized for `lang`.
     */
    init(lang: string, onProgress?: (progress: number, stage: string) => void): Promise<void>;
    /** Run OCR on a rendered page. `lang` is the engine-specific language code. */
    recognize(canvas: HTMLCanvasElement, lang: string): Promise<OcrPageResult>;
    /** Release resources / internal workers. */
    terminate(): void;
}
