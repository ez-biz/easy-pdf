import type { OcrEngine, OcrEngineId } from "./types";
import { tesseractEngine } from "./tesseractEngine";
import { paddleEngine } from "./paddleEngine";

export function getEngine(id: OcrEngineId): OcrEngine {
    return id === "paddle" ? paddleEngine : tesseractEngine;
}

const PAGE_SEPARATOR = "\n\n--- Page Break ---\n\n";

export function joinPages(pages: string[]): string {
    return pages.join(PAGE_SEPARATOR);
}

export type { OcrEngine, OcrEngineId, OcrPageResult } from "./types";
