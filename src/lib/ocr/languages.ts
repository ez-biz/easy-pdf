import type { OcrEngineId } from "./types";

export interface OcrLanguage {
    uiCode: string;          // value stored in the dropdown / state
    label: string;
    tesseractCode: string;   // always present — Tesseract is the universal fallback
    paddleSupported: boolean; // true iff the default PP-OCRv5 model (Latin script, v1) covers it
}

// v1: the default ppu-paddle-ocr PP-OCRv5 model is Latin-script. Mark those true;
// non-Latin scripts (CJK, Devanagari, Arabic) route to Tesseract until we host their models.
export const OCR_LANGUAGES: OcrLanguage[] = [
    { uiCode: "eng", label: "English", tesseractCode: "eng", paddleSupported: true },
    { uiCode: "fra", label: "French", tesseractCode: "fra", paddleSupported: true },
    { uiCode: "deu", label: "German", tesseractCode: "deu", paddleSupported: true },
    { uiCode: "spa", label: "Spanish", tesseractCode: "spa", paddleSupported: true },
    { uiCode: "ita", label: "Italian", tesseractCode: "ita", paddleSupported: true },
    { uiCode: "por", label: "Portuguese", tesseractCode: "por", paddleSupported: true },
    { uiCode: "chi_sim", label: "Chinese (Simplified)", tesseractCode: "chi_sim", paddleSupported: false },
    { uiCode: "jpn", label: "Japanese", tesseractCode: "jpn", paddleSupported: false },
    { uiCode: "kor", label: "Korean", tesseractCode: "kor", paddleSupported: false },
    { uiCode: "hin", label: "Hindi", tesseractCode: "hin", paddleSupported: false },
    { uiCode: "ara", label: "Arabic", tesseractCode: "ara", paddleSupported: false },
];

export function getLanguage(uiCode: string): OcrLanguage | undefined {
    return OCR_LANGUAGES.find((l) => l.uiCode === uiCode);
}

export function getTesseractCode(uiCode: string): string | undefined {
    return getLanguage(uiCode)?.tesseractCode;
}

export function isSupportedBy(engine: OcrEngineId, uiCode: string): boolean {
    const lang = getLanguage(uiCode);
    if (!lang) return false;
    return engine === "paddle" ? lang.paddleSupported : true;
}
