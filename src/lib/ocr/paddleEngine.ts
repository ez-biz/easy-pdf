import type { OcrEngine } from "./types";

interface PaddleRecognitionItem {
    text: string;
    confidence: number;
}

interface PaddleService {
    initialize(): Promise<void>;
    recognize(
        image: ArrayBuffer,
        options?: { flatten?: boolean }
    ): Promise<{ text?: string; confidence?: number; results?: PaddleRecognitionItem[] }>;
}

// Self-hosted PP-OCRv5 default (Latin-script) model files — placed by Task 7.
const MODEL_PATHS = {
    detection: "/models/ppocr/det.ort",
    recognition: "/models/ppocr/rec.ort",
    charactersDictionary: "/models/ppocr/dict.txt",
};

let service: PaddleService | null = null;

function canvasToArrayBuffer(canvas: HTMLCanvasElement): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error("canvas.toBlob returned null"));
                return;
            }
            blob.arrayBuffer().then(resolve, reject);
        }, "image/png");
    });
}

/**
 * Wraps ppu-paddle-ocr (PP-OCRv5) via its web entry. Imported dynamically so
 * the model weights and onnxruntime-web runtime only load when OCR actually
 * runs. v1 uses the single default (Latin-script) model, so `lang` is ignored
 * here — Tesseract handles languages the default model does not cover.
 */
export const paddleEngine: OcrEngine = {
    async init(_lang, onProgress) {
        if (service) return;
        onProgress?.(0, "Loading OCR model…");
        const { PaddleOcrService } = await import("ppu-paddle-ocr/web");
        const created = new PaddleOcrService({ model: MODEL_PATHS }) as unknown as PaddleService;
        await created.initialize();
        service = created;
        onProgress?.(100, "Model ready");
    },

    async recognize(canvas, lang) {
        if (!service) await this.init(lang);
        const buffer = await canvasToArrayBuffer(canvas);
        const res = await service!.recognize(buffer, { flatten: true });
        return {
            text: res.text ?? "",
            confidence: res.confidence ?? 0,
            lines: res.results?.map((r) => ({ text: r.text, confidence: r.confidence })),
        };
    },

    terminate() {
        service = null;
    },
};
